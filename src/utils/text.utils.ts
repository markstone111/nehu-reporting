/**
 * Text Utilities
 *
 * String manipulation helpers used across forms, validation, and the chatbot.
 * All functions are pure (no side effects) and unit-testable.
 */

// ---------------------------------------------------------------------------
// Word counting
// ---------------------------------------------------------------------------

/**
 * Count the number of words in a string.
 * Handles multiple spaces, newlines, and leading/trailing whitespace.
 *
 * @example
 *   countWords("wifi not working in hostel") → 5
 *   countWords("  multiple   spaces  ") → 2
 *   countWords("") → 0
 */
export function countWords(text: string): number {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).length;
}

/**
 * Returns a formatted word count string for display in form inputs.
 * @example
 *   wordCountLabel(45, 300) → "45 / 300 words"
 */
export function wordCountLabel(current: number, max: number): string {
  return `${current} / ${max} words`;
}

// ---------------------------------------------------------------------------
// Text truncation
// ---------------------------------------------------------------------------

/**
 * Truncate text to a maximum number of characters, appending "…" if truncated.
 * Useful for issue card titles and notification bodies.
 *
 * @example
 *   truncate("The WiFi is not working in the hostel block A", 30) → "The WiFi is not working in the…"
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 1).trimEnd() + '…';
}

// ---------------------------------------------------------------------------
// Sanitization
// ---------------------------------------------------------------------------

/**
 * Remove leading/trailing whitespace and collapse multiple internal spaces
 * into a single space. Use before sending any text to the API.
 *
 * @example
 *   sanitizeText("  wifi  not working   ") → "wifi not working"
 */
export function sanitizeText(text: string): string {
  return text.trim().replace(/\s+/g, ' ');
}

/**
 * Capitalize the first letter of a string.
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ---------------------------------------------------------------------------
// Formatting
// ---------------------------------------------------------------------------

/**
 * Convert a SCREAMING_SNAKE_CASE status string to a human-readable label.
 * @example
 *   statusToLabel("UNDER_REVIEW") → "Under Review"
 *   statusToLabel("IN_PROGRESS") → "In Progress"
 */
export function statusToLabel(status: string): string {
  return status
    .split('_')
    .map((word) => capitalize(word.toLowerCase()))
    .join(' ');
}

/**
 * Convert a CategoryId like "IT_SERVICES" to "IT Services"
 */
export function categoryToLabel(categoryId: string): string {
  return categoryId
    .split('_')
    .map((word) => (word.length <= 2 ? word.toUpperCase() : capitalize(word.toLowerCase())))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Validation helpers (text-specific)
// ---------------------------------------------------------------------------

/**
 * Check if a string is empty or only whitespace.
 */
export function isBlank(text: string): boolean {
  return text.trim().length === 0;
}

/**
 * Validate an email address format.
 * Basic RFC5322 simplified regex — sufficient for our use case.
 */
export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim());
}

/**
 * Check if a URL string is a valid HTTP/HTTPS URL.
 * Used to validate the base API URL in dev settings.
 */
export function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
