/**
 * useAuth Hook
 *
 * TanStack Query mutations for login, register, and logout.
 * Automatically synchronizes SecureStore (encrypted tokens) and Zustand (user state),
 * and handles app routing upon state transitions.
 */

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { authApi } from '@/api/auth.api';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage.service';
import { useAuthStore, selectIsAuthenticated } from '@/store/auth.store';
import { getErrorMessage } from '@/utils/error.utils';
import { logger } from '@/utils/logger.utils';
import type { LoginRequest, RegisterRequest, AuthResponse, User } from '@/types/api.types';

export function useAuth() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);
  const setUser = useAuthStore((s) => s.setUser);
  const clearAuth = useAuthStore((s) => s.clearAuth);

  /**
   * Persist authentication tokens securely and update Zustand state.
   */
  const handleAuthSuccess = async (response: AuthResponse) => {
    logger.log(
      'AUTH',
      `User authenticated: ${response.user.name} (${response.user.email}) — role: ${response.user.role}`,
    );

    // 1. Encrypted storage for JWT tokens
    await SecureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, response.tokens.accessToken);
    await SecureStorage.set(STORAGE_KEYS.REFRESH_TOKEN, response.tokens.refreshToken);

    // 2. User profile in Zustand (persisted to AsyncStorage)
    setUser(response.user);

    // 3. Navigate into the authenticated tab application
    router.replace('/(app)');
  };

  /**
   * Mutation: User Login
   */
  const loginMutation = useMutation({
    mutationFn: (data: LoginRequest) => authApi.login(data),
    onSuccess: async (response) => {
      await handleAuthSuccess(response);
    },
  });

  /**
   * Mutation: User Registration
   */
  const registerMutation = useMutation({
    mutationFn: (data: RegisterRequest) => authApi.register(data),
    onSuccess: async (response) => {
      await handleAuthSuccess(response);
    },
  });

  /**
   * Mutation: User Logout
   */
  const logoutMutation = useMutation({
    mutationFn: async () => {
      try {
        const storedToken = await SecureStorage.get(STORAGE_KEYS.FCM_TOKEN);
        if (storedToken) {
          try {
            await authApi.deleteFcmToken({ fcmToken: storedToken });
          } catch {
            // Ignore backend failure on token deletion
          }
        }
        await authApi.logout();
      } catch {
        // Backend logout failure should not block local cleanup
      }
    },
    onSettled: async () => {
      // 1. Wipe secure tokens
      await SecureStorage.clearAll();

      // 2. Clear state in Zustand
      clearAuth();

      // 3. Clear TanStack query cache
      queryClient.clear();

      logger.log('AUTH', 'User signed out — tokens and cache cleared');

      // 4. Redirect to login
      router.replace('/(auth)/login');
    },
  });

  return {
    // Current user state
    user,
    isAuthenticated,
    isHydrated,

    // Login action
    login: loginMutation.mutateAsync,
    isLoggingIn: loginMutation.isPending,
    loginError: loginMutation.error ? getErrorMessage(loginMutation.error) : null,
    resetLoginError: loginMutation.reset,

    // Register action
    register: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error ? getErrorMessage(registerMutation.error) : null,
    resetRegisterError: registerMutation.reset,

    // Logout action
    logout: logoutMutation.mutateAsync,
    isLoggingOut: logoutMutation.isPending,
  };
}

/**
 * Quick helper hook to read the currently logged-in user.
 */
export function useCurrentUser(): {
  user: User | null;
  isAuthenticated: boolean;
  isHydrated: boolean;
} {
  const user = useAuthStore((s) => s.user);
  const isHydrated = useAuthStore((s) => s.isHydrated);
  const isAuthenticated = useAuthStore(selectIsAuthenticated);

  return { user, isAuthenticated, isHydrated };
}
