/**
 * Location Service — src/services/location.service.ts
 *
 * Canonical NEHU Shillong campus locations mapped per issue category,
 * fuzzy/similar location search suggestions, strict location validation,
 * and GPS coordinate acquisition via expo-location.
 */

import * as Location from 'expo-location';
import { CATEGORY_IDS } from '@/constants/categories';
import type { IssueLocation } from '@/types/api.types';

/**
 * Official NEHU Shillong Campus locations grouped by Issue Category.
 */
export const NEHU_LOCATIONS_BY_CATEGORY: Record<string, readonly string[]> = {
  [CATEGORY_IDS.HOSTEL]: [
    'Hostel No. 1: Lasubon Halls of Residence (PG Women)',
    'Hostel No. 2: Nohsngithiang Halls of Residence (UG Women)',
    'Hostel No. 3: Miktoksi Halls of Residence (UG Women)',
    'Hostel No. 6: Syntuksiar Halls of Residence (PG Women)',
    'Hostel No. 8: Saramati Halls of Residence (Research Scholars Women)',
    'Hostel No. 9: Thadlaskein Halls of Residence (PG / Research Men)',
    'Hostel No. 11: Sensiar Halls of Residence & Annexe (PG Women)',
    'Hostel No. 15: Kynrem Halls of Residence (PG Men)',
    'Hostel No. 18: Kupli Halls of Residence (Men)',
    'Hostel No. 20: Mawthadraishan Halls of Residence (UG Men)',
    'Hostel No. 23: Symper Halls of Residence (UG Men)',
    'Hostel No. 24: Golden Jubilee Girls Halls of Residence (UG/PG Women)',
    'Balgito Hall of Residence (Research Scholars Women)',
    'Pahsyntiew Hall of Residence (Women)',
    'Arbela Hall of Residence (Women)',
    'Chhinlung Hall of Residence (Women)',
    'Japfu Hall of Residence (Women)',
    'Persara Hall of Residence (Women)',
    'Renggira Hall of Residence (Women)',
    'Sohpetbneng Hall of Residence (Women)',
    'Weinia Hall of Residence (Women)',
    'Kyllang Halls of Residence (UG Men)',
    'Umiam Hall of Residence (Men)',
    'Umngot Hall of Residence (Men)',
    'International Hostel (Men & Women Wings, Gate No. 2)',
  ],
  [CATEGORY_IDS.ACADEMIC]: [
    // School of Economics, Management and Information Sciences
    'Department of Commerce (School of Economics, Management & Info Sciences)',
    'Department of Economics (School of Economics, Management & Info Sciences)',
    'Department of Journalism and Mass Communication (School of Economics, Management & Info Sciences)',
    'Department of Library and Information Science (School of Economics, Management & Info Sciences)',
    'Department of Tourism and Hotel Management (School of Economics, Management & Info Sciences)',
    // School of Education
    'Department of Education (School of Education)',
    'Department of Adult and Continuing Education (School of Education)',
    'Centre for Distance Education (School of Education)',
    'Centre for Science Education (School of Education)',
    'Centre for Pre-Service Teacher Education - PMMMNMTT (School of Education)',
    // School of Human & Environmental Sciences
    'Department of Anthropology (School of Human & Environmental Sciences)',
    'Department of Environmental Studies (School of Human & Environmental Sciences)',
    'Department of Geography (School of Human & Environmental Sciences)',
    'Department of Geology (School of Human & Environmental Sciences)',
    // School of Humanities
    'Department of English (School of Humanities)',
    'Department of Hindi (School of Humanities)',
    'Department of Khasi (School of Humanities)',
    'Department of Linguistics (School of Humanities)',
    'Department of Philosophy (School of Humanities)',
    // School of Life Sciences
    'Department of Biochemistry (School of Life Sciences)',
    'Department of Biotechnology and Bioinformatics (School of Life Sciences)',
    'Department of Botany (School of Life Sciences)',
    'Department of Zoology (School of Life Sciences)',
    // School of Physical Sciences
    'Department of Chemistry (School of Physical Sciences)',
    'Department of Mathematics (School of Physical Sciences)',
    'Department of Physics (School of Physical Sciences)',
    'Department of Statistics (School of Physical Sciences)',
    // School of Social Sciences
    'Department of Cultural and Creative Studies (School of Social Sciences)',
    'Department of History (School of Social Sciences)',
    'Department of Law (School of Social Sciences)',
    'Department of Political Science (School of Social Sciences)',
    'Department of Sociology (School of Social Sciences)',
    // School of Technology (SoT / Engineering Block)
    'Department of Architecture (School of Technology)',
    'Department of Basic Sciences and Social Sciences (School of Technology)',
    'Department of Biomedical Engineering (School of Technology)',
    'Department of Computer Applications (School of Technology)',
    'Department of Electronics and Communication Engineering (School of Technology)',
    'Department of Energy Engineering (School of Technology)',
    'Department of Information Technology (School of Technology)',
    'Department of Nanotechnology (School of Technology)',
  ],
  [CATEGORY_IDS.CAMPUS_FACILITIES]: [
    'Administrative Building (Admin Block, Umshing)',
    "Dean of Students' Welfare (DSW) Office",
    'Examination & Finance Wings (Admin Block)',
    'Computer Centre (Shillong)',
    'Health Centre (Umshing Main Campus)',
    'Health Centre (Bijni Complex)',
    'U Kiang Nangbah Guest House & 200-Seater Auditorium (Gate No. 2)',
    'U Tirot Sing Syiem Guest House (New Guest House)',
    'Students Amenity Centre (SAC)',
    'Central Canteen & Cafeteria',
    'Departmental Canteens / Cafeterias',
    'Community Hall',
    'Campus Main Gate No. 1 (Mawkynroh)',
    'Campus Gate No. 2 (Umshing)',
    'University Bus Stops & Student Parking Zones',
  ],
  [CATEGORY_IDS.LIBRARY]: [
    'Central Library — Main Reading Rooms',
    'Central Library — Cyber Room',
    'Central Library — ETD (Electronic Theses & Dissertations) Lab',
    'Central Library — Documentation & Reprography Section',
    'Sophisticated Analytical Instrument Facility (SAIF-NEHU)',
    'High-Performance Computing Cluster (PARAM Sheersh / SULEKOR, Computer Centre)',
  ],
  [CATEGORY_IDS.SPORTS]: [
    'Indoor Stadium (Badminton, Table Tennis, Chess)',
    'University Gymnasium (Fitness Center)',
    'Football Ground',
    'Multi-Purpose Ground',
    'Basketball Courts',
  ],
} as const;

export const ALL_NEHU_LOCATIONS: readonly string[] = Array.from(
  new Set(Object.values(NEHU_LOCATIONS_BY_CATEGORY).flat()),
);

/** Backward-compatible export of prominent NEHU campus landmarks */
export const CAMPUS_LANDMARKS: readonly string[] = ALL_NEHU_LOCATIONS.slice(0, 16);

/**
 * Returns the valid official locations for the given category, or all campus locations if none is selected.
 */
export function getLocationsForCategory(categoryId?: string | null): readonly string[] {
  if (categoryId && NEHU_LOCATIONS_BY_CATEGORY[categoryId]) {
    return NEHU_LOCATIONS_BY_CATEGORY[categoryId];
  }
  return ALL_NEHU_LOCATIONS;
}

const LOCATION_ABBREVIATIONS: Record<string, string> = {
  sot: 'school of technology',
  it: 'information technology',
  ece: 'electronics and communication',
  bme: 'biomedical engineering',
  sac: 'students amenity centre',
  dsw: 'dean of students',
  saif: 'sophisticated analytical instrument',
  etd: 'electronic theses',
  ug: 'ug',
  pg: 'pg',
  gym: 'gymnasium',
};

/**
 * Search and rank similar NEHU locations for autocomplete as the user types.
 */
export function searchMatchingLocations(
  query: string,
  categoryId?: string | null,
  limit = 8,
): readonly string[] {
  const pool = getLocationsForCategory(categoryId);
  const raw = query.trim().toLowerCase();
  if (!raw) {
    return pool.slice(0, limit);
  }

  const expandedTokens = raw
    .split(/\s+/)
    .filter(Boolean)
    .map((t) => LOCATION_ABBREVIATIONS[t] ?? t);

  const scored: { label: string; score: number }[] = [];

  for (const label of pool) {
    const lower = label.toLowerCase();
    let score = 0;

    if (lower === raw) {
      score = 100;
    } else if (lower.startsWith(raw)) {
      score = 80;
    } else if (lower.includes(raw)) {
      score = 60;
    } else {
      const matchedTokens = expandedTokens.filter((tok) => lower.includes(tok));
      if (matchedTokens.length === expandedTokens.length) {
        score = 45;
      } else if (matchedTokens.length > 0) {
        score = 20 * (matchedTokens.length / expandedTokens.length);
      }
    }

    if (score > 0) {
      scored.push({ label, score });
    }
  }

  scored.sort((a, b) => b.score - a.score || a.label.localeCompare(b.label));
  return scored.slice(0, limit).map((s) => s.label);
}

/**
 * Strictly validates that the entered location matches an official NEHU location
 * (scoped to the selected category when provided).
 */
export function findCanonicalLocation(
  input: string,
  categoryId?: string | null,
): string | null {
  const clean = input.trim().toLowerCase();
  if (!clean) return null;
  const pool = getLocationsForCategory(categoryId);
  const match = pool.find((loc) => loc.toLowerCase() === clean);
  return match ?? null;
}

export function isValidNehuLocation(input: string, categoryId?: string | null): boolean {
  return findCanonicalLocation(input, categoryId) !== null;
}

/** Default fallback location if GPS permission is denied or coordinates fail */
export const DEFAULT_CAMPUS_LOCATION: IssueLocation = {
  label: 'Administrative Building (Admin Block, Umshing)',
  latitude: 25.6054,
  longitude: 91.8988,
  autoFetched: false,
};

export interface FetchLocationResult {
  readonly location: IssueLocation;
  readonly error?: string;
  readonly isPermissionGranted: boolean;
}

/**
 * Request foreground location permissions from the operating system.
 */
export async function requestLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  } catch (error) {
    console.warn('[LocationService] Permission request failed:', error);
    return false;
  }
}

/**
 * Check if location permissions are currently granted.
 */
export async function hasLocationPermissions(): Promise<boolean> {
  try {
    const { status } = await Location.getForegroundPermissionsAsync();
    return status === Location.PermissionStatus.GRANTED;
  } catch (error) {
    console.warn('[LocationService] Permission check failed:', error);
    return false;
  }
}

/**
 * Attempt to acquire GPS coordinates for metadata attachment.
 */
export async function getCurrentCampusLocation(): Promise<FetchLocationResult> {
  try {
    const isGranted = await requestLocationPermissions();

    if (!isGranted) {
      return {
        location: {
          label: '',
          latitude: null,
          longitude: null,
          autoFetched: false,
        },
        error: 'Location permission was denied. Please select your campus location from the list.',
        isPermissionGranted: false,
      };
    }

    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;

    return {
      location: {
        label: '',
        latitude,
        longitude,
        autoFetched: true,
      },
      isPermissionGranted: true,
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unable to acquire GPS coordinates.';
    console.warn('[LocationService] getCurrentCampusLocation failed:', message);

    return {
      location: {
        label: '',
        latitude: null,
        longitude: null,
        autoFetched: false,
      },
      error: 'GPS acquisition timed out. Please select your campus location from the list.',
      isPermissionGranted: false,
    };
  }
}
