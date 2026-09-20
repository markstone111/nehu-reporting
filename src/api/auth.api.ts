/**
 * Auth API Module
 *
 * All authentication-related HTTP calls go through this module.
 * Uses apiClient from @/api/client — DO NOT use axios directly.
 *
 * Endpoints:
 *   POST /auth/register  — Create a new account (one-time ID card upload)
 *   POST /auth/login     — Exchange credentials for JWT tokens
 *   POST /auth/refresh   — Refresh access token (called by interceptor automatically)
 *   POST /auth/logout    — Invalidate refresh token on server
 *   PATCH /auth/fcm-token — Update FCM token on the server
 */

import { apiClient } from '@/api/client';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  AuthTokens,
  UpdateFcmTokenRequest,
} from '@/types/api.types';

// ---------------------------------------------------------------------------
// Auth API Functions
// ---------------------------------------------------------------------------

/**
 * Register a new user account.
 *
 * The idCardImageBase64 is a Base64-encoded JPEG/PNG of the student's ID card.
 * This is a one-time upload — users cannot change it later (by design decision).
 *
 * Note: This is a large payload due to the base64 image.
 * The backend should accept up to 5MB for this field.
 */
export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data, {
      _isPublic: true,
    } as object);
    return response.data;
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data, {
      _isPublic: true,
    } as object);
    return response.data;
  },

  /**
   * Called automatically by the API client interceptor on 401.
   * You should not need to call this directly from the UI.
   */
  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    const response = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }, {
      _isPublic: true,
    } as object);
    return response.data;
  },

  /**
   * Invalidate the refresh token on the server side.
   * Always call this on logout — even if it fails, clear local storage.
   */
  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  /**
   * Update the device's FCM token on the server.
   * Called when a new FCM token is generated (app start, token refresh).
   */
  updateFcmToken: async (data: UpdateFcmTokenRequest): Promise<void> => {
    await apiClient.patch('/auth/fcm-token', data);
  },
};
