/**
 * Design System — Theme Constants
 *
 * NEHU Issue Report & Feedback App
 * Light theme only. Inspired by Canva mobile app — clean, confident, professional.
 *
 * Color naming convention:
 *   primary   — NEHU Blue (#003DA5) — main brand & interactive elements
 *   accent    — Warm Amber (#F5A623) — highlights, badges, CTAs
 *   neutral   — Greys for backgrounds, borders, text
 *   semantic  — success, warning, error, info
 *
 * Usage:
 *   import { COLORS, TYPOGRAPHY, SPACING, SHADOWS, RADIUS } from '@/constants/theme';
 */

// ---------------------------------------------------------------------------
// Colors
// ---------------------------------------------------------------------------
export const COLORS = {
  // Brand
  primary: '#003DA5', // NEHU Blue — primary actions, links, active states
  primaryLight: '#1A5DC8', // Lighter blue — hover/pressed states
  primarySubtle: '#EBF0FA', // Very light blue — backgrounds, selected chips

  accent: '#F5A623', // Warm Amber — badges, highlights
  accentLight: '#FEF3DC', // Light amber — chip backgrounds

  // Neutrals (8-step scale)
  white: '#FFFFFF',
  gray50: '#F9FAFB', // Page background
  gray100: '#F3F4F6', // Card background, input fill
  gray200: '#E5E7EB', // Borders, dividers
  gray300: '#D1D5DB', // Disabled borders
  gray400: '#9CA3AF', // Placeholder text
  gray500: '#6B7280', // Secondary text
  gray600: '#4B5563', // Body text
  gray700: '#374151', // Subheadings
  gray800: '#1F2937', // Headings
  gray900: '#111827', // Primary text (near-black)

  // Semantic
  success: '#16A34A', // Green — resolved, confirmed
  successLight: '#DCFCE7',
  warning: '#D97706', // Amber — in-progress, pending
  warningLight: '#FEF3C7',
  error: '#DC2626', // Red — critical, error states
  errorLight: '#FEE2E2',
  info: '#0284C7', // Sky blue — info banners
  infoLight: '#E0F2FE',

  // Status colors (maps to IssueStatus)
  statusSubmitted: '#6B7280', // Gray
  statusUnderReview: '#0284C7', // Info blue
  statusAssigned: '#7C3AED', // Purple
  statusInProgress: '#D97706', // Amber
  statusResolved: '#16A34A', // Green
  statusClosed: '#4B5563', // Dark gray
  statusEscalated: '#DC2626', // Red
} as const;

// ---------------------------------------------------------------------------
// Typography
// ---------------------------------------------------------------------------
export const TYPOGRAPHY = {
  // Font family — Inter (loaded via @expo-google-fonts/inter)
  fontFamily: {
    regular: 'Inter_400Regular',
    medium: 'Inter_500Medium',
    semiBold: 'Inter_600SemiBold',
    bold: 'Inter_700Bold',
  },

  // Font sizes (px)
  fontSize: {
    xs: 11,
    sm: 13,
    base: 15,
    md: 17,
    lg: 19,
    xl: 22,
    xxl: 26,
    display: 32,
  },

  // Line heights
  lineHeight: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.7,
  },

  // Letter spacing
  letterSpacing: {
    tight: -0.3,
    normal: 0,
    wide: 0.5,
    caps: 1.2,
  },
} as const;

// ---------------------------------------------------------------------------
// Spacing — 8px grid
// ---------------------------------------------------------------------------
export const SPACING = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 40,
  section: 48,
} as const;

// ---------------------------------------------------------------------------
// Border Radius
// ---------------------------------------------------------------------------
export const RADIUS = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
} as const;

// ---------------------------------------------------------------------------
// Shadows (React Native)
// ---------------------------------------------------------------------------
export const SHADOWS = {
  none: {},
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
} as const;

// ---------------------------------------------------------------------------
// Layout
// ---------------------------------------------------------------------------
export const LAYOUT = {
  screenHorizontalPadding: SPACING.base,
  headerHeight: 56,
  tabBarHeight: 60,
  inputHeight: 48,
  buttonHeight: 48,
  cardBorderRadius: RADIUS.lg,
} as const;
