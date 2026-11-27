/**
 * Issues API Module
 *
 * All issue-related HTTP calls go through this module.
 *
 * Endpoints:
 *   POST   /issues         — Submit a new issue
 *   GET    /issues         — Get the current user's issues (paginated)
 *   GET    /issues/:id     — Get full issue detail with timeline
 */

import { apiClient } from '@/api/client';
import { useAuthStore } from '@/store/auth.store';
import { getCategoryById, getSubcategoryById } from '@/constants/categories';
import type {
  SubmitIssueRequest,
  SubmitIssueResponse,
  Issue,
  IssueSummary,
  IssueStatus,
  GetIssuesRequest,
  Paginated,
} from '@/types/api.types';

/**
 * Normalize backend issue status strings (e.g. "open", "pending", "in_progress")
 * into canonical uppercase mobile IssueStatus values.
 */
export function normalizeIssueStatus(rawStatus?: string | null): IssueStatus {
  const s = (rawStatus || 'SUBMITTED').toUpperCase().trim();
  if (s === 'OPEN' || s === 'PENDING' || s === 'SUBMITTED') return 'SUBMITTED';
  if (s === 'UNDER_REVIEW' || s === 'REOPENED') return 'UNDER_REVIEW';
  if (s === 'ASSIGNED') return 'ASSIGNED';
  if (s === 'IN_PROGRESS') return 'IN_PROGRESS';
  if (s === 'RESOLVED') return 'RESOLVED';
  if (s === 'CLOSED' || s === 'REJECTED') return 'CLOSED';
  if (s === 'ESCALATED') return 'ESCALATED';
  return 'SUBMITTED';
}

/**
 * Mapping between mobile category identifiers and live Cloud SQL UUIDs / names
 */
const DATABASE_CATEGORY_MAP: Record<string, { id: string; name: string }> = {
  HOSTEL: { id: '64186f49-bf76-4389-869a-323895980286', name: 'Hostel and Residential' },
  ACADEMICS: { id: '84c22147-f812-422f-9980-04ca4d8eb17a', name: 'Academic and Department' },
  INFRASTRUCTURE: { id: '4656baec-49de-4563-ae62-6c8e5b1fd3b6', name: 'Campus and Facilities (Central Level)' },
  HYGIENE: { id: '4656baec-49de-4563-ae62-6c8e5b1fd3b6', name: 'Campus and Facilities (Central Level)' },
  SAFETY: { id: '64186f49-bf76-4389-869a-323895980286', name: 'Hostel and Residential' },
  IT_SERVICES: { id: '4656baec-49de-4563-ae62-6c8e5b1fd3b6', name: 'Campus and Facilities (Central Level)' },
  ADMINISTRATION: { id: '84c22147-f812-422f-9980-04ca4d8eb17a', name: 'Academic and Department' },
  OTHER: { id: '4656baec-49de-4563-ae62-6c8e5b1fd3b6', name: 'Campus and Facilities (Central Level)' },
};

export const issuesApi = {
  /**
   * Submit a new issue report.
   *
   * Automatically formats GPS coordinates, verifies categories,
   * attaches image evidence, and passes to backend duplicate detection.
   */
  submit: async (data: SubmitIssueRequest): Promise<SubmitIssueResponse> => {
    let locationStr = 'Campus';
    if (typeof (data as any).location === 'string') {
      locationStr = (data as any).location;
    } else if (data.location && typeof data.location === 'object') {
      const loc = data.location as any;
      locationStr = loc.label || 'Campus';
      if (loc.latitude && loc.longitude) {
        locationStr = `${locationStr} (${Number(loc.latitude).toFixed(5)}, ${Number(loc.longitude).toFixed(5)})`;
      }
    }

    const currentUser = useAuthStore.getState().user;

    const payload: Record<string, any> = {
      title: data.title,
      description: data.description,
      location: locationStr,
      attachments: data.attachments ? Array.from(data.attachments) : [],
    };

    if (currentUser?.id) {
      payload.user_id = currentUser.id;
      payload.student_id = currentUser.id;
    }

    const resolvedCategory = getCategoryById(data.category);
    if (resolvedCategory) {
      payload.category_id = resolvedCategory.id;
      payload.category_name = resolvedCategory.label;
    } else {
      const catKey = (data.category || '').toUpperCase().trim();
      if (DATABASE_CATEGORY_MAP[catKey]) {
        payload.category_id = DATABASE_CATEGORY_MAP[catKey].id;
        payload.category_name = DATABASE_CATEGORY_MAP[catKey].name;
      } else if (catKey && /^[0-9a-fA-F-]{36}$/.test(catKey)) {
        payload.category_id = catKey;
      } else if (data.category) {
        payload.category_name = data.category;
      }
    }

    const subVal = data.subcategory;
    if (subVal) {
      const resolvedSub = getSubcategoryById(subVal);
      if (resolvedSub) {
        payload.subcategory_id = resolvedSub.id;
        payload.subcategory_name = resolvedSub.label;
      } else if (/^[0-9a-fA-F-]{36}$/.test(subVal)) {
        payload.subcategory_id = subVal;
      } else {
        payload.subcategory_name = subVal;
      }
    }

    const response = await apiClient.post<any>('/issues', payload);
    const resData = response.data?.data || response.data;
    return {
      issueId: resData?.id || resData?.issueId,
      status: normalizeIssueStatus(resData?.status),
      isDuplicate: Boolean(resData?.is_duplicate || resData?.isDuplicate),
      linkedIssueId: resData?.parent_issue_id || resData?.linkedIssueId || null,
      message: response.data?.message || 'Grievance submitted successfully',
    };
  },

  /**
   * Get the authenticated user's issue list (paginated summary cards).
   */
  getMyIssues: async (params: GetIssuesRequest = {}): Promise<Paginated<IssueSummary>> => {
    const currentUser = useAuthStore.getState().user;
    const queryParams: Record<string, any> = { ...params };
    if (currentUser?.id && !queryParams.user_id) {
      queryParams.user_id = currentUser.id;
    }

    const response = await apiClient.get<any>('/issues/my', { params: queryParams });
    const rawData =
      response.data?.data?.issues ||
      response.data?.data ||
      response.data?.issues ||
      response.data ||
      [];
    const list = Array.isArray(rawData) ? rawData : rawData.data || [];

    const items: IssueSummary[] = list.map((it: any) => ({
      id: it.id || it.issue_id,
      title: it.title,
      description: it.description || '',
      status: normalizeIssueStatus(it.status),
      category: it.category_name || it.category || 'General',
      subcategory: it.subcategory_name || it.subcategory || null,
      locationLabel: it.location || undefined,
      createdAt: it.created_at || new Date().toISOString(),
      updatedAt: it.updated_at || it.created_at || new Date().toISOString(),
      isDuplicate: Boolean(it.is_duplicate),
      linkedCount: it.duplicate_count || it.report_count || 0,
    }));

    return {
      data: items,
      total: response.data?.data?.total || response.data?.total || items.length,
      page: params.page ?? 1,
      pageSize: params.pageSize ?? 20,
      hasNextPage: false,
    };
  },

  /**
   * Get full issue detail including resolution timeline events and image attachments.
   */
  getIssueById: async (id: string): Promise<Issue> => {
    const response = await apiClient.get<any>(`/issues/${id}`);
    const it = response.data?.data || response.data;

    const rawTimeline = Array.isArray(it.timeline) ? it.timeline : [];
    const timeline = rawTimeline.map((ev: any, idx: number) => ({
      id: ev.id || `ev-${idx}`,
      event: normalizeIssueStatus(ev.new_status) as any,
      title: `Status: ${normalizeIssueStatus(ev.new_status).replace(/_/g, ' ')}`,
      message: ev.remarks || `Status updated to ${ev.new_status}`,
      timestamp: ev.created_at,
      actor: ev.changed_by?.includes('ADMIN') ? ('admin' as const) : ('user' as const),
      actorName: ev.changed_by,
    }));

    return {
      id: it.id,
      title: it.title,
      description: it.description,
      status: normalizeIssueStatus(it.status),
      category: it.category_name || 'General',
      subcategory: it.subcategory_name || null,
      location: {
        label: it.location || 'Campus',
        latitude: null,
        longitude: null,
        autoFetched: false,
      },
      source: 'FORM',
      isDuplicate: Boolean(it.is_duplicate),
      linkedIssueId: it.parent_issue_id || null,
      linkedCount: it.duplicate_count || 0,
      assignedTo: it.assigned_to || null,
      createdAt: it.created_at,
      updatedAt: it.updated_at,
      timeline,
      attachments: it.attachments || [],
    };
  },
};
