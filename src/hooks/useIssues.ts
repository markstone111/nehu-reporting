/**
 * useIssues Hook
 *
 * TanStack Query hooks for querying user issues, issue details,
 * and submitting new grievance reports.
 *
 * Provides resilient fallbacks for offline development/demo testing
 * if the backend server is temporarily unreachable during phone testing.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { issuesApi } from '@/api/issues.api';
import { logger } from '@/utils/logger.utils';
import type {
  Issue,
  IssueSummary,
  GetIssuesRequest,
  SubmitIssueRequest,
  SubmitIssueResponse,
  Paginated,
} from '@/types/api.types';

// ---------------------------------------------------------------------------
// Demo / Fallback Data (Active during local testing if server is offline)
// ---------------------------------------------------------------------------

let DEMO_ISSUES: IssueSummary[] = [
  {
    id: 'demo-issue-1',
    title: 'Water geyser malfunctioning in Boys Hostel 3',
    description:
      'The geyser in the second-floor east wing bathroom has been tripping the circuit breaker for the past three days. No hot water in morning hours.',
    category: 'HOSTEL',
    subcategory: 'HOSTEL_MESS',
    status: 'IN_PROGRESS',
    locationLabel: 'Boys Hostel 3, 2nd Floor East Wing',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(), // 6 hours ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isDuplicate: false,
    linkedCount: 1,
  },
  {
    id: 'demo-issue-2',
    title: 'Wi-Fi connectivity dropouts in Central Library',
    description:
      'NEHU-Student Wi-Fi continuously disconnects every 5 minutes in the reference reading room. Signal is full but IP lease fails.',
    category: 'IT_SERVICES',
    subcategory: 'IT_WIFI',
    status: 'UNDER_REVIEW',
    locationLabel: 'Central Library, Reference Hall (1st Floor)',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(), // Yesterday
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    isDuplicate: false,
    linkedCount: 3,
  },
  {
    id: 'demo-issue-3',
    title: 'Broken street lamp near Science Complex junction',
    description:
      'Streetlight pole #14 has been dark for a week. The pathway between the Science Complex and Girls Hostel is completely pitch black at night.',
    category: 'INFRASTRUCTURE',
    subcategory: 'INFRA_ELECTRICAL',
    status: 'RESOLVED',
    locationLabel: 'Science Complex - Hostel Road junction',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(), // 3 days ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    isDuplicate: false,
    linkedCount: 1,
  },
  {
    id: 'demo-issue-4',
    title: 'Projector HDMI port damaged in IT Dept Lab 3',
    description:
      'The ceiling-mounted projector in Computer Lab 3 has a bent HDMI connector pin, making it impossible to connect laptops for seminars.',
    category: 'ACADEMICS',
    subcategory: 'ACAD_CLASSES',
    status: 'SUBMITTED',
    locationLabel: 'School of Technology, Dept of IT, Room 302',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(), // 1 hour ago
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    isDuplicate: false,
    linkedCount: 1,
  },
];

const DEMO_DETAIL_MAP: Record<string, Issue> = {
  'demo-issue-1': {
    id: 'demo-issue-1',
    title: 'Water geyser malfunctioning in Boys Hostel 3',
    description:
      'The geyser in the second-floor east wing bathroom has been tripping the circuit breaker for the past three days. No hot water in morning hours. Multiple students have reported the issue to the hostel caretaker without resolution.',
    category: 'HOSTEL',
    subcategory: 'HOSTEL_MESS',
    status: 'IN_PROGRESS',
    assignedTo: 'Hostel Maintenance Division (Estate Office)',
    location: {
      label: 'Boys Hostel 3, 2nd Floor East Wing',
      latitude: 25.6054,
      longitude: 91.8988,
      autoFetched: true,
    },
    attachments: [],
    source: 'FORM',
    isDuplicate: false,
    linkedIssueId: null,
    linkedCount: 1,
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    timeline: [
      {
        id: 'tl-1',
        event: 'SUBMITTED',
        title: 'Grievance Submitted',
        message: 'Report filed successfully and queued for administrative review.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
        actor: 'user',
        actorName: 'Nikunj Maheshwari (Student)',
      },
      {
        id: 'tl-2',
        event: 'UNDER_REVIEW',
        title: 'Review by Proctor & Estate Cell',
        message: 'Issue reviewed and verified as urgent electrical/plumbing defect.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
        actor: 'admin',
        actorName: 'NEHU Estate Office',
      },
      {
        id: 'tl-3',
        event: 'ASSIGNED',
        title: 'Assigned to Electrician On Duty',
        message: 'Assigned to Estate Maintenance Team (Technician: B. Sangma).',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
        actor: 'admin',
        actorName: 'Estate Supervisor',
      },
      {
        id: 'tl-4',
        event: 'IN_PROGRESS',
        title: 'Inspection in Progress',
        message: 'Replacement heating coil and 16A breaker ordered from central store.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        actor: 'admin',
        actorName: 'Technician B. Sangma',
      },
    ],
  },
};

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

/**
 * Fetch list of issues submitted by the current user.
 */
export function useMyIssues(params: GetIssuesRequest = {}) {
  return useQuery<Paginated<IssueSummary>>({
    queryKey: ['issues', params],
    queryFn: async () => {
      try {
        const response = await issuesApi.getMyIssues(params);
        logger.log('USER_ACTION', `Fetched grievances list (total: ${response.data.length})`);
        return response;
      } catch (err) {
        // Fallback to demo issues if server is unreachable
        let filtered = [...DEMO_ISSUES];
        if (params.status) {
          filtered = filtered.filter((i) => i.status === params.status);
        }
        logger.log(
          'USER_ACTION',
          `[DEMO FALLBACK] Loaded grievances list (total: ${filtered.length})`,
        );
        return {
          data: filtered,
          total: filtered.length,
          page: params.page ?? 1,
          pageSize: params.pageSize ?? 20,
          hasNextPage: false,
        };
      }
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
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
      try {
        const detail = await issuesApi.getIssueById(id);
        logger.log('USER_ACTION', `Loaded grievance details from API: ${id}`);
        return detail;
      } catch (err) {
        // Return demo detail or synthesize a realistic detail from summary
        if (DEMO_DETAIL_MAP[id]) {
          return DEMO_DETAIL_MAP[id];
        }
        const summary = DEMO_ISSUES.find((i) => i.id === id);
        if (summary) {
          return {
            id: summary.id,
            title: summary.title,
            description:
              summary.description ??
              'Detailed grievance description recorded in the university database.',
            status: summary.status,
            category: summary.category,
            subcategory: summary.subcategory,
            assignedTo: 'NEHU Campus Maintenance Division',
            location: {
              label: summary.locationLabel ?? 'NEHU Campus, Shillong',
              latitude: 25.6054,
              longitude: 91.8988,
              autoFetched: false,
            },
            attachments: [],
            source: 'FORM',
            isDuplicate: summary.isDuplicate,
            linkedIssueId: null,
            linkedCount: summary.linkedCount,
            createdAt: summary.createdAt,
            updatedAt: summary.updatedAt,
            timeline: [
              {
                id: 'tl-sub',
                event: 'SUBMITTED',
                title: 'Report Submitted',
                message: 'Grievance recorded on NEHU portal.',
                timestamp: summary.createdAt,
                actor: 'user',
                actorName: 'Student',
              },
            ],
          };
        }
        throw err;
      }
    },
    enabled: Boolean(id),
    staleTime: 1000 * 60 * 2,
  });
}

/**
 * Submit a new issue report.
 */
export function useSubmitIssue() {
  const queryClient = useQueryClient();

  return useMutation<SubmitIssueResponse, Error, SubmitIssueRequest>({
    mutationFn: async (data: SubmitIssueRequest): Promise<SubmitIssueResponse> => {
      try {
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
      } catch (err) {
        // Fallback for demo / offline phone testing
        const now = new Date().toISOString();
        const newId = `demo-${Date.now()}`;

        logger.warn('ISSUE_SUBMIT', `Backend offline — created local mock grievance: ${newId}`, {
          title: data.title,
          category: data.category,
          location: data.location.label,
          source: data.source,
        });
        const newSummary: IssueSummary = {
          id: newId,
          title: data.title,
          description: data.description,
          category: data.category,
          subcategory: data.subcategory,
          status: 'SUBMITTED',
          locationLabel: data.location.label,
          createdAt: now,
          updatedAt: now,
          isDuplicate: false,
          linkedCount: 1,
        };

        DEMO_ISSUES = [newSummary, ...DEMO_ISSUES];

        DEMO_DETAIL_MAP[newId] = {
          id: newId,
          title: data.title,
          description: data.description,
          status: 'SUBMITTED',
          category: data.category,
          subcategory: data.subcategory,
          assignedTo: 'NEHU Administration (Pending Assignment)',
          location: data.location,
          attachments: data.attachments,
          source: data.source,
          isDuplicate: false,
          linkedIssueId: null,
          linkedCount: 1,
          createdAt: now,
          updatedAt: now,
          timeline: [
            {
              id: `tl-${Date.now()}`,
              event: 'SUBMITTED',
              title: 'Grievance Submitted',
              message: 'Grievance recorded successfully and queued for administrative review.',
              timestamp: now,
              actor: 'user',
              actorName: 'Student',
            },
          ],
        };

        return {
          issueId: newId,
          status: 'SUBMITTED',
          isDuplicate: false,
          linkedIssueId: null,
          message: 'Grievance registered successfully.',
        };
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['issues'] });
    },
  });
}
