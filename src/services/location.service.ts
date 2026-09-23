/**
 * Location Service — src/services/location.service.ts
 *
 * Provides GPS coordinate acquisition and reverse geocoding via expo-location.
 * Tailored for North-Eastern Hill University (NEHU) Shillong campus coordinates (~25.60° N, 91.90° E).
 */

import * as Location from 'expo-location';
import type { IssueLocation } from '@/types/api.types';

/**
 * Pre-defined prominent NEHU campus landmarks for quick student selection.
 */
export const CAMPUS_LANDMARKS: readonly string[] = [
  'Central Library, Reference Hall',
  'School of Technology (Dept of IT / ECE / BME)',
  'Science Complex (Physics & Chemistry Depts)',
  'Administration Block (VC & Registrar Office)',
  'Multi-Purpose Convention Hall',
  'Boys Hostel Block 1',
  'Boys Hostel Block 2',
  'Boys Hostel Block 3',
  'Boys Hostel Block 4',
  'Girls Hostel Block 1',
  'Girls Hostel Block 2',
  'Girls Hostel Block 3',
  'NEHU Health Centre',
  'Student Activity Centre (SAC)',
  'Campus Main Gate 1 (Mawkynroh)',
  'Campus Gate 2 (Umshing)',
] as const;

/** Default fallback location if GPS permission is denied or coordinates fail */
export const DEFAULT_CAMPUS_LOCATION: IssueLocation = {
  label: 'NEHU Campus, Shillong',
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
 * Attempt to acquire GPS coordinates and reverse geocode a human-readable address.
 * Falls back gracefully to default NEHU coordinates if GPS is unavailable.
 */
export async function getCurrentCampusLocation(): Promise<FetchLocationResult> {
  try {
    const isGranted = await requestLocationPermissions();

    if (!isGranted) {
      return {
        location: {
          label: 'NEHU Campus, Shillong',
          latitude: null,
          longitude: null,
          autoFetched: false,
        },
        error: 'Location permission was denied. Please enter campus location manually.',
        isPermissionGranted: false,
      };
    }

    // Get current position with balanced battery accuracy
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = position.coords;

    // Reverse geocode
    let formattedLabel = 'NEHU Campus, Shillong';

    try {
      const reverseList = await Location.reverseGeocodeAsync({ latitude, longitude });

      if (reverseList && reverseList.length > 0) {
        const place = reverseList[0];
        const parts: string[] = [];

        if (place.name && place.name !== place.street) {
          parts.push(place.name);
        }
        if (place.street) {
          parts.push(place.street);
        }
        if (place.district || place.subregion) {
          parts.push((place.district ?? place.subregion)!);
        }
        if (place.city) {
          parts.push(place.city);
        }

        if (parts.length > 0) {
          formattedLabel = parts.join(', ');
        }
      }
    } catch (geoError) {
      console.warn('[LocationService] Reverse geocode failed, using lat/lng:', geoError);
      formattedLabel = `GPS (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    }

    return {
      location: {
        label: formattedLabel,
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
      location: DEFAULT_CAMPUS_LOCATION,
      error: 'GPS acquisition timed out. Please enter your building or landmark manually.',
      isPermissionGranted: false,
    };
  }
}
