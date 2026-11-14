/**
 * Notifications API Module — src/api/notifications.api.ts
 *
 * All campus notification and in-app alert HTTP calls.
 * Uses apiClient from @/api/client.
 *
 * Endpoints:
 *   GET    /notifications              — Fetch user notification history
 *   GET    /notifications/unread-count — Fetch badge count of unread items
 *   PATCH  /notifications/:id/read     — Mark single notification as read
 *   PATCH  /notifications/read-all     — Mark all user notifications as read
 *   DELETE /notifications/:id          — Dismiss/delete notification
 */

import { apiClient } from '@/api/client';
import type {
  GetNotificationsRequest,
  GetNotificationsResponse,
  UnreadCountResponse,
  MarkAsReadResponse,
  MarkAllReadResponse,
  UUID,
} from '@/types/api.types';

export const notificationsApi = {
  /**
   * Fetch paginated notifications with optional filter (ALL, GRIEVANCES, ADMINISTRATIVE).
   */
  getNotifications: async (
    params?: GetNotificationsRequest,
  ): Promise<GetNotificationsResponse> => {
    const response = await apiClient.get<GetNotificationsResponse>('/notifications', {
      params,
    });
    return response.data;
  },

  /**
   * Fetch unread notification count for badge rendering.
   */
  getUnreadCount: async (): Promise<UnreadCountResponse> => {
    const response = await apiClient.get<UnreadCountResponse>('/notifications/unread-count');
    return response.data;
  },

  /**
   * Mark a single notification as read.
   */
  markAsRead: async (notificationId: UUID): Promise<MarkAsReadResponse> => {
    const response = await apiClient.patch<MarkAsReadResponse>(
      `/notifications/${notificationId}/read`,
    );
    return response.data;
  },

  /**
   * Mark all notifications for current user as read.
   */
  markAllAsRead: async (): Promise<MarkAllReadResponse> => {
    const response = await apiClient.patch<MarkAllReadResponse>('/notifications/read-all');
    return response.data;
  },

  /**
   * Dismiss or delete a notification.
   */
  deleteNotification: async (notificationId: UUID): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },
};
