/**
 * Issue Categories & Subcategories
 *
 * Canonical NEHU taxonomy matching Cloud SQL `categories` and `sub_categories` tables.
 * - `id` is the exact database UUID sent in `category_id` / `subcategory_id`.
 * - `label` is the exact database `name` displayed in the UI and sent in `category_name` / `subcategory_name`.
 */

export type CategoryId = string;

export interface Category {
  readonly id: CategoryId;
  readonly label: string;
  readonly targetAdminType: string;
  readonly description: string;
  readonly icon: string;
  readonly color: string;
}

export interface Subcategory {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly parentId: CategoryId;
}

export const CATEGORY_IDS = {
  HOSTEL: '64186f49-bf76-4389-869a-323895980286',
  ACADEMIC: '84c22147-f812-422f-9980-04ca4d8eb17a',
  CAMPUS_FACILITIES: '4656baec-49de-4563-ae62-6c8e5b1fd3b6',
  LIBRARY: '84d9ca84-af7f-4676-869a-fbdc728a8b98',
  SPORTS: '95a4469e-fbc1-4b7b-8886-356dc1738bdf',
} as const;

export const ISSUE_CATEGORIES: readonly Category[] = [
  {
    id: CATEGORY_IDS.HOSTEL,
    label: 'Hostel and Residential',
    targetAdminType: 'WARDEN',
    description: 'Hostel accommodations, mess facilities, residential cleanliness, and security',
    icon: 'home',
    color: '#0284C7',
  },
  {
    id: CATEGORY_IDS.ACADEMIC,
    label: 'Academic and Department',
    targetAdminType: 'HOD',
    description: 'Departmental labs, timetable scheduling, exams, and faculty conduct',
    icon: 'school',
    color: '#16A34A',
  },
  {
    id: CATEGORY_IDS.CAMPUS_FACILITIES,
    label: 'Campus and Facilities (Central Level)',
    targetAdminType: 'ESTATE_OFFICER',
    description: 'Central IT, campus sanitation, canteen, cafeteria, transport, and parking',
    icon: 'build',
    color: '#7C3AED',
  },
  {
    id: CATEGORY_IDS.LIBRARY,
    label: 'Library and Research Facilities',
    targetAdminType: 'LIBRARIAN',
    description: 'Library access, digital resources, book availability, and study environment',
    icon: 'library',
    color: '#D97706',
  },
  {
    id: CATEGORY_IDS.SPORTS,
    label: 'Sports and Gymnasium',
    targetAdminType: 'SPORTS_OFFICER',
    description: 'Sports facilities, gym equipment, timings, and court booking',
    icon: 'fitness',
    color: '#DC2626',
  },
] as const;

export const ISSUE_SUBCATEGORIES: Record<string, readonly Subcategory[]> = {
  [CATEGORY_IDS.HOSTEL]: [
    {
      id: '5b267187-0ec3-4dea-9e07-98ad2430e81a',
      label: 'Mess Food & Hygiene',
      description: 'Issues with food quality, menu, or kitchen cleanliness.',
      parentId: CATEGORY_IDS.HOSTEL,
    },
    {
      id: '0bc346d3-716a-4fac-80a7-ce7d29836fbd',
      label: 'Maintenance & Hostel Wi-Fi',
      description: 'Local router issues, plumbing, or electrical faults (Reported to Warden/Estate).',
      parentId: CATEGORY_IDS.HOSTEL,
    },
    {
      id: '9fdcd1a9-efad-49c9-9552-6f8511548d45',
      label: 'Room Allotment & Cleanliness',
      description: 'Disputes over rooms or irregular sweeping schedules.',
      parentId: CATEGORY_IDS.HOSTEL,
    },
    {
      id: 'ebddeedf-57b5-45cd-8de5-5c31a849cb3d',
      label: 'Safety & Security',
      description: 'Curfews, unauthorized entry, or theft.',
      parentId: CATEGORY_IDS.HOSTEL,
    },
  ],
  [CATEGORY_IDS.ACADEMIC]: [
    {
      id: '255eefd1-3f22-49af-992b-a15d061a3242',
      label: 'Department Labs & Academic Wi-Fi',
      description:
        'Faulty lab equipment, software issues, or department network downtime (Reported to HOD/Lab Admin).',
      parentId: CATEGORY_IDS.ACADEMIC,
    },
    {
      id: 'f50e2f36-590f-44b7-8873-b97768dd80c2',
      label: 'Timetable & Attendance',
      description: 'Class scheduling clashes or discrepancies in the attendance portal.',
      parentId: CATEGORY_IDS.ACADEMIC,
    },
    {
      id: '578f6b1c-1a40-4ac0-bdb2-c016188ba8d8',
      label: 'Exams, Results & Evaluation',
      description: 'Delays in result declaration or issues with admit cards.',
      parentId: CATEGORY_IDS.ACADEMIC,
    },
    {
      id: 'a80492c3-880b-4a4f-83ac-6519f6d78699',
      label: 'Faculty & Staff Conduct',
      description: 'Grievances regarding teaching quality or unprofessional behavior.',
      parentId: CATEGORY_IDS.ACADEMIC,
    },
  ],
  [CATEGORY_IDS.CAMPUS_FACILITIES]: [
    {
      id: '4645ebbb-dbfb-44ce-9c47-44930f63cbee',
      label: 'Central IT & Escalations',
      description:
        'Campus-wide server outages, blocked sites, or unresolved Wi-Fi tickets escalated from departments/hostels.',
      parentId: CATEGORY_IDS.CAMPUS_FACILITIES,
    },
    {
      id: 'f6b32c0e-7fce-4414-81c0-62207dc21beb',
      label: 'Hygiene & Sanitation',
      description: 'Unclean campus washrooms or lack of drinking water facilities.',
      parentId: CATEGORY_IDS.CAMPUS_FACILITIES,
    },
    {
      id: '1fa23ab6-e6cf-4cc8-8062-ed83ad3bab7c',
      label: 'Canteen & Cafeteria',
      description: 'Overcharging or poor food quality at campus food stalls.',
      parentId: CATEGORY_IDS.CAMPUS_FACILITIES,
    },
    {
      id: 'c4486d91-dacc-43e7-8ba5-1275d6078808',
      label: 'Transport & Parking',
      description: 'Bus schedule delays or lack of designated student parking.',
      parentId: CATEGORY_IDS.CAMPUS_FACILITIES,
    },
  ],
  [CATEGORY_IDS.LIBRARY]: [
    {
      id: '53fa3e88-086f-46ed-a87b-5828e3c2691c',
      label: 'Library Wi-Fi & Digital Resources',
      description:
        'Inability to access college portals or local library network drops (Reported to Librarian).',
      parentId: CATEGORY_IDS.LIBRARY,
    },
    {
      id: 'd69f7cfb-9a56-4336-91c7-44770b2c6154',
      label: 'Book Availability & Circulation',
      description: 'Shortage of course textbooks or issues with late fees.',
      parentId: CATEGORY_IDS.LIBRARY,
    },
    {
      id: 'c5369512-4b53-401f-8ca3-7033bca549cf',
      label: 'Reading Room Environment',
      description: 'Broken chairs, non-functional ACs/fans, or noise management.',
      parentId: CATEGORY_IDS.LIBRARY,
    },
  ],
  [CATEGORY_IDS.SPORTS]: [
    {
      id: '2ca4b831-69d0-43fa-8a7f-b7c051caa36c',
      label: 'Equipment Condition',
      description: 'Broken treadmills, torn nets, or lack of basic gym weights.',
      parentId: CATEGORY_IDS.SPORTS,
    },
    {
      id: 'c20c72ff-c3cb-4ee5-8a41-9eaf1de2dd4b',
      label: 'Timings & Accessibility',
      description: 'Unfair restrictions on usage hours or closed facilities.',
      parentId: CATEGORY_IDS.SPORTS,
    },
    {
      id: 'cdb4321c-18f9-4f61-be86-f4294d8998ce',
      label: 'Ground/Court Booking',
      description: 'Conflicts over court reservations or team selections.',
      parentId: CATEGORY_IDS.SPORTS,
    },
  ],
} as const;

const LEGACY_KEY_TO_ID: Record<string, string> = {
  HOSTEL: CATEGORY_IDS.HOSTEL,
  SAFETY: CATEGORY_IDS.HOSTEL,
  ACADEMICS: CATEGORY_IDS.ACADEMIC,
  ACADEMIC: CATEGORY_IDS.ACADEMIC,
  ADMINISTRATION: CATEGORY_IDS.ACADEMIC,
  INFRASTRUCTURE: CATEGORY_IDS.CAMPUS_FACILITIES,
  HYGIENE: CATEGORY_IDS.CAMPUS_FACILITIES,
  IT_SERVICES: CATEGORY_IDS.CAMPUS_FACILITIES,
  SANITATION: CATEGORY_IDS.CAMPUS_FACILITIES,
  TRANSPORT: CATEGORY_IDS.CAMPUS_FACILITIES,
  OTHER: CATEGORY_IDS.CAMPUS_FACILITIES,
  LIBRARY: CATEGORY_IDS.LIBRARY,
  SPORTS: CATEGORY_IDS.SPORTS,
};

/**
 * Helper: get category object by UUID, exact name, or legacy enum key
 */
export function getCategoryById(id: string): Category | undefined {
  if (!id) return undefined;
  const trimmed = id.trim();
  const direct = ISSUE_CATEGORIES.find(
    (c) => c.id === trimmed || c.label.toLowerCase() === trimmed.toLowerCase(),
  );
  if (direct) return direct;

  const mappedId = LEGACY_KEY_TO_ID[trimmed.toUpperCase()];
  if (mappedId) {
    return ISSUE_CATEGORIES.find((c) => c.id === mappedId);
  }
  return undefined;
}

/**
 * Helper: get subcategories for a given category
 */
export function getSubcategories(categoryId: CategoryId): readonly Subcategory[] {
  const resolved = getCategoryById(categoryId)?.id ?? categoryId;
  return ISSUE_SUBCATEGORIES[resolved] ?? [];
}

/**
 * Helper: get a single subcategory object by UUID or name
 */
export function getSubcategoryById(id: string): Subcategory | undefined {
  if (!id) return undefined;
  const trimmed = id.trim();
  for (const list of Object.values(ISSUE_SUBCATEGORIES)) {
    const found = list.find(
      (s) => s.id === trimmed || s.label.toLowerCase() === trimmed.toLowerCase(),
    );
    if (found) return found;
  }
  return undefined;
}
