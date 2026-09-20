/**
 * Button Component
 *
 * Canva-inspired, accessible button with smooth press states,
 * variants (primary, secondary, outline, ghost, danger),
 * sizes (sm, md, lg), and loading spinner.
 */

import type { ReactNode } from 'react';
import {
  Pressable,
  Text,
  ActivityIndicator,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS, SPACING, SHADOWS } from '@/constants/theme';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  readonly title: string;
  readonly onPress: () => void;
  readonly variant?: ButtonVariant;
  readonly size?: ButtonSize;
  readonly loading?: boolean;
  readonly disabled?: boolean;
  readonly icon?: ReactNode;
  readonly iconPosition?: 'left' | 'right';
  readonly fullWidth?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly textStyle?: StyleProp<TextStyle>;
}

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const getContainerStyle = ({ pressed }: { pressed: boolean }): ViewStyle[] => {
    const base: ViewStyle = {
      ...styles.container,
      ...styles[`size_${size}`],
      ...(fullWidth ? styles.fullWidth : {}),
      ...styles[`variant_${variant}`],
    };

    if (isDisabled) {
      return [base, styles.disabled, ...(style ? [style as ViewStyle] : [])];
    }

    if (pressed) {
      return [base, styles[`pressed_${variant}`], ...(style ? [style as ViewStyle] : [])];
    }

    return [base, ...(style ? [style as ViewStyle] : [])];
  };

  const getSpinnerColor = (): string => {
    switch (variant) {
      case 'outline':
      case 'ghost':
        return COLORS.primary;
      default:
        return COLORS.white;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      style={getContainerStyle}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={getSpinnerColor()} />
          <Text
            style={[
              styles.text,
              styles[`text_${variant}`],
              styles[`textSize_${size}`],
              styles.loadingText,
              textStyle,
            ]}
          >
            Please wait...
          </Text>
        </View>
      ) : (
        <View style={styles.contentRow}>
          {icon && iconPosition === 'left' && <View style={styles.iconLeft}>{icon}</View>}
          <Text
            style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`], textStyle]}
          >
            {title}
          </Text>
          {icon && iconPosition === 'right' && <View style={styles.iconRight}>{icon}</View>}
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  fullWidth: {
    width: '100%',
  },
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: SPACING.sm,
  },
  iconLeft: {
    marginRight: SPACING.sm,
  },
  iconRight: {
    marginLeft: SPACING.sm,
  },
  disabled: {
    opacity: 0.5,
  },

  // Sizes
  size_sm: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    minHeight: 36,
  },
  size_md: {
    paddingVertical: SPACING.sm + 4,
    paddingHorizontal: SPACING.lg,
    minHeight: 48,
  },
  size_lg: {
    paddingVertical: SPACING.md + 2,
    paddingHorizontal: SPACING.xl,
    minHeight: 54,
  },

  // Text sizes
  textSize_sm: {
    fontSize: TYPOGRAPHY.fontSize.sm,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.3,
  },
  textSize_md: {
    fontSize: TYPOGRAPHY.fontSize.base,
    lineHeight: TYPOGRAPHY.fontSize.base * 1.3,
  },
  textSize_lg: {
    fontSize: TYPOGRAPHY.fontSize.md,
    lineHeight: TYPOGRAPHY.fontSize.md * 1.3,
  },

  // Text base
  text: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    textAlign: 'center',
  },

  // Variant containers
  variant_primary: {
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  pressed_primary: {
    backgroundColor: COLORS.primaryLight,
  },
  text_primary: {
    color: COLORS.white,
  },

  variant_secondary: {
    backgroundColor: COLORS.accent,
    ...SHADOWS.sm,
  },
  pressed_secondary: {
    backgroundColor: '#E09618',
  },
  text_secondary: {
    color: COLORS.white,
  },

  variant_outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: COLORS.primary,
  },
  pressed_outline: {
    backgroundColor: COLORS.primarySubtle,
  },
  text_outline: {
    color: COLORS.primary,
  },

  variant_ghost: {
    backgroundColor: 'transparent',
  },
  pressed_ghost: {
    backgroundColor: COLORS.gray100,
  },
  text_ghost: {
    color: COLORS.primary,
  },

  variant_danger: {
    backgroundColor: COLORS.error,
    ...SHADOWS.sm,
  },
  pressed_danger: {
    backgroundColor: '#B91C1C',
  },
  text_danger: {
    color: COLORS.white,
  },
});
