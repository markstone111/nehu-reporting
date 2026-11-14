/**
 * useNotifications Hook — src/hooks/useNotifications.ts
 *
 * TanStack Query hooks for managing user campus notifications, unread count,
 * marking notifications as read, and deleting notifications.
 *
 * Provides a resilient offline/demo fallback mechanism so that phone testing and UI
 * demonstrations continue to function seamlessly even if the backend server is offline.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { logger } from '@/utils/logger.utils';
import type {
  AppNotification,
  GetNotificationsRequest,
  GetNotificationsResponse,
  UnreadCountResponse,
} from '@/types/api.types';

// ---------------------------------------------------------------------------
// Fallback Demo Notifications (Used when backend is offline or during testing)
// ---------------------------------------------------------------------------

let DEMO_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif-1',
    category: 'Grievance',
    type: 'ASSIGNED',
    status: 'In Progress',
    title: 'Wi-Fi Outage Assigned to Network Engineering',
    message:
      'Grievance #IT-9402 (7th sem Classroom & Software Lab) assigned to Senior Network Engineer for hardware diagnostic.',
    timestamp: '12m ago',
    isRead: false,
    issueId: 'c1-wifi-it',
    icon: 'wifi-outline',
    badgeVariant: 'primary',
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-2',
    category: 'Grievance',
    type: 'UNDER_REVIEW',
    status: 'Under Review',
    title: 'Kyllang Hostel Water Filtration Inspection',
    message:
      'Estate & Sanitation department scheduled technician visit to replace purifier membranes on Ground & 2nd Floor.',
    timestamp: '1h ago',
    isRead: false,
    issueId: 'c2-water-kyllang',
    icon: 'water-outline',
    badgeVariant: 'warning',
    createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-3',
    category: 'Grievance',
    type: 'RESOLVED',
    status: 'Resolved',
    title: 'Grievance #HYG-3180 Resolved',
    message:
      'Housekeeping staff cleared overflowing dustbins and sanitized 2nd Floor corridor in School of Technology.',
    timestamp: 'Yesterday',
    isRead: true,
    issueId: 'c3-hygiene-sot',
    icon: 'checkmark-circle-outline',
    badgeVariant: 'success',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'notif-4',
    category: 'Administrative',
    type: 'NOTICE',
    status: 'Notice',
    title: 'Central Campus Fiber Gateway Maintenance',
    message:
      'Computer Centre scheduled core router maintenance on Saturday 2:00 AM – 5:00 AM. Intermittent drops expected.',
    timestamp: '2 days ago',
    isRead: true,
    issueId: null,
    icon: 'construct-outline',
    badgeVariant: 'neutral',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (params?: GetNotificationsRequest) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch user's campus notifications with optional category filtering and pagination.
 */
export function useNotifications(params?: GetNotificationsRequest) {
  return useQuery<GetNotificationsResponse>({
    queryKey: NOTIFICATION_QUERY_KEYS.list(params),
    queryFn: async () => {
      try {
        const response = await notificationsApi.getNotifications(params);
        logger.log('NOTIF', `Fetched ${response.data.length} notifications from backend.`);
        return response;
      } catch (err) {
        logger.warn('NOTIF', 'Backend unreachable for notifications, using local fallback data', err);

        // Filter local demo list
        let filtered = [...DEMO_NOTIFICATIONS];
        if (params?.filter === 'GRIEVANCES') {
          filtered = filtered.filter((n) => n.category === 'Grievance');
        } else if (params?.filter === 'ADMINISTRATIVE') {
          filtered = filtered.filter((n) => n.category === 'Administrative');
        }

        const unreadCount = DEMO_NOTIFICATIONS.filter((n) => !n.isRead).length;

        return {
          data: filtered,
          total: filtered.length,
          page: params?.page ?? 1,
          pageSize: params?.pageSize ?? 20,
          hasNextPage: false,
          unreadCount,
        };
      }
    },
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Fetch unread notification count for badge display.
 */
export function useUnreadNotificationCount() {
  return useQuery<UnreadCountResponse>({
    queryKey: NOTIFICATION_QUERY_KEYS.unreadCount,
    queryFn: async () => {
      try {
        return await notificationsApi.getUnreadCount();
      } catch {
        const unreadCount = DEMO_NOTIFICATIONS.filter((n) => !n.isRead).length;
        return { unreadCount };
      }
    },
    staleTime: 30 * 1000,
  });
}

/**
 * Mark a single notification as read.
 */
export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      try {
        return await notificationsApi.markAsRead(notificationId);
      } catch {
        // Local state fallback update
        DEMO_NOTIFICATIONS = DEMO_NOTIFICATIONS.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n,
        );
        return { id: notificationId, isRead: true, readAt: new Date().toISOString() };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * Mark all notifications as read.
 */
export function useMarkAllNotificationsAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      try {
        return await notificationsApi.markAllAsRead();
      } catch {
        // Local state fallback update
        const count = DEMO_NOTIFICATIONS.filter((n) => !n.isRead).length;
        DEMO_NOTIFICATIONS = DEMO_NOTIFICATIONS.map((n) => ({ ...n, isRead: true }));
        return { markedCount: count, message: 'All notifications marked as read.' };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

/**
 * Dismiss or delete a notification item.
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      try {
        await notificationsApi.deleteNotification(notificationId);
      } catch {
        DEMO_NOTIFICATIONS = DEMO_NOTIFICATIONS.filter((n) => n.id !== notificationId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}

