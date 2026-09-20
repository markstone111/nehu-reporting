/**
 * Issue Categories & Subcategories
 *
 * This is the canonical list of categories used across the app.
 * - The `id` field is what gets sent to the backend in the API payload.
 * - The `label` is what the user sees.
 * - The `icon` references a material/community icon name for the UI picker.
 *
 * To add a new category in the future:
 *   1. Add an entry to ISSUE_CATEGORIES.
 *   2. Add its subcategories to ISSUE_SUBCATEGORIES keyed by the category id.
 *   3. Add a matching status color in theme.ts if needed.
 *   The backend should also update its enum — coordinate the id strings.
 */

export type CategoryId =
  | 'INFRASTRUCTURE'
  | 'HOSTEL'
  | 'ACADEMICS'
  | 'HYGIENE'
  | 'SAFETY'
  | 'IT_SERVICES'
  | 'ADMINISTRATION'
  | 'OTHER';

export interface Category {
  readonly id: CategoryId;
  readonly label: string;
  readonly description: string;
  readonly icon: string; // react-native-vector-icons / expo icon name
  readonly color: string;
}

export interface Subcategory {
  readonly id: string;
  readonly label: string;
  readonly parentId: CategoryId;
}

export const ISSUE_CATEGORIES: readonly Category[] = [
  {
    id: 'INFRASTRUCTURE',
    label: 'Infrastructure',
    description: 'Buildings, roads, electricity, water supply',
    icon: 'build',
    color: '#7C3AED',
  },
  {
    id: 'HOSTEL',
    label: 'Hostel',
    description: 'Hostel rooms, facilities, mess, warden issues',
    icon: 'home',
    color: '#0284C7',
  },
  {
    id: 'ACADEMICS',
    label: 'Academics',
    description: 'Classes, faculty, exam, timetable issues',
    icon: 'school',
    color: '#16A34A',
  },
  {
    id: 'HYGIENE',
    label: 'Hygiene & Sanitation',
    description: 'Cleanliness, washrooms, waste disposal',
    icon: 'cleaning-services',
    color: '#0891B2',
  },
  {
    id: 'SAFETY',
    label: 'Safety & Ragging',
    description: 'Ragging, harassment, security concerns',
    icon: 'security',
    color: '#DC2626',
  },
  {
    id: 'IT_SERVICES',
    label: 'IT & Network',
    description: 'WiFi, lab computers, internet, portal issues',
    icon: 'wifi',
    color: '#D97706',
  },
  {
    id: 'ADMINISTRATION',
    label: 'Administration',
    description: 'Fee, certificates, ID cards, office issues',
    icon: 'admin-panel-settings',
    color: '#475569',
  },
  {
    id: 'OTHER',
    label: 'Other',
    description: 'Any issue that does not fit above categories',
    icon: 'help-outline',
    color: '#6B7280',
  },
] as const;

export const ISSUE_SUBCATEGORIES: Record<CategoryId, readonly Subcategory[]> = {
  INFRASTRUCTURE: [
    { id: 'ELECTRICITY', label: 'Electricity / Power Cut', parentId: 'INFRASTRUCTURE' },
    { id: 'WATER', label: 'Water Supply', parentId: 'INFRASTRUCTURE' },
    { id: 'BUILDING', label: 'Building / Structure', parentId: 'INFRASTRUCTURE' },
    { id: 'ROAD', label: 'Roads / Pathways', parentId: 'INFRASTRUCTURE' },
    { id: 'FURNITURE', label: 'Furniture / Equipment', parentId: 'INFRASTRUCTURE' },
  ],
  HOSTEL: [
    { id: 'HOSTEL_ROOM', label: 'Room Condition', parentId: 'HOSTEL' },
    { id: 'HOSTEL_MESS', label: 'Mess / Food Quality', parentId: 'HOSTEL' },
    { id: 'HOSTEL_WARDEN', label: 'Warden / Staff Issue', parentId: 'HOSTEL' },
    { id: 'HOSTEL_WATER', label: 'Hostel Water Supply', parentId: 'HOSTEL' },
    { id: 'HOSTEL_ELECTRICITY', label: 'Hostel Electricity', parentId: 'HOSTEL' },
  ],
  ACADEMICS: [
    { id: 'ACADEMICS_CLASS', label: 'Classes Not Held', parentId: 'ACADEMICS' },
    { id: 'ACADEMICS_FACULTY', label: 'Faculty Behaviour', parentId: 'ACADEMICS' },
    { id: 'ACADEMICS_EXAM', label: 'Exam / Results', parentId: 'ACADEMICS' },
    { id: 'ACADEMICS_TIMETABLE', label: 'Timetable Issue', parentId: 'ACADEMICS' },
    { id: 'ACADEMICS_LIBRARY', label: 'Library', parentId: 'ACADEMICS' },
  ],
  HYGIENE: [
    { id: 'HYGIENE_WASHROOM', label: 'Washrooms', parentId: 'HYGIENE' },
    { id: 'HYGIENE_WASTE', label: 'Waste Disposal', parentId: 'HYGIENE' },
    { id: 'HYGIENE_CAMPUS', label: 'Campus Cleanliness', parentId: 'HYGIENE' },
  ],
  SAFETY: [
    { id: 'SAFETY_RAGGING', label: 'Ragging', parentId: 'SAFETY' },
    { id: 'SAFETY_HARASSMENT', label: 'Harassment', parentId: 'SAFETY' },
    { id: 'SAFETY_SECURITY', label: 'Security Concern', parentId: 'SAFETY' },
    { id: 'SAFETY_ACCIDENT', label: 'Accident / Injury', parentId: 'SAFETY' },
  ],
  IT_SERVICES: [
    { id: 'IT_WIFI', label: 'WiFi / Internet', parentId: 'IT_SERVICES' },
    { id: 'IT_LAB', label: 'Computer Lab', parentId: 'IT_SERVICES' },
    { id: 'IT_PORTAL', label: 'Student Portal', parentId: 'IT_SERVICES' },
    { id: 'IT_PRINTER', label: 'Printer / Scanner', parentId: 'IT_SERVICES' },
  ],
  ADMINISTRATION: [
    { id: 'ADMIN_FEE', label: 'Fee / Scholarship', parentId: 'ADMINISTRATION' },
    { id: 'ADMIN_CERTIFICATE', label: 'Certificates / Documents', parentId: 'ADMINISTRATION' },
    { id: 'ADMIN_ID', label: 'ID Card', parentId: 'ADMINISTRATION' },
    { id: 'ADMIN_STAFF', label: 'Admin Staff Behaviour', parentId: 'ADMINISTRATION' },
  ],
  OTHER: [{ id: 'OTHER_GENERAL', label: 'General Issue', parentId: 'OTHER' }],
} as const;

/**
 * Helper: get category object by id
 */
export function getCategoryById(id: string): Category | undefined {
  return ISSUE_CATEGORIES.find((c) => c.id === id);
}

/**
 * Helper: get subcategories for a given category
 */
export function getSubcategories(categoryId: CategoryId): readonly Subcategory[] {
  return ISSUE_SUBCATEGORIES[categoryId] ?? [];
}
