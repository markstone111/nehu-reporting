/**
 * CategoryPicker Component — src/components/issue/CategoryPicker.tsx
 *
 * Canva-inspired visual category & subcategory selector for grievance filing.
 * Features grid cards with curated category icons, color palettes,
 * and an interactive chip shelf for granular subcategories.
 */

import { View, Text, Pressable, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ISSUE_CATEGORIES,
  getSubcategories,
  type CategoryId,
  type Subcategory,
} from '@/constants/categories';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export interface CategoryPickerProps {
  readonly selectedCategoryId: CategoryId | null;
  readonly selectedSubcategoryId: string | null;
  readonly onSelectCategory: (categoryId: CategoryId) => void;
  readonly onSelectSubcategory: (subcategoryId: string | null) => void;
  readonly error?: string | null;
}

const CATEGORY_ICONS: Record<CategoryId, keyof typeof Ionicons.glyphMap> = {
  INFRASTRUCTURE: 'construct-outline',
  HOSTEL: 'bed-outline',
  ACADEMICS: 'school-outline',
  HYGIENE: 'water-outline',
  SAFETY: 'shield-checkmark-outline',
  IT_SERVICES: 'wifi-outline',
  ADMINISTRATION: 'business-outline',
  OTHER: 'help-circle-outline',
};

export function CategoryPicker({
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  onSelectSubcategory,
  error,
}: CategoryPickerProps) {
  const activeSubcategories = selectedCategoryId ? getSubcategories(selectedCategoryId) : [];

  const handleCategoryPress = (catId: CategoryId) => {
    if (selectedCategoryId === catId) {
      // already selected
      return;
    }
    onSelectCategory(catId);
    onSelectSubcategory(null); // reset subcategory on parent change
  };

  const handleSubcategoryPress = (subId: string) => {
    if (selectedSubcategoryId === subId) {
      onSelectSubcategory(null);
    } else {
      onSelectSubcategory(subId);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          Select Category <Text style={styles.requiredAsterisk}>*</Text>
        </Text>
        {selectedCategoryId && <Text style={styles.selectedCount}>1 selected</Text>}
      </View>

      {/* Grid of Categories (2 columns) */}
      <View style={styles.grid}>
        {ISSUE_CATEGORIES.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const iconName = CATEGORY_ICONS[category.id] ?? 'folder-outline';

          return (
            <Pressable
              key={category.id}
              onPress={() => handleCategoryPress(category.id)}
              style={({ pressed }) => [
                styles.categoryCard,
                isSelected && [
                  styles.categoryCardSelected,
                  { borderColor: category.color, backgroundColor: `${category.color}0D` },
                ],
                pressed && styles.categoryCardPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${category.label} category`}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${category.color}18` },
                  isSelected && { backgroundColor: category.color },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isSelected ? COLORS.white : category.color}
                />
              </View>

              <View style={styles.categoryTextWrapper}>
                <Text
                  style={[
                    styles.categoryTitle,
                    isSelected && { color: category.color, fontFamily: TYPOGRAPHY.fontFamily.bold },
                  ]}
                  numberOfLines={1}
                >
                  {category.label}
                </Text>
                <Text style={styles.categoryDescription} numberOfLines={2}>
                  {category.description}
                </Text>
              </View>

              {isSelected && (
                <View style={[styles.checkBadge, { backgroundColor: category.color }]}>
                  <Ionicons name="checkmark" size={12} color={COLORS.white} />
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Granular Subcategories Shelf (Only shown if parent category is selected) */}
      {selectedCategoryId && activeSubcategories.length > 0 && (
        <View style={styles.subcategorySection}>
          <View style={styles.subcategoryHeaderRow}>
            <Ionicons name="list-outline" size={14} color={COLORS.gray600} />
            <Text style={styles.subcategorySectionTitle}>Specific Subcategory (Optional)</Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subcategoryScroll}
          >
            {activeSubcategories.map((sub: Subcategory) => {
              const isSubSelected = selectedSubcategoryId === sub.id;

              return (
                <Pressable
                  key={sub.id}
                  onPress={() => handleSubcategoryPress(sub.id)}
                  style={[styles.subChip, isSubSelected && styles.subChipSelected]}
                  accessibilityRole="button"
                >
                  <Text style={[styles.subChipText, isSubSelected && styles.subChipTextSelected]}>
                    {sub.label}
                  </Text>
                  {isSubSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={14}
                      color={COLORS.primary}
                      style={styles.subChipCheck}
                    />
                  )}
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Error text */}
      {error && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle" size={14} color={COLORS.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.base,
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray800,
  },
  requiredAsterisk: {
    color: COLORS.error,
  },
  selectedCount: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.primary,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  categoryCard: {
    width: '48.5%',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    padding: SPACING.sm + 2,
    minHeight: 88,
    position: 'relative',
  },
  categoryCardSelected: {
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  categoryCardPressed: {
    opacity: 0.85,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.xs,
  },
  categoryTextWrapper: {
    flex: 1,
  },
  categoryTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    color: COLORS.gray900,
    marginBottom: 2,
  },
  categoryDescription: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 10,
    color: COLORS.gray500,
    lineHeight: 13,
  },
  checkBadge: {
    position: 'absolute',
    top: SPACING.xs,
    right: SPACING.xs,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subcategorySection: {
    marginTop: SPACING.md,
    backgroundColor: COLORS.gray50,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  subcategoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs + 2,
    gap: 4,
  },
  subcategorySectionTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.gray600,
  },
  subcategoryScroll: {
    flexDirection: 'row',
    gap: SPACING.xs,
    paddingVertical: 2,
  },
  subChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.gray300,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: SPACING.xs,
  },
  subChipSelected: {
    backgroundColor: COLORS.primarySubtle,
    borderColor: COLORS.primary,
  },
  subChipText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.gray700,
  },
  subChipTextSelected: {
    color: COLORS.primary,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  subChipCheck: {
    marginLeft: 4,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.xs,
    gap: SPACING.xs,
  },
  errorText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.error,
  },
});
