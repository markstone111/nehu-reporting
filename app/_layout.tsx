/**
 * Root Layout — app/_layout.tsx
 *
 * This is the top-level Expo Router layout. It:
 *   1. Loads Inter fonts via @expo-google-fonts/inter
 *   2. Wraps the entire app in React Query's QueryClientProvider
 *   3. Guards routes: unauthenticated users are redirected to (auth)
 *   4. Hides the splash screen once fonts are ready
 *   5. Registers gesture handler (required for react-native-gesture-handler)
 *
 * Route structure:
 *   (auth)/ — Public: login, register (no auth required)
 *   (app)/  — Protected: all main app screens (auth required)
 *   dev/    — Hidden developer settings
 */

import { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import * as Notifications from 'expo-notifications';
import { QueryClient, QueryClientProvider, useQueryClient } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet } from 'react-native';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { NotificationService } from '@/services/notification.service';
import { NotificationToast } from '@/components/notification/NotificationToast';
import { NOTIFICATION_QUERY_KEYS, useIssueStatusWatcher } from '@/hooks/useNotifications';

// Keep the splash screen visible until fonts are loaded
SplashScreen.preventAutoHideAsync();

// ---------------------------------------------------------------------------
// React Query client configuration
// ---------------------------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Retry failed requests once before showing error
      retry: 1,
      // Consider data stale after 2 minutes — revalidate on window focus
      staleTime: 2 * 60 * 1000,
      // Keep cached data for 5 minutes even if unused
      gcTime: 5 * 60 * 1000,
    },
    mutations: {
      // Do not retry failed mutations by default
      retry: 0,
    },
  },
});

// ---------------------------------------------------------------------------
// Notification Bootstrap & Deep Link Component
// ---------------------------------------------------------------------------

function NotificationBootstrap() {
  const router = useRouter();
  const queryClientInstance = useQueryClient();
  useIssueStatusWatcher();
  const [toast, setToast] = useState<{
    visible: boolean;
    title: string;
    message: string;
    issueId?: string;
  }>({
    visible: false,
    title: '',
    message: '',
  });

  useEffect(() => {
    // 1. Initialize FCM registration & channel setup
    NotificationService.registerForPushNotifications();

    // 2. Token refresh listener
    const refreshSub = NotificationService.setupTokenRefreshListener();

    // 3. Foreground notification arrival listener
    const foregroundSub = Notifications.addNotificationReceivedListener((notification) => {
      const payload = NotificationService.extractPayload(notification);
      const title = notification.request.content.title ?? 'Campus Update';
      const body = notification.request.content.body ?? '';

      // Invalidate queries so lists update in real-time
      queryClientInstance.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
      queryClientInstance.invalidateQueries({ queryKey: ['issues'] });

      // Trigger floating in-app banner
      setToast({
        visible: true,
        title,
        message: body,
        ...(payload.issueId ? { issueId: payload.issueId } : {}),
      });
    });

    // 4. Notification response listener (user tapped notification in system tray)
    const responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
      const notification = response.notification;
      const payload = NotificationService.extractPayload(notification);

      if (payload.issueId) {
        router.push({
          pathname: '/(app)/issues/[id]',
          params: { id: payload.issueId },
        });
      }
    });

    return () => {
      refreshSub?.remove();
      foregroundSub.remove();
      responseSub.remove();
    };
  }, [router, queryClientInstance]);

  return (
    <NotificationToast
      visible={toast.visible}
      title={toast.title}
      message={toast.message}
      onDismiss={() => setToast((prev) => ({ ...prev, visible: false }))}
      onPress={() => {
        if (toast.issueId) {
          router.push({
            pathname: '/(app)/issues/[id]',
            params: { id: toast.issueId },
          });
        }
      }}
    />
  );
}

// ---------------------------------------------------------------------------
// Root Layout Component
// ---------------------------------------------------------------------------

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide splash screen once fonts are ready (or if they fail to load)
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Don't render anything until fonts are loaded
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="dark" />
        <NotificationBootstrap />
        <Stack screenOptions={{ headerShown: false }}>
          {/*
           * (auth) group: login and register screens.
           * No header — each screen manages its own header via <Header /> component.
           */}
          <Stack.Screen name="(auth)" />

          {/*
           * (app) group: all protected screens (tab bar lives here).
           * Auth guard lives in (app)/_layout.tsx
           */}
          <Stack.Screen name="(app)" />

          {/*
           * dev/ group: hidden developer settings.
           * Accessible via long-press on version text in Profile screen.
           */}
          <Stack.Screen name="dev/settings" options={{ presentation: 'modal' }} />
        </Stack>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
