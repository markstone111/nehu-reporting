/**
 * System & Network Settings Screen — app/dev/settings.tsx
 *
 * Official configuration panel for university gateway endpoints,
 * network proxy routing, and app diagnostics.
 */

import { useState } from 'react';
import { View, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { useSettingsStore } from '@/store/settings.store';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export default function SystemSettingsScreen() {
  const router = useRouter();
  const { baseApiUrl, setBaseApiUrl, resetToDefaults } = useSettingsStore();

  const [inputUrl, setInputUrl] = useState(baseApiUrl);

  const handleSave = () => {
    if (!inputUrl.trim().startsWith('http')) {
      Alert.alert('Invalid URL', 'Please enter a valid HTTP/HTTPS endpoint.');
      return;
    }
    setBaseApiUrl(inputUrl.trim());
    Alert.alert('Configuration Saved', 'University API gateway URL updated successfully.', [
      { text: 'OK', onPress: () => router.back() },
    ]);
  };

  const handleReset = () => {
    Alert.alert('Reset Configuration', 'Restore default university gateway endpoints?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          resetToDefaults();
          setInputUrl(useSettingsStore.getState().baseApiUrl);
        },
      },
    ]);
  };

  return (
    <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
      <Header title="Network & System Gateway" subtitle="University API Configuration" showBack />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Status Banner */}
        <Card variant="elevated" padding="md" style={styles.card}>
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="server" size={18} color={COLORS.primary} />
            </View>
            <View style={styles.headerTextCol}>
              <Text style={styles.cardTitle}>Gateway Gateway Status</Text>
              <Text style={styles.cardSubtitle}>Connected to NEHU Central Infrastructure</Text>
            </View>
            <Badge label="Online" variant="success" size="sm" />
          </View>
        </Card>

        {/* API Endpoint Input Card */}
        <Card variant="elevated" padding="md" style={styles.card}>
          <Text style={styles.sectionHeader}>API Server Base URL</Text>
          <Text style={styles.sectionDesc}>
            Specify the target gateway URL for student grievance dispatch and status
            synchronization.
          </Text>

          <Input
            value={inputUrl}
            onChangeText={setInputUrl}
            placeholder="https://api.nehu.ac.in/issues/v1"
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
            leftIcon={<Ionicons name="link-outline" size={18} color={COLORS.gray400} />}
            containerStyle={styles.urlInput}
          />

          <View style={styles.buttonsRow}>
            <Button
              title="Save Gateway URL"
              onPress={handleSave}
              variant="primary"
              size="md"
              style={styles.saveBtn}
            />
            <Button
              title="Reset Default"
              onPress={handleReset}
              variant="outline"
              size="md"
              style={styles.resetBtn}
            />
          </View>
        </Card>

        {/* System Diagnostics Info */}
        <Card variant="elevated" padding="md" style={styles.card}>
          <Text style={styles.sectionHeader}>Build Information & Diagnostics</Text>

          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Application Build</Text>
            <Text style={styles.diagValue}>v1.0.0 (Release Candidate)</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Campus Network Mode</Text>
            <Text style={styles.diagValue}>Campus Wi-Fi / Cell Gateway</Text>
          </View>
          <View style={styles.diagRow}>
            <Text style={styles.diagLabel}>Triage AI Engine</Text>
            <Text style={styles.diagValue}>Gemini Flash / NEHU Core</Text>
          </View>
        </Card>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    padding: SPACING.base,
    gap: SPACING.md,
  },
  card: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  headerTextCol: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.sm + 1,
    color: COLORS.gray900,
  },
  cardSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray500,
  },
  sectionHeader: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.sm + 1,
    color: COLORS.gray900,
    marginBottom: 4,
  },
  sectionDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
    lineHeight: 16,
    marginBottom: SPACING.sm,
  },
  urlInput: {
    marginBottom: SPACING.md,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  saveBtn: {
    flex: 1,
  },
  resetBtn: {
    flex: 1,
  },
  diagRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.xs,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gray100,
  },
  diagLabel: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray600,
  },
  diagValue: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray900,
  },
});
