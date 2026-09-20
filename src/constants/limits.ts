/**
 * Payload Limits & Validation Constants
 *
 * These are enforced client-side before any API call.
 * The backend MUST also enforce these server-side — treat these as the
 * single source of truth for the mobile app.
 *
 * If the backend changes a limit, update this file and propagate to all
 * form validators that reference LIMITS.
 */
export const LIMITS = {
  // Issue report fields
  ISSUE_TITLE_MIN_CHARS: 5,
  ISSUE_TITLE_MAX_CHARS: 100,

  ISSUE_DESCRIPTION_MIN_WORDS: 5,
  ISSUE_DESCRIPTION_MAX_WORDS: 300,
  ISSUE_DESCRIPTION_MAX_CHARS: 2000,

  ISSUE_LOCATION_LABEL_MAX_CHARS: 200,

  // Attachments — scaffolded for future use (not active yet)
  ATTACHMENT_MAX_COUNT: 3,
  ATTACHMENT_MAX_SIZE_BYTES: 5 * 1024 * 1024, // 5 MB per file
  ATTACHMENT_COMPRESSED_SIZE_BYTES: 1 * 1024 * 1024, // 1 MB after compression

  // Chatbot
  CHATBOT_MESSAGE_MIN_CHARS: 1,
  CHATBOT_MESSAGE_MAX_CHARS: 500,
  CHATBOT_SESSION_MAX_TURNS: 30, // Safety: end session after 30 bot turns

  // Auth
  NAME_MIN_CHARS: 2,
  NAME_MAX_CHARS: 80,
  PASSWORD_MIN_CHARS: 8,
  PASSWORD_MAX_CHARS: 128,

  // Token refresh
  FCM_TOKEN_REFRESH_INTERVAL_MS: 24 * 60 * 60 * 1000, // 24h
  ACCESS_TOKEN_REFRESH_BUFFER_MS: 5 * 60 * 1000, // refresh 5min before expiry
} as const;

/**
 * API Timeouts (milliseconds)
 */
export const API_TIMEOUTS = {
  DEFAULT: 15_000, // 15s — standard requests
  UPLOAD: 60_000, // 60s — file uploads (future)
  CHATBOT: 30_000, // 30s — LLM responses can be slower
} as const;
