/**
 * ScreenWrapper Component
 *
 * Provides safe area insets, keyboard-avoiding behavior, optional scroll container,
 * and consistent page background styling across all screens.
 */

import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '@/constants/theme';

export interface ScreenWrapperProps {
  readonly children: ReactNode;
  readonly scrollable?: boolean;
  readonly avoidKeyboard?: boolean;
  readonly style?: StyleProp<ViewStyle>;
  readonly contentContainerStyle?: StyleProp<ViewStyle>;
  readonly edges?: readonly Edge[];
  readonly backgroundColor?: string;
  readonly statusBarStyle?: 'dark' | 'light';
}

export function ScreenWrapper({
  children,
  scrollable = true,
  avoidKeyboard = true,
  style,
  contentContainerStyle,
  edges = ['top', 'left', 'right'],
  backgroundColor = COLORS.gray50,
  statusBarStyle = 'dark',
}: ScreenWrapperProps) {
  const content = scrollable ? (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={[styles.scrollContent, contentContainerStyle]}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.flex, contentContainerStyle]}>{children}</View>
  );

  return (
    <SafeAreaView edges={edges as Edge[]} style={[styles.container, { backgroundColor }, style]}>
      <StatusBar style={statusBarStyle} />
      {avoidKeyboard ? (
        <KeyboardAvoidingView
          style={styles.flex}
          behavior={Platform.OS === 'ios' ? 'padding' : 'padding'}
        >
          {content}
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
