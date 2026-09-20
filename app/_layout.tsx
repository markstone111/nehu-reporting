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

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
          <Stack.Screen name="dev" options={{ presentation: 'modal' }} />
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
