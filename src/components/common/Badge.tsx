/**
 * Badge Component
 *
 * Canva-inspired pill badge for categories, counts, and tags.
 */

import type { ReactNode } from 'react';
import {
  View,
  Text,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING } from '@/constants/theme';

export type BadgeVariant =
  'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';

export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  readonly label: string;
  readonly variant?: BadgeVariant;
  readonly size?: BadgeSize;
  readonly icon?: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly textStyle?: StyleProp<TextStyle>;
}

export function Badge({
  label,
  variant = 'primary',
  size = 'md',
  icon,
  style,
  textStyle,
}: BadgeProps) {
  return (
    <View style={[styles.badge, styles[`variant_${variant}`], styles[`size_${size}`], style]}>
      {icon && <View style={styles.iconContainer}>{icon}</View>}
      <Text
        style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.full,
    alignSelf: 'flex-start',
  },
  iconContainer: {
    marginRight: SPACING.xs,
  },
  text: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },

  // Sizes
  size_sm: {
    paddingVertical: SPACING.xxs,
    paddingHorizontal: SPACING.sm,
  },
  size_md: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
  },

  // Text sizes
  textSize_sm: {
    fontSize: TYPOGRAPHY.fontSize.xs,
  },
  textSize_md: {
    fontSize: TYPOGRAPHY.fontSize.sm,
  },

  // Variants
  variant_primary: {
    backgroundColor: COLORS.primarySubtle,
  },
  text_primary: {
    color: COLORS.primary,
  },

  variant_secondary: {
    backgroundColor: COLORS.accentLight,
  },
  text_secondary: {
    color: '#B45309',
  },

  variant_success: {
    backgroundColor: COLORS.successLight,
  },
  text_success: {
    color: COLORS.success,
  },

  variant_warning: {
    backgroundColor: COLORS.warningLight,
  },
  text_warning: {
    color: COLORS.warning,
  },

  variant_error: {
    backgroundColor: COLORS.errorLight,
  },
  text_error: {
    color: COLORS.error,
  },

  variant_info: {
    backgroundColor: COLORS.infoLight,
  },
  text_info: {
    color: COLORS.info,
  },

  variant_neutral: {
    backgroundColor: COLORS.gray100,
  },
  text_neutral: {
    color: COLORS.gray700,
  },
});
