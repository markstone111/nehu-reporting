/**
 * API Client — Axios Instance
 *
 * This is the single Axios instance used by ALL API modules in the app.
 * It handles:
 *   1. Dynamic base URL — reads from settingsStore so the dev settings screen
 *      works without restarting the app.
 *   2. Auth token injection — attaches Bearer token to every request.
 *   3. Token refresh — on 401, silently refreshes the access token and retries
 *      the original request. If refresh also fails, forces logout.
 *   4. Error normalization — converts all errors to ApiError shape so UI code
 *      doesn't need to handle raw Axios errors.
 *   5. Configurable timeouts per request type (see TIMEOUTS).
 *
 * Usage:
 *   import { apiClient } from '@/api/client';
 *   const response = await apiClient.get<MyType>('/endpoint');
 *
 * Do NOT import axios directly in feature modules — always use this client.
 */

import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from 'axios';
import { useSettingsStore } from '@/store/settings.store';
import { useAuthStore } from '@/store/auth.store';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage.service';
import { API_TIMEOUTS } from '@/constants/limits';
import type { ApiError, AuthTokens, RefreshTokenRequest } from '@/types/api.types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Extended request config with app-specific flags */
interface AppRequestConfig extends AxiosRequestConfig {
  /** If true, this request will NOT have the Authorization header attached */
  _isPublic?: boolean;
  /** Internal flag to prevent infinite refresh loops */
  _isRetry?: boolean;
}

// ---------------------------------------------------------------------------
// Create Axios instance
// ---------------------------------------------------------------------------

/**
 * We use a factory function that reads the base URL at request time
 * (not at import time) so the dev settings URL change takes effect immediately.
 */
const createApiClient = (): AxiosInstance => {
  const instance = axios.create({
    timeout: API_TIMEOUTS.DEFAULT,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });

  // -------------------------------------------------------------------------
  // Request interceptor — inject base URL + auth token
  // -------------------------------------------------------------------------
  instance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig & AppRequestConfig) => {
      // Read base URL dynamically from the settings store (Zustand)
      const { baseApiUrl } = useSettingsStore.getState();
      config.baseURL = baseApiUrl;

      // Attach access token unless this is a public route (login/register)
      if (!config._isPublic) {
        const token = await SecureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      return config;
    },
    (error: unknown) => Promise.reject(normalizeError(error)),
  );

  // -------------------------------------------------------------------------
  // Response interceptor — handle 401, normalize errors
  // -------------------------------------------------------------------------
  instance.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalConfig = error.config as AppRequestConfig | undefined;

      // Handle 401 Unauthorized — attempt token refresh once
      if (
        error.response?.status === 401 &&
        originalConfig &&
        !originalConfig._isRetry &&
        !originalConfig._isPublic
      ) {
        originalConfig._isRetry = true;

        try {
          const refreshToken = await SecureStorage.get(STORAGE_KEYS.REFRESH_TOKEN);
          if (!refreshToken) throw new Error('No refresh token');

          // Call refresh endpoint directly (bypasses interceptor via _isPublic)
          const refreshResponse = await instance.post<AuthTokens>(
            '/auth/refresh',
            { refreshToken } satisfies RefreshTokenRequest,
            { _isPublic: true } as AppRequestConfig,
          );

          const { accessToken, refreshToken: newRefresh } = refreshResponse.data;

          // Store new tokens
          await SecureStorage.set(STORAGE_KEYS.ACCESS_TOKEN, accessToken);
          await SecureStorage.set(STORAGE_KEYS.REFRESH_TOKEN, newRefresh);

          // Retry original request with new token
          if (originalConfig.headers) {
            originalConfig.headers.Authorization = `Bearer ${accessToken}`;
          }
          return instance(originalConfig);
        } catch {
          // Refresh failed — force logout
          await SecureStorage.clearAll();
          useAuthStore.getState().clearAuth();
          return Promise.reject(normalizeError(error));
        }
      }

      return Promise.reject(normalizeError(error));
    },
  );

  return instance;
};

// ---------------------------------------------------------------------------
// Error normalizer
// ---------------------------------------------------------------------------

/**
 * Converts any Axios or network error into a consistent ApiError object.
 * This means UI components only ever deal with `{ code, message, field? }`.
 */
export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const response = error.response;

    // Backend returned a structured error body
    if (response?.data && typeof response.data === 'object') {
      const data = response.data as Partial<ApiError>;
      return {
        code: data.code ?? `HTTP_${response.status}`,
        message: data.message ?? 'An error occurred. Please try again.',
        ...(data.field !== undefined && { field: data.field }),
        ...(data.details !== undefined && { details: data.details }),
      };
    }

    // Network error (no response)
    if (error.code === 'ECONNABORTED') {
      return { code: 'TIMEOUT', message: 'Request timed out. Check your connection.' };
    }
    if (!error.response) {
      return { code: 'NETWORK_ERROR', message: 'No internet connection. Please try again.' };
    }

    return { code: `HTTP_${response?.status ?? 'UNKNOWN'}`, message: error.message };
  }

  // Non-Axios error
  if (error instanceof Error) {
    return { code: 'UNKNOWN_ERROR', message: error.message };
  }

  return { code: 'UNKNOWN_ERROR', message: 'An unexpected error occurred.' };
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const apiClient = createApiClient();
