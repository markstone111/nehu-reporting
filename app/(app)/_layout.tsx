/**
 * App Layout — app/(app)/_layout.tsx
 *
 * Layout for all protected screens.
 * Redirects to (auth)/login if the user is NOT authenticated.
 *
 * Uses a Stack navigator wrapping (tabs) so detail/form/chatbot screens
 * push cleanly on top of the tab bar without triggering Expo 58's
 * hidden-tab redirect back to the initial tab.
 */

import { Stack, Redirect } from 'expo-router';
import { useAuthStore, selectIsAuthenticated } from '@/store/auth.store';

export default function AppLayout() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  if (!isHydrated) return null;

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="issues/[id]" />
      <Stack.Screen name="report/form" />
      <Stack.Screen name="report/chatbot" />
    </Stack>
  );
}
