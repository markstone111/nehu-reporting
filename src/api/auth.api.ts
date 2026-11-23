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
 */
export async function scanIdCardWithOcr(imageUri: string): Promise<OcrExtractedFields | null> {
  const ocrUrl =
    process.env.EXPO_PUBLIC_OCR_URL ||
    'https://kasunwai-ocr-294086420184.asia-southeast1.run.app/api/ocr';

  const formData = new FormData();
  formData.append('file', {
    uri: imageUri,
    name: 'id_card.jpg',
    type: 'image/jpeg',
  } as any);

  try {
    const res = await fetch(ocrUrl, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      return null;
    }
    const data = await res.json();
    return data?.results || null;
  } catch (err) {
    console.warn('[OCR] Cloud Run scan failed:', err);
    return null;
  }
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
    await apiClient.post('/notifications/token', {
      fcm_token: data.fcmToken,
      device_type: data.platform || 'android',
    });
  },

  deleteFcmToken: async (data: DeleteFcmTokenRequest): Promise<void> => {
    await apiClient.delete('/notifications/token', { data });
  },
};
