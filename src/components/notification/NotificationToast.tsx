/**
 * In-App Notification Toast Component — src/components/notification/NotificationToast.tsx
 *
 * Floating Canva/Apple-style heads-up banner displayed when a push notification
 * arrives while the application is active in the foreground.
 *
 * Supports tap-to-navigate (deep linking) and swipe/auto-dismiss.
 */

import { useEffect, useRef, useCallback } from 'react';
import { Text, View, StyleSheet, Pressable, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';

export interface NotificationToastProps {
  readonly visible: boolean;
  readonly title: string;
  readonly message: string;
  readonly icon?: keyof typeof Ionicons.glyphMap;
  readonly onPress?: () => void;
  readonly onDismiss: () => void;
  readonly durationMs?: number;
}

export function NotificationToast({
  visible,
  title,
  message,
  icon = 'notifications',
  onPress,
  onDismiss,
  durationMs = 4500,
}: NotificationToastProps) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-120)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const wasVisibleRef = useRef(false);

  const handleDismiss = useCallback(() => {
    if (dismissTimer.current) {
      clearTimeout(dismissTimer.current);
      dismissTimer.current = null;
    }
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -120,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismissRef.current();
    });
  }, [opacity, translateY]);

  useEffect(() => {
    if (visible) {
      wasVisibleRef.current = true;
      // Clear any pending timeout
      if (dismissTimer.current) clearTimeout(dismissTimer.current);

      // Slide in from top
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          bounciness: 4,
          speed: 14,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss
      dismissTimer.current = setTimeout(() => {
        handleDismiss();
      }, durationMs);
    } else if (wasVisibleRef.current) {
      wasVisibleRef.current = false;
      translateY.setValue(-120);
      opacity.setValue(0);
    }

    return () => {
      if (dismissTimer.current) clearTimeout(dismissTimer.current);
    };
  }, [visible, durationMs, handleDismiss, opacity, translateY]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          top: Platform.OS === 'ios' ? insets.top : insets.top + SPACING.xs,
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable
        style={styles.toastCard}
        onPress={() => {
          handleDismiss();
          if (onPress) onPress();
        }}
        accessibilityRole="button"
        accessibilityLabel={`${title}. ${message}`}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={COLORS.white} />
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.appTag}>NEHU ALERT</Text>
            <Text style={styles.timeTag}>Just now</Text>
          </View>
          <Text style={styles.title} numberOfLines={1}>
            {title}
          </Text>
          <Text style={styles.message} numberOfLines={2}>
            {message}
          </Text>
        </View>

        <Pressable
          style={styles.closeButton}
          onPress={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          hitSlop={10}
        >
          <Ionicons name="close" size={16} color={COLORS.gray400} />
        </Pressable>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: SPACING.base,
    right: SPACING.base,
    zIndex: 9999,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    ...SHADOWS.lg,
  },
  iconContainer: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  contentContainer: {
    flex: 1,
    paddingRight: SPACING.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  appTag: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 0.6,
  },
  timeTag: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.gray400,
  },
  title: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray900,
    marginBottom: 1,
  },
  message: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray600,
    lineHeight: 16,
  },
  closeButton: {
    padding: SPACING.xxs,
    marginLeft: SPACING.xs,
  },
});
