/**
 * EmptyState Component
 *
 * Friendly, Canva-styled placeholder for empty lists and search results.
 */

import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/common/Button';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export interface EmptyStateProps {
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly title: string;
  readonly message: string;
  readonly actionTitle?: string;
  readonly onAction?: () => void;
  readonly style?: StyleProp<ViewStyle>;
}

export function EmptyState({
  icon = 'document-text-outline',
  title,
  message,
  actionTitle,
  onAction,
  style,
}: EmptyStateProps) {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={36} color={COLORS.primary} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {actionTitle && onAction && (
        <Button
          title={actionTitle}
          onPress={onAction}
          variant="primary"
          size="md"
          style={styles.actionBtn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxl,
    paddingHorizontal: SPACING.xl,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.base,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  message: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
    textAlign: 'center',
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.4,
    marginBottom: SPACING.lg,
  },
  actionBtn: {
    minWidth: 160,
    borderRadius: RADIUS.full,
  },
});
