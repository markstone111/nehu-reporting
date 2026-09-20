/**
 * Avatar Component
 *
 * Displays a user profile photo with fallback to initials.
 * Canva-inspired circular styling with crisp typography.
 */

import { useState } from 'react';
import { View, Text, Image, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { COLORS, TYPOGRAPHY, RADIUS } from '@/constants/theme';

export type AvatarSize = 'sm' | 'md' | 'lg' | 'xl';

export interface AvatarProps {
  readonly name: string;
  readonly imageUrl?: string | null | undefined;
  readonly size?: AvatarSize;
  readonly style?: StyleProp<ViewStyle>;
}

const SIZE_DIMENSIONS: Record<AvatarSize, number> = {
  sm: 32,
  md: 44,
  lg: 64,
  xl: 88,
};

const FONT_SIZES: Record<AvatarSize, number> = {
  sm: TYPOGRAPHY.fontSize.xs,
  md: TYPOGRAPHY.fontSize.base,
  lg: TYPOGRAPHY.fontSize.xl,
  xl: TYPOGRAPHY.fontSize.xxl,
};

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 0 || !parts[0]) return 'U';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  const first = parts[0][0] ?? '';
  const second = parts[1]?.[0] ?? '';
  return `${first}${second}`.toUpperCase();
}

export function Avatar({ name, imageUrl, size = 'md', style }: AvatarProps) {
  const [imageError, setImageError] = useState(false);

  const dimension = SIZE_DIMENSIONS[size];
  const fontSize = FONT_SIZES[size];
  const initials = getInitials(name);

  const containerStyle = {
    width: dimension,
    height: dimension,
    borderRadius: dimension / 2,
  };

  const hasValidImage = Boolean(imageUrl) && !imageError;

  return (
    <View style={[styles.container, containerStyle, style]}>
      {hasValidImage ? (
        <Image
          source={{ uri: imageUrl! }}
          style={[styles.image, containerStyle]}
          onError={() => setImageError(true)}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.fallback, containerStyle]}>
          <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.primarySubtle,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.white,
  },
  image: {
    borderRadius: RADIUS.full,
  },
  fallback: {
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    color: COLORS.primary,
    textAlign: 'center',
  },
});
