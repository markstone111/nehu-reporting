/**
 * Card Component
 *
 * Canva-inspired surface container with subtle border, soft shadow,
 * and optional pressable behavior.
 */

import type { ReactNode } from 'react';
import { View, Pressable, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS, RADIUS, SHADOWS, SPACING } from '@/constants/theme';

export type CardVariant = 'elevated' | 'outlined' | 'flat';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps {
  readonly children: ReactNode;
  readonly style?: StyleProp<ViewStyle>;
  readonly onPress?: () => void;
  readonly variant?: CardVariant;
  readonly padding?: CardPadding;
}

export function Card({
  children,
  style,
  onPress,
  variant = 'elevated',
  padding = 'md',
}: CardProps) {
  const containerStyles = [
    styles.card,
    styles[`variant_${variant}`],
    styles[`padding_${padding}`],
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [containerStyles, pressed && styles.pressed]}
      >
        {children}
      </Pressable>
    );
  }

  return <View style={containerStyles}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    overflow: 'hidden',
  },
  pressed: {
    opacity: 0.85,
  },

  // Variants
  variant_elevated: {
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.sm,
  },
  variant_outlined: {
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
  },
  variant_flat: {
    backgroundColor: COLORS.gray100,
  },

  // Paddings
  padding_none: {
    padding: 0,
  },
  padding_sm: {
    padding: SPACING.sm,
  },
  padding_md: {
    padding: SPACING.base,
  },
  padding_lg: {
    padding: SPACING.xl,
  },
});
