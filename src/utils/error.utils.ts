/**
 * Error Handling Utilities
 *
 * Converts unknown errors (Axios errors, API errors, network failures)
 * into human-readable strings suitable for display in UI toasts and alerts.
 */

import axios from 'axios';
import type { ApiError } from '@/types/api.types';

const ERROR_CODE_MESSAGES: Record<string, string> = {
  UNAUTHORIZED: 'Session expired or invalid credentials. Please sign in again.',
  INVALID_CREDENTIALS: 'Invalid email or password. Please check your credentials and try again.',
  USER_EXISTS: 'An account with this email or roll number already exists.',
  VALIDATION_ERROR: 'Please check your inputs and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  FORBIDDEN: 'Your account is inactive or you do not have permission to perform this action.',
  RATE_LIMITED: 'Too many requests. Please wait a moment and try again.',
  SERVER_ERROR: 'Internal server error. Please try again shortly.',
  NETWORK_ERROR: 'Unable to connect to the server. Please check your internet connection.',
  TIMEOUT: 'The request timed out. Please check your connection and try again.',
  TIMEOUT_ERROR: 'The request timed out. Please check your connection and try again.',
  ID_CARD_REQUIRED: 'University ID card image is required for registration.',
};

/**
 * Extracts a human-friendly error message from any caught error.
 */
export function getErrorMessage(
  error: unknown,
  fallbackMessage = 'An unexpected error occurred.',
): string {
  if (!error) return fallbackMessage;

  // Direct string error
  if (typeof error === 'string') return error;

  // Axios error with backend ApiError body
  if (axios.isAxiosError(error)) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return ERROR_CODE_MESSAGES.TIMEOUT_ERROR ?? 'Request timed out.';
    }

    if (!error.response) {
      return ERROR_CODE_MESSAGES.NETWORK_ERROR ?? 'Network error. Please check your connection.';
    }

    const data = error.response.data as Record<string, unknown> | undefined;
    const rawMsg =
      (typeof data?.message === 'string' && data.message.trim()) ||
      (typeof data?.error === 'string' && data.error.trim()) ||
      undefined;

    if (rawMsg) {
      return rawMsg;
    }

    const code = typeof data?.code === 'string' ? data.code : undefined;
    if (code && ERROR_CODE_MESSAGES[code]) {
      return ERROR_CODE_MESSAGES[code];
    }

    if (error.response.status === 401) {
      return ERROR_CODE_MESSAGES.INVALID_CREDENTIALS ?? 'Invalid email or password.';
    }

    if (error.response.status === 403) {
      return ERROR_CODE_MESSAGES.FORBIDDEN ?? 'Access forbidden.';
    }

    if (error.response.status === 409) {
      return ERROR_CODE_MESSAGES.USER_EXISTS ?? 'Account already exists.';
    }

    if (error.response.status >= 500) {
      return ERROR_CODE_MESSAGES.SERVER_ERROR ?? 'The server encountered an error. Please try again.';
    }
  }

  // Normalized ApiError object (returned by apiClient interceptor)
  if (typeof error === 'object' && error !== null) {
    const apiErr = error as Partial<ApiError>;
    if (typeof apiErr.message === 'string' && apiErr.message.trim().length > 0) {
      return apiErr.message;
    }
    if (apiErr.code && ERROR_CODE_MESSAGES[apiErr.code]) {
      return ERROR_CODE_MESSAGES[apiErr.code];
    }
  }

  // Standard JavaScript Error instance
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
