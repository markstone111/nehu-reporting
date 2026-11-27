/**
 * Campus Alerts & Notifications Screen — app/(app)/notifications.tsx
 *
 * Real-time notification hub for NEHU campus members.
 * Displays grievance lifecycle updates, administrative remarks,
 * assignment notices, and university advisories.
 *
 * Connected to useNotifications hook with resilient offline demo fallback
 * and full backend sync support.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { NotificationService } from '@/services/notification.service';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
} from '@/hooks/useNotifications';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import type { BadgeVariant } from '@/components/common/Badge';
import type { AppNotification } from '@/types/api.types';

const VALID_BADGE_VARIANTS = new Set<BadgeVariant>([
  'primary',
  'secondary',
  'success',
  'warning',
  'error',
  'info',
  'neutral',
]);

function resolveSafeIcon(icon?: string | null): keyof typeof Ionicons.glyphMap {
  if (icon && icon in Ionicons.glyphMap) {
    return icon as keyof typeof Ionicons.glyphMap;
  }
  return 'notifications-outline';
}

function resolveSafeBadgeVariant(variant?: string | null): BadgeVariant {
  if (variant && VALID_BADGE_VARIANTS.has(variant as BadgeVariant)) {
    return variant as BadgeVariant;
  }
  return 'primary';
}

type FilterTab = 'ALL' | 'GRIEVANCES' | 'ADMINISTRATIVE';

export default function NotificationsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');

  const { data, refetch, isRefetching } = useNotifications({
    filter: activeTab,
  });

  const markAsReadMutation = useMarkNotificationAsRead();
  const markAllReadMutation = useMarkAllNotificationsAsRead();

  const notifications = data?.data ?? [];
  const unreadCount = data?.unreadCount ?? notifications.filter((n) => !n.isRead).length;

  const handleRefresh = async () => {
    await refetch();
  };

  const handleSimulateNotification = async () => {
    try {
      const activeIssue = notifications.find((n) => n.issueId);
      if (activeIssue && activeIssue.issueId) {
        await NotificationService.notifyGrievanceStatusUpdated({
          id: activeIssue.issueId,
          title: activeIssue.title.replace(/^Grievance Logged:\s*/, ''),
          status: 'In Progress',
          remarks:
            'Estate maintenance technician has been assigned and dispatched for on-site inspection.',
        });
      } else {
        await NotificationService.displayLocalNotification({
          title: 'Campus Advisory: Fiber Maintenance',
          body: 'NEHU Computer Centre routine core router upgrade tonight at 11:00 PM.',
        });
      }
    } catch {
      // Non-fatal simulation error
    }
  };

  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  const handleNotificationPress = (notif: AppNotification) => {
    if (!notif.isRead) {
      markAsReadMutation.mutate(notif.id);
    }

    if (typeof notif.issueId === 'string' && notif.issueId.trim().length > 0) {
      router.push({
        pathname: '/(app)/issues/[id]',
        params: { id: notif.issueId.trim() },
      });
    }
  };

  const grievancesCount = notifications.filter((n) => n.category === 'Grievance').length;
  const adminCount = notifications.filter((n) => n.category === 'Administrative').length;

  return (
    <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
      <Header
        title="Alerts & Notices"
        subtitle={
          unreadCount > 0 ? `${unreadCount} unread university updates` : 'All updates reviewed'
        }
        rightElement={
          <View style={styles.headerActionsGroup}>
            <Pressable
              onPress={handleSimulateNotification}
              hitSlop={8}
              style={styles.headerActionBtn}
              accessibilityRole="button"
              accessibilityLabel="Simulate incoming push alert"
            >
              <Ionicons name="notifications-circle-outline" size={24} color={COLORS.primary} />
            </Pressable>
            {unreadCount > 0 && (
              <Pressable
                onPress={handleMarkAllRead}
                hitSlop={8}
                style={styles.headerActionBtn}
                accessibilityRole="button"
                accessibilityLabel="Mark all read"
              >
                <Ionicons name="checkmark-done-outline" size={22} color={COLORS.gray600} />
              </Pressable>
            )}
          </View>
        }
      />

      {/* Filter Tabs Strip */}
      <View style={styles.tabsStrip}>
        <Pressable
          onPress={() => setActiveTab('ALL')}
          style={[styles.tabChip, activeTab === 'ALL' && styles.tabChipActive]}
        >
          <Text style={[styles.tabChipText, activeTab === 'ALL' && styles.tabChipTextActive]}>
            All ({notifications.length})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('GRIEVANCES')}
          style={[styles.tabChip, activeTab === 'GRIEVANCES' && styles.tabChipActive]}
        >
          <Text
            style={[styles.tabChipText, activeTab === 'GRIEVANCES' && styles.tabChipTextActive]}
          >
            Grievances ({activeTab === 'GRIEVANCES' ? notifications.length : grievancesCount})
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('ADMINISTRATIVE')}
          style={[styles.tabChip, activeTab === 'ADMINISTRATIVE' && styles.tabChipActive]}
        >
          <Text
            style={[styles.tabChipText, activeTab === 'ADMINISTRATIVE' && styles.tabChipTextActive]}
          >
            Advisory ({activeTab === 'ADMINISTRATIVE' ? notifications.length : adminCount})
          </Text>
        </Pressable>
      </View>

      {/* Notifications List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color={COLORS.gray300} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptySubtitle}>
              You are all caught up! New grievance status changes and campus notices will appear
              here.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const iconName = resolveSafeIcon(item.icon);
          const badgeVariant = resolveSafeBadgeVariant(item.badgeVariant);
          const statusLabel = item.status || 'Notice';
          const safeTitle = item.title || 'Campus Update';
          const safeMessage = item.message || '';
          const safeTimestamp =
            item.timestamp ||
            (item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '');

          return (
            <Pressable onPress={() => handleNotificationPress(item)}>
              <Card
                variant="elevated"
                padding="md"
                style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
              >
                <View style={styles.cardHeaderRow}>
                  <View style={styles.iconCircle}>
                    <Ionicons name={iconName} size={18} color={COLORS.primary} />
                  </View>
                  <View style={styles.headerInfoCol}>
                    <View style={styles.badgeRow}>
                      <Badge label={statusLabel} variant={badgeVariant} size="sm" />
                      <Text style={styles.timestampText}>{safeTimestamp}</Text>
                    </View>
                    <Text style={styles.notifTitle} numberOfLines={2}>
                      {safeTitle}
                    </Text>
                  </View>
                  {!item.isRead && <View style={styles.unreadDot} />}
                </View>

                {safeMessage ? <Text style={styles.notifMessage}>{safeMessage}</Text> : null}
              </Card>
            </Pressable>
          );
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  headerActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  headerActionBtn: {
    padding: SPACING.xxs,
  },
  tabsStrip: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray200,
    gap: SPACING.xs,
  },
  tabChip: {
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
  },
  tabChipText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray600,
  },
  tabChipTextActive: {
    color: COLORS.white,
  },
  listContent: {
    padding: SPACING.base,
    gap: SPACING.sm,
    flexGrow: 1,
  },
  notifCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  notifCardUnread: {
    borderColor: '#BFDBFE',
    backgroundColor: '#F8FAFC',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerInfoCol: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  timestampText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray400,
  },
  notifTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray900,
    lineHeight: 18,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
    marginLeft: SPACING.xs,
    marginTop: 4,
  },
  notifMessage: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray600,
    lineHeight: 17,
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.lg,
  },
  emptyTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.gray800,
    marginTop: SPACING.md,
  },
  emptySubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
    textAlign: 'center',
    marginTop: SPACING.xs,
    lineHeight: 20,
  },
});
