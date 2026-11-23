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
import type {
  SubmitIssueRequest,
  SubmitIssueResponse,
  Issue,
  IssueSummary,
  GetIssuesRequest,
  Paginated,
} from '@/types/api.types';

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

    const payload: Record<string, any> = {
      title: data.title,
      description: data.description,
      location: locationStr,
      attachments: data.attachments ? Array.from(data.attachments) : [],
    };

    const catVal = data.category;
    if (catVal && /^[0-9a-fA-F-]{36}$/.test(catVal)) {
      payload.category_id = catVal;
    } else if (catVal) {
      payload.category_name = catVal;
    }

    const subVal = data.subcategory;
    if (subVal && /^[0-9a-fA-F-]{36}$/.test(subVal)) {
      payload.subcategory_id = subVal;
    } else if (subVal) {
      payload.subcategory_name = subVal;
    }

    const response = await apiClient.post<any>('/issues', payload);
    const resData = response.data?.data || response.data;
    return {
      issueId: resData?.id || resData?.issueId,
      status: (resData?.status || 'OPEN').toLowerCase() as any,
      isDuplicate: Boolean(resData?.is_duplicate || resData?.isDuplicate),
      linkedIssueId: resData?.parent_issue_id || resData?.linkedIssueId || null,
      message: response.data?.message || 'Grievance submitted successfully',
    };
  },

  /**
   * Get the authenticated user's issue list (paginated summary cards).
   */
  getMyIssues: async (params: GetIssuesRequest = {}): Promise<Paginated<IssueSummary>> => {
    const response = await apiClient.get<any>('/issues', { params });
    const rawData = response.data?.data || response.data?.issues || response.data || [];
    const list = Array.isArray(rawData) ? rawData : rawData.data || [];

    const items: IssueSummary[] = list.map((it: any) => ({
      id: it.id || it.issue_id,
      title: it.title,
      status: (it.status || 'OPEN').toLowerCase() as any,
      category: it.category_name || it.category || 'General',
      subcategory: it.subcategory_name || it.subcategory || null,
      createdAt: it.created_at || new Date().toISOString(),
      updatedAt: it.updated_at || it.created_at || new Date().toISOString(),
      isDuplicate: Boolean(it.is_duplicate),
      linkedCount: it.duplicate_count || it.report_count || 0,
    }));

    return {
      data: items,
      total: response.data?.total || items.length,
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
      event: (ev.new_status || 'UPDATE') as any,
      message: ev.remarks || `Status updated to ${ev.new_status}`,
      timestamp: ev.created_at,
      actor: ev.changed_by?.includes('ADMIN') ? ('ADMIN' as const) : ('STUDENT' as const),
      actorName: ev.changed_by,
    }));

    return {
      id: it.id,
      title: it.title,
      description: it.description,
      status: (it.status || 'OPEN').toLowerCase() as any,
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
