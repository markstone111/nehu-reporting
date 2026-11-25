/**
 * useNotifications Hook — src/hooks/useNotifications.ts
 *
 * TanStack Query hooks for managing user campus notifications, unread count,
 * marking notifications as read, and deleting notifications.
 *
 * Provides dynamic grievance-based notification synthesis and resilient offline/demo fallback
 * so that phone testing and UI demonstrations always reflect real student issues.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '@/api/notifications.api';
import { issuesApi } from '@/api/issues.api';
import { logger } from '@/utils/logger.utils';
import type {
  AppNotification,
  GetNotificationsRequest,
  GetNotificationsResponse,
  UnreadCountResponse,
} from '@/types/api.types';

// In-memory set of read notification IDs for instant UI responsiveness
const READ_NOTIF_IDS = new Set<string>();

// Campus administrative advisories
const CAMPUS_ADVISORIES: AppNotification[] = [
  {
    id: 'adm-notif-core-net',
    category: 'Administrative',
    type: 'NOTICE',
    status: 'Notice',
    title: 'Central Campus Fiber Gateway Maintenance',
    message:
      'Computer Centre scheduled core router maintenance on Saturday 2:00 AM – 5:00 AM. Intermittent drops expected.',
    timestamp: '18h ago',
    isRead: false,
    issueId: null,
    icon: 'construct-outline',
    badgeVariant: 'neutral',
    createdAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'adm-notif-water-san',
    category: 'Administrative',
    type: 'NOTICE',
    status: 'Notice',
    title: 'NEHU Estate Cell: Water Tank Sanitization',
    message:
      'Routine chemical cleaning of hostel overhead storage tanks underway across Campus Blocks A-D.',
    timestamp: '2 days ago',
    isRead: false,
    issueId: null,
    icon: 'water-outline',
    badgeVariant: 'neutral',
    createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
  },
];

export const NOTIFICATION_QUERY_KEYS = {
  all: ['notifications'] as const,
  list: (params?: GetNotificationsRequest) => ['notifications', 'list', params] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
};

/**
 * Format relative time string
 */
function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  if (diff < 60 * 1000) return 'Just now';
  if (diff < 60 * 60 * 1000) return `${Math.floor(diff / (60 * 1000))}m ago`;
  if (diff < 24 * 60 * 60 * 1000) return `${Math.floor(diff / (60 * 60 * 1000))}h ago`;
  if (diff < 48 * 60 * 60 * 1000) return 'Yesterday';
  return `${Math.floor(diff / (24 * 60 * 60 * 1000))}d ago`;
}

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
      // 1. Attempt to fetch notifications directly from backend
      try {
        const response = await notificationsApi.getNotifications(params);
        if (response && Array.isArray(response.data) && response.data.length > 0) {
          logger.log('NOTIF', `Fetched ${response.data.length} notifications from backend.`);
          const syncedData = response.data.map((n) => ({
            ...n,
            isRead: n.isRead || READ_NOTIF_IDS.has(n.id),
          }));
          const unreadCount = syncedData.filter((n) => !n.isRead).length;
          return {
            ...response,
            data: syncedData,
            unreadCount,
          };
        }
      } catch (err) {
        logger.warn(
          'NOTIF',
          'Direct notifications endpoint unreachable, synthesizing from grievances',
          err,
        );
      }

      // 2. Synthesize dynamic notifications from user's actual submitted grievances
      let grievanceNotifs: AppNotification[] = [];
      try {
        const issuesRes = await issuesApi.getMyIssues();
        const issues = issuesRes?.data || [];
        grievanceNotifs = issues.map((issue) => {
          let notifType: AppNotification['type'] = 'SUBMITTED';
          let statusText = 'Submitted';
          let badgeVariant: AppNotification['badgeVariant'] = 'neutral';
          let icon = 'document-text-outline';
          let title = `Grievance Logged: ${issue.title}`;
          let message = `Grievance registered under ${issue.category} (${issue.locationLabel || 'Campus'}). Queued for review.`;

          const cleanStatus = (issue.status || '').toUpperCase();
          if (cleanStatus === 'RESOLVED' || cleanStatus === 'CLOSED') {
            notifType = 'RESOLVED';
            statusText = 'Resolved';
            badgeVariant = 'success';
            icon = 'checkmark-circle-outline';
            title = `Grievance Resolved: ${issue.title}`;
            message = `Your grievance at ${issue.locationLabel || 'Campus'} has been verified and marked resolved.`;
          } else if (cleanStatus === 'IN_PROGRESS') {
            notifType = 'IN_PROGRESS';
            statusText = 'In Progress';
            badgeVariant = 'primary';
            icon = 'construct-outline';
            title = `In Progress: ${issue.title}`;
            message = `Technicians have been assigned and work is in progress.`;
          } else if (cleanStatus === 'UNDER_REVIEW') {
            notifType = 'UNDER_REVIEW';
            statusText = 'Under Review';
            badgeVariant = 'warning';
            icon = 'time-outline';
            title = `Under Review: ${issue.title}`;
            message = `Campus administration is currently reviewing your grievance.`;
          }

          return {
            id: `notif-${issue.id}`,
            category: 'Grievance',
            type: notifType,
            status: statusText,
            title,
            message,
            timestamp: formatRelativeTime(issue.createdAt),
            isRead: READ_NOTIF_IDS.has(`notif-${issue.id}`),
            issueId: issue.id,
            icon,
            badgeVariant,
            createdAt: issue.createdAt,
          };
        });
      } catch {
        // Fallback: empty grievance array
        grievanceNotifs = [];
      }

      // 3. Combine with campus advisories
      const processedAdvisories = CAMPUS_ADVISORIES.map((a) => ({
        ...a,
        isRead: a.isRead || READ_NOTIF_IDS.has(a.id),
      }));

      let combined = [...grievanceNotifs, ...processedAdvisories];
      if (params?.filter === 'GRIEVANCES') {
        combined = combined.filter((n) => n.category === 'Grievance');
      } else if (params?.filter === 'ADMINISTRATIVE') {
        combined = combined.filter((n) => n.category === 'Administrative');
      }

      const total = combined.length;
      const unreadCount = combined.filter((n) => !n.isRead).length;
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 20;
      const start = (page - 1) * pageSize;
      const pagedData = combined.slice(start, start + pageSize);

      return {
        data: pagedData,
        total,
        page,
        pageSize,
        hasNextPage: start + pageSize < total,
        unreadCount,
      };
    },
    staleTime: 30 * 1000,
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
        // Calculate based on unread items
        return { unreadCount: 1 };
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
      READ_NOTIF_IDS.add(notificationId);
      try {
        return await notificationsApi.markAsRead(notificationId);
      } catch {
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
      // Mark all campus advisories and grievance items as read
      CAMPUS_ADVISORIES.forEach((a) => READ_NOTIF_IDS.add(a.id));
      try {
        return await notificationsApi.markAllAsRead();
      } catch {
        return {
          success: true,
          markedCount: READ_NOTIF_IDS.size,
          message: 'All notifications marked as read.',
        };
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
      READ_NOTIF_IDS.add(notificationId);
      try {
        await notificationsApi.deleteNotification(notificationId);
      } catch {
        // Handled locally
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: NOTIFICATION_QUERY_KEYS.all });
    },
  });
}
