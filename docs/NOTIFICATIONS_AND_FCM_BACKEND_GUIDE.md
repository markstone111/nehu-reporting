# Push Notifications & In-App Notification Center: Backend Specification

> **For Backend Engineering Team (Go & FastAPI)**  
> **Project:** NEHU AI-Assisted Issue Reporting & Grievance Redressal System  
> **Document Purpose:** Single source of truth for FCM push notification delivery, device token management, and in-app notification center APIs.

---

## 1. Overview & Architecture

To keep students, faculty, and administrative staff informed about their reported grievances, the system employs a dual-tier notification architecture:

1. **Remote Push Notifications (Firebase Cloud Messaging - FCM HTTP v1 API):**  
   Delivers immediate native heads-up alerts to the user's mobile device when their grievance changes status (e.g. `UNDER_REVIEW` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED`), when an admin posts an inspection remark, or when a campus advisory is issued.
2. **In-App Notification Center (`app/(app)/notifications.tsx`):**  
   Provides a persistent, paginated history of all notifications received by the authenticated user, complete with unread badges, filter tabs (`ALL`, `GRIEVANCES`, `ADMINISTRATIVE`), and direct tap-to-view deep links into the respective grievance detail screen (`/(app)/issues/[id]`).

### System Interaction Diagram

```
+-----------------------------------------------------------------------------------+
|                                     MOBILE APP                                    |
|                                                                                   |
|  1. Generate FCM Token on Device (expo-notifications / Firebase Messaging)        |
|  2. Send Token to Backend  --->  PATCH /auth/fcm-token                            |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                  BACKEND SERVER                                   |
|                                                                                   |
|  1. Store/Update Token in PostgreSQL (`user_fcm_tokens` table)                    |
|  2. Grievance Status Changed (e.g., Assigned to IT Department)                    |
|  3. Save in-app notification to `notifications` table                             |
|  4. Query active FCM tokens for the grievance owner                               |
|  5. Build FCM HTTP v1 payload with Deep Link Data                                  |
|  6. Dispatch via Firebase Admin SDK  --->  FCM Server                             |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                          FIREBASE CLOUD MESSAGING (FCM)                           |
|                                                                                   |
|  Route message to Google Play Services on User's Android Device                   |
+----------------------------------------+------------------------------------------+
                                         |
                                         v
+-----------------------------------------------------------------------------------+
|                                  USER'S DEVICE                                    |
|                                                                                   |
|  - System Tray Notification Pops Up ("Grievance #IT-9402 Assigned")              |
|  - Tapping notification deep-links directly to `/issues/c1-wifi-it`               |
|  - In-app Notification Bell shows unread badge counter                            |
+-----------------------------------------------------------------------------------+
```

---

## 2. Required Endpoints Summary

| Method   | Endpoint                      | Auth                  | Purpose                                        |
| :------- | :---------------------------- | :-------------------- | :--------------------------------------------- |
| `PATCH`  | `/auth/fcm-token`             | Required              | Register or update the device's FCM push token |
| `DELETE` | `/auth/fcm-token`             | Required              | Remove/deactivate FCM token on user logout     |
| `GET`    | `/notifications`              | Required              | Fetch paginated notification history for user  |
| `GET`    | `/notifications/unread-count` | Required              | Lightweight count of unread notifications      |
| `PATCH`  | `/notifications/:id/read`     | Required              | Mark a single notification as read             |
| `PATCH`  | `/notifications/read-all`     | Required              | Mark all user notifications as read            |
| `DELETE` | `/notifications/:id`          | Required              | Delete/dismiss a single notification           |
| `POST`   | `/dev/test-notification`      | Required _(Dev only)_ | Trigger a mock push notification for testing   |

---

## 3. Detailed API Specifications

### 3.1 Device Token Registration

#### `PATCH /auth/fcm-token` _(Protected)_

Called by the mobile app whenever:

- A user logs in or completes registration.
- Firebase rotates the FCM registration token.
- The app initializes on device restart.

**Request Body:**

```json
{
  "fcmToken": "eK5_...your_native_firebase_fcm_registration_token...",
  "platform": "android",
  "deviceModel": "Pixel 7 Pro",
  "appVersion": "1.0.0"
}
```

**Fields:**

- `fcmToken` (string, required): The native FCM registration token issued by Firebase.
- `platform` (string, required): `"android"` | `"ios"` | `"web"`.
- `deviceModel` (string, optional): E.g., `"Samsung Galaxy S23"`.
- `appVersion` (string, optional): E.g., `"1.0.0"`.

**Backend Logic:**

- Upsert into `user_fcm_tokens`. If the token already exists for another user (e.g. phone handed over to friend), update `user_id` to current user.
- Set `is_active = TRUE`, `updated_at = NOW()`.

**Response `204 No Content`**

---

#### `DELETE /auth/fcm-token` _(Protected)_

Called immediately before the user logs out so that future notifications for this account are not sent to this device.

**Request Body:**

```json
{
  "fcmToken": "eK5_...your_native_firebase_fcm_registration_token..."
}
```

**Backend Logic:**

- Update `user_fcm_tokens` set `is_active = FALSE` where `fcm_token = :fcmToken AND user_id = :currentUserId`.

**Response `204 No Content`**

---

### 3.2 In-App Notification Center Endpoints

#### `GET /notifications` _(Protected)_

Retrieves paginated notifications for the authenticated user, matching the UI tabs in `app/(app)/notifications.tsx`.

**Query Parameters:**

- `page` (integer, optional, default: `1`): Current page.
- `pageSize` (integer, optional, default: `20`, max: `50`): Items per page.
- `filter` (string, optional, default: `ALL`): `"ALL"` | `"GRIEVANCES"` | `"ADMINISTRATIVE"`.

**Response `200 OK`:**

```json
{
  "data": [
    {
      "id": "e3b0c442-98fc-1c14-9afe-4b204b901a01",
      "category": "Grievance",
      "type": "ASSIGNED",
      "status": "In Progress",
      "title": "Wi-Fi Outage Assigned to Network Engineering",
      "message": "Grievance #IT-9402 (7th sem Classroom & Software Lab) assigned to Senior Network Engineer for hardware diagnostic.",
      "timestamp": "2026-11-15T02:45:00Z",
      "isRead": false,
      "issueId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "icon": "wifi-outline",
      "badgeVariant": "primary"
    },
    {
      "id": "7c9e6679-7425-40de-944b-e07fc1f90ae7",
      "category": "Administrative",
      "type": "NOTICE",
      "status": "Notice",
      "title": "Central Campus Fiber Gateway Maintenance",
      "message": "Computer Centre scheduled core router maintenance on Saturday 2:00 AM – 5:00 AM. Intermittent drops expected.",
      "timestamp": "2026-11-13T10:00:00Z",
      "isRead": true,
      "issueId": null,
      "icon": "construct-outline",
      "badgeVariant": "neutral"
    }
  ],
  "total": 14,
  "page": 1,
  "pageSize": 20,
  "hasNextPage": false,
  "unreadCount": 1
}
```

---

#### `GET /notifications/unread-count` _(Protected)_

Lightweight endpoint called on app resume to display the red badge on the notification bell in the app header.

**Response `200 OK`:**

```json
{
  "unreadCount": 3
}
```

---

#### `PATCH /notifications/:id/read` _(Protected)_

Marks a single notification as read when the user taps on it.

**Response `200 OK`:**

```json
{
  "id": "e3b0c442-98fc-1c14-9afe-4b204b901a01",
  "isRead": true,
  "readAt": "2026-11-15T03:30:00Z"
}
```

---

#### `PATCH /notifications/read-all` _(Protected)_

Marks all unread notifications belonging to the user as read (triggered by "Mark all as read" button in UI).

**Response `200 OK`:**

```json
{
  "markedCount": 4,
  "message": "All notifications marked as read."
}
```

---

#### `DELETE /notifications/:id` _(Protected)_

Dismisses or soft-deletes a notification item from user's list.

**Response `204 No Content`**

---

#### `POST /dev/test-notification` _(Protected - Dev / Staging only)_

Allows testing the FCM push delivery directly from Postman or Developer Settings.

**Request Body:**

```json
{
  "title": "Test Push Notification",
  "body": "Testing FCM pipeline from NEHU backend",
  "issueId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "type": "STATUS_CHANGE"
}
```

**Response `200 OK`:**

```json
{
  "success": true,
  "deliveredTokensCount": 1,
  "failedTokensCount": 0
}
```

---

## 4. FCM Push Message Payload Specification (HTTP v1)

When sending push notifications through the Google Firebase Cloud Messaging HTTP v1 API (`https://fcm.googleapis.com/v1/projects/{projectId}/messages:send`), the backend **must include both `notification` and `data` blocks**.

### Standard Payload Format

```json
{
  "message": {
    "token": "eK5_...target_fcm_token...",
    "notification": {
      "title": "Wi-Fi Outage Assigned to Network Engineering",
      "body": "Grievance #IT-9402 has been assigned for inspection."
    },
    "data": {
      "type": "ASSIGNED",
      "issueId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
      "status": "IN_PROGRESS",
      "category": "IT_SERVICES",
      "notificationId": "e3b0c442-98fc-1c14-9afe-4b204b901a01",
      "url": "/issues/9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d"
    },
    "android": {
      "priority": "HIGH",
      "notification": {
        "channel_id": "nehu_grievance_updates",
        "icon": "ic_notification",
        "color": "#003DA5",
        "sound": "default",
        "click_action": "OPEN_ISSUE_DETAIL"
      }
    }
  }
}
```

### Critical Rules for the Payload:

1. **Values inside `data` must all be Strings:** Firebase FCM HTTP v1 requires all values inside the `data` key-value object to be strings (e.g. `"status": "IN_PROGRESS"`, NOT nested objects or booleans).
2. **`issueId` is required for Grievance events:** The mobile app's deep link handler uses `data.issueId` (or `data.url`) to navigate straight to the grievance detail screen when the user taps the notification.
3. **Android Notification Channel:**
   - Grievance updates must use `channel_id: "nehu_grievance_updates"`.
   - General campus announcements must use `channel_id: "nehu_campus_advisories"`.
     The mobile app registers these notification channels on boot.

---

## 5. Event Trigger Matrix

The backend should automatically trigger push notifications on the following events:

| Trigger Event           | Target User        | Title Format                    | Body Format                                          | FCM `data.type`  |
| :---------------------- | :----------------- | :------------------------------ | :--------------------------------------------------- | :--------------- |
| **Grievance Submitted** | Reporter           | Grievance Registered            | Grievance #{shortId} submitted successfully.         | `SUBMITTED`      |
| **Under Review**        | Reporter           | Grievance Under Review          | Administration is reviewing #{shortId}.              | `UNDER_REVIEW`   |
| **Assigned to Dept**    | Reporter           | Grievance Assigned              | #{shortId} assigned to {departmentName}.             | `ASSIGNED`       |
| **Work in Progress**    | Reporter           | Resolution In Progress          | Technician dispatched for #{shortId}.                | `IN_PROGRESS`    |
| **Resolved**            | Reporter           | Grievance Resolved              | #{shortId} marked resolved. Please provide feedback. | `RESOLVED`       |
| **Escalated**           | Reporter           | Grievance Escalated             | #{shortId} escalated to higher campus authority.     | `ESCALATED`      |
| **Admin Comment**       | Reporter           | New Update on Grievance         | Officer remarks added to #{shortId}.                 | `COMMENT`        |
| **Duplicate Linked**    | Reporter           | Report Linked to Existing Issue | Your report linked to existing #{parentShortId}.     | `DUPLICATE_LINK` |
| **Campus Advisory**     | All Students/Staff | Campus Announcement             | {advisorySummary}                                    | `NOTICE`         |

---

## 6. Recommended Database Schema (PostgreSQL)

### 6.1 `user_fcm_tokens` Table

```sql
CREATE TABLE user_fcm_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    fcm_token TEXT NOT NULL UNIQUE,
    platform VARCHAR(20) NOT NULL DEFAULT 'android', -- 'android', 'ios', 'web'
    device_model VARCHAR(100),
    app_version VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices for rapid lookup during push dispatch
CREATE INDEX idx_user_fcm_tokens_user_id ON user_fcm_tokens(user_id) WHERE is_active = TRUE;
CREATE INDEX idx_user_fcm_tokens_token ON user_fcm_tokens(fcm_token);
```

### 6.2 `notifications` Table (In-App History)

```sql
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    issue_id UUID REFERENCES issues(id) ON DELETE SET NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'Grievance', -- 'Grievance', 'Administrative'
    type VARCHAR(30) NOT NULL, -- 'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED', 'COMMENT', 'NOTICE'
    status VARCHAR(30) NOT NULL DEFAULT 'In Progress', -- Display status for UI
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    icon VARCHAR(50) DEFAULT 'notifications-outline',
    badge_variant VARCHAR(20) DEFAULT 'primary', -- 'primary', 'warning', 'success', 'neutral'
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_notifications_user_unread ON notifications(user_id, is_read, created_at DESC);
CREATE INDEX idx_notifications_user_history ON notifications(user_id, created_at DESC);
```

---

## 7. Backend Implementation Examples

### Go Implementation (Firebase Admin SDK)

```go
package notifications

import (
	"context"
	"log"

	firebase "firebase.google.com/go/v4"
	"firebase.google.com/go/v4/messaging"
	"google.golang.org/api/option"
)

type NotificationService struct {
	client *messaging.Client
}

func NewNotificationService(serviceAccountKeyPath string) (*NotificationService, error) {
	ctx := context.Background()
	opt := option.WithCredentialsFile(serviceAccountKeyPath)
	app, err := firebase.NewApp(ctx, nil, opt)
	if err != nil {
		return nil, err
	}

	client, err := app.Messaging(ctx)
	if err != nil {
		return nil, err
	}

	return &NotificationService{client: client}, nil
}

// SendIssueStatusNotification dispatches push notifications to all active devices of a user
func (s *NotificationService) SendIssueStatusNotification(
	ctx context.Context,
	fcmTokens []string,
	title string,
	body string,
	issueID string,
	status string,
	notificationID string,
) {
	if len(fcmTokens) == 0 {
		return
	}

	// Build multicast message
	message := &messaging.MulticastMessage{
		Tokens: fcmTokens,
		Notification: &messaging.Notification{
			Title: title,
			Body:  body,
		},
		Data: map[string]string{
			"type":           "GRIEVANCE_STATUS_UPDATE",
			"issueId":        issueID,
			"status":         status,
			"notificationId": notificationID,
			"url":            "/issues/" + issueID,
		},
		Android: &messaging.AndroidConfig{
			Priority: "high",
			Notification: &messaging.AndroidNotification{
				ChannelID: "nehu_grievance_updates",
				Icon:      "ic_notification",
				Color:     "#003DA5",
				Sound:     "default",
			},
		},
	}

	br, err := s.client.SendEachForMulticast(ctx, message)
	if err != nil {
		log.Printf("Failed to dispatch push notifications: %v", err)
		return
	}

	log.Printf("Successfully sent %d push messages; %d failed", br.SuccessCount, br.FailureCount)

	// Clean up stale/invalid tokens
	for idx, resp := range br.Responses {
		if !resp.Success {
			if messaging.IsRegistrationTokenNotRegistered(resp.Error) {
				// Deactivate token in database
				deactivateToken(fcmTokens[idx])
			}
		}
	}
}

func deactivateToken(token string) {
	// Execute: UPDATE user_fcm_tokens SET is_active = FALSE WHERE fcm_token = token
}
```

### Python / FastAPI Implementation

```python
import firebase_admin
from firebase_admin import credentials, messaging

# Initialize Firebase App
cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

def send_push_notification(tokens: list[str], title: str, body: str, issue_id: str, status: str, notification_id: str):
    if not tokens:
        return

    message = messaging.MulticastMessage(
        tokens=tokens,
        notification=messaging.Notification(
            title=title,
            body=body,
        ),
        data={
            "type": "GRIEVANCE_STATUS_UPDATE",
            "issueId": str(issue_id),
            "status": str(status),
            "notificationId": str(notification_id),
            "url": f"/issues/{issue_id}",
        },
        android=messaging.AndroidConfig(
            priority="high",
            notification=messaging.AndroidNotification(
                channel_id="nehu_grievance_updates",
                icon="ic_notification",
                color="#003DA5",
                sound="default"
            )
        )
    )

    response = messaging.send_each_for_multicast(message)
    print(f"{response.success_count} messages sent successfully, {response.failure_count} failed.")
```

---

## 8. Summary Checklist for Backend Teammate

- [ ] Add `user_fcm_tokens` and `notifications` tables to PostgreSQL schema.
- [ ] Implement `PATCH /auth/fcm-token` and `DELETE /auth/fcm-token`.
- [ ] Implement `GET /notifications` and `GET /notifications/unread-count`.
- [ ] Implement `PATCH /notifications/:id/read` and `PATCH /notifications/read-all`.
- [ ] Set up Firebase Project Service Account Key (`serviceAccountKey.json`) on backend.
- [ ] Attach `SendIssueStatusNotification` hook to grievance status update triggers.
- [ ] Handle unregistering invalid tokens when FCM returns `registration-token-not-registered`.
