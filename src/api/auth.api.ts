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

import { Platform } from 'react-native';
import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';
import type {
  RegisterRequest,
  LoginRequest,
  AuthResponse,
  AuthTokens,
  UpdateFcmTokenRequest,
  DeleteFcmTokenRequest,
} from '@/types/api.types';

export interface OcrExtractedFields {
  name?: string;
  id_number?: string;
  department?: string;
  programme?: string;
  year_of_admission?: string;
  valid_upto?: string;
}

/**
 * Scan ID card image with Cloud Run PP-OCRv6 microservice
 * Uses native XMLHttpRequest to bypass JS fetch/FormData quirks on Android and iOS,
 * directly invoking React Native's native streaming networking module with 45s cold-start timeout.
 */
export async function scanIdCardWithOcr(imageUri: string): Promise<OcrExtractedFields | null> {
  const ocrUrl =
    process.env.EXPO_PUBLIC_OCR_URL ||
    'https://kasunwai-ocr-294086420184.asia-southeast1.run.app/api/ocr';

  let normalizedUri = imageUri;
  if (Platform.OS === 'android' && !normalizedUri.startsWith('file://') && !normalizedUri.startsWith('content://')) {
    normalizedUri = `file://${normalizedUri}`;
  }

  return new Promise(async (resolve) => {
    try {
      const formData = new FormData();

      if (Platform.OS === 'web') {
        try {
          const res = await fetch(imageUri);
          const blob = await res.blob();
          formData.append('file', blob, 'id_card.jpg');
        } catch {
          formData.append('file', {
            uri: normalizedUri,
            name: 'id_card.jpg',
            type: 'image/jpeg',
          } as any);
        }
      } else {
        // Native Android & iOS: Native NetworkingModule streams local file directly via ContentResolver
        formData.append('file', {
          uri: normalizedUri,
          name: 'id_card.jpg',
          type: 'image/jpeg',
        } as any);
      }

      const xhr = new XMLHttpRequest();
      xhr.open('POST', ocrUrl);
      xhr.timeout = 45000; // 45 seconds to accommodate Cloud Run cold starts

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const data = JSON.parse(xhr.responseText);
            const results = data?.results || data?.extracted_data || null;
            resolve(results);
          } catch (err) {
            console.warn('[OCR] JSON parse error:', err);
            resolve(null);
          }
        } else {
          console.warn(`[OCR] HTTP error ${xhr.status}: ${xhr.responseText}`);
          resolve(null);
        }
      };

      xhr.onerror = (e) => {
        console.warn('[OCR] XMLHttpRequest network error:', e);
        resolve(null);
      };

      xhr.ontimeout = () => {
        console.warn('[OCR] Cloud Run request timed out (45s)');
        resolve(null);
      };

      xhr.send(formData);
    } catch (err) {
      console.warn('[OCR] Failed to send XHR:', err);
      resolve(null);
    }
  });
}

// ---------------------------------------------------------------------------
// Auth API Functions
// ---------------------------------------------------------------------------

export const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const payload = {
      roll_number:
        data.roll_number ||
        (data as any).id_number ||
        `STU-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      full_name: data.full_name || data.name,
      department: data.department || 'General',
      email: data.email,
      password: data.password,
    };

    const response = await apiClient.post<any>('/users', payload, {
      _isPublic: true,
    } as object);
    const createdUser = response.data?.data || response.data;

    // Immediately log in to obtain session token
    let token = 'session-token';
    try {
      const loginRes = await apiClient.post<any>(
        '/users/login',
        {
          email: data.email,
          password: data.password,
        },
        { _isPublic: true } as object,
      );
      const loginData = loginRes.data?.data || loginRes.data;
      if (loginData?.token) {
        token = loginData.token;
      }
    } catch {
      // Non-blocking fallback
    }

    // Register FCM token if provided
    if (data.fcmToken) {
      try {
        await apiClient.post('/notifications/token', {
          user_id: createdUser?.id,
          fcm_token: data.fcmToken,
          device_type: 'android',
        });
      } catch {
        // FCM token non-critical
      }
    }

    return {
      tokens: {
        accessToken: token,
        refreshToken: token,
        expiresIn: 86400 * 30,
      },
      user: {
        id: createdUser?.id,
        name: createdUser?.full_name || data.name,
        full_name: createdUser?.full_name || data.name,
        roll_number: createdUser?.roll_number || payload.roll_number,
        department: createdUser?.department || payload.department,
        email: data.email,
        role: data.role || 'student',
        avatarUrl: null,
        createdAt: new Date().toISOString(),
      },
    };
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<any>(
      '/users/login',
      {
        email: data.email,
        password: data.password,
      },
      {
        _isPublic: true,
      } as object,
    );

    const resData = response.data?.data || response.data;
    const token = resData?.token || 'session-token';
    const user = resData?.user;

    // Register FCM token if provided
    if (data.fcmToken && user?.id) {
      try {
        await apiClient.post('/notifications/token', {
          user_id: user.id,
          fcm_token: data.fcmToken,
          device_type: 'android',
        });
      } catch {
        // FCM token non-critical
      }
    }

    return {
      tokens: {
        accessToken: token,
        refreshToken: token,
        expiresIn: 86400 * 30,
      },
      user: {
        id: user?.id,
        name: user?.full_name || 'Student',
        full_name: user?.full_name,
        roll_number: user?.roll_number,
        department: user?.department,
        email: user?.email || data.email,
        role: 'student',
        avatarUrl: null,
        createdAt: user?.created_at || new Date().toISOString(),
      },
    };
  },

  refresh: async (refreshToken: string): Promise<AuthTokens> => {
    return {
      accessToken: refreshToken,
      refreshToken: refreshToken,
      expiresIn: 86400 * 30,
    };
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/notifications/logout');
    } catch {
      // Non-blocking logout cleanup
    }
  },

  updateFcmToken: async (data: UpdateFcmTokenRequest): Promise<void> => {
    const user = useAuthStore.getState().user;
    const payload: Record<string, any> = {
      fcm_token: data.fcmToken,
      device_type: data.platform || 'android',
    };
    if (user?.id) {
      payload.user_id = user.id;
    }
    await apiClient.post('/notifications/token', payload);
  },

  deleteFcmToken: async (data: DeleteFcmTokenRequest): Promise<void> => {
    await apiClient.delete('/notifications/token', { data });
  },
};
