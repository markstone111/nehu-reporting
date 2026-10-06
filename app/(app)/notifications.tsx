/**
 * Campus Alerts & Notifications Screen — app/(app)/notifications.tsx
 *
 * Real-time notification hub for NEHU campus members.
 * Displays grievance lifecycle updates, administrative remarks,
 * assignment notices, and university advisories.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

interface CampusNotification {
  id: string;
  category: 'Grievance' | 'Administrative';
  status: 'In Progress' | 'Under Review' | 'Resolved' | 'Notice';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  issueId?: string;
  icon: keyof typeof Ionicons.glyphMap;
  badgeVariant: 'primary' | 'warning' | 'success' | 'neutral';
}

const INITIAL_NOTIFICATIONS: CampusNotification[] = [
  {
    id: 'notif-1',
    category: 'Grievance',
    status: 'In Progress',
    title: 'Wi-Fi Outage Assigned to Network Engineering',
    message:
      'Grievance #IT-9402 (7th sem Classroom & Software Lab) assigned to Senior Network Engineer for hardware diagnostic.',
    timestamp: '12m ago',
    isRead: false,
    issueId: 'c1-wifi-it',
    icon: 'wifi-outline',
    badgeVariant: 'primary',
  },
  {
    id: 'notif-2',
    category: 'Grievance',
    status: 'Under Review',
    title: 'Kyllang Hostel Water Filtration Inspection',
    message:
      'Estate & Sanitation department scheduled technician visit to replace purifier membranes on Ground & 2nd Floor.',
    timestamp: '1h ago',
    isRead: false,
    issueId: 'c2-water-kyllang',
    icon: 'water-outline',
    badgeVariant: 'warning',
  },
  {
    id: 'notif-3',
    category: 'Grievance',
    status: 'Resolved',
    title: 'Grievance #HYG-3180 Resolved',
    message:
      'Housekeeping staff cleared overflowing dustbins and sanitized 2nd Floor corridor in School of Technology.',
    timestamp: 'Yesterday',
    isRead: true,
    issueId: 'c3-hygiene-sot',
    icon: 'checkmark-circle-outline',
    badgeVariant: 'success',
  },
  {
    id: 'notif-4',
    category: 'Administrative',
    status: 'Notice',
    title: 'Central Campus Fiber Gateway Maintenance',
    message:
      'Computer Centre scheduled core router maintenance on Saturday 2:00 AM – 5:00 AM. Intermittent drops expected.',
    timestamp: '2 days ago',
    isRead: true,
    icon: 'construct-outline',
    badgeVariant: 'neutral',
  },
];

type FilterTab = 'ALL' | 'GRIEVANCES' | 'ADMINISTRATIVE';

export default function NotificationsScreen() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<CampusNotification[]>(INITIAL_NOTIFICATIONS);
  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise((res) => setTimeout(res, 600));
    setRefreshing(false);
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const handleNotificationPress = (notif: CampusNotification) => {
    // Mark as read
    setNotifications((prev) => prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n)));

    if (notif.issueId) {
      router.push({
        pathname: '/(app)/issues/[id]',
        params: { id: notif.issueId },
      });
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (activeTab === 'GRIEVANCES') return n.category === 'Grievance';
    if (activeTab === 'ADMINISTRATIVE') return n.category === 'Administrative';
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
      <Header
        title="Alerts & Notices"
        subtitle={
          unreadCount > 0 ? `${unreadCount} unread university updates` : 'All updates reviewed'
        }
        rightElement={
          unreadCount > 0 ? (
            <Pressable
              onPress={handleMarkAllRead}
              hitSlop={8}
              style={styles.headerActionBtn}
              accessibilityRole="button"
              accessibilityLabel="Mark all read"
            >
              <Ionicons name="checkmark-done-outline" size={20} color={COLORS.primary} />
            </Pressable>
          ) : undefined
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
            Grievances (3)
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('ADMINISTRATIVE')}
          style={[styles.tabChip, activeTab === 'ADMINISTRATIVE' && styles.tabChipActive]}
        >
          <Text
            style={[styles.tabChipText, activeTab === 'ADMINISTRATIVE' && styles.tabChipTextActive]}
          >
            Advisory (1)
          </Text>
        </Pressable>
      </View>

      {/* Notifications List */}
      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => handleNotificationPress(item)}>
            <Card
              variant="elevated"
              padding="md"
              style={[styles.notifCard, !item.isRead && styles.notifCardUnread]}
            >
              <View style={styles.cardHeaderRow}>
                <View style={styles.iconCircle}>
                  <Ionicons name={item.icon} size={18} color={COLORS.primary} />
                </View>
                <View style={styles.headerInfoCol}>
                  <View style={styles.badgeRow}>
                    <Badge label={item.status} variant={item.badgeVariant} size="sm" />
                    <Text style={styles.timestampText}>{item.timestamp}</Text>
                  </View>
                  <Text style={styles.notifTitle} numberOfLines={2}>
                    {item.title}
                  </Text>
                </View>
                {!item.isRead && <View style={styles.unreadDot} />}
              </View>

              <Text style={styles.notifMessage}>{item.message}</Text>
            </Card>
          </Pressable>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
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
});
