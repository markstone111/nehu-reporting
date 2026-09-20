/**
 * Register Screen — app/(auth)/register.tsx
 *
 * Canva-inspired, accessible account creation screen for NEHU students, faculty, and staff.
 * Enforces one-time University ID card upload for identity verification before account creation.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Image, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Card } from '@/components/common/Card';
import { useAuth } from '@/hooks/useAuth';
import {
  pickIdCardFromGallery,
  takeIdCardWithCamera,
  type ProcessedImage,
} from '@/services/image.service';
import { validateName, validateEmail, validatePassword } from '@/utils/validation.utils';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS, SHADOWS } from '@/constants/theme';
import type { UserRole } from '@/types/api.types';

const ROLES: readonly {
  readonly key: UserRole;
  readonly label: string;
  readonly icon: keyof typeof Ionicons.glyphMap;
}[] = [
  { key: 'student', label: 'Student', icon: 'school-outline' },
  { key: 'faculty', label: 'Faculty', icon: 'person-outline' },
  { key: 'staff', label: 'Staff', icon: 'briefcase-outline' },
];

export default function RegisterScreen() {
  const router = useRouter();
  const { register, isRegistering, registerError, resetRegisterError } = useAuth();

  // Form state
  const [role, setRole] = useState<UserRole>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // ID card image state
  const [idCardImage, setIdCardImage] = useState<ProcessedImage | null>(null);
  const [isProcessingImage, setIsProcessingImage] = useState(false);

  // Field validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [idCardError, setIdCardError] = useState<string | null>(null);

  // Handlers
  const handleNameChange = (val: string) => {
    setName(val);
    if (nameError) setNameError(null);
    if (registerError) resetRegisterError();
  };

  const handleEmailChange = (val: string) => {
    setEmail(val);
    if (emailError) setEmailError(null);
    if (registerError) resetRegisterError();
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (passwordError) setPasswordError(null);
    if (registerError) resetRegisterError();
  };

  const handleConfirmPasswordChange = (val: string) => {
    setConfirmPassword(val);
    if (confirmPasswordError) setConfirmPasswordError(null);
  };

  const handlePickFromGallery = async () => {
    setIsProcessingImage(true);
    setIdCardError(null);
    try {
      const res = await pickIdCardFromGallery();
      if (!res.canceled && res.image) {
        setIdCardImage(res.image);
      } else if (res.error) {
        setIdCardError(res.error);
      }
    } catch {
      setIdCardError('Failed to access photo gallery.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleTakeWithCamera = async () => {
    setIsProcessingImage(true);
    setIdCardError(null);
    try {
      const res = await takeIdCardWithCamera();
      if (!res.canceled && res.image) {
        setIdCardImage(res.image);
      } else if (res.error) {
        setIdCardError(res.error);
      }
    } catch {
      setIdCardError('Failed to access camera.');
    } finally {
      setIsProcessingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setIdCardImage(null);
    setIdCardError(null);
  };

  const handleSubmit = async () => {
    // 1. Run all validations
    const errName = validateName(name);
    const errEmail = validateEmail(email);
    const errPassword = validatePassword(password);
    let errConfirm: string | null = null;
    let errIdCard: string | null = null;

    if (password !== confirmPassword) {
      errConfirm = 'Passwords do not match.';
    }

    if (!idCardImage) {
      errIdCard = 'Please upload a photo of your University ID Card.';
    }

    setNameError(errName);
    setEmailError(errEmail);
    setPasswordError(errPassword);
    setConfirmPasswordError(errConfirm);
    setIdCardError(errIdCard);

    if (errName || errEmail || errPassword || errConfirm || errIdCard || !idCardImage) {
      Alert.alert(
        'Incomplete Information',
        'Please correct the highlighted fields and ensure your ID card is uploaded before submitting.',
      );
      return;
    }

    try {
      await register({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        role,
        idCardImageBase64: idCardImage.base64,
        fcmToken: null,
      });
      // Navigation is handled automatically in useAuth on success
    } catch {
      // Server error is handled via registerError in useAuth
    }
  };

  return (
    <ScreenWrapper contentContainerStyle={styles.container}>
      {/* Back Button */}
      <Pressable
        onPress={() => router.back()}
        style={styles.backButton}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Go back to login"
      >
        <Ionicons name="arrow-back" size={22} color={COLORS.gray800} />
        <Text style={styles.backButtonText}>Back to Sign In</Text>
      </Pressable>

      {/* Screen Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.heading}>Create Account</Text>
        <Text style={styles.subheading}>
          Register to file campus grievances, track status updates, and communicate with university
          administration.
        </Text>
      </View>

      {/* Main Registration Card */}
      <Card variant="elevated" padding="lg" style={styles.card}>
        {/* Role Selector Tabs */}
        <View style={styles.roleSection}>
          <Text style={styles.sectionLabel}>Select Your Role at NEHU</Text>
          <View style={styles.roleGrid}>
            {ROLES.map((r) => {
              const isSelected = role === r.key;
              return (
                <Pressable
                  key={r.key}
                  onPress={() => setRole(r.key)}
                  style={[styles.roleChip, isSelected && styles.roleChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isSelected }}
                >
                  <Ionicons
                    name={r.icon}
                    size={18}
                    color={isSelected ? COLORS.white : COLORS.gray600}
                    style={styles.roleChipIcon}
                  />
                  <Text style={[styles.roleChipText, isSelected && styles.roleChipTextActive]}>
                    {r.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Server Error Banner */}
        {registerError && (
          <View style={styles.errorBanner}>
            <Ionicons
              name="warning-outline"
              size={18}
              color={COLORS.error}
              style={styles.bannerIcon}
            />
            <Text style={styles.bannerText}>{registerError}</Text>
          </View>
        )}

        {/* Full Name */}
        <Input
          label="Full Name"
          placeholder="Enter your official name"
          value={name}
          onChangeText={handleNameChange}
          error={nameError}
          autoCapitalize="words"
          leftIcon={<Ionicons name="person-outline" size={18} color={COLORS.gray400} />}
        />

        {/* University Email */}
        <Input
          label="University Email"
          placeholder="e.g. rollno@students.nehu.ac.in"
          value={email}
          onChangeText={handleEmailChange}
          error={emailError}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          leftIcon={<Ionicons name="mail-outline" size={18} color={COLORS.gray400} />}
          helperText="Use your official NEHU institutional email if available"
        />

        {/* Password */}
        <Input
          label="Password"
          placeholder="At least 8 characters"
          value={password}
          onChangeText={handlePasswordChange}
          error={passwordError}
          secureTextEntry
          leftIcon={<Ionicons name="lock-closed-outline" size={18} color={COLORS.gray400} />}
        />

        {/* Confirm Password */}
        <Input
          label="Confirm Password"
          placeholder="Re-enter your password"
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          error={confirmPasswordError}
          secureTextEntry
          leftIcon={<Ionicons name="shield-checkmark-outline" size={18} color={COLORS.gray400} />}
        />

        {/* ID Card Upload Section */}
        <View style={styles.uploadSection}>
          <View style={styles.uploadHeaderRow}>
            <Text style={styles.sectionLabel}>University ID Card</Text>
            <View style={styles.badgeRequired}>
              <Text style={styles.badgeRequiredText}>Mandatory</Text>
            </View>
          </View>
          <Text style={styles.uploadInstruction}>
            One-time verification photo. Used by administrators to verify genuine campus reports.
          </Text>

          {isProcessingImage ? (
            <View style={styles.imageProcessingContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
              <Text style={styles.imageProcessingText}>Compressing & preparing image...</Text>
            </View>
          ) : idCardImage ? (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: idCardImage.uri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.previewMetaRow}>
                <View style={styles.previewStatus}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
                  <Text style={styles.previewStatusText}>Attached ({idCardImage.sizeKb} KB)</Text>
                </View>
                <Pressable onPress={handleRemoveImage} hitSlop={8} style={styles.removeImageButton}>
                  <Ionicons name="trash-outline" size={16} color={COLORS.error} />
                  <Text style={styles.removeImageText}>Remove</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <View style={[styles.uploadBox, Boolean(idCardError) && styles.uploadBoxError]}>
              <View style={styles.uploadIconCircle}>
                <Ionicons name="camera-outline" size={24} color={COLORS.primary} />
              </View>
              <Text style={styles.uploadBoxTitle}>Attach ID Card Photo</Text>
              <Text style={styles.uploadBoxSubtitle}>
                Capture clear photo or choose from photo library
              </Text>

              <View style={styles.uploadActionsRow}>
                <Button
                  title="Take Photo"
                  onPress={handleTakeWithCamera}
                  variant="outline"
                  size="sm"
                  icon={<Ionicons name="camera" size={16} color={COLORS.primary} />}
                  style={styles.uploadActionBtn}
                />
                <Button
                  title="Choose Gallery"
                  onPress={handlePickFromGallery}
                  variant="outline"
                  size="sm"
                  icon={<Ionicons name="images" size={16} color={COLORS.primary} />}
                  style={styles.uploadActionBtn}
                />
              </View>
            </View>
          )}

          {idCardError && (
            <View style={styles.idCardErrorRow}>
              <Ionicons name="alert-circle" size={14} color={COLORS.error} />
              <Text style={styles.idCardErrorText}>{idCardError}</Text>
            </View>
          )}
        </View>

        {/* Identity Policy Notice */}
        <View style={styles.policyNotice}>
          <Ionicons
            name="information-circle-outline"
            size={18}
            color={COLORS.info}
            style={styles.policyIcon}
          />
          <Text style={styles.policyText}>
            NEHU policy requires verifiable student and staff identity to maintain campus integrity
            and prevent malicious spam.
          </Text>
        </View>

        {/* Register Button */}
        <Button
          title="Create Account"
          onPress={handleSubmit}
          loading={isRegistering}
          variant="primary"
          size="lg"
          fullWidth
          style={styles.submitButton}
        />

        {/* Login Link */}
        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account?</Text>
          <Pressable onPress={() => router.back()} hitSlop={8}>
            <Text style={styles.loginLink}>Sign In</Text>
          </Pressable>
        </View>
      </Card>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.base,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray700,
    marginLeft: SPACING.xs,
  },
  titleContainer: {
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
  card: {
    marginBottom: SPACING.xl,
  },
  roleSection: {
    marginBottom: SPACING.lg,
  },
  sectionLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray800,
  },
  roleGrid: {
    flexDirection: 'row',
    marginTop: SPACING.xs + 2,
    gap: SPACING.sm,
  },
  roleChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.gray100,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  roleChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  roleChipIcon: {
    marginRight: SPACING.xs,
  },
  roleChipText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray700,
  },
  roleChipTextActive: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
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
  uploadSection: {
    marginBottom: SPACING.lg,
  },
  uploadHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xxs,
  },
  badgeRequired: {
    backgroundColor: COLORS.accentLight,
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: SPACING.xxs,
    borderRadius: RADIUS.xs,
  },
  badgeRequiredText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs - 1,
    color: '#B45309',
  },
  uploadInstruction: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
    marginBottom: SPACING.sm,
  },
  uploadBox: {
    backgroundColor: COLORS.gray50,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: COLORS.gray300,
    borderRadius: RADIUS.md,
    padding: SPACING.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadBoxError: {
    borderColor: COLORS.error,
    backgroundColor: COLORS.errorLight,
  },
  uploadIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  uploadBoxTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray800,
    marginBottom: SPACING.xxs,
  },
  uploadBoxSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  uploadActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    width: '100%',
    justifyContent: 'center',
  },
  uploadActionBtn: {
    flex: 1,
  },
  imageProcessingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  imageProcessingText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray600,
    marginLeft: SPACING.sm,
  },
  previewContainer: {
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    padding: SPACING.sm,
    ...SHADOWS.sm,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: RADIUS.sm,
  },
  previewMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
  },
  previewStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewStatusText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray700,
    marginLeft: SPACING.xs,
  },
  removeImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  removeImageText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.error,
    marginLeft: SPACING.xxs,
  },
  idCardErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
  },
  idCardErrorText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.error,
    marginLeft: SPACING.xs,
  },
  policyNotice: {
    flexDirection: 'row',
    backgroundColor: COLORS.infoLight,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    borderWidth: 1,
    borderColor: '#BAE6FD',
  },
  policyIcon: {
    marginRight: SPACING.sm,
    marginTop: 1,
  },
  policyText: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#0369A1',
    lineHeight: TYPOGRAPHY.fontSize.xs * 1.4,
  },
  submitButton: {
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
  loginLink: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
  },
});
