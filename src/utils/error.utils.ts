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
  INVALID_CREDENTIALS: 'The email or password you entered is incorrect.',
  USER_EXISTS: 'An account with this email address already exists.',
  VALIDATION_ERROR: 'Please check your inputs and try again.',
  NOT_FOUND: 'The requested resource was not found.',
  FORBIDDEN: 'You do not have permission to perform this action.',
  SERVER_ERROR: 'Internal server error. Please try again shortly.',
  NETWORK_ERROR: 'Unable to connect to the server. Please check your network connection.',
  TIMEOUT_ERROR: 'The request timed out. Please try again.',
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

    const data = error.response.data as Partial<ApiError> | undefined;
    if (data?.message) {
      return data.message;
    }

    if (data?.code && ERROR_CODE_MESSAGES[data.code]) {
      return ERROR_CODE_MESSAGES[data.code];
    }

    if (error.response.status === 401) {
      return ERROR_CODE_MESSAGES.UNAUTHORIZED ?? 'Unauthorized. Please sign in again.';
    }

    if (error.response.status === 403) {
      return ERROR_CODE_MESSAGES.FORBIDDEN ?? 'Access forbidden.';
    }

    if (error.response.status >= 500) {
      return 'The server encountered an error. Please try again in a few moments.';
    }
  }

  // Standard JavaScript Error instance
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return fallbackMessage;
}
