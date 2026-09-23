/**
 * Timeline Component
 *
 * Full vertical timeline container for grievance tracking.
 * Connects chronological TimelineStep nodes and shows status progression.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { TimelineStep } from '@/components/issue/TimelineStep';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import type { TimelineEvent, IssueStatus } from '@/types/api.types';

export interface TimelineProps {
  readonly events: readonly TimelineEvent[];
  readonly currentStatus?: IssueStatus;
}

export function Timeline({ events, currentStatus }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="time-outline" size={24} color={COLORS.gray400} />
        <Text style={styles.emptyTitle}>Grievance Queued</Text>
        <Text style={styles.emptyText}>
          Your report has been queued for administrative triage. Status updates will appear here in
          real time.
        </Text>
      </View>
    );
  }

  // Sort chronologically (oldest to newest)
  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
  );

  const lastIndex = sortedEvents.length - 1;

  const isResolved = currentStatus === 'RESOLVED' || currentStatus === 'CLOSED';

  return (
    <View style={styles.container}>
      {/* Timeline Steps */}
      <View style={styles.stepsList}>
        {sortedEvents.map((item, index) => {
          const isLast = index === lastIndex;
          const isCurrent = isLast && !isResolved;

          return <TimelineStep key={item.id} event={item} isLast={isLast} isCurrent={isCurrent} />;
        })}
      </View>

      {/* Resolution Milestone Footer */}
      {isResolved ? (
        <View style={styles.resolvedFooter}>
          <Ionicons name="checkmark-done-circle" size={20} color={COLORS.success} />
          <Text style={styles.resolvedFooterText}>Grievance successfully resolved and closed.</Text>
        </View>
      ) : (
        <View style={styles.pendingFooter}>
          <Ionicons name="information-circle-outline" size={16} color={COLORS.primary} />
          <Text style={styles.pendingFooterText}>
            Standard university redressal SLA is 3 to 7 working days.
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  stepsList: {
    paddingVertical: SPACING.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.md,
  },
  emptyTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray800,
    marginTop: SPACING.xs,
    marginBottom: SPACING.xxs,
  },
  emptyText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.4,
  },
  resolvedFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successLight,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  resolvedFooterText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.success,
    marginLeft: SPACING.xs,
    flex: 1,
  },
  pendingFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySubtle,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginTop: SPACING.xs,
  },
  pendingFooterText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.primary,
    marginLeft: SPACING.xs,
    flex: 1,
  },
});
