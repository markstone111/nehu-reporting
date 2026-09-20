/**
 * IssueCard Component
 *
 * Canva-inspired grievance summary card displaying status, category,
 * title, location, and relative time. Used across Dashboard and My Issues lists.
 */

import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/common/Card';
import { StatusChip } from '@/components/common/StatusChip';
import { Badge } from '@/components/common/Badge';
import { getCategoryById } from '@/constants/categories';
import { timeAgo } from '@/utils/date.utils';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';
import type { IssueSummary } from '@/types/api.types';

export interface IssueCardProps {
  readonly issue: IssueSummary;
  readonly onPress?: (issue: IssueSummary) => void;
  readonly style?: StyleProp<ViewStyle>;
}

export function IssueCard({ issue, onPress, style }: IssueCardProps) {
  const category = getCategoryById(issue.category);
  const categoryLabel = category ? category.label : issue.category.replace('_', ' ');

  const handlePress = () => {
    if (onPress) {
      onPress(issue);
    }
  };

  return (
    <Card variant="elevated" padding="md" onPress={handlePress} style={[styles.card, style]}>
      {/* Top Meta Row: Category & Status */}
      <View style={styles.topRow}>
        <Badge label={categoryLabel} variant="primary" size="sm" style={styles.categoryBadge} />
        <StatusChip status={issue.status} size="sm" />
      </View>

      {/* Main Content: Title & Description */}
      <Text style={styles.title} numberOfLines={2}>
        {issue.title}
      </Text>

      {issue.description ? (
        <Text style={styles.description} numberOfLines={2}>
          {issue.description}
        </Text>
      ) : null}

      {/* Location Row */}
      {issue.locationLabel ? (
        <View style={styles.locationRow}>
          <Ionicons
            name="location-outline"
            size={14}
            color={COLORS.gray500}
            style={styles.locationIcon}
          />
          <Text style={styles.locationText} numberOfLines={1}>
            {issue.locationLabel}
          </Text>
        </View>
      ) : null}

      {/* Bottom Footer: Reference ID & Timestamp */}
      <View style={styles.footerRow}>
        <View style={styles.idContainer}>
          <Text style={styles.refId}>#{issue.id.slice(0, 8).toUpperCase()}</Text>
          {issue.isDuplicate && (
            <Badge label="Linked" variant="warning" size="sm" style={styles.duplicateBadge} />
          )}
        </View>

        <View style={styles.timeContainer}>
          <Ionicons name="time-outline" size={13} color={COLORS.gray400} style={styles.timeIcon} />
          <Text style={styles.timeText}>{timeAgo(issue.createdAt)}</Text>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={COLORS.gray400}
            style={styles.chevron}
          />
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: SPACING.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  categoryBadge: {
    maxWidth: '55%',
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray900,
    lineHeight: TYPOGRAPHY.fontSize.base * 1.3,
    marginBottom: SPACING.xs,
  },
  description: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.4,
    marginBottom: SPACING.sm,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  locationIcon: {
    marginRight: SPACING.xs,
  },
  locationText: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: SPACING.xs + 2,
    borderTopWidth: 1,
    borderTopColor: COLORS.gray100,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refId: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray400,
    letterSpacing: 0.5,
  },
  duplicateBadge: {
    marginLeft: SPACING.xs,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeIcon: {
    marginRight: SPACING.xxs,
  },
  timeText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
  },
  chevron: {
    marginLeft: SPACING.xs,
  },
});
