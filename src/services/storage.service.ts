/**
 * Storage Service
 *
 * Abstraction layer over two storage mechanisms:
 *   1. expo-secure-store  — encrypted, for sensitive data (JWT tokens, FCM token)
 *   2. AsyncStorage       — regular, for non-sensitive persistent data
 *
 * Why abstract?
 *   - Expo SecureStore has a key length limit and may behave differently on web.
 *   - If we ever swap the storage implementation (e.g., to MMKV), we only change here.
 *   - Centralizes all storage keys to avoid key typos scattered across files.
 *
 * Usage:
 *   import { SecureStorage, Storage, STORAGE_KEYS } from '@/services/storage.service';
 *   await SecureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, token);
 *   const token = await SecureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
 */

import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ---------------------------------------------------------------------------
// Storage Keys — single source of truth
// ---------------------------------------------------------------------------

export const STORAGE_KEYS = {
  // Secure (encrypted)
  ACCESS_TOKEN: 'nehu_access_token',
  REFRESH_TOKEN: 'nehu_refresh_token',
  FCM_TOKEN: 'nehu_fcm_token',

  // AsyncStorage (non-sensitive)
  ONBOARDING_COMPLETE: 'nehu_onboarding_complete',
  LAST_FCM_REFRESH: 'nehu_last_fcm_refresh',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

// ---------------------------------------------------------------------------
// SecureStorage — expo-secure-store wrapper
// ---------------------------------------------------------------------------

export const SecureStorage = {
  /**
   * Store an encrypted string value.
   * @param key - One of STORAGE_KEYS (sensitive ones)
   * @param value - String value to store
   */
  async set(key: string, value: string): Promise<void> {
    await SecureStore.setItemAsync(key, value);
  },

  /**
   * Retrieve an encrypted value by key.
   * @returns The stored string, or null if not found.
   */
  async get(key: string): Promise<string | null> {
    return await SecureStore.getItemAsync(key);
  },

  /**
   * Delete an encrypted value by key.
   */
  async delete(key: string): Promise<void> {
    await SecureStore.deleteItemAsync(key);
  },

  /**
   * Clear all known secure storage keys.
   * Call this on logout to ensure no sensitive data remains.
   */
  async clearAll(): Promise<void> {
    const sensitiveKeys = [
      STORAGE_KEYS.ACCESS_TOKEN,
      STORAGE_KEYS.REFRESH_TOKEN,
      STORAGE_KEYS.FCM_TOKEN,
    ];
    await Promise.all(sensitiveKeys.map((k) => SecureStore.deleteItemAsync(k)));
  },
};

// ---------------------------------------------------------------------------
// Storage — AsyncStorage wrapper
// ---------------------------------------------------------------------------

export const Storage = {
  /**
   * Store a JSON-serializable value.
   */
  async set<T>(key: string, value: T): Promise<void> {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  },

  /**
   * Retrieve and parse a stored value.
   * @returns The parsed value, or null if not found or parse fails.
   */
  async get<T>(key: string): Promise<T | null> {
    const raw = await AsyncStorage.getItem(key);
    if (raw === null) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /**
   * Remove a value by key.
   */
  async delete(key: string): Promise<void> {
    await AsyncStorage.removeItem(key);
  },
};
