/**
 * Profile Screen — app/(app)/profile.tsx
 *
 * User profile view, institutional verification status, account details,
 * logout action, and hidden developer settings access via long-press on version text.
 */

import { View, Text, StyleSheet, Pressable, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/common/Card';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import { Button } from '@/components/common/Button';
import { useAuth, useCurrentUser } from '@/hooks/useAuth';
import { useSettingsStore } from '@/store/settings.store';
import { capitalize } from '@/utils/text.utils';
import { formatDateTime } from '@/utils/date.utils';
import { COLORS, TYPOGRAPHY, SPACING } from '@/constants/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useCurrentUser();
  const { logout, isLoggingOut } = useAuth();
  const { isDevMode, setDevMode } = useSettingsStore();

  const displayName = user?.name ?? 'Campus Member';
  const displayEmail = user?.email ?? 'member@nehu.ac.in';
  const displayRole = user?.role ? capitalize(user.role) : 'Student';

  const handleConfirmLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out of your NEHU account?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          await logout();
        },
      },
    ]);
  };

  const handleVersionLongPress = () => {
    const nextMode = !isDevMode;
    setDevMode(nextMode);
    Alert.alert(
      'Developer Mode',
      `Developer mode is now ${nextMode ? 'ENABLED' : 'DISABLED'}. You can now configure the backend API server URL.`,
      [
        {
          text: 'Open Dev Settings',
          onPress: () => router.push('/dev/settings'),
        },
        { text: 'OK', style: 'cancel' },
      ],
    );
  };

  return (
    <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
      <Header title="My Profile" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Profile Card */}
        <Card variant="elevated" padding="lg" style={styles.profileCard}>
          <View style={styles.avatarContainer}>
            <Avatar name={displayName} imageUrl={user?.avatarUrl ?? undefined} size="xl" />
            <View style={styles.verifiedBadgeCircle}>
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
            </View>
          </View>

          <Text style={styles.nameText}>{displayName}</Text>
          <Text style={styles.emailText}>{displayEmail}</Text>

          <View style={styles.badgeRow}>
            <Badge label={displayRole} variant="primary" size="md" />
            <Badge
              label="ID Verified"
              variant="success"
              size="md"
              icon={<Ionicons name="shield-checkmark" size={14} color={COLORS.success} />}
              style={styles.verifiedBadge}
            />
          </View>
        </Card>

        {/* University Details */}
        <Card variant="elevated" padding="md" style={styles.infoCard}>
          <Text style={styles.cardSectionTitle}>University Record</Text>

          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="business-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Institution</Text>
              <Text style={styles.infoValue}>North-Eastern Hill University, Shillong</Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoIconCircle}>
              <Ionicons name="calendar-outline" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.infoTextCol}>
              <Text style={styles.infoLabel}>Registered On</Text>
              <Text style={styles.infoValue}>
                {user?.createdAt ? formatDateTime(user.createdAt) : 'September 2026'}
              </Text>
            </View>
          </View>
        </Card>

        {/* Dev Settings Quick Link (if Dev Mode is toggled) */}
        {isDevMode && (
          <Card variant="outlined" padding="md" style={styles.devCard}>
            <View style={styles.devHeaderRow}>
              <Ionicons name="construct-outline" size={20} color={COLORS.warning} />
              <Text style={styles.devTitle}>Developer Mode Active</Text>
            </View>
            <Text style={styles.devDesc}>
              Configure university API gateway and network endpoints.
            </Text>
            <Button
              title="Configure API Endpoint"
              onPress={() => router.push('/dev/settings')}
              variant="outline"
              size="sm"
              style={styles.devBtn}
            />
          </Card>
        )}

        {/* Sign Out Button */}
        <Button
          title="Sign Out"
          onPress={handleConfirmLogout}
          loading={isLoggingOut}
          variant="danger"
          size="lg"
          fullWidth
          icon={<Ionicons name="log-out-outline" size={18} color={COLORS.white} />}
          style={styles.logoutButton}
        />

        {/* Version Footer (Hidden Long-Press Trigger) */}
        <Pressable
          onLongPress={handleVersionLongPress}
          delayLongPress={600}
          hitSlop={12}
          style={styles.versionContainer}
          accessibilityLabel="App version. Long press for developer settings."
        >
          <Ionicons name="shield-outline" size={13} color={COLORS.gray400} />
          <Text style={styles.versionText}>NEHU Redressal Portal • v1.0.0 (Build 24)</Text>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    paddingHorizontal: SPACING.base,
    paddingTop: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
  profileCard: {
    alignItems: 'center',
    marginBottom: SPACING.base,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: SPACING.md,
  },
  verifiedBadgeCircle: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.white,
  },
  nameText: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.xl,
    color: COLORS.gray900,
    marginBottom: 2,
  },
  emailText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray500,
    marginBottom: SPACING.md,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedBadge: {
    marginLeft: SPACING.sm,
  },
  infoCard: {
    marginBottom: SPACING.base,
  },
  cardSectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray900,
    marginBottom: SPACING.md,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs + 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  infoIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  infoTextCol: {
    flex: 1,
  },
  infoLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.gray500,
  },
  infoValue: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray800,
    marginTop: 1,
  },
  devCard: {
    backgroundColor: COLORS.warningLight,
    borderColor: '#FDE68A',
    marginBottom: SPACING.base,
  },
  devHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  devTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: '#92400E',
    marginLeft: SPACING.xs,
  },
  devDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: '#B45309',
    marginBottom: SPACING.md,
  },
  devBtn: {
    backgroundColor: COLORS.white,
    borderColor: '#F59E0B',
  },
  logoutButton: {
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  versionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm,
  },
  versionText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray400,
    marginLeft: SPACING.xs,
  },
});
