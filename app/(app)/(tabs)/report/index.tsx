/**
 * Report Hub Screen — app/(app)/report/index.tsx
 *
 * Central launchpad for filing grievances at North-Eastern Hill University.
 * Presents two distinct reporting channels:
 *  1. Standard Structured Form — category, GPS, and word-validated fields.
 *  2. AI Assistant Reporter — natural language conversational reporting.
 */

import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/common/Card';
import { Badge } from '@/components/common/Badge';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export default function ReportHubScreen() {
  const router = useRouter();

  return (
    <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
      <Header title="Report Campus Issue" subtitle="North-Eastern Hill University Grievance Cell" />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro banner */}
        <View style={styles.introCard}>
          <View style={styles.introHeader}>
            <View style={styles.crestCircle}>
              <Ionicons name="school" size={20} color={COLORS.primary} />
            </View>
            <View style={styles.introTextWrapper}>
              <Text style={styles.introTitle}>Student & Campus Grievances</Text>
              <Text style={styles.introSubtitle}>
                Direct administrative redressal for hostels, infrastructure, academics & hygiene
              </Text>
            </View>
          </View>
        </View>

        {/* Section title */}
        <Text style={styles.sectionHeading}>Choose How to Report</Text>

        {/* Reporting Option 1: Standard Form */}
        <Card
          variant="elevated"
          padding="lg"
          onPress={() => router.push('/(app)/report/form')}
          style={styles.channelCard}
        >
          <View style={styles.channelHeader}>
            <View style={[styles.channelIconBox, { backgroundColor: COLORS.primarySubtle }]}>
              <Ionicons name="document-text" size={26} color={COLORS.primary} />
            </View>
            <View style={styles.channelTitleWrapper}>
              <View style={styles.badgeRow}>
                <Text style={styles.channelTitle}>Standard Form</Text>
                <Badge label="Recommended" variant="primary" size="sm" />
              </View>
              <Text style={styles.channelMeta}>Structured & precise</Text>
            </View>
          </View>

          <Text style={styles.channelDescription}>
            Fill out specific grievance details manually with our category picker, GPS location
            auto-detection, and word-validated text fields.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.featureText}>8 official NEHU categories & subcategories</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.featureText}>GPS reverse geocoding for campus landmarks</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.featureText}>Instant reference tracking number generation</Text>
            </View>
          </View>

          <View style={styles.actionButtonRow}>
            <Text style={styles.actionButtonText}>Open Standard Form</Text>
            <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
          </View>
        </Card>

        {/* Reporting Option 2: AI Voice & Chat Reporter */}
        <Card
          variant="elevated"
          padding="lg"
          onPress={() => router.push('/(app)/report/chatbot')}
          style={[styles.channelCard, styles.aiChannelCard]}
        >
          <View style={styles.channelHeader}>
            <View style={[styles.channelIconBox, { backgroundColor: COLORS.accentLight }]}>
              <Ionicons name="chatbubbles" size={26} color={COLORS.accent} />
            </View>
            <View style={styles.channelTitleWrapper}>
              <View style={styles.badgeRow}>
                <Text style={styles.channelTitle}>AI Assistant</Text>
                <Badge label="AI Powered" variant="secondary" size="sm" />
              </View>
              <Text style={styles.channelMeta}>Conversational reporting</Text>
            </View>
          </View>

          <Text style={styles.channelDescription}>
            Chat naturally in English or campus everyday phrasing. The AI chatbot categorizes,
            extracts locations, assesses urgency, and drafts the report for your review.
          </Text>

          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="sparkles" size={14} color={COLORS.accent} />
              <Text style={styles.featureText}>
                Auto-categorizes messy or informal descriptions
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="sparkles" size={14} color={COLORS.accent} />
              <Text style={styles.featureText}>
                Clarifies missing location or details interactively
              </Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="sparkles" size={14} color={COLORS.accent} />
              <Text style={styles.featureText}>One-tap draft review and submission</Text>
            </View>
          </View>

          <View style={styles.actionButtonRow}>
            <Text style={[styles.actionButtonText, { color: '#B45309' }]}>Start AI Chat</Text>
            <Ionicons name="arrow-forward" size={16} color="#B45309" />
          </View>
        </Card>

        {/* Administrative SLA & Security Info */}
        <View style={styles.infoBanner}>
          <View style={styles.infoTitleRow}>
            <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.primary} />
            <Text style={styles.infoBannerTitle}>NEHU Grievance Redressal Protocol</Text>
          </View>
          <Text style={styles.infoBannerText}>
            • Standard resolution turnaround time is 3 to 7 working days.{'\n'}• All reports are
            digitally signed with your verified university credentials.{'\n'}• For urgent security
            threats or anti-ragging assistance, dial the 24x7 Proctorial Emergency Cell at{' '}
            <Text style={styles.phoneLink}>0364-272-1000</Text>.
          </Text>
        </View>
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
  introCard: {
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: SPACING.lg,
  },
  introHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  crestCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  introTextWrapper: {
    flex: 1,
  },
  introTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.sm + 1,
    color: COLORS.gray900,
    marginBottom: 2,
  },
  introSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray500,
    lineHeight: 15,
  },
  sectionHeading: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray900,
    marginBottom: SPACING.md,
  },
  channelCard: {
    marginBottom: SPACING.base,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.lg,
  },
  aiChannelCard: {
    borderColor: '#FED7AA',
    backgroundColor: '#FFFCF7',
  },
  channelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  channelIconBox: {
    width: 48,
    height: 48,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md,
  },
  channelTitleWrapper: {
    flex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  channelTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.md,
    color: COLORS.gray900,
  },
  channelMeta: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray500,
  },
  channelDescription: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    color: COLORS.gray600,
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  featureList: {
    gap: SPACING.xs + 1,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.gray50,
    padding: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  featureText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.gray700,
  },
  actionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    paddingTop: SPACING.xs,
  },
  actionButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.primary,
  },
  infoBanner: {
    backgroundColor: COLORS.primarySubtle,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  infoBannerTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    color: COLORS.primary,
  },
  infoBannerText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray700,
    lineHeight: 17,
  },
  phoneLink: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    textDecorationLine: 'underline',
  },
});
