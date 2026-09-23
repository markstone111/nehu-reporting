/**
 * TimelineStep Component
 *
 * Modular step item in the grievance resolution timeline.
 * Displays step node, connecting line, event title, actor badge,
 * message description, and timestamp.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Badge } from '@/components/common/Badge';
import { timeAgo, formatDateTime } from '@/utils/date.utils';
import { statusToLabel, capitalize } from '@/utils/text.utils';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import type { TimelineEvent, IssueStatus } from '@/types/api.types';

export interface TimelineStepProps {
  readonly event: TimelineEvent;
  readonly isLast: boolean;
  readonly isCurrent?: boolean;
}

interface EventConfig {
  readonly icon: keyof typeof Ionicons.glyphMap;
  readonly color: string;
  readonly bgColor: string;
}

const EVENT_CONFIGS: Record<IssueStatus | 'COMMENT', EventConfig> = {
  SUBMITTED: {
    icon: 'paper-plane-outline',
    color: COLORS.primary,
    bgColor: COLORS.primarySubtle,
  },
  UNDER_REVIEW: {
    icon: 'search-outline',
    color: COLORS.info,
    bgColor: COLORS.infoLight,
  },
  ASSIGNED: {
    icon: 'person-add-outline',
    color: '#7C3AED',
    bgColor: '#F3E8FF',
  },
  IN_PROGRESS: {
    icon: 'construct-outline',
    color: '#B45309',
    bgColor: COLORS.warningLight,
  },
  RESOLVED: {
    icon: 'checkmark-circle',
    color: COLORS.success,
    bgColor: COLORS.successLight,
  },
  CLOSED: {
    icon: 'lock-closed-outline',
    color: COLORS.gray600,
    bgColor: COLORS.gray200,
  },
  ESCALATED: {
    icon: 'alert-circle-outline',
    color: COLORS.error,
    bgColor: COLORS.errorLight,
  },
  COMMENT: {
    icon: 'chatbubble-ellipses-outline',
    color: COLORS.primary,
    bgColor: COLORS.primarySubtle,
  },
};

export function TimelineStep({ event, isLast, isCurrent = false }: TimelineStepProps) {
  const config = EVENT_CONFIGS[event.event] ?? EVENT_CONFIGS.SUBMITTED;
  const stepTitle = event.title ?? statusToLabel(event.event);
  const actorRole = capitalize(event.actor);
  const actorDisplay = event.actorName ?? actorRole;

  const getActorBadgeVariant = () => {
    switch (event.actor) {
      case 'admin':
        return 'primary';
      case 'user':
        return 'secondary';
      case 'system':
      default:
        return 'neutral';
    }
  };

  return (
    <View style={styles.stepContainer}>
      {/* Node column with connecting vertical line */}
      <View style={styles.nodeColumn}>
        <View
          style={[
            styles.nodeCircle,
            { backgroundColor: config.bgColor, borderColor: config.color },
            isCurrent && styles.nodeCircleCurrent,
          ]}
        >
          <Ionicons name={config.icon} size={15} color={config.color} />
        </View>

        {!isLast && (
          <View style={[styles.connectingLine, isCurrent && styles.connectingLineActive]} />
        )}
      </View>

      {/* Content column */}
      <View style={[styles.contentColumn, !isLast && styles.contentSpacing]}>
        {/* Step Header */}
        <View style={styles.headerRow}>
          <Text style={[styles.stepTitle, isCurrent && styles.stepTitleCurrent]}>{stepTitle}</Text>
          <Text style={styles.timeAgoText}>{timeAgo(event.timestamp)}</Text>
        </View>

        {/* Actor and Exact Timestamp Row */}
        <View style={styles.actorRow}>
          <Badge
            label={actorDisplay}
            variant={getActorBadgeVariant()}
            size="sm"
            style={styles.actorBadge}
          />
          <Text style={styles.exactDateText}>{formatDateTime(event.timestamp)}</Text>
        </View>

        {/* Message / Description Box */}
        {event.message ? (
          <View style={[styles.messageBox, isCurrent && styles.messageBoxCurrent]}>
            <Text style={styles.messageText}>{event.message}</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    flexDirection: 'row',
  },
  nodeColumn: {
    alignItems: 'center',
    width: 32,
    marginRight: SPACING.sm,
  },
  nodeCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
    backgroundColor: COLORS.white,
  },
  nodeCircleCurrent: {
    borderWidth: 2,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  connectingLine: {
    width: 2,
    flex: 1,
    backgroundColor: COLORS.gray200,
    marginVertical: 2,
  },
  connectingLineActive: {
    backgroundColor: COLORS.primarySubtle,
  },
  contentColumn: {
    flex: 1,
  },
  contentSpacing: {
    paddingBottom: SPACING.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  stepTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray900,
    flex: 1,
    marginRight: SPACING.xs,
  },
  stepTitleCurrent: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
  },
  timeAgoText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray400,
  },
  actorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  actorBadge: {
    alignSelf: 'flex-start',
  },
  exactDateText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.gray400,
  },
  messageBox: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  messageBoxCurrent: {
    backgroundColor: COLORS.primarySubtle,
    borderColor: '#BFDBFE',
  },
  messageText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray700,
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.4,
  },
});
