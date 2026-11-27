/**
 * CategoryPicker Component — src/components/issue/CategoryPicker.tsx
 *
 * Clean, modern category & subcategory selector for grievance filing.
 * When a category is selected, other categories collapse away and its
 * required subcategories appear immediately below, with a "Change" button
 * to switch back to all categories.
 */

import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  ISSUE_CATEGORIES,
  CATEGORY_IDS,
  getSubcategories,
  type CategoryId,
  type Subcategory,
} from '@/constants/categories';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';

export interface CategoryPickerProps {
  readonly selectedCategoryId: CategoryId | null;
  readonly selectedSubcategoryId: string | null;
  readonly onSelectCategory: (categoryId: CategoryId | null) => void;
  readonly onSelectSubcategory: (subcategoryId: string | null) => void;
  readonly error?: string | null;
}

const CATEGORY_ICONS: Record<string, keyof typeof Ionicons.glyphMap> = {
  [CATEGORY_IDS.HOSTEL]: 'bed-outline',
  [CATEGORY_IDS.ACADEMIC]: 'school-outline',
  [CATEGORY_IDS.CAMPUS_FACILITIES]: 'business-outline',
  [CATEGORY_IDS.LIBRARY]: 'library-outline',
  [CATEGORY_IDS.SPORTS]: 'fitness-outline',
};

export function CategoryPicker({
  selectedCategoryId,
  selectedSubcategoryId,
  onSelectCategory,
  onSelectSubcategory,
  error,
}: CategoryPickerProps) {
  const selectedCategory = ISSUE_CATEGORIES.find((c) => c.id === selectedCategoryId);
  const activeSubcategories = selectedCategoryId ? getSubcategories(selectedCategoryId) : [];

  const handleCategoryPress = (catId: CategoryId) => {
    if (selectedCategoryId === catId) {
      return;
    }
    onSelectCategory(catId);
    onSelectSubcategory(null);
  };

  const handleClearCategory = () => {
    onSelectCategory(null);
    onSelectSubcategory(null);
  };

  const handleSubcategoryPress = (subId: string) => {
    onSelectSubcategory(selectedSubcategoryId === subId ? null : subId);
  };

  const visibleCategories = selectedCategory ? [selectedCategory] : ISSUE_CATEGORIES;

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <View style={styles.labelTextCol}>
          <Text style={styles.label}>
            Issue Category <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <Text style={styles.helperSubtitle}>
            {selectedCategory
              ? 'Now choose a specific subcategory below'
              : 'Choose the department or facility for this issue'}
          </Text>
        </View>
        {selectedCategory && (
          <Pressable
            onPress={handleClearCategory}
            hitSlop={8}
            style={styles.changeButton}
            accessibilityRole="button"
            accessibilityLabel="Change selected category"
          >
            <Ionicons name="swap-horizontal-outline" size={13} color={COLORS.primary} />
            <Text style={styles.changeButtonText}>Change</Text>
          </Pressable>
        )}
      </View>

      {/* Category List (shows all 5 when unselected, or only the selected one) */}
      <View style={styles.categoryList}>
        {visibleCategories.map((category) => {
          const isSelected = selectedCategoryId === category.id;
          const iconName = CATEGORY_ICONS[category.id] ?? 'folder-outline';

          return (
            <Pressable
              key={category.id}
              onPress={() => handleCategoryPress(category.id)}
              style={({ pressed }) => [
                styles.categoryRow,
                isSelected && {
                  borderColor: category.color,
                  backgroundColor: `${category.color}08`,
                },
                pressed && !isSelected && styles.categoryRowPressed,
              ]}
              accessibilityRole="radio"
              accessibilityState={{ selected: isSelected }}
              accessibilityLabel={`${category.label} category`}
            >
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: `${category.color}16` },
                  isSelected && { backgroundColor: category.color },
                ]}
              >
                <Ionicons
                  name={iconName}
                  size={20}
                  color={isSelected ? COLORS.white : category.color}
                />
              </View>

              <View style={styles.categoryContent}>
                <Text
                  style={[
                    styles.categoryTitle,
                    isSelected && { color: category.color, fontFamily: TYPOGRAPHY.fontFamily.bold },
                  ]}
                >
                  {category.label}
                </Text>

                <Text style={styles.categoryDescription} numberOfLines={2}>
                  {category.description}
                </Text>
              </View>

              <View
                style={[
                  styles.radioOuter,
                  isSelected && { borderColor: category.color, backgroundColor: category.color },
                ]}
              >
                {isSelected && <Ionicons name="checkmark" size={12} color={COLORS.white} />}
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Required Subcategories List */}
      {selectedCategory && activeSubcategories.length > 0 && (
        <View
          style={[
            styles.subcategorySection,
            {
              borderColor: `${selectedCategory.color}35`,
              backgroundColor: `${selectedCategory.color}06`,
            },
          ]}
        >
          <View style={styles.subcategoryHeaderRow}>
            <View style={[styles.subDot, { backgroundColor: selectedCategory.color }]} />
            <Text style={styles.subcategorySectionTitle}>
              Select Subcategory <Text style={styles.requiredAsterisk}>*</Text>
            </Text>
          </View>

          <View style={styles.subcategoryList}>
            {activeSubcategories.map((sub: Subcategory) => {
              const isSubSelected = selectedSubcategoryId === sub.id;

              return (
                <Pressable
                  key={sub.id}
                  onPress={() => handleSubcategoryPress(sub.id)}
                  style={({ pressed }) => [
                    styles.subItem,
                    isSubSelected && {
                      borderColor: selectedCategory.color,
                      backgroundColor: COLORS.white,
                    },
                    pressed && styles.categoryRowPressed,
                  ]}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSubSelected }}
                >
                  <View style={styles.subItemTextWrap}>
                    <Text
                      style={[
                        styles.subItemTitle,
                        isSubSelected && {
                          color: selectedCategory.color,
                          fontFamily: TYPOGRAPHY.fontFamily.bold,
                        },
                      ]}
                    >
                      {sub.label}
                    </Text>
                    <Text style={styles.subItemDesc} numberOfLines={2}>
                      {sub.description}
                    </Text>
                  </View>

                  <Ionicons
                    name={isSubSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={isSubSelected ? selectedCategory.color : COLORS.gray300}
                  />
                </Pressable>
              );
            })}
          </View>
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
    width: '100%',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  labelTextCol: {
    flex: 1,
  },
  label: {
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.base,
    color: COLORS.gray900,
    marginBottom: 2,
  },
  helperSubtitle: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray500,
  },
  requiredAsterisk: {
    color: COLORS.error,
  },
  changeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.primarySubtle,
    paddingHorizontal: SPACING.sm + 2,
    paddingVertical: 5,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  changeButtonText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: 11,
    color: COLORS.primary,
  },
  categoryList: {
    gap: SPACING.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    borderColor: COLORS.gray200,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 4,
    gap: SPACING.sm + 2,
  },
  categoryRowPressed: {
    opacity: 0.85,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryContent: {
    flex: 1,
  },
  categoryTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.sm,
    color: COLORS.gray900,
    marginBottom: 3,
  },
  categoryDescription: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11.5,
    color: COLORS.gray500,
    lineHeight: 16,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: COLORS.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subcategorySection: {
    marginTop: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    borderWidth: 1,
  },
  subcategoryHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
    gap: 6,
  },
  subDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  subcategorySectionTitle: {
    flex: 1,
    fontFamily: TYPOGRAPHY.fontFamily.bold,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    color: COLORS.gray800,
  },
  subcategoryList: {
    gap: SPACING.xs + 2,
  },
  subItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1,
    borderColor: COLORS.gray200,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm + 2,
    gap: SPACING.sm,
  },
  subItemTextWrap: {
    flex: 1,
  },
  subItemTitle: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs + 1,
    color: COLORS.gray800,
    marginBottom: 2,
  },
  subItemDesc: {
    fontFamily: TYPOGRAPHY.fontFamily.regular,
    fontSize: 11,
    color: COLORS.gray500,
    lineHeight: 15,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: SPACING.sm,
    gap: SPACING.xs,
  },
  errorText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.error,
  },
});
