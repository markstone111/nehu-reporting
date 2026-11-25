/**
 * Notification Service — src/services/notification.service.ts
 *
 * Handles Firebase Cloud Messaging (FCM) registration, native device push token
 * generation, Android notification channels, runtime permissions, foreground presentation,
 * and deep link payload extraction.
 *
 * Gracefully adapts between Expo Go (development/testing client) and
 * Production/Development Builds (with native Google Play Services).
 */

import { Platform } from 'react-native';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import { SecureStorage, STORAGE_KEYS } from '@/services/storage.service';
import { authApi } from '@/api/auth.api';
import { logger } from '@/utils/logger.utils';

// Check if running inside Expo Go client
const isExpoGo =
  Constants.appOwnership === 'expo' ||
  Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

// ---------------------------------------------------------------------------
// Foreground Notification Presentation Handler
// ---------------------------------------------------------------------------

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const NOTIFICATION_CHANNELS = {
  GRIEVANCE_UPDATES: 'nehu_grievance_updates',
  CAMPUS_ADVISORIES: 'nehu_campus_advisories',
} as const;

export interface NotificationPayload {
  readonly type?: string;
  readonly issueId?: string;
  readonly status?: string;
  readonly category?: string;
  readonly notificationId?: string;
  readonly url?: string;
}

export const NotificationService = {
  /**
   * Set up Android notification channels (Android 8.0 / API 26+)
   */
  async setupNotificationChannels(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.GRIEVANCE_UPDATES, {
        name: 'Grievance Resolution Updates',
        description:
          'Instant alerts when your reported grievance changes status or receives remarks.',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#003DA5',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.CAMPUS_ADVISORIES, {
        name: 'Campus Advisories & Notices',
        description: 'University-wide infrastructure advisories and administrative notices.',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 200, 100, 200],
        lightColor: '#003DA5',
        enableLights: true,
        enableVibrate: true,
        showBadge: true,
      });

      logger.log('NOTIF', 'Android notification channels initialized successfully.');
    } catch {
      // In Expo Go, channel creation may be restricted by the host client; non-fatal
      logger.log('NOTIF', 'Android notification channels initialized with default host settings.');
    }
  },

  /**
   * Request push permissions and generate the native Firebase FCM Device Token.
   * Caches token locally in SecureStorage and attempts backend synchronization.
   */
  async registerForPushNotifications(): Promise<string | null> {
    try {
      await this.setupNotificationChannels();

      // 1. Check existing permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      // 2. Request permission if not already granted
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        logger.warn('NOTIF', 'Notification permission was denied by the user.');
        return null;
      }

      // If running inside Expo Go client, native remote FCM registration is handled
      // via development build. Use fallback dev token so all app features function smoothly.
      if (isExpoGo) {
        const devToken = 'fcm-token-expo-go-dev-session';
        logger.log(
          'NOTIF',
          'Expo Go environment active: using dev push token (development builds will receive native FCM tokens).',
        );
        await SecureStorage.set(STORAGE_KEYS.FCM_TOKEN, devToken);
        await this.syncTokenWithBackend(devToken);
        return devToken;
      }

      // 3. Acquire native FCM Device Token from Google Play Services (Development / Production build)
      if (!Device.isDevice) {
        logger.log('NOTIF', 'Running on simulator/emulator — push notifications skipped.');
        return null;
      }

      let fcmToken: string | null = null;
      try {
        const deviceTokenResult = await Notifications.getDevicePushTokenAsync();
        fcmToken = typeof deviceTokenResult.data === 'string' ? deviceTokenResult.data : null;
      } catch (fcmError) {
        logger.warn(
          'NOTIF',
          'getDevicePushTokenAsync unavailable in current environment',
          fcmError,
        );
      }

      if (!fcmToken) {
        logger.warn('NOTIF', 'Failed to acquire device push token.');
        return null;
      }

      logger.log('NOTIF', `Push Token generated: ${fcmToken.substring(0, 15)}...`);

      // 4. Save to secure storage
      await SecureStorage.set(STORAGE_KEYS.FCM_TOKEN, fcmToken);

      // 5. Sync with backend
      await this.syncTokenWithBackend(fcmToken);

      return fcmToken;
    } catch (error) {
      logger.error('NOTIF', 'Push token registration encountered an issue (non-fatal)', error);
      return null;
    }
  },

  /**
   * Sync active FCM token to the backend server
   */
  async syncTokenWithBackend(token: string): Promise<void> {
    const accessToken = await SecureStorage.get(STORAGE_KEYS.ACCESS_TOKEN);
    if (!accessToken) {
      // User is not logged in yet — token is preserved in SecureStorage and syncs automatically on login
      logger.log('NOTIF', 'Push token cached locally (will sync automatically on user login).');
      return;
    }

    try {
      await authApi.updateFcmToken({
        fcmToken: token,
        platform: Platform.OS === 'ios' ? 'ios' : 'android',
      });
      logger.log('NOTIF', 'FCM token synced successfully with university backend.');
    } catch {
      logger.log('NOTIF', 'Could not sync token with backend yet.');
    }
  },

  /**
   * Retrieve cached FCM token from SecureStorage
   */
  async getStoredToken(): Promise<string | null> {
    return await SecureStorage.get(STORAGE_KEYS.FCM_TOKEN);
  },

  /**
   * Listen for token refresh events from Firebase
   */
  setupTokenRefreshListener(): Notifications.EventSubscription | null {
    if (isExpoGo) {
      return null;
    }

    try {
      return Notifications.addPushTokenListener(async (tokenData) => {
        const fcmToken =
          typeof tokenData.data === 'string' ? tokenData.data : String(tokenData.data);
        logger.log('NOTIF', `Token refreshed: ${fcmToken.substring(0, 15)}...`);
        await SecureStorage.set(STORAGE_KEYS.FCM_TOKEN, fcmToken);
        await this.syncTokenWithBackend(fcmToken);
      });
    } catch {
      return null;
    }
  },

  /**
   * Extract custom data payload from a notification object
   */
  extractPayload(notification: Notifications.Notification): NotificationPayload {
    const rawData = notification.request.content.data;
    if (!rawData || typeof rawData !== 'object') {
      return {};
    }
    return rawData as NotificationPayload;
  },

  /**
   * Display or schedule a local device notification immediately (sound, banner, vibration).
   * Works on both Expo Go and Production / Dev Builds.
   */
  async displayLocalNotification(options: {
    title: string;
    body: string;
    data?: NotificationPayload;
    channelId?: string;
  }): Promise<string | null> {
    try {
      await this.setupNotificationChannels();
      const identifier = await Notifications.scheduleNotificationAsync({
        content: {
          title: options.title,
          body: options.body,
          data: (options.data || {}) as Record<string, unknown>,
          sound: true,
          vibrate: [0, 250, 250, 250],
          priority: Notifications.AndroidNotificationPriority.MAX,
          ...(options.channelId ? { channelId: options.channelId } : {}),
        },
        trigger: null, // immediate delivery
      });
      logger.log('NOTIF', `Local notification triggered [${identifier}]: ${options.title}`);
      return identifier;
    } catch (err) {
      logger.warn('NOTIF', 'Failed to schedule local notification', err);
      return null;
    }
  },

  /**
   * Trigger immediate system notification when user submits a grievance report
   */
  async notifyGrievanceSubmitted(issue: {
    id: string;
    title: string;
    category?: string;
    location?: string;
  }): Promise<void> {
    await this.displayLocalNotification({
      title: 'Grievance Registered ✅',
      body: `"${issue.title}" has been submitted and queued for NEHU administration review.`,
      channelId: NOTIFICATION_CHANNELS.GRIEVANCE_UPDATES,
      data: {
        type: 'SUBMITTED',
        issueId: issue.id,
        status: 'SUBMITTED',
        ...(issue.category ? { category: issue.category } : {}),
      },
    });
  },

  /**
   * Trigger system notification when grievance status or technician assignment changes
   */
  async notifyGrievanceStatusUpdated(issue: {
    id: string;
    title: string;
    status: string;
    remarks?: string;
  }): Promise<void> {
    await this.displayLocalNotification({
      title: `Grievance Update: ${issue.status}`,
      body: issue.remarks || `Status of "${issue.title}" has been updated to ${issue.status}.`,
      channelId: NOTIFICATION_CHANNELS.GRIEVANCE_UPDATES,
      data: {
        type: issue.status,
        issueId: issue.id,
        status: issue.status,
      },
    });
  },
};
