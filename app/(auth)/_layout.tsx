/**
 * Auth Layout — app/(auth)/_layout.tsx
 *
 * Layout for public screens (login, register).
 * Redirects to (app) if the user is already authenticated.
 *
 * Screens:
 *   login    — app/(auth)/login.tsx
 *   register — app/(auth)/register.tsx
 */

import { Stack, Redirect } from 'expo-router';
import { useAuthStore, selectIsAuthenticated } from '@/store/auth.store';

export default function AuthLayout() {
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const isHydrated = useAuthStore((s) => s.isHydrated);

  // Wait for store to hydrate from AsyncStorage before making routing decisions.
  // This prevents a flash of the login screen on app start for logged-in users.
  if (!isHydrated) return null;

  // If already logged in, skip auth screens and go straight to the app
  if (isAuthenticated) {
    return <Redirect href="/" />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
    </Stack>
  );
}
