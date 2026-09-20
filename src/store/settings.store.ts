/**
 * Settings Store — Zustand
 *
 * Stores developer/app-level settings that persist across sessions.
 * Most importantly: the backend base URL (changeable for demo/testing purposes).
 *
 * How the dev settings work:
 *   1. User long-presses the app version text on the Profile screen.
 *   2. A modal opens showing this store's current values.
 *   3. Changes are written here and immediately picked up by api/client.ts
 *      (which reads baseUrl dynamically from this store).
 *
 * The store is persisted to AsyncStorage so it survives app restarts.
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Default values
// ---------------------------------------------------------------------------

/** Production backend URL — update this when your Go server is deployed */
const DEFAULT_API_URL = 'https://api.nehu.ac.in/issues/v1';

/** Development fallback — useful during local testing */
const DEV_API_URL = 'http://10.0.2.2:8080/v1'; // Android emulator localhost

// ---------------------------------------------------------------------------
// State shape
// ---------------------------------------------------------------------------

interface SettingsState {
  /** Base URL for ALL API requests. Changed via hidden dev settings. */
  baseApiUrl: string;

  /** Whether to show extra debug info in the UI (response times, session IDs) */
  isDevMode: boolean;

  /** The number of times the app has been opened (useful for onboarding logic) */
  openCount: number;

  // Actions
  setBaseApiUrl: (url: string) => void;
  setDevMode: (enabled: boolean) => void;
  resetToDefaults: () => void;
  incrementOpenCount: () => void;
}

// ---------------------------------------------------------------------------
// Store
// ---------------------------------------------------------------------------

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      // Initial state
      baseApiUrl: DEFAULT_API_URL,
      isDevMode: false,
      openCount: 0,

      // Actions
      setBaseApiUrl: (url: string) => set({ baseApiUrl: url.trim().replace(/\/$/, '') }),
      setDevMode: (enabled: boolean) => set({ isDevMode: enabled }),
      resetToDefaults: () => set({ baseApiUrl: DEFAULT_API_URL, isDevMode: false }),
      incrementOpenCount: () => set((s) => ({ openCount: s.openCount + 1 })),
    }),
    {
      name: 'nehu-settings',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);

// Export constants for use in tests or other modules
export { DEFAULT_API_URL, DEV_API_URL };
