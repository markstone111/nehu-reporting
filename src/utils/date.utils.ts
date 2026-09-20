/**
 * Date Utilities
 *
 * Lightweight date formatting helpers for the app UI.
 * Uses the native Intl.DateTimeFormat — no external libraries needed.
 *
 * All functions accept ISO 8601 date strings (as returned by the backend)
 * or Date objects.
 */

type DateInput = string | Date;

/**
 * Parse an ISO string or Date to a JS Date object.
 */
function toDate(input: DateInput): Date {
  return typeof input === 'string' ? new Date(input) : input;
}

/**
 * Format a date as "21 Sep 2026" (short, unambiguous).
 * Used on issue cards and timeline.
 */
export function formatShortDate(input: DateInput): string {
  return toDate(input).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a date as "21 Sep 2026, 3:08 AM" (date + time).
 * Used on issue detail timeline events.
 */
export function formatDateTime(input: DateInput): string {
  return toDate(input).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

/**
 * Returns a human-readable relative time string.
 * e.g. "2 hours ago", "just now", "3 days ago"
 * Used on notification list and issue cards.
 */
export function timeAgo(input: DateInput): string {
  const now = Date.now();
  const then = toDate(input).getTime();
  const diffMs = now - then;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return 'just now';
  if (diffSec < 3600) {
    const m = Math.floor(diffSec / 60);
    return `${m} ${m === 1 ? 'minute' : 'minutes'} ago`;
  }
  if (diffSec < 86400) {
    const h = Math.floor(diffSec / 3600);
    return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  }
  if (diffSec < 86400 * 7) {
    const d = Math.floor(diffSec / 86400);
    return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  }

  // Fall back to short date for older events
  return formatShortDate(input);
}

/**
 * Check if a date is today.
 */
export function isToday(input: DateInput): boolean {
  const d = toDate(input);
  const now = new Date();
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  );
}
