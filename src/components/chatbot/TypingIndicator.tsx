/**
 * TypingIndicator Component — src/components/chatbot/TypingIndicator.tsx
 *
 * Smooth animated typing indicator with 3 staggered pulsing dots.
 * Indicates that the AI assistant is formulating its response.
 */

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export function TypingIndicator() {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: -5,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(300),
        ]),
      );
    };

    const anim1 = createPulse(dot1Anim, 0);
    const anim2 = createPulse(dot2Anim, 180);
    const anim3 = createPulse(dot3Anim, 360);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1Anim, dot2Anim, dot3Anim]);

  return (
    <View style={styles.container}>
      <View style={styles.assistantAvatarCircle}>
        <Ionicons name="sparkles" size={13} color={COLORS.accent} />
      </View>

      <View style={styles.bubble}>
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot1Anim }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot2Anim }] }]} />
        <Animated.View style={[styles.dot, { transform: [{ translateY: dot3Anim }] }]} />
        <Text style={styles.typingText}>AI is thinking...</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: SPACING.md,
    paddingHorizontal: SPACING.xs,
  },
  assistantAvatarCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.accentLight,
    borderWidth: 1,
    borderColor: '#FED7AA',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.xs + 2,
    marginBottom: 2,
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.lg,
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.primary,
  },
  typingText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray400,
    marginLeft: SPACING.xs,
  },
});
