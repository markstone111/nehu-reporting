/**
 * All TypeScript types for API request/response payloads.
 *
 * This file is the CONTRACT between the mobile app and the backend team.
 * Any changes here MUST be communicated to the Go + FastAPI teammates and
 * reflected in docs/API_CONTRACT.md.
 *
 * Naming conventions:
 *   - Request bodies: <Resource>Request
 *   - Response bodies: <Resource>Response
 *   - Paginated lists: Paginated<T>
 *   - API errors: ApiError
 */

// ---------------------------------------------------------------------------
// Shared / Primitives
// ---------------------------------------------------------------------------

/** ISO 8601 date string, e.g. "2026-09-21T03:00:00Z" */
export type ISODateString = string;

/** UUID v4 string */
export type UUID = string;

/** Standard paginated list wrapper */
export interface Paginated<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly hasNextPage: boolean;
}

/** Standard API error shape — every error from the backend must match this */
export interface ApiError {
  readonly code: string; // e.g. "VALIDATION_ERROR", "UNAUTHORIZED"
  readonly message: string; // Human-readable message
  readonly field?: string; // Which field caused the error (for form errors)
  readonly details?: unknown; // Optional extra context
}

/** Standard success response wrapper (for non-list endpoints) */
export interface ApiResponse<T> {
  readonly data: T;
  readonly message?: string;
}

// ---------------------------------------------------------------------------
// Auth Types
// ---------------------------------------------------------------------------

export type UserRole = 'student' | 'staff' | 'faculty';

export interface User {
  readonly id: UUID;
  readonly name: string;
  readonly full_name?: string;
  readonly roll_number?: string;
  readonly department?: string;
  readonly email: string;
  readonly role: UserRole;
  readonly avatarUrl: string | null; // URL to ID card or profile pic
  readonly createdAt: ISODateString;
}

export interface RegisterRequest {
  readonly name: string;
  readonly full_name?: string;
  readonly roll_number?: string;
  readonly department?: string;
  readonly email: string;
  readonly password: string;
  readonly role: UserRole;
  readonly idCardImageBase64: string; // One-time upload at registration
  readonly fcmToken: string | null; // May be null if permission denied
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
  readonly fcmToken: string | null;
}

export interface AuthTokens {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresIn: number; // Seconds until access token expires
}

export interface AuthResponse {
  readonly tokens: AuthTokens;
  readonly user: User;
}

export interface RefreshTokenRequest {
  readonly refreshToken: string;
}

export interface UpdateFcmTokenRequest {
  readonly fcmToken: string;
  readonly platform: 'android' | 'ios';
  readonly deviceModel?: string;
  readonly appVersion?: string;
}

export interface DeleteFcmTokenRequest {
  readonly fcmToken: string;
}

// ---------------------------------------------------------------------------
// Issue Types
// ---------------------------------------------------------------------------

export type IssueStatus =
  'SUBMITTED' | 'UNDER_REVIEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';

export type IssueSource = 'FORM' | 'CHATBOT';

export interface IssueLocation {
  readonly label: string; // Human-readable, e.g. "Boys Hostel Block A, Floor 3"
  readonly latitude: number | null; // GPS lat — null if not available
  readonly longitude: number | null; // GPS lon — null if not available
  readonly autoFetched: boolean; // Whether GPS was used or user typed manually
}

/** A single step in the issue resolution timeline */
export interface TimelineEvent {
  readonly id: UUID;
  readonly event: IssueStatus | 'COMMENT';
  readonly message: string;
  readonly timestamp: ISODateString;
  readonly actor: 'system' | 'admin' | 'user';
  readonly actorName?: string;
  readonly title?: string;
}

/** Full issue detail (used in issue detail screen) */
export interface Issue {
  readonly id: UUID;
  readonly title: string;
  readonly description: string;
  readonly status: IssueStatus;
  readonly category: string; // CategoryId
  readonly subcategory: string | null;
  readonly location: IssueLocation;
  readonly source: IssueSource;
  readonly isDuplicate: boolean;
  readonly linkedIssueId: UUID | null;
  readonly linkedCount: number; // How many reports are linked to this issue
  readonly assignedTo: string | null; // Department or person name
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
  readonly timeline: readonly TimelineEvent[];
  readonly attachments: readonly string[]; // Array of URLs — empty for now
}

/** Summary card version of Issue (used in list screens) */
export interface IssueSummary {
  readonly id: UUID;
  readonly title: string;
  readonly status: IssueStatus;
  readonly category: string;
  readonly subcategory: string | null;
  readonly createdAt: ISODateString;
  readonly updatedAt: ISODateString;
  readonly isDuplicate: boolean;
  readonly linkedCount: number;
  readonly description?: string;
  readonly locationLabel?: string;
}

/** Request body for submitting a new issue (both FORM and CHATBOT sources) */
export interface SubmitIssueRequest {
  readonly title: string;
  readonly description: string;
  readonly category: string; // CategoryId
  readonly subcategory: string | null;
  readonly location: IssueLocation;
  readonly attachments: readonly string[]; // Always [] for now — scaffolded for future
  readonly source: IssueSource;
  readonly metadata: {
    readonly appVersion: string;
    readonly platform: 'android' | 'ios' | 'web';
  };
}

export interface SubmitIssueResponse {
  readonly issueId: UUID;
  readonly status: IssueStatus;
  readonly isDuplicate: boolean;
  readonly linkedIssueId: UUID | null;
  readonly message: string;
}

export interface GetIssuesRequest {
  readonly page?: number;
  readonly pageSize?: number;
  readonly status?: IssueStatus;
}

// ---------------------------------------------------------------------------
// Chatbot Types
// ---------------------------------------------------------------------------

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  readonly id: string;
  readonly role: MessageRole;
  readonly content: string;
  readonly timestamp: string;
}

export interface DraftIssue extends Omit<
  SubmitIssueRequest,
  'attachments' | 'source' | 'metadata'
> {
  readonly department?: string | undefined;
  readonly hostel?: string | undefined;
}

/** State of the chatbot session — tracks what the LLM has collected so far */
export interface ChatSessionState {
  readonly category: string | null;
  readonly subcategory: string | null;
  readonly collectedFields: readonly string[];
  readonly pendingFields: readonly string[];
  readonly complete: boolean;
  readonly draftIssue: DraftIssue | null;
}

export interface ChatMessageRequest {
  readonly sessionId: UUID | null; // null for first message — server creates session
  readonly message: string;
  readonly sessionState: ChatSessionState | null;
}

export interface ChatMessageResponse {
  readonly sessionId: UUID;
  readonly botMessage: string;
  readonly sessionState: ChatSessionState;
}

// ---------------------------------------------------------------------------
// Notification Types
// ---------------------------------------------------------------------------

export type NotificationType =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'RESOLVED'
  | 'CLOSED'
  | 'ESCALATED'
  | 'COMMENT'
  | 'DUPLICATE_LINK'
  | 'NOTICE';

export interface AppNotification {
  readonly id: UUID;
  readonly category: 'Grievance' | 'Administrative';
  readonly type: NotificationType;
  readonly status?: string;
  readonly title: string;
  readonly message: string;
  readonly issueId: UUID | null; // Deep link target
  readonly isRead: boolean;
  readonly createdAt: ISODateString;
  readonly timestamp?: string;
  readonly icon?: string;
  readonly badgeVariant?: 'primary' | 'warning' | 'success' | 'neutral';
}

export interface GetNotificationsRequest {
  readonly page?: number;
  readonly pageSize?: number;
  readonly filter?: 'ALL' | 'GRIEVANCES' | 'ADMINISTRATIVE';
}

export interface GetNotificationsResponse extends Paginated<AppNotification> {
  readonly unreadCount: number;
}

export interface UnreadCountResponse {
  readonly unreadCount: number;
}

export interface MarkAsReadResponse {
  readonly id: UUID;
  readonly isRead: boolean;
  readonly readAt: ISODateString;
}

export interface MarkAllReadResponse {
  readonly markedCount: number;
  readonly message: string;
}
