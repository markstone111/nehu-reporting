/**
 * My Issues List Screen — app/(app)/issues/index.tsx
 *
 * Full list of user's submitted grievances with search, status filtering,
 * pull-to-refresh, and direct navigation to detailed status tracking.
 */

import { useState, useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, Pressable, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { ScreenWrapper } from '@/components/layout/ScreenWrapper';
import { Header } from '@/components/layout/Header';
import { Input } from '@/components/common/Input';
import { IssueCard } from '@/components/issue/IssueCard';
import { EmptyState } from '@/components/issue/EmptyState';
import { useMyIssues } from '@/hooks/useIssues';
import { COLORS, TYPOGRAPHY, SPACING, RADIUS } from '@/constants/theme';
import type { IssueSummary } from '@/types/api.types';

type FilterTab = 'ALL' | 'ACTIVE' | 'RESOLVED' | 'CLOSED';

const FILTER_TABS: readonly { readonly key: FilterTab; readonly label: string }[] = [
  { key: 'ALL', label: 'All' },
  { key: 'ACTIVE', label: 'In Progress' },
  { key: 'RESOLVED', label: 'Resolved' },
  { key: 'CLOSED', label: 'Closed' },
];

export default function MyIssuesScreen() {
  const router = useRouter();
  const { data: issuesData, refetch, isRefetching } = useMyIssues({ page: 1, pageSize: 50 });

  const [activeTab, setActiveTab] = useState<FilterTab>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter and search logic
  const filteredIssues = useMemo(() => {
    const allIssues = issuesData?.data ?? [];
    return allIssues.filter((issue) => {
      // 1. Tab filter
      if (activeTab === 'ACTIVE') {
        const isActive =
          issue.status === 'SUBMITTED' ||
          issue.status === 'UNDER_REVIEW' ||
          issue.status === 'ASSIGNED' ||
          issue.status === 'IN_PROGRESS' ||
          issue.status === 'ESCALATED';
        if (!isActive) return false;
      } else if (activeTab === 'RESOLVED') {
        if (issue.status !== 'RESOLVED') return false;
      } else if (activeTab === 'CLOSED') {
        if (issue.status !== 'CLOSED') return false;
      }

      // 2. Search query filter
      if (searchQuery.trim().length > 0) {
        const query = searchQuery.toLowerCase().trim();
        const matchesTitle = issue.title.toLowerCase().includes(query);
        const matchesDesc = issue.description?.toLowerCase().includes(query) ?? false;
        const matchesLoc = issue.locationLabel?.toLowerCase().includes(query) ?? false;
        const matchesCat = issue.category.toLowerCase().includes(query);
        if (!matchesTitle && !matchesDesc && !matchesLoc && !matchesCat) {
          return false;
        }
      }

      return true;
    });
  }, [issuesData?.data, activeTab, searchQuery]);

  const handleIssuePress = (issue: IssueSummary) => {
    router.push(`/(app)/issues/${issue.id}`);
  };

  return (
    <ScreenWrapper scrollable={false} backgroundColor={COLORS.gray50}>
      <Header
        title="My Grievances"
        subtitle="Track submitted issues & resolutions"
        rightElement={
          <Pressable
            onPress={() => router.push('/(app)/report/form')}
            style={styles.newReportButton}
            accessibilityRole="button"
            accessibilityLabel="New grievance"
          >
            <Ionicons name="add" size={18} color={COLORS.white} />
            <Text style={styles.newReportText}>New</Text>
          </Pressable>
        }
      />

      <View style={styles.container}>
        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Input
            placeholder="Search by title, department, or location..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            leftIcon={<Ionicons name="search-outline" size={18} color={COLORS.gray400} />}
            rightIcon={
              searchQuery.length > 0 ? (
                <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={18} color={COLORS.gray400} />
                </Pressable>
              ) : null
            }
            containerStyle={styles.searchInput}
          />
        </View>

        {/* Filter Tabs */}
        <View style={styles.tabsContainer}>
          {FILTER_TABS.map((tab) => {
            const isSelected = activeTab === tab.key;
            return (
              <Pressable
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                style={[styles.tabChip, isSelected && styles.tabChipActive]}
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
              >
                <Text style={[styles.tabChipText, isSelected && styles.tabChipTextActive]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Issues Count Bar */}
        <View style={styles.countRow}>
          <Text style={styles.countText}>
            Showing {filteredIssues.length}{' '}
            {filteredIssues.length === 1 ? 'grievance' : 'grievances'}
          </Text>
        </View>

        {/* List of Issues */}
        <FlatList
          data={filteredIssues}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <IssueCard issue={item} onPress={handleIssuePress} />}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              colors={[COLORS.primary]}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <EmptyState
              icon={searchQuery ? 'search-outline' : 'document-text-outline'}
              title={searchQuery ? 'No Matching Grievances' : 'No Grievances in this Category'}
              message={
                searchQuery
                  ? `No issues matched "${searchQuery}". Try different keywords.`
                  : 'You have not submitted any complaints matching this filter status.'
              }
              actionTitle={searchQuery ? 'Clear Search' : 'Report an Issue'}
              onAction={
                searchQuery ? () => setSearchQuery('') : () => router.push('/(app)/report/form')
              }
            />
          }
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: SPACING.md,
  },
  newReportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.sm + 2,
    borderRadius: RADIUS.md,
  },
  newReportText: {
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.white,
    marginLeft: 2,
  },
  searchContainer: {
    paddingHorizontal: SPACING.base,
    marginBottom: SPACING.xs,
  },
  searchInput: {
    marginBottom: 0,
  },
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.sm,
    gap: SPACING.sm,
  },
  tabChip: {
    paddingVertical: SPACING.xs + 2,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.gray100,
    borderWidth: 1,
    borderColor: COLORS.gray200,
  },
  tabChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  tabChipText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: TYPOGRAPHY.fontSize.xs,
    color: COLORS.gray600,
  },
  tabChipTextActive: {
    color: COLORS.white,
    fontFamily: TYPOGRAPHY.fontFamily.semiBold,
  },
  countRow: {
    paddingHorizontal: SPACING.base,
    paddingVertical: SPACING.xs,
    marginBottom: SPACING.xs,
  },
  countText: {
    fontFamily: TYPOGRAPHY.fontFamily.medium,
    fontSize: 11,
    color: COLORS.gray500,
  },
  listContent: {
    paddingHorizontal: SPACING.base,
    paddingBottom: SPACING.xxxl,
  },
});
