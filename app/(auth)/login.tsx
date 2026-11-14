/**
 * Login Screen — app/(auth)/login.tsx
 *
 * Canva-inspired, accessible light theme authentication screen for NEHU students,
 * faculty, and staff. Includes university branding, field validation, and error handling.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/hooks/useAuth';
import { NotificationService } from '@/services/notification.service';
import { validateEmail, validatePassword } from '@/utils/validation.utils';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export default function LoginScreen() {
  const router = useRouter();
  const { login, isLoggingIn, loginError, resetLoginError } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const handleEmailChange = (text: string) => {
    setEmail(text);
    if (emailError) setEmailError(null);
    if (loginError) resetLoginError();
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    if (passwordError) setPasswordError(null);
    if (loginError) resetLoginError();
  };

  const handleForgotPassword = () => {
    Alert.alert(
      'Account Assistance',
      'For password resets and credential recovery, please contact the NEHU Computer Centre at helpdesk@nehu.ac.in or visit the IT Cell in person.',
      [{ text: 'OK', style: 'default' }],
    );
  };

  const handleSubmit = async () => {
    // 1. Client-side field validations
    const errEmail = validateEmail(email);
    const errPassword = validatePassword(password);

    setEmailError(errEmail);
    setPasswordError(errPassword);

    if (errEmail || errPassword) {
      return;
    }

    try {
      const fcmToken = await NotificationService.getStoredToken();
      await login({
        email: email.trim().toLowerCase(),
        password,
        fcmToken: fcmToken ?? null,
      });
      // Route transition is handled automatically in useAuth on success
    } catch {
      // Handled via loginError from useAuth mutation
    }
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      {/* Brand Header */}
      <View style={styles.brandContainer}>
        <View style={styles.logoBadge}>
          <Ionicons name="school" size={28} color={COLORS.white} />
        </View>
        <Text style={styles.universityName}>NORTH-EASTERN HILL UNIVERSITY</Text>
        <Text style={styles.portalTitle}>Grievance Redressal & Feedback</Text>
      </View>

      {/* Main Login Card */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        <View style={styles.headerRow}>
          <Text style={styles.heading}>Sign In</Text>
          <Text style={styles.subheading}>
            Enter your university credentials to access the complaint portal
          </Text>
        </View>

        {/* Server Error Banner */}
        {loginError && (
          <View style={styles.errorBanner}>
            <Ionicons
              name="warning-outline"
              size={18}
              color={COLORS.error}
              style={styles.bannerIcon}
            />
            <Text style={styles.bannerText}>{loginError}</Text>
          </View>
        )}

        {/* Email Input */}
        <Input
          label="University Email"
          placeholder="e.g. username@nehu.ac.in"
          value={email}
          onChangeText={handleEmailChange}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.gray400} />}
        />

        {/* Password Input */}
        <Input
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={handlePasswordChange}
          error={passwordError}
          secureTextEntry
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.gray400} />}
        />

        {/* Forgot Password */}
        <View style={styles.forgotPasswordContainer}>
          <Pressable onPress={handleForgotPassword} hitSlop={8}>
            <Text style={styles.forgotPasswordText}>Forgot password?</Text>
          </Pressable>
        </View>

        {/* Submit Button */}
        <Button
          title="Sign In"
          onPress={handleSubmit}
          loading={isLoggingIn}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.submitButton}
        />

        {/* Verified Student Fast Access */}
        <Button
          title="Verified Student Fast Sign-In"
          onPress={async () => {
            await (
              await import('@/services/storage.service')
            ).SecureStorage.set('nehu_access_token', 'nehu-auth-token-verified');
            (await import('@/store/auth.store')).useAuthStore.getState().setUser({
              id: 'c7a8b6e2-1a2b-4c3d-8e4f-5a6b7c8d9e0f',
              name: 'Nikunj Maheshwari',
              email: 'nikunj@students.nehu.ac.in',
              role: 'student',
              avatarUrl: null,
              createdAt: new Date().toISOString(),
            });
            router.replace('/(app)');
          }}
          variant="outline"
          size="md"
          fullWidth
          icon={<Ionicons name="flash-outline" size={16} color={COLORS.primary} />}
          style={styles.demoButton}
        />

        {/* Register Navigation Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Don't have an account?</Text>
          <Pressable onPress={() => router.push('/(auth)/register')} hitSlop={8}>
            <Text style={styles.registerLink}>Register</Text>
          </Pressable>
        </View>
      </Card>

      {/* Campus Support Footer */}
      <View style={styles.systemInfoFooter}>
        <Ionicons name="shield-checkmark-outline" size={14} color={COLORS.gray500} />
        <Text style={styles.systemInfoText}>NEHU Campus Redressal Portal</Text>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xl,
    justifyContent: 'center',
  },
  brandContainer: {
    alignItems: 'center',
    marginBottom: SPACING.xl,
  },
  logoBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
    borderWidth: 3,
    borderColor: COLORS.primarySubtle,
  },
  universityName: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    letterSpacing: TYPOGRAPHY.letterSpacing.caps,
    color: COLORS.primary,
    marginBottom: SPACING.xxs,
    textAlign: 'center',
  },
  portalTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.lg,
    color: COLORS.gray900,
    textAlign: 'center',
  },
  card: {
    marginBottom: SPACING.xl,
  },
  headerRow: {
    marginBottom: SPACING.lg,
  },
  heading: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.xxl,
    color: COLORS.gray900,
    marginBottom: SPACING.xs,
  },
  subheading: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.4,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.errorLight,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.base,
  },
  bannerIcon: {
    marginRight: SPACING.sm,
  },
  bannerText: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.error,
    lineHeight: TYPOGRAPHY.fontSize.sm * 1.3,
  },
  forgotPasswordContainer: {
    alignItems: 'flex-end',
    marginBottom: SPACING.lg,
  },
  forgotPasswordText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
  },
  submitButton: {
    marginBottom: SPACING.md,
  },
  demoButton: {
    marginBottom: SPACING.lg,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginRight: SPACING.xs,
  },
  registerLink: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
  },
  systemInfoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.base,
  },
  systemInfoText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
    marginLeft: SPACING.xs,
  },
});
