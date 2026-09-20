/**
 * Image Service
 *
 * Handles picking, capturing, compressing, and Base64-encoding images
 * for the ID card verification and general attachments.
 */

import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

export interface ProcessedImage {
  readonly uri: string;
  readonly base64: string; // Full data URL or raw base64 string
  readonly width: number;
  readonly height: number;
  readonly sizeKb: number;
}

export interface ImagePickResult {
  readonly canceled: boolean;
  readonly image?: ProcessedImage;
  readonly error?: string;
}

/**
 * Compresses an image at `uri` to max width 1200px and JPEG quality 0.70.
 * Returns the processed URI and Base64 string.
 */
export async function compressAndEncodeImage(uri: string): Promise<ProcessedImage> {
  const result = await ImageManipulator.manipulateAsync(uri, [{ resize: { width: 1200 } }], {
    compress: 0.7,
    format: ImageManipulator.SaveFormat.JPEG,
    base64: true,
  });

  const base64Str = result.base64 ?? '';
  // Base64 byte length ≈ length * 3/4
  const sizeKb = Math.round((base64Str.length * 0.75) / 1024);

  return {
    uri: result.uri,
    base64: `data:image/jpeg;base64,${base64Str}`,
    width: result.width,
    height: result.height,
    sizeKb,
  };
}

/**
 * Launch the photo library to pick an ID card image.
 */
export async function pickIdCardFromGallery(): Promise<ImagePickResult> {
  try {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      return {
        canceled: true,
        error: 'Permission to access photo gallery was denied.',
      };
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.85,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { canceled: true };
    }

    const asset = result.assets[0];
    if (!asset) return { canceled: true };

    const processed = await compressAndEncodeImage(asset.uri);
    return {
      canceled: false,
      image: processed,
    };
  } catch (err) {
    return {
      canceled: true,
      error: err instanceof Error ? err.message : 'Failed to pick image.',
    };
  }
}

/**
 * Launch the camera to take a photo of an ID card.
 */
export async function takeIdCardWithCamera(): Promise<ImagePickResult> {
  try {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== ImagePicker.PermissionStatus.GRANTED) {
      return {
        canceled: true,
        error: 'Permission to access camera was denied.',
      };
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [16, 10],
      quality: 0.85,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { canceled: true };
    }

    const asset = result.assets[0];
    if (!asset) return { canceled: true };

    const processed = await compressAndEncodeImage(asset.uri);
    return {
      canceled: false,
      image: processed,
    };
  } catch (err) {
    return {
      canceled: true,
      error: err instanceof Error ? err.message : 'Failed to capture photo.',
    };
  }
}
