/**
 * Home Dashboard — app/(app)/index.tsx
 *
 * Primary landing dashboard for NEHU students and staff.
 * Canva-inspired visual hierarchy with metrics overview, quick action cards,
 * recent grievance activity, and 24/7 campus emergency contacts.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, RefreshControl, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Avatar } from '@/components/common/Avatar';
import { IssueCard } from '@/components/issue/IssueCard';
import { EmptyState } from '@/components/issue/EmptyState';
import { useCurrentUser } from '@/hooks/useAuth';
import { useMyIssues } from '@/hooks/useIssues';
import { capitalize } from '@/utils/text.utils';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import type { IssueSummary } from '@/types/api.types';

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { data: issuesData, refetch, isRefetching } = useMyIssues({ page: 1, pageSize: 5 });

  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const displayName = user?.name ?? 'Campus Member';
  const displayRole = user?.role ? capitalize(user.role) : 'Student';

  // Calculate live statistics
  const issues = issuesData?.data ?? [];
  const totalCount = issuesData?.total ?? issues.length;
  const inProgressCount = issues.filter(
    (i) => i.status === 'IN_PROGRESS' || i.status === 'UNDER_REVIEW' || i.status === 'ASSIGNED',
  ).length;
  const resolvedCount = issues.filter((i) => i.status === 'RESOLVED').length;

  const recentIssues = issues.slice(0, 3);

  const handleIssuePress = (issue: IssueSummary) => {
    router.push(`/(app)/issues/${issue.id}`);
  };

  return (
    <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={handleRefresh}
            colors={[COLORS.primary]}
            tintColor={COLORS.primary}
          />
        }
      >
        {/* Top User Greeting Header */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <View style={styles.roleBadgeRow}>
              <Text style={styles.universitySubtext}>NORTH-EASTERN HILL UNIVERSITY</Text>
              <Badge label={displayRole} variant="primary" size="sm" style={styles.roleBadge} />
            </View>
            <Text style={styles.welcomeGreeting}>Hello, {displayName}</Text>
          </View>

          <Pressable
            onPress={() => router.push('/(app)/profile')}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Open profile"
          >
            <Avatar name={displayName} imageUrl={user?.avatarUrl} size="md" />
          </Pressable>
        </View>

        {/* Metrics Overview Strip */}
        <View style={styles.metricsRow}>
          <Card variant="elevated" padding="sm" style={styles.metricCard}>
            <View style={styles.metricIconCircle}>
              <Ionicons name="folder-open-outline" size={18} color={COLORS.primary} />
            </View>
            <Text style={styles.metricNumber}>{totalCount}</Text>
            <Text style={styles.metricLabel}>Total Filed</Text>
          </Card>

          <Card variant="elevated" padding="sm" style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: COLORS.warningLight }]}>
              <Ionicons name="time-outline" size={18} color={COLORS.warning} />
            </View>
            <Text style={styles.metricNumber}>{inProgressCount}</Text>
            <Text style={styles.metricLabel}>In Progress</Text>
          </Card>

          <Card variant="elevated" padding="sm" style={styles.metricCard}>
            <View style={[styles.metricIconCircle, { backgroundColor: COLORS.successLight }]}>
              <Ionicons name="checkmark-circle-outline" size={18} color={COLORS.success} />
            </View>
            <Text style={styles.metricNumber}>{resolvedCount}</Text>
            <Text style={styles.metricLabel}>Resolved</Text>
          </Card>
        </View>

        {/* Quick Report Action Cards */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>File Grievance or Report</Text>
        </View>

        <View style={styles.actionCardsRow}>
          {/* Option 1: Standard Structured Form */}
          <Card
            variant="elevated"
            padding="md"
            onPress={() => router.push('/(app)/report/form')}
            style={styles.actionCard}
          >
            <View style={[styles.actionIconBadge, { backgroundColor: COLORS.primarySubtle }]}>
              <Ionicons name="document-text" size={22} color={COLORS.primary} />
            </View>
            <Text style={styles.actionCardTitle}>Standard Form</Text>
            <Text style={styles.actionCardDesc}>
              Structured grievance with campus category & location
            </Text>
            <View style={styles.actionCardFooter}>
              <Text style={styles.actionCardLink}>Open Form</Text>
              <Ionicons name="arrow-forward" size={14} color={COLORS.primary} />
            </View>
          </Card>

          {/* Option 2: AI Chatbot Assistant */}
          <Card
            variant="elevated"
            padding="md"
            onPress={() => router.push('/(app)/report/chatbot')}
            style={[styles.actionCard, styles.actionCardAI]}
          >
            <View style={styles.aiBadgeRow}>
              <View style={[styles.actionIconBadge, { backgroundColor: COLORS.accentLight }]}>
                <Ionicons name="chatbubbles" size={22} color={COLORS.accent} />
              </View>
              <Badge label="AI Powered" variant="secondary" size="sm" />
            </View>
            <Text style={styles.actionCardTitle}>Chat with AI</Text>
            <Text style={styles.actionCardDesc}>
              Natural language grievance drafting & auto-tagging
            </Text>
            <View style={styles.actionCardFooter}>
              <Text style={[styles.actionCardLink, { color: '#B45309' }]}>Start Chat</Text>
              <Ionicons name="arrow-forward" size={14} color="#B45309" />
            </View>
          </Card>
        </View>

        {/* Recent Grievances Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Recent Grievances</Text>
          <Pressable
            onPress={() => router.push('/(app)/issues')}
            hitSlop={8}
            accessibilityRole="button"
          >
            <Text style={styles.viewAllLink}>View All ({totalCount})</Text>
          </Pressable>
        </View>

        {recentIssues.length > 0 ? (
          recentIssues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} onPress={handleIssuePress} />
          ))
        ) : (
          <EmptyState
            icon="document-text-outline"
            title="No Grievances Reported Yet"
            message="Issues you submit via form or chatbot will appear here with live tracking."
            actionTitle="Report an Issue"
            onAction={() => router.push('/(app)/report/form')}
          />
        )}

        {/* Anti-Ragging & Emergency Helpline Card */}
        <Card variant="outlined" padding="md" style={styles.emergencyCard}>
          <View style={styles.emergencyHeaderRow}>
            <View style={styles.emergencyIconCircle}>
              <Ionicons name="warning-outline" size={20} color={COLORS.error} />
            </View>
            <View style={styles.emergencyTextContainer}>
              <Text style={styles.emergencyTitle}>NEHU Anti-Ragging & Safety Cell</Text>
              <Text style={styles.emergencySubtitle}>
                Zero tolerance for harassment or ragging on campus.
              </Text>
            </View>
          </View>
          <View style={styles.helplineList}>
            <View style={styles.helplineItem}>
              <Ionicons name="call-outline" size={14} color={COLORS.gray600} />
              <Text style={styles.helplineText}>National Anti-Ragging Helpline: 1800-180-5522</Text>
            </View>
            <View style={styles.helplineItem}>
              <Ionicons name="mail-outline" size={14} color={COLORS.gray600} />
              <Text style={styles.helplineText}>Proctor Office: proctor@nehu.ac.in</Text>
            </View>
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerTextContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  roleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xxs,
  },
  universitySubtext: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 10,
    letterSpacing: TYPOGRAPHY.letterSpacing.caps,
    color: COLORS.primary,
    marginRight: SPACING.xs,
  },
  roleBadge: {
    paddingVertical: 1,
    paddingHorizontal: SPACING.xs,
  },
  welcomeGreeting: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.gray900,
  },
  metricsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  metricIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  metricNumber: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.gray900,
  },
  metricLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.gray900,
  },
  viewAllLink: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
  },
  actionCardsRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  actionCard: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  actionCardAI: {
    borderColor: '#FDE68A',
  },
  aiBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  actionIconBadge: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.sm,
  },
  actionCardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray900,
    marginBottom: SPACING.xxs,
  },
  actionCardDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.4,
    marginBottom: SPACING.md,
    minHeight: 34,
  },
  actionCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xxs,
  },
  actionCardLink: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
  },
  emergencyCard: {
    backgroundColor: '#FFF7ED',
    borderColor: '#FED7AA',
    marginTop: SPACING.base,
  },
  emergencyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  emergencyIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.errorLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  emergencyTextContainer: {
    flex: 1,
  },
  emergencyTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray900,
  },
  emergencySubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray600,
  },
  helplineList: {
    paddingTop: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: '#FED7AA',
    gap: SPACING.xs,
  },
  helplineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  helplineText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.gray700,
    marginLeft: SPACING.xs,
  },
});
