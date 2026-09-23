/**
 * Standard Grievance Report Form — app/(app)/report/form.tsx
 *
 * Full production-grade grievance submission screen for students and faculty.
 * Features:
 *   - Student verification identity badge
 *   - Character-limited title with real-time counters
 *   - Visual Category & Subcategory Picker
 *   - GPS auto-location reverse geocoder + 1-tap NEHU landmark chips
 *   - Multi-line description with word counter (5 to 300 words)
 *   - Attachment placeholder card
 *   - Full client validation matching backend limits
 *   - Immediate navigation to grievance timeline tracking upon submission
 */

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { Card } from '@/components/common/Card';
import { Input } from '@/components/common/Input';
import { Button } from '@/components/common/Button';
import { Badge } from '@/components/common/Badge';
import { CategoryPicker } from '@/components/issue';
import { useAuthStore } from '@/store/auth.store';
import { useSubmitIssue } from '@/hooks/useIssues';
import { getCurrentCampusLocation, CAMPUS_LANDMARKS } from '@/services/location.service';
import {
  validateIssueTitle,
  validateIssueCategory,
  validateIssueDescription,
  validateIssueLocation,
} from '@/utils/validation.utils';
import { countWords, capitalize } from '@/utils/text.utils';
import { LIMITS } from '@/constants/limits';
import type { CategoryId } from '@/constants/categories';
import type { IssueLocation, SubmitIssueRequest } from '@/types/api.types';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export default function ReportFormScreen() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const submitIssueMutation = useSubmitIssue();

  // Form states
  const [title, setTitle] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<CategoryId | null>(null);
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState<string | null>(null);
  const [locationLabel, setLocationLabel] = useState('');
  const [gpsLocation, setGpsLocation] = useState<IssueLocation | null>(null);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [description, setDescription] = useState('');

  // Field validation error states
  const [titleError, setTitleError] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [descriptionError, setDescriptionError] = useState<string | null>(null);

  // Word count helper
  const wordCount = countWords(description);
  const isWordCountValid =
    wordCount >= LIMITS.ISSUE_DESCRIPTION_MIN_WORDS &&
    wordCount <= LIMITS.ISSUE_DESCRIPTION_MAX_WORDS;
  const isWordCountTooShort = wordCount > 0 && wordCount < LIMITS.ISSUE_DESCRIPTION_MIN_WORDS;
  const isWordCountTooLong = wordCount > LIMITS.ISSUE_DESCRIPTION_MAX_WORDS;

  // Handle GPS Auto-Detection
  const handleAutoDetectLocation = async () => {
    setIsFetchingGps(true);
    setGpsError(null);

    const result = await getCurrentCampusLocation();
    setIsFetchingGps(false);

    if (result.error) {
      setGpsError(result.error);
    }

    setGpsLocation(result.location);
    setLocationLabel(result.location.label);
    if (locationError) setLocationError(null);
  };

  // Quick landmark chip tap
  const handleSelectLandmark = (landmark: string) => {
    setLocationLabel(landmark);
    setGpsLocation({
      label: landmark,
      latitude: 25.6054,
      longitude: 91.8988,
      autoFetched: false,
    });
    if (locationError) setLocationError(null);
  };

  // Submission handler
  const handleSubmit = async () => {
    // Run validation on all fields
    const tErr = validateIssueTitle(title);
    const cErr = validateIssueCategory(selectedCategoryId);
    const lErr = validateIssueLocation(locationLabel);
    const dErr = validateIssueDescription(description);

    setTitleError(tErr);
    setCategoryError(cErr);
    setLocationError(lErr);
    setDescriptionError(dErr);

    if (tErr || cErr || lErr || dErr) {
      Alert.alert(
        'Incomplete Grievance Form',
        'Please correct the highlighted fields before submitting.',
      );
      return;
    }

    const payload: SubmitIssueRequest = {
      title: title.trim(),
      category: selectedCategoryId!,
      subcategory: selectedSubcategoryId ?? null,
      description: description.trim(),
      location: {
        label: locationLabel.trim(),
        latitude: gpsLocation?.latitude ?? null,
        longitude: gpsLocation?.longitude ?? null,
        autoFetched: gpsLocation?.autoFetched ?? false,
      },
      attachments: [],
      source: 'FORM',
      metadata: {
        appVersion: '1.0.0',
        platform: 'android',
      },
    };

    try {
      const response = await submitIssueMutation.mutateAsync(payload);

      if (response.isDuplicate) {
        Alert.alert(
          'Linked to Existing Report',
          'A similar grievance was already reported by campus members in this zone. Your report has been grouped for priority redressal.',
          [
            {
              text: 'View Grievance Status',
              onPress: () => {
                router.replace({
                  pathname: '/(app)/issues/[id]',
                  params: { id: response.issueId },
                });
              },
            },
          ],
        );
      } else {
        Alert.alert(
          'Grievance Filed Successfully',
          `Your report has been queued under reference ID #${response.issueId.slice(0, 8).toUpperCase()}. You will receive updates as the administration takes action.`,
          [
            {
              text: 'Track Grievance',
              onPress: () => {
                router.replace({
                  pathname: '/(app)/issues/[id]',
                  params: { id: response.issueId },
                });
              },
            },
          ],
        );
      }
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to submit grievance. Please verify your connection.';
      Alert.alert('Submission Error', message);
    }
  };

  const displayName = user?.name ?? 'NEHU Student';
  const roleDisplay = user?.role ? ` • ${capitalize(user.role)}` : '';

  return (
    <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
      <Header title="File Grievance" subtitle="Standard Structured Report" showBack />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Student Identity Card */}
        <View style={styles.identityCard}>
          <View style={styles.identityAvatarCircle}>
            <Ionicons name="person" size={18} color={COLORS.primary} />
          </View>
          <View style={styles.identityTextWrapper}>
            <Text style={styles.identityName}>
              {displayName}
              <Text style={styles.identityDept}>{roleDisplay}</Text>
            </Text>
            <Text style={styles.identityNote}>
              Complaints are verified with your NEHU ID to ensure swift administrative action.
            </Text>
          </View>
          <Badge label="Verified ID" variant="primary" size="sm" />
        </View>

        {/* 1. Issue Title */}
        <Card variant="elevated" padding="md" style={styles.sectionCard}>
          <Input
            label="Issue Title"
            placeholder="e.g. Water geyser malfunctioning in Boys Hostel 3"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (titleError) setTitleError(null);
            }}
            error={titleError}
            maxLength={LIMITS.ISSUE_TITLE_MAX_CHARS}
            showCharCount
            helperText="Provide a concise, specific summary of the grievance."
          />
        </Card>

        {/* 2. Category & Subcategory Picker */}
        <Card variant="elevated" padding="md" style={styles.sectionCard}>
          <CategoryPicker
            selectedCategoryId={selectedCategoryId}
            selectedSubcategoryId={selectedSubcategoryId}
            onSelectCategory={(catId) => {
              setSelectedCategoryId(catId);
              if (categoryError) setCategoryError(null);
            }}
            onSelectSubcategory={setSelectedSubcategoryId}
            error={categoryError}
          />
        </Card>

        {/* 3. Campus Location */}
        <Card variant="elevated" padding="md" style={styles.sectionCard}>
          <View style={styles.locationHeaderRow}>
            <View>
              <Text style={styles.fieldSectionTitle}>Campus Location</Text>
              <Text style={styles.fieldSectionSubtitle}>
                Specify where the issue is occurring on campus.
              </Text>
            </View>

            <Pressable
              onPress={handleAutoDetectLocation}
              disabled={isFetchingGps}
              style={({ pressed }) => [
                styles.gpsButton,
                isFetchingGps && styles.gpsButtonDisabled,
                pressed && { opacity: 0.8 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Detect location with GPS"
            >
              {isFetchingGps ? (
                <ActivityIndicator size="small" color={COLORS.primary} />
              ) : (
                <Ionicons name="navigate" size={14} color={COLORS.primary} />
              )}
              <Text style={styles.gpsButtonText}>{isFetchingGps ? 'Locating...' : 'Auto GPS'}</Text>
            </Pressable>
          </View>

          {/* Location input text */}
          <Input
            placeholder="e.g. Room 302, 3rd Floor, Department of IT"
            value={locationLabel}
            onChangeText={(text) => {
              setLocationLabel(text);
              if (locationError) setLocationError(null);
            }}
            error={locationError}
            maxLength={LIMITS.ISSUE_LOCATION_LABEL_MAX_CHARS}
            leftIcon={<Ionicons name="location-outline" size={18} color={COLORS.primary} />}
          />

          {/* GPS feedback status */}
          {gpsLocation?.autoFetched && (
            <View style={styles.gpsSuccessNotice}>
              <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
              <Text style={styles.gpsSuccessText}>
                GPS coordinates captured ({gpsLocation.latitude?.toFixed(4)},{' '}
                {gpsLocation.longitude?.toFixed(4)})
              </Text>
            </View>
          )}

          {gpsError && (
            <View style={styles.gpsWarningNotice}>
              <Ionicons name="alert-circle-outline" size={14} color={COLORS.warning} />
              <Text style={styles.gpsWarningText}>{gpsError}</Text>
            </View>
          )}

          {/* Quick NEHU Landmark selection */}
          <View style={styles.landmarksSection}>
            <Text style={styles.landmarksHeading}>Quick Campus Landmarks:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.landmarksScroll}
            >
              {CAMPUS_LANDMARKS.map((landmark) => (
                <Pressable
                  key={landmark}
                  onPress={() => handleSelectLandmark(landmark)}
                  style={styles.landmarkChip}
                >
                  <Ionicons name="business-outline" size={12} color={COLORS.gray600} />
                  <Text style={styles.landmarkChipText}>{landmark}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Card>

        {/* 4. Issue Description & Word Counter */}
        <Card variant="elevated" padding="md" style={styles.sectionCard}>
          <View style={styles.descriptionHeaderRow}>
            <Text style={styles.fieldSectionTitle}>Detailed Description</Text>
            <View
              style={[
                styles.wordCountBadge,
                isWordCountValid && styles.wordCountBadgeValid,
                (isWordCountTooShort || isWordCountTooLong) && styles.wordCountBadgeInvalid,
              ]}
            >
              <Text
                style={[
                  styles.wordCountText,
                  isWordCountValid && styles.wordCountTextValid,
                  (isWordCountTooShort || isWordCountTooLong) && styles.wordCountTextInvalid,
                ]}
              >
                {wordCount} / {LIMITS.ISSUE_DESCRIPTION_MAX_WORDS} words
              </Text>
            </View>
          </View>

          <Input
            placeholder="Describe the issue in detail, how long it has persisted, and any specific hazards or affected students..."
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              if (descriptionError) setDescriptionError(null);
            }}
            error={descriptionError}
            multiline
            numberOfLines={5}
            maxLength={LIMITS.ISSUE_DESCRIPTION_MAX_CHARS}
            helperText="Minimum 5 words required for administrative verification."
          />
        </Card>

        {/* 5. Attachments / Evidence (Future Pipeline) */}
        <Card variant="outlined" padding="md" style={styles.attachmentCard}>
          <View style={styles.attachmentHeader}>
            <View style={styles.attachmentIconBox}>
              <Ionicons name="images-outline" size={20} color={COLORS.gray500} />
            </View>
            <View style={styles.attachmentTextWrapper}>
              <View style={styles.attachmentTitleRow}>
                <Text style={styles.attachmentTitle}>Photo / Evidence Attachments</Text>
                <Badge label="Coming Soon" variant="neutral" size="sm" />
              </View>
              <Text style={styles.attachmentSubtitle}>
                Camera & photo evidence pipeline is being integrated for the next update. All
                reports are currently physically verified by estate maintenance.
              </Text>
            </View>
          </View>
        </Card>

        {/* Submit Action */}
        <View style={styles.submitContainer}>
          <Button
            title="Submit Grievance"
            onPress={handleSubmit}
            loading={submitIssueMutation.isPending}
            variant="primary"
            size="lg"
            icon={<Ionicons name="send" size={18} color={COLORS.white} />}
          />

          <Text style={styles.disclaimerText}>
            By submitting, you confirm that the report is accurate and pertains to genuine campus
            facilities at North-Eastern Hill University.
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
  identityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    padding: SPACING.sm + 2,
    borderWidth: 1,
    borderColor: COLORS.gray200,
    marginBottom: SPACING.base,
  },
  identityAvatarCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  identityTextWrapper: {
    flex: 1,
    marginRight: SPACING.xs,
  },
  identityName: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    color: COLORS.gray900,
  },
  identityDept: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    color: COLORS.gray500,
  },
  identityNote: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.gray500,
    marginTop: 1,
  },
  sectionCard: {
    marginBottom: SPACING.base,
  },
  fieldSectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray800,
  },
  fieldSectionSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray500,
    marginTop: 1,
    marginBottom: SPACING.sm,
  },
  locationHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  gpsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primarySubtle,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
  },
  gpsButtonDisabled: {
    opacity: 0.6,
  },
  gpsButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.primary,
  },
  gpsSuccessNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
  },
  gpsSuccessText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 10,
    color: COLORS.success,
  },
  gpsWarningNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: -SPACING.xs,
    marginBottom: SPACING.sm,
  },
  gpsWarningText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.warning,
    flex: 1,
  },
  landmarksSection: {
    marginTop: SPACING.xs,
  },
  landmarksHeading: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.gray600,
    marginBottom: SPACING.xs,
  },
  landmarksScroll: {
    gap: SPACING.xs,
  },
  landmarkChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.gray100,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
  },
  landmarkChipText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray700,
  },
  descriptionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  wordCountBadge: {
    paddingHorizontal: SPACING.xs + 2,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    backgroundColor: COLORS.gray100,
  },
  wordCountBadgeValid: {
    backgroundColor: COLORS.successLight,
  },
  wordCountBadgeInvalid: {
    backgroundColor: COLORS.warningLight,
  },
  wordCountText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 10,
    color: COLORS.gray500,
  },
  wordCountTextValid: {
    color: COLORS.success,
  },
  wordCountTextInvalid: {
    color: COLORS.warning,
  },
  attachmentCard: {
    marginBottom: SPACING.lg,
    borderStyle: 'dashed',
    borderColor: COLORS.gray300,
    backgroundColor: '#F8FAFC',
  },
  attachmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  attachmentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.gray200,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.sm,
  },
  attachmentTextWrapper: {
    flex: 1,
  },
  attachmentTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  attachmentTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    color: COLORS.gray700,
  },
  attachmentSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.gray400,
    lineHeight: 14,
  },
  submitContainer: {
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
  },
  disclaimerText: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.gray400,
    textAlign: 'center',
    marginTop: SPACING.sm,
    lineHeight: 14,
  },
});
