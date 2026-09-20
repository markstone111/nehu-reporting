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
   * Works the same whether the report came from the standard form or
   * the AI chatbot — both produce a SubmitIssueRequest. The `source` field
   * distinguishes them on the backend.
   *
   * Duplicate detection happens server-side. If the backend detects a
   * duplicate (cosine similarity >= threshold), the response will have:
   *   isDuplicate: true
   *   linkedIssueId: "<uuid of existing issue>"
   * The app simply shows a toast: "Your report was linked to an existing issue."
   */
  submit: async (data: SubmitIssueRequest): Promise<SubmitIssueResponse> => {
    const response = await apiClient.post<SubmitIssueResponse>('/issues', data);
    return response.data;
  },

  /**
   * Get the authenticated user's issue list (paginated summary cards).
   */
  getMyIssues: async (params: GetIssuesRequest = {}): Promise<Paginated<IssueSummary>> => {
    const response = await apiClient.get<Paginated<IssueSummary>>('/issues', { params });
    return response.data;
  },

  /**
   * Get full issue detail including timeline events.
   */
  getIssueById: async (id: string): Promise<Issue> => {
    const response = await apiClient.get<Issue>(`/issues/${id}`);
    return response.data;
  },
};
