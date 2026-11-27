/**
 * useIssues Hook
 *
 * TanStack Query hooks for querying user issues, issue details,
 * and submitting new grievance reports directly from the live backend.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesApi } from '@/api/issues.api';
import { useAuthStore } from '@/store/auth.store';
import { NotificationService } from '@/services/notification.service';
import { logger } from '@/utils/logger.utils';
import type {
  Issue,
  IssueSummary,
  GetIssuesRequest,
  SubmitIssueRequest,
  SubmitIssueResponse,
  Paginated,
} from '@/types/api.types';

// Track known issue statuses per user in memory to detect live backend transitions
const LAST_KNOWN_ISSUE_STATUSES = new Map<string, string>();

/**
 * Fetch list of issues submitted by the current authenticated user.
 */
export function useMyIssues(params: GetIssuesRequest = {}) {
  const queryClient = useQueryClient();
  const userId = useAuthStore((s) => s.user?.id);

  return useQuery<Paginated<IssueSummary>>({
    queryKey: ['issues', userId ?? 'anon', params],
    enabled: Boolean(userId),
    queryFn: async () => {
      try {
        const response = await issuesApi.getMyIssues({
          ...params,
          ...(userId ? { user_id: userId } : {}),
        } as GetIssuesRequest);
        logger.log('USER_ACTION', `Fetched grievances list (total: ${response.data.length})`);

        // Detect status transitions since previous fetch for this user
        const userPrefix = `${userId ?? 'anon'}:`;
        const hadBaseline = Array.from(LAST_KNOWN_ISSUE_STATUSES.keys()).some((k) =>
          k.startsWith(userPrefix),
        );
        let hasTransition = false;
        for (const issue of response.data) {
          const statusKey = `${userPrefix}${issue.id}`;
          const prevStatus = LAST_KNOWN_ISSUE_STATUSES.get(statusKey);
          if (hadBaseline && prevStatus && prevStatus !== issue.status) {
            hasTransition = true;
            NotificationService.notifyGrievanceStatusUpdated({
              id: issue.id,
              title: issue.title,
              status: issue.status,
            });
            queryClient.invalidateQueries({ queryKey: ['issue', issue.id] });
          }
          LAST_KNOWN_ISSUE_STATUSES.set(statusKey, issue.status);
        }

        if (hasTransition) {
          queryClient.invalidateQueries({ queryKey: ['notifications'] });
        }

        return response;
      } catch (err) {
        logger.warn('USER_ACTION', 'Failed to fetch user issues from backend', err);
        return {
          data: [],
          total: 0,
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          hasNextPage: false,
        };
      }
    },
    staleTime: 15 * 1000, // 15 seconds — ensures prompt status updates
    refetchOnMount: 'always',
  });
}

/**
 * Fetch full details and resolution timeline for a single issue.
 */
export function useIssueDetail(id: string) {
  return useQuery<Issue>({
    queryKey: ['issue', id],
    queryFn: async () => {
      logger.log('USER_ACTION', `Loading grievance details: ${id}`);
      const detail = await issuesApi.getIssueById(id);
      logger.log('USER_ACTION', `Loaded grievance details from API: ${id}`);
      return detail;
    },
    enabled: Boolean(id),
    staleTime: 15 * 1000,
    refetchOnMount: 'always',
  });
}

/**
 * Submit a new issue report.
 */
export function useSubmitIssue() {
  const queryClient = useQueryClient();

  return useMutation<SubmitIssueResponse, Error, SubmitIssueRequest>({
    mutationFn: async (data: SubmitIssueRequest): Promise<SubmitIssueResponse> => {
      const res = await issuesApi.submit(data);
      logger.log(
        'ISSUE_SUBMIT',
        `Grievance submitted to API: "${data.title}" -> ${data.category}`,
        {
          issueId: res.issueId,
          location: data.location.label,
        },
      );
      return res;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });

      // Pop up instant local alert banner on device
      NotificationService.notifyGrievanceSubmitted({
        id: data.issueId,
        title: variables.title,
        category: variables.category,
        location: variables.location?.label,
        isDuplicate: data.isDuplicate,
      });
    },
  });
}
