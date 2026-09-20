/**
 * Validation Utilities
 *
 * Form-level validation helpers that combine limits from @/constants/limits
 * with text utilities to produce user-facing error messages.
 *
 * Each validator returns:
 *   null   → field is valid
 *   string → error message to display under the input
 *
 * Usage in forms:
 *   const error = validateDescription(text);
 *   if (error) showFieldError(error);
 */

import { LIMITS } from '@/constants/limits';
import { countWords, isBlank, isValidEmail, isValidUrl, sanitizeText } from '@/utils/text.utils';

// ---------------------------------------------------------------------------
// Auth validators
// ---------------------------------------------------------------------------

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (isBlank(trimmed)) return 'Name is required.';
  if (trimmed.length < LIMITS.NAME_MIN_CHARS)
    return `Name must be at least ${LIMITS.NAME_MIN_CHARS} characters.`;
  if (trimmed.length > LIMITS.NAME_MAX_CHARS)
    return `Name cannot exceed ${LIMITS.NAME_MAX_CHARS} characters.`;
  if (!/^[a-zA-Z\s'-]+$/.test(trimmed))
    return 'Name can only contain letters, spaces, hyphens, and apostrophes.';
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (isBlank(trimmed)) return 'Email address is required.';
  if (!isValidEmail(trimmed)) return 'Please enter a valid email address.';
  return null;
}

export function validatePassword(password: string): string | null {
  if (isBlank(password)) return 'Password is required.';
  if (password.length < LIMITS.PASSWORD_MIN_CHARS)
    return `Password must be at least ${LIMITS.PASSWORD_MIN_CHARS} characters.`;
  if (password.length > LIMITS.PASSWORD_MAX_CHARS) return 'Password is too long.';
  return null;
}

// ---------------------------------------------------------------------------
// Issue form validators
// ---------------------------------------------------------------------------

export function validateIssueTitle(title: string): string | null {
  const trimmed = title.trim();
  if (isBlank(trimmed)) return 'Issue title is required.';
  if (trimmed.length < LIMITS.ISSUE_TITLE_MIN_CHARS)
    return `Title must be at least ${LIMITS.ISSUE_TITLE_MIN_CHARS} characters.`;
  if (trimmed.length > LIMITS.ISSUE_TITLE_MAX_CHARS)
    return `Title cannot exceed ${LIMITS.ISSUE_TITLE_MAX_CHARS} characters.`;
  return null;
}

export function validateIssueDescription(description: string): string | null {
  const trimmed = sanitizeText(description);
  if (isBlank(trimmed)) return 'Please describe the issue.';

  const wordCount = countWords(trimmed);
  if (wordCount < LIMITS.ISSUE_DESCRIPTION_MIN_WORDS)
    return `Description must be at least ${LIMITS.ISSUE_DESCRIPTION_MIN_WORDS} words.`;
  if (wordCount > LIMITS.ISSUE_DESCRIPTION_MAX_WORDS)
    return `Description cannot exceed ${LIMITS.ISSUE_DESCRIPTION_MAX_WORDS} words (currently ${wordCount}).`;
  if (trimmed.length > LIMITS.ISSUE_DESCRIPTION_MAX_CHARS)
    return `Description cannot exceed ${LIMITS.ISSUE_DESCRIPTION_MAX_CHARS} characters.`;
  return null;
}

export function validateIssueCategory(category: string | null): string | null {
  if (!category) return 'Please select a category.';
  return null;
}

export function validateIssueLocation(locationLabel: string): string | null {
  if (isBlank(locationLabel)) return 'Location is required.';
  if (locationLabel.length > LIMITS.ISSUE_LOCATION_LABEL_MAX_CHARS)
    return `Location cannot exceed ${LIMITS.ISSUE_LOCATION_LABEL_MAX_CHARS} characters.`;
  return null;
}

// ---------------------------------------------------------------------------
// Chatbot validator
// ---------------------------------------------------------------------------

export function validateChatMessage(message: string): string | null {
  const trimmed = message.trim();
  if (isBlank(trimmed)) return 'Please type a message.';
  if (trimmed.length > LIMITS.CHATBOT_MESSAGE_MAX_CHARS)
    return `Message cannot exceed ${LIMITS.CHATBOT_MESSAGE_MAX_CHARS} characters.`;
  return null;
}

// ---------------------------------------------------------------------------
// Dev settings validator
// ---------------------------------------------------------------------------

export function validateApiUrl(url: string): string | null {
  if (isBlank(url)) return 'API URL cannot be empty.';
  if (!isValidUrl(url)) return 'Must be a valid http:// or https:// URL.';
  return null;
}
