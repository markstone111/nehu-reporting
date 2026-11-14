# Push Notification System & Deep Linking Architecture

> **Project:** NEHU AI-Assisted Issue Reporting & Grievance Redressal System  
> **Module:** Remote Push Notifications (FCM), Foreground Heads-Up Alerts & In-App Notification Center  
> **Target Audience:** Frontend Engineers, Mobile Contributors, and Backend Integrators

---

## 1. System Overview

The NEHU mobile grievance system relies on timely communication to keep university members informed of their complaint resolution status. The notification system handles three distinct application states:

| App State | Delivery Mechanism | User Experience | Tap Action |
| :--- | :--- | :--- | :--- |
| **Foreground** (App Open & Active) | In-App Toast Banner (`NotificationToast.tsx`) + System Tray | Floating banner slides down from top; real-time query cache invalidation updates grievance views immediately. | Dismisses toast and deep-links directly to grievance details. |
| **Background** (App Minimized) | Android System Tray Notification via FCM | Native notification with NEHU icon and grievance category badge. | Brings app to foreground and navigates to `/(app)/issues/[id]`. |
| **Killed** (App Terminated) | Android System Tray Notification via Google Play Services | Native notification wakes app when tapped. | Cold-boots app and navigates directly to the target grievance screen once auth is hydrated. |

```
                                      +---------------------------------------------+
                                      |            Grievance Status Event           |
                                      |   (Assigned, In Progress, Resolved, etc.)   |
                                      +----------------------+----------------------+
                                                             |
                                                             v
                                      +---------------------------------------------+
                                      |          University Go/FastAPI Server       |
                                      |     - Records notification in PostgreSQL    |
                                      |     - Formats FCM HTTP v1 JSON message      |
                                      +----------------------+----------------------+
                                                             |
                                                             v
                                      +---------------------------------------------+
                                      |        Firebase Cloud Messaging (FCM)       |
                                      +----------------------+----------------------+
                                                             |
                                                             v
                                      +---------------------------------------------+
                                      |            User's Android Device            |
                                      +----------------------+----------------------+
                                                             |
                           +---------------------------------+---------------------------------+
                           |                                                                   |
                           v                                                                   v
             [App in Foreground]                                                  [App in Background / Killed]
                           |                                                                   |
            `onNotificationReceived`                                             `onNotificationResponseReceived`
                           |                                                                   |
                           v                                                                   v
     1. Invalidate TanStack queries                                      1. Extract `issueId` from `data` payload
     2. Slide down `<NotificationToast />`                                2. `router.push('/(app)/issues/' + id)`
     3. User taps toast -> deep link                                     3. Opens Grievance Detail screen
```

---

## 2. Prerequisites & Setup Guide

### 2.1 Firebase Console Setup
1. Open the [Firebase Console](https://console.firebase.google.com/) and select the project.
2. In Project Settings, ensure an Android app exists with package name:
   ```
   ac.nehu.issuereport
   ```
   *(This exact package name is configured in `app.json` line 26).*
3. Download `google-services.json` and place it in the project root:
   ```
   nehu-issue-report-feedback/google-services.json
   ```
   *(This file is gitignored in `.gitignore` to prevent secret leakage).*

### 2.2 Expo Configuration (`app.json`)
The application defines the Android credentials and plugin bindings in `app.json`:

```json
{
  "expo": {
    "android": {
      "package": "ac.nehu.issuereport",
      "googleServicesFile": "./google-services.json"
    },
    "plugins": [
      [
        "expo-notifications",
        {
          "icon": "./assets/icon.png",
          "color": "#003DA5"
        }
      ]
    ]
  }
}
```

---

## 3. Core Architecture & File Guide

### 3.1 Notification Service (`src/services/notification.service.ts`)
The foundational service responsible for device push token management:
- **`registerForPushNotifications()`**:
  1. Verifies physical hardware via `Device.isDevice`.
  2. Creates high-priority Android Notification Channels:
     * `nehu_grievance_updates`: Channel for real-time grievance tracking alerts.
     * `nehu_campus_advisories`: Channel for university infrastructure notices.
  3. Checks and requests Android 13+ (`POST_NOTIFICATIONS`) and iOS permissions.
  4. Generates the native FCM token via `Notifications.getDevicePushTokenAsync()`.
  5. Stores the token in `SecureStorage` under key `STORAGE_KEYS.FCM_TOKEN`.
  6. Automatically syncs the token with the university backend via `authApi.updateFcmToken()`.
- **`setupTokenRefreshListener()`**: Subscribes to token rotation events from Firebase and re-syncs with the backend.
- **`extractPayload(notification)`**: Safely casts and normalizes custom data properties (`issueId`, `status`, `type`, `url`).

### 3.2 In-App Toast Banner (`src/components/notification/NotificationToast.tsx`)
A Canva-inspired floating banner rendered at the top of the screen:
- Animated slide-in and slide-out with spring physics.
- Displays grievance category badge, title, message, and timestamp.
- Auto-dismisses after 4.5 seconds if untouched.
- Tap gesture triggers instant deep linking to the relevant issue.

### 3.3 Root Bootstrap & Deep Link Handler (`app/_layout.tsx`)
The root layout initializes the notification listeners inside a `<NotificationBootstrap />` component:
- **Foreground Listener (`addNotificationReceivedListener`)**: Triggers `<NotificationToast />` and invalidates React Query caches so grievance lists immediately refresh.
- **Response Listener (`addNotificationResponseReceivedListener`)**: Catches notification taps and calls `router.push('/(app)/issues/[id]')`.

### 3.4 Notifications Data Hook (`src/hooks/useNotifications.ts`)
- **`useNotifications(params)`**: Queries `GET /notifications` with filter tabs (`ALL`, `GRIEVANCES`, `ADMINISTRATIVE`). Includes an offline mock fallback (`DEMO_NOTIFICATIONS`) so developers can test the UI without an active backend.
- **`useUnreadNotificationCount()`**: Queries `GET /notifications/unread-count` to display the red notification badge on the Alerts tab bar.
- **`useMarkNotificationAsRead()`**: Mutation for `PATCH /notifications/:id/read`.
- **`useMarkAllNotificationsAsRead()`**: Mutation for `PATCH /notifications/read-all`.
- **`useDeleteNotification()`**: Mutation for `DELETE /notifications/:id`.

### 3.5 Alerts & Notifications Screen (`app/(app)/notifications.tsx`)
A production-ready notification hub featuring:
- Live badge counters and filter chips (`All`, `Grievances`, `Advisory`).
- Unread status dots and distinct status badges (`In Progress`, `Under Review`, `Resolved`, `Notice`).
- Pull-to-refresh integration with TanStack Query.
- "Mark all as read" 1-tap action.
- Clean empty state placeholder.

---

## 4. Deep Linking Specification

### URL Scheme
The mobile app registers the `nehu://` custom scheme in `app.json`.

| Trigger Source | Target Route | Deep Link URL |
| :--- | :--- | :--- |
| Grievance Status Change Push | Grievance Detail Screen | `nehu://issues/{issueId}` or `/(app)/issues/{issueId}` |
| Campus Advisory Push | Notifications Tab | `nehu://notifications` or `/(app)/notifications` |

### FCM Data Payload Structure
When backend dispatches push notifications, the `data` block must contain:

```json
{
  "type": "ASSIGNED",
  "issueId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "status": "IN_PROGRESS",
  "category": "IT_SERVICES",
  "url": "/issues/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
}
```

---

## 5. Developer Testing & Verification Guide

### 5.1 Testing on Physical Device
1. Build and run the app on an Android device:
   ```bash
   npx expo start
   ```
2. Check the Metro bundler terminal output. Look for the formatted logger entry:
   ```
   [HH:MM:SS] 🔔 [NOTIF] Android notification channels initialized successfully.
   [HH:MM:SS] 🔔 [NOTIF] Push Token generated: eK5_8...
   ```
3. If running in Expo Go on Android, push token registration gracefully handles Expo client environments and saves the token to `SecureStorage`.

### 5.2 Sending a Test Push via Firebase Cloud Messaging CLI / Curl
Once the FCM token is displayed in the terminal:
```bash
curl -X POST "https://fcm.googleapis.com/v1/projects/{YOUR_PROJECT_ID}/messages:send" \
  -H "Authorization: Bearer $(gcloud auth print-access-token)" \
  -H "Content-Type: application/json" \
  -d '{
    "message": {
      "token": "<COPIED_FCM_TOKEN>",
      "notification": {
        "title": "Wi-Fi Outage Assigned to Network Engineering",
        "body": "Grievance #IT-9402 has been assigned to Senior Network Engineer."
      },
      "data": {
        "issueId": "demo-issue-1",
        "status": "IN_PROGRESS",
        "type": "ASSIGNED"
      },
      "android": {
        "notification": {
          "channel_id": "nehu_grievance_updates"
        }
      }
    }
  }'
```

---

## 6. Troubleshooting Common Issues

| Issue | Root Cause | Solution |
| :--- | :--- | :--- |
| `Device push token is null` | Running in simulator/emulator | Push notifications require a physical device. Test on an Android phone. |
| Permission Denied | User selected "Don't allow" on Android 13+ prompt | Open device Settings → Apps → NEHU Issue Report → Notifications → Turn On. |
| Token not syncing to backend | Backend server is offline or local IP changed | The token is safely saved in encrypted `SecureStorage` and will sync automatically when the user signs in or connects to the gateway. |
| Deep link doesn't open issue | `data.issueId` was missing in FCM payload | Ensure backend includes `"issueId": "uuid"` inside the `data` block of the FCM HTTP v1 payload. |

