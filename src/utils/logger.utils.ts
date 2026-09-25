/**
 * Terminal Logger Utility — src/utils/logger.utils.ts
 *
 * Provides formatted, high-visibility console output to the running
 * Metro / Expo terminal process. Allows full visibility of user actions,
 * API requests, mock fallbacks, and chatbot events during phone testing.
 */

type LogCategory =
  | 'AUTH'
  | 'USER_ACTION'
  | 'HTTP_REQ'
  | 'HTTP_RES'
  | 'HTTP_ERR'
  | 'ISSUE_SUBMIT'
  | 'CHATBOT'
  | 'LOCATION'
  | 'STORAGE';

const CATEGORY_EMOJIS: Record<LogCategory, string> = {
  AUTH: '🔐 [AUTH]',
  USER_ACTION: '📱 [USER ACTION]',
  HTTP_REQ: '🌐 [HTTP REQ]',
  HTTP_RES: '✅ [HTTP RES]',
  HTTP_ERR: '❌ [HTTP ERR]',
  ISSUE_SUBMIT: '📝 [ISSUE SUBMIT]',
  CHATBOT: '🤖 [CHATBOT]',
  LOCATION: '📍 [LOCATION]',
  STORAGE: '💾 [STORAGE]',
};

export const logger = {
  log: (category: LogCategory, message: string, data?: unknown) => {
    const timestamp = new Date().toLocaleTimeString();
    const tag = CATEGORY_EMOJIS[category] ?? `[${category}]`;

    if (data !== undefined) {
      console.log(`[${timestamp}] ${tag} ${message}`, JSON.stringify(data, null, 2));
    } else {
      console.log(`[${timestamp}] ${tag} ${message}`);
    }
  },

  warn: (category: LogCategory, message: string, data?: unknown) => {
    const timestamp = new Date().toLocaleTimeString();
    console.warn(`[${timestamp}] ⚠️ [${category}] ${message}`, data ?? '');
  },

  error: (category: LogCategory, message: string, error?: unknown) => {
    const timestamp = new Date().toLocaleTimeString();
    console.error(`[${timestamp}] 🚨 [${category}] ${message}`, error ?? '');
  },
};
