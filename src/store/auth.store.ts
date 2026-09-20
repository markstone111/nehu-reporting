/**
 * Auth Store — Zustand
 *
 * Holds the logged-in user, tokens, and auth state.
 * Tokens (accessToken, refreshToken) are stored in expo-secure-store for encryption.
 * Only the user object and auth status are stored in this Zustand store (AsyncStorage).
 *
 * Token storage is handled separately in src/services/storage.service.ts.
 * This store is the single source of truth for "is the user logged in?" checks.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types/api.types';

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface AuthState {
  /** The currently authenticated user, or null if not logged in */
  user: User | null;

  /**
   * Whether the auth state has been rehydrated from storage.
   * Use this to avoid flickering — don't render the app until isHydrated is true.
   */
  isHydrated: boolean;

  // Actions
  setUser: (user: User) => void;
  clearAuth: () => void;
  setHydrated: (value: boolean) => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      // Initial state
      user: null,
      isHydrated: false,

      // Actions
      setUser: (user: User) => set({ user }),
      clearAuth: () => set({ user: null }),
      setHydrated: (value: boolean) => set({ isHydrated: value }),
    }),
    {
      name: 'nehu-auth',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        // Mark as hydrated after storage is loaded
        state?.setHydrated(true);
      },
    },
  ),
);

/** Selector: is the user currently authenticated? */
export const selectIsAuthenticated = (state: AuthState): boolean => state.user !== null;
