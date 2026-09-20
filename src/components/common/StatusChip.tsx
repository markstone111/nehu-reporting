/**
 * StatusChip Component
 *
 * Visual status indicator for grievances (Submitted, Under Review, In Progress, Resolved, etc.).
 * Includes a subtle status dot and accessible text colors.
 */

import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '@/constants/theme';
import { statusToLabel } from '@/utils/text.utils';
import type { IssueStatus } from '@/types/api.types';

export interface StatusChipProps {
  readonly status: IssueStatus;
  readonly showDot?: boolean;
  readonly size?: 'sm' | 'md';
  readonly style?: StyleProp<ViewStyle>;
}

interface StatusConfig {
  readonly bg: string;
  readonly text: string;
  readonly dot: string;
}

const STATUS_CONFIGS: Record<IssueStatus, StatusConfig> = {
  SUBMITTED: {
    bg: COLORS.gray100,
    text: COLORS.gray700,
    dot: COLORS.statusSubmitted,
  },
  UNDER_REVIEW: {
    bg: COLORS.infoLight,
    text: COLORS.info,
    dot: COLORS.statusUnderReview,
  },
  ASSIGNED: {
    bg: '#F3E8FF',
    text: '#7C3AED',
    dot: COLORS.statusAssigned,
  },
  IN_PROGRESS: {
    bg: COLORS.warningLight,
    text: '#B45309',
    dot: COLORS.statusInProgress,
  },
  RESOLVED: {
    bg: COLORS.successLight,
    text: COLORS.success,
    dot: COLORS.statusResolved,
  },
  CLOSED: {
    bg: COLORS.gray200,
    text: COLORS.gray600,
    dot: COLORS.statusClosed,
  },
  ESCALATED: {
    bg: COLORS.errorLight,
    text: COLORS.error,
    dot: COLORS.statusEscalated,
  },
};

export function StatusChip({ status, showDot = true, size = 'md', style }: StatusChipProps) {
  const config = STATUS_CONFIGS[status] ?? STATUS_CONFIGS.SUBMITTED;
  const label = statusToLabel(status);

  return (
    <View
      style={[styles.chip, { backgroundColor: config.bg }, styles[`size_${size}`], style]}
      accessibilityRole="text"
      accessibilityLabel={`Status: ${label}`}
    >
      {showDot && (
        <View style={[styles.dot, { backgroundColor: config.dot }, styles[`dot_${size}`]]} />
      )}
      <Text style={[styles.label, { color: config.text }, styles[`label_${size}`]]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  dot: {
    borderRadius: RADIUS.full,
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Sizes
  size_sm: {
    paddingVertical: SPACING.xxs + 1,
    paddingHorizontal: SPACING.sm,
  },
  size_md: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },

  dot_sm: {
    width: 6,
    height: 6,
    marginRight: SPACING.xs,
  },
  dot_md: {
    width: 8,
    height: 8,
    marginRight: SPACING.xs + 2,
  },

  label_sm: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  label_md: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },
});
