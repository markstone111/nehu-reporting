/**
 * DraftReviewCard Component — src/components/chatbot/DraftReviewCard.tsx
 *
 * Canva-inspired review surface presented when the AI assistant has collected
 * all necessary grievance parameters (title, category, location, description).
 * Gives the student full visibility and control before official submission.
 */

import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { getCategoryById } from '@/constants/categories';
import type { DraftIssue } from '@/types/api.types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export interface DraftReviewCardProps {
  readonly draft: DraftIssue;
  readonly onSubmit: () => void;
  readonly onKeepChatting?: () => void;
  readonly onReset?: () => void;
  readonly isSubmitting?: boolean;
}

export function DraftReviewCard({
  draft,
  onSubmit,
  onKeepChatting,
  onReset,
  isSubmitting = false,
}: DraftReviewCardProps) {
  const category = getCategoryById(draft.category);
  const categoryLabel = category ? category.label : draft.category.replace('_', ' ');

  return (
    <Card variant="elevated" padding="md" style={styles.card}>
      {/* Header Banner */}
      <View style={styles.headerRow}>
        <View style={styles.sparkleCircle}>
          <Ionicons name="sparkles" size={16} color={COLORS.accent} />
        </View>
        <View style={styles.headerTextWrapper}>
          <Text style={styles.headerTitle}>Grievance Draft Ready</Text>
          <Text style={styles.headerSubtitle}>
            Please review the structured summary before filing
          </Text>
        </View>
        <Badge label="Ready" variant="secondary" size="sm" />
      </View>

      <View style={styles.divider} />

      {/* Category & Subcategory Row */}
      <View style={styles.categoryRow}>
        <Badge label={categoryLabel} variant="primary" size="sm" />
        {draft.subcategory && (
          <Badge
            label={draft.subcategory.replace('_', ' ')}
            variant="neutral"
            size="sm"
            style={styles.subcatBadge}
          />
        )}
      </View>

      {/* Title */}
      <Text style={styles.draftTitle}>{draft.title}</Text>

      {/* Description */}
      <View style={styles.descriptionBox}>
        <Text style={styles.descriptionLabel}>Grievance Description:</Text>
        <Text style={styles.descriptionText}>{draft.description}</Text>
      </View>

      {/* Campus Location */}
      <View style={styles.locationContainer}>
        <Ionicons name="location" size={16} color={COLORS.primary} />
        <View style={styles.locationTextWrapper}>
          <Text style={styles.locationLabelText}>Campus Location</Text>
          <Text style={styles.locationValueText}>{draft.location.label}</Text>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        <Button
          title="Confirm & Submit Grievance"
          onPress={onSubmit}
          loading={isSubmitting}
          variant="primary"
          size="md"
          icon={<Ionicons name="paper-plane" size={16} color={COLORS.white} />}
        />

        <View style={styles.secondaryButtonsRow}>
          {onKeepChatting && (
            <Button
              title="Add More Details"
              onPress={onKeepChatting}
              disabled={isSubmitting}
              variant="outline"
              size="sm"
              style={styles.secondaryBtn}
            />
          )}

          {onReset && (
            <Button
              title="Start Over"
              onPress={onReset}
              disabled={isSubmitting}
              variant="ghost"
              size="sm"
              style={styles.secondaryBtn}
            />
          )}
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginVertical: SPACING.md,
    borderWidth: 1.5,
    borderColor: '#FED7AA',
    backgroundColor: '#FFFCF7',
    borderRadius: RADIUS.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sparkleCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerTextWrapper: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  headerTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.sm + 1,
    color: COLORS.gray900,
  },
  headerSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.gray500,
  },
  divider: {
    height: 1,
    backgroundColor: '#FED7AA',
    marginVertical: SPACING.sm + 2,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
  },
  subcatBadge: {
    marginLeft: SPACING.xs,
  },
  draftTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray900,
    marginBottom: SPACING.sm,
    lineHeight: TYPOGRAPHY.fontSize.base * 1.3,
  },
  descriptionBox: {
    backgroundColor: COLORS.white,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: SPACING.sm,
  },
  descriptionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 10,
    color: COLORS.gray400,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  descriptionText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    color: COLORS.gray800,
    lineHeight: 18,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primarySubtle,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    marginBottom: SPACING.md,
    gap: SPACING.xs + 2,
  },
  locationTextWrapper: {
    flex: 1,
  },
  locationLabelText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.primary,
  },
  locationValueText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    color: COLORS.primary,
  },
  actionsContainer: {
    gap: SPACING.xs + 2,
  },
  secondaryButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginTop: 2,
  },
  secondaryBtn: {
    minWidth: 120,
  },
});
