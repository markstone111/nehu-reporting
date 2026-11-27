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
import { SecureStorage, STORAGE_KEYS } from '@/services/storage.service';
import { API_TIMEOUTS } from '@/constants/limits';
import { logger } from '@/utils/logger.utils';
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
      // Read base URL from .env (EXPO_PUBLIC_API_URL) if defined, or fall back to Zustand settings store
      const envApiUrl = process.env.EXPO_PUBLIC_API_URL?.trim().replace(/\/$/, '');
      const { baseApiUrl } = useSettingsStore.getState();
      config.baseURL = envApiUrl || baseApiUrl;

      // Attach access token unless this is a public route (login/register)
      if (!config._isPublic) {
        const token = await SecureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }

      logger.log('HTTP_REQ', `${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);

      return config;
    },
    (error: unknown) => {
      logger.error('HTTP_ERR', 'Request interceptor failed', error);
      return Promise.reject(normalizeError(error));
    },
  );

  // -------------------------------------------------------------------------
  // Response interceptor — handle 401, normalize errors
  // -------------------------------------------------------------------------
  instance.interceptors.response.use(
    (response) => {
      logger.log(
        'HTTP_RES',
        `${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`,
      );
      return response;
    },
    async (error: AxiosError) => {
      logger.warn(
        'HTTP_ERR',
        `${error.response?.status ?? 'NETWORK_OFFLINE'} ${error.config?.method?.toUpperCase()} ${error.config?.url} — ${error.message}`,
      );
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
          // Token refresh unavailable or failed; reject request without destroying active session
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
function formatBackendErrorMessage(status: number, rawMessage?: string, rawCode?: string): { code: string; message: string } {
  const lower = rawMessage?.toLowerCase() ?? '';

  if (lower.includes('invalid credentials') || (status === 401 && !rawMessage)) {
    return {
      code: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password. Please check your credentials and try again.',
    };
  }
  if (lower.includes('inactive')) {
    return {
      code: 'FORBIDDEN',
      message: 'Your account is inactive. Please contact the NEHU Computer Centre.',
    };
  }
  if (status === 409 || lower.includes('already exists')) {
    return {
      code: 'USER_EXISTS',
      message: 'An account with this email or roll number already exists.',
    };
  }
  if (status === 404) {
    return {
      code: rawCode ?? 'NOT_FOUND',
      message: rawMessage || 'The requested resource was not found.',
    };
  }
  if (status === 429) {
    return {
      code: 'RATE_LIMITED',
      message: 'Too many requests. Please wait a moment and try again.',
    };
  }
  if (status >= 500) {
    return {
      code: 'SERVER_ERROR',
      message: 'Server error. Please try again shortly.',
    };
  }

  return {
    code: rawCode ?? `HTTP_${status}`,
    message: rawMessage || 'An error occurred. Please try again.',
  };
}

export function normalizeError(error: unknown): ApiError {
  if (axios.isAxiosError(error)) {
    const response = error.response;

    // Backend returned a structured error body
    if (response?.data && typeof response.data === 'object') {
      const data = response.data as Record<string, unknown>;
      const rawMessage =
        (typeof data.message === 'string' && data.message.trim()) ||
        (typeof data.error === 'string' && data.error.trim()) ||
        (typeof data.detail === 'string' && data.detail.trim()) ||
        undefined;
      const rawCode = typeof data.code === 'string' ? data.code : undefined;

      const formatted = formatBackendErrorMessage(response.status, rawMessage, rawCode);

      return {
        code: formatted.code,
        message: formatted.message,
        ...(typeof data.field === 'string' && { field: data.field }),
        ...(data.details !== undefined && {
          details: data.details as Record<string, string>,
        }),
      };
    }

    // Network error (no response)
    if (error.code === 'ECONNABORTED') {
      return { code: 'TIMEOUT', message: 'Request timed out. Check your connection and try again.' };
    }
    if (!error.response) {
      return {
        code: 'NETWORK_ERROR',
        message: 'Unable to connect to the server. Please check your internet connection.',
      };
    }

    const formatted = formatBackendErrorMessage(response?.status ?? 500, error.message);
    return { code: formatted.code, message: formatted.message };
  }

  // Already normalized ApiError
  if (typeof error === 'object' && error !== null && 'code' in error && 'message' in error) {
    return error as ApiError;
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
