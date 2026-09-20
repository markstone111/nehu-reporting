/**
 * Issue Detail Screen — app/(app)/issues/[id].tsx
 *
 * Detailed view of a grievance including status, category, location,
 * duplicate linkage alert, and resolution timeline events.
 */

import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/common/Card';
import { StatusChip } from '@/components/common/StatusChip';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { Timeline } from '@/components/issue';
import { useIssueDetail } from '@/hooks/useIssues';
import { getCategoryById } from '@/constants/categories';
import { formatDateTime } from '@/utils/date.utils';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export default function IssueDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const { data: issue, isLoading, error, refetch } = useIssueDetail(id ?? '');

  if (isLoading) {
    return (
      <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
        <Header title="Grievance Details" showBack />
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Fetching grievance details...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (error || !issue) {
    return (
      <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
        <Header title="Grievance Details" showBack />
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>Unable to Load Grievance</Text>
          <Text style={styles.errorMessage}>
            Could not retrieve details for this issue. Please check your network connection.
          </Text>
          <Button title="Retry" onPress={() => refetch()} variant="primary" size="md" />
        </View>
      </ScreenWrapper>
    );
  }

  const category = getCategoryById(issue.category);
  const categoryLabel = category ? category.label : issue.category.replace('_', ' ');
  const refCode = `#${issue.id.slice(0, 8).toUpperCase()}`;

  return (
    <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
      <Header title="Grievance Details" subtitle={refCode} showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Duplicate Linkage Alert (if applicable) */}
        {issue.isDuplicate && (
          <View style={styles.duplicateBanner}>
            <Ionicons name="link-outline" size={20} color="#B45309" style={styles.duplicateIcon} />
            <View style={styles.duplicateTextContainer}>
              <Text style={styles.duplicateTitle}>Linked to Existing Campus Issue</Text>
              <Text style={styles.duplicateMessage}>
                Your report was linked to an existing campus issue by university administration for
                grouped resolution.
              </Text>
            </View>
          </View>
        )}

        {/* Status Card */}
        <Card variant="elevated" padding="md" style={styles.card}>
          <View style={styles.statusHeaderRow}>
            <View>
              <Text style={styles.metaLabel}>Current Status</Text>
              <StatusChip status={issue.status} size="md" style={styles.statusChip} />
            </View>
            <View style={styles.trackingContainer}>
              <Text style={styles.metaLabel}>Reference ID</Text>
              <Text style={styles.trackingId}>{refCode}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.metaGrid}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Submitted</Text>
              <Text style={styles.metaValue}>{formatDateTime(issue.createdAt)}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Assigned Department</Text>
              <Text style={styles.metaValue} numberOfLines={2}>
                {issue.assignedTo ?? 'Pending Assignment'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Issue Description Card */}
        <Card variant="elevated" padding="md" style={styles.card}>
          <View style={styles.categoryRow}>
            <Badge label={categoryLabel} variant="primary" size="sm" />
            {issue.subcategory && (
              <Badge
                label={issue.subcategory.replace('_', ' ')}
                variant="neutral"
                size="sm"
                style={styles.subcatBadge}
              />
            )}
          </View>

          <Text style={styles.issueTitle}>{issue.title}</Text>
          <Text style={styles.issueDescription}>{issue.description}</Text>

          {/* Location details */}
          <View style={styles.locationContainer}>
            <View style={styles.locationHeaderRow}>
              <Ionicons name="location" size={16} color={COLORS.primary} />
              <Text style={styles.locationTitle}>Campus Location</Text>
            </View>
            <Text style={styles.locationLabel}>{issue.location.label}</Text>
            {issue.location.autoFetched && (
              <View style={styles.gpsVerifiedRow}>
                <Ionicons name="navigate-circle-outline" size={12} color={COLORS.success} />
                <Text style={styles.gpsVerifiedText}>GPS coordinates verified</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Resolution Timeline Card */}
        <Card variant="elevated" padding="md" style={styles.card}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="git-commit-outline" size={18} color={COLORS.primary} />
            <Text style={styles.timelineSectionTitle}>Grievance Timeline</Text>
          </View>

          <Timeline events={issue.timeline ?? []} currentStatus={issue.status} />
        </Card>

        {/* Helpdesk Notice */}
        <View style={styles.supportFooter}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.gray500} />
          <Text style={styles.supportText}>
            For urgent security matters or physical emergencies, dial campus security at
            0364-272-1000.
          </Text>
        </View>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginTop: SPACING.md,
  },
  errorTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.gray900,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  errorMessage: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  duplicateBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.warningLight,
    borderWidth: 1,
    borderColor: '#FDE68A',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  duplicateIcon: {
    marginRight: SPACING.sm,
    marginTop: 2,
  },
  duplicateTextContainer: {
    flex: 1,
  },
  duplicateTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#92400E',
    marginBottom: 2,
  },
  duplicateMessage: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#B45309',
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.4,
  },
  card: {
    marginBottom: SPACING.base,
  },
  statusHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusChip: {
    marginTop: SPACING.xs,
  },
  trackingContainer: {
    alignItems: 'flex-end',
  },
  trackingId: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.primary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.gray100,
    marginVertical: SPACING.md,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  metaCol: {
    flex: 1,
  },
  metaLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.gray500,
  },
  metaValue: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray800,
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  subcatBadge: {
    marginLeft: SPACING.xs,
  },
  issueTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.gray900,
    lineHeight: TYPOGRAPHY.fontSize.md * 1.3,
    marginBottom: SPACING.sm,
  },
  issueDescription: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray700,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.5,
    marginBottom: SPACING.base,
  },
  locationContainer: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
  },
  locationLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray800,
  },
  gpsVerifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  gpsVerifiedText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.success,
    marginLeft: 3,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  timelineSectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray900,
    marginLeft: SPACING.xs,
  },
  supportFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  supportText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray500,
    textAlign: 'center',
    marginLeft: SPACING.xs,
  },
});
