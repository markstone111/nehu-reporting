# API Contract — NEHU Issue Report & Feedback

> **For Backend Team (Go + FastAPI)**
> This document is the single source of truth for the mobile app ↔ backend API contract.
> Any changes must be agreed upon by the team and reflected here.

## Base URL

Configurable via the app's developer settings.
Default production: `https://api.nehu.ac.in/issues/v1`
Local dev (Go server): `http://localhost:8080/v1`

---

## Master Bidirectional Data Flow Matrix

This master overview summarizes:

1. **What the Mobile App Sends to the Backend** (Payloads, Query Params, Headers, Constraints)
2. **What the Backend Returns to the Mobile App** (Response Objects, Tokens, Status Codes)
3. **What the Backend Dispatches via Remote Push (FCM HTTP v1)** (Trigger Events & Deep Link Data Payloads)

### 1. App → Backend: All Payloads Sent by the Mobile Client

| Endpoint                      | Method   | Purpose                             | What App Sends (Payload / Params)                                                                                                                        | Constraints / Formats                                                                 |
| :---------------------------- | :------- | :---------------------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------- | :------------------------------------------------------------------------------------ |
| `/auth/register`              | `POST`   | Account creation                    | `{ name, email, password, role, idCardImageBase64, fcmToken }`                                                                                           | `role`: `'student'\|'staff'\|'faculty'`. Image up to 5MB Base64. `fcmToken` nullable. |
| `/auth/login`                 | `POST`   | User authentication                 | `{ email, password, fcmToken }`                                                                                                                          | Valid university email. `fcmToken` nullable.                                          |
| `/auth/refresh`               | `POST`   | Token rotation                      | `{ refreshToken }`                                                                                                                                       | JWT refresh token string.                                                             |
| `/auth/logout`                | `POST`   | Invalidate session                  | `Headers: { Authorization: "Bearer <token>" }`                                                                                                           | Invalidates refresh token on server.                                                  |
| `/auth/fcm-token`             | `PATCH`  | Register active device push token   | `{ fcmToken, platform, deviceModel?, appVersion? }`                                                                                                      | `platform`: `'android'\|'ios'`. Upserts token in `user_fcm_tokens`.                   |
| `/auth/fcm-token`             | `DELETE` | De-register token on logout         | `{ fcmToken }`                                                                                                                                           | Deactivates token so logged-out users don't receive alerts.                           |
| `/issues`                     | `POST`   | File grievance (Form or AI Chatbot) | `{ title, description, category, subcategory, location: { label, latitude, longitude, autoFetched }, attachments, source: "FORM"\|"CHATBOT", metadata }` | Title 5–100 chars, description 5–300 words. Location label max 200 chars.             |
| `/issues`                     | `GET`    | Fetch user's grievance list         | `Query: ?page=1&pageSize=20&status=IN_PROGRESS`                                                                                                          | Paginated. `status` filter optional.                                                  |
| `/issues/:id`                 | `GET`    | Fetch grievance details & timeline  | `URL param: :id` (UUID)                                                                                                                                  | Returns grievance data with complete chronological `timeline: [...]`.                 |
| `/chatbot/message`            | `POST`   | Conversational triage turn          | Turn 1: `{ sessionId: null, message, sessionState: null }`<br>Follow-up: `{ sessionId, message, sessionState }`                                          | Message 1–500 chars. Maintains state machine for category/location/description.       |
| `/chatbot/:sessionId`         | `DELETE` | Cancel conversational draft session | `URL param: :sessionId` (UUID)                                                                                                                           | Best-effort session cleanup.                                                          |
| `/notifications`              | `GET`    | In-app notification center          | `Query: ?page=1&pageSize=20&filter=ALL\|GRIEVANCES\|ADMINISTRATIVE`                                                                                      | Paginated user notification history.                                                  |
| `/notifications/unread-count` | `GET`    | Notification badge count            | None                                                                                                                                                     | Lightweight count of unread items for tab bar & header badges.                        |
| `/notifications/:id/read`     | `PATCH`  | Mark notification as read           | `URL param: :id` (UUID)                                                                                                                                  | Updates `is_read = true` and `read_at = NOW()`.                                       |
| `/notifications/read-all`     | `PATCH`  | Mark all notifications read         | None                                                                                                                                                     | Marks all unread notifications for current user as read.                              |
| `/notifications/:id`          | `DELETE` | Dismiss notification item           | `URL param: :id` (UUID)                                                                                                                                  | Soft-deletes or removes notification from user's view.                                |

---

### 2. Backend → App: All Responses Expected by the Mobile Client

| Endpoint                              | Status        | What Backend Returns to App                                                                                                                                                                                                            | Mobile App UI Impact                                                                                                              |
| :------------------------------------ | :------------ | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------------------------------------------------------------- |
| `/auth/register` & `/auth/login`      | `201` / `200` | `{ tokens: { accessToken, refreshToken, expiresIn }, user: { id, name, email, role, avatarUrl, createdAt } }`                                                                                                                          | Encrypts JWT in `SecureStorage`, stores user profile in Zustand, navigates to `/(app)` dashboard.                                 |
| `/auth/refresh`                       | `200`         | `{ accessToken, refreshToken, expiresIn }`                                                                                                                                                                                             | Silently intercepted on 401: stores new tokens, retries original failed request seamlessly.                                       |
| `/auth/logout`                        | `204`         | Empty body                                                                                                                                                                                                                             | Clears SecureStorage tokens and Zustand auth store, redirects to `/(auth)/login`.                                                 |
| `/auth/fcm-token` (`PATCH`/`DELETE`)  | `204`         | Empty body                                                                                                                                                                                                                             | Confirms device token registered / deactivated in database.                                                                       |
| `/issues` (`POST`)                    | `201`         | `{ issueId, status, isDuplicate, linkedIssueId, message }`                                                                                                                                                                             | Shows toast banner with `message`. If `isDuplicate: true`, alerts user that report was linked to existing parent ticket.          |
| `/issues` (`GET`)                     | `200`         | `{ data: [{ id, title, status, category, subcategory, createdAt, updatedAt, isDuplicate, linkedCount }], total, page, pageSize, hasNextPage }`                                                                                         | Populates My Issues list and dashboard metrics with status chips and category badges.                                             |
| `/issues/:id` (`GET`)                 | `200`         | `{ id, title, description, status, category, subcategory, location, source, isDuplicate, linkedIssueId, linkedCount, assignedTo, createdAt, updatedAt, timeline: [{ id, event, message, timestamp, actor, actorName }], attachments }` | Renders full grievance details, GPS location label, and interactive step-by-step Resolution Timeline.                             |
| `/chatbot/message` (`POST`)           | `200`         | `{ sessionId, botMessage, sessionState: { category, subcategory, collectedFields, pendingFields, complete, draftIssue } }`                                                                                                             | Renders assistant chat bubble with bouncing indicator. When `complete: true`, displays Canva-style interactive Draft Review Card. |
| `/notifications` (`GET`)              | `200`         | `{ data: [{ id, category, type, status, title, message, timestamp, isRead, issueId, icon, badgeVariant }], total, page, pageSize, hasNextPage, unreadCount }`                                                                          | Renders Alerts list with unread blue dots, category filters, and tap-to-navigate action.                                          |
| `/notifications/unread-count` (`GET`) | `200`         | `{ unreadCount: number }`                                                                                                                                                                                                              | Controls red badge counter on the bottom `Alerts` tab bar icon.                                                                   |
| `/notifications/:id/read` (`PATCH`)   | `200`         | `{ id, isRead: true, readAt: string }`                                                                                                                                                                                                 | Clears unread indicator for that item, decrements badge count.                                                                    |
| `/notifications/read-all` (`PATCH`)   | `200`         | `{ markedCount: number, message: string }`                                                                                                                                                                                             | Clears all unread dots and resets tab badge to 0.                                                                                 |

---

### 3. Backend → FCM → Device: Remote Push Trigger Matrix

When grievance lifecycle events occur, the backend dispatches an **FCM HTTP v1 message** to the user's active device tokens:

```json
{
  "message": {
    "token": "<user_fcm_token>",
    "notification": {
      "title": "Wi-Fi Outage Assigned to Network Engineering",
      "body": "Grievance #IT-9402 has been assigned to Senior Network Engineer."
    },
    "data": {
      "type": "ASSIGNED",
      "issueId": "c1-wifi-it",
      "status": "IN_PROGRESS",
      "category": "IT_SERVICES",
      "url": "/issues/c1-wifi-it"
    },
    "android": {
      "priority": "HIGH",
      "notification": {
        "channel_id": "nehu_grievance_updates",
        "icon": "ic_notification",
        "color": "#003DA5",
        "sound": "default"
      }
    }
  }
}
```

- **Foreground:** Triggers `<NotificationToast />` slide-down banner inside the app and invalidates TanStack Query caches in real-time.
- **Background / Killed:** Native Android system notification with NEHU blue branding; tapping it deep-links directly to `/(app)/issues/:id`.

---

## Authentication

All protected endpoints require:

```
Authorization: Bearer <access_token>
```

### POST /auth/register

**Request:**

```json
{
  "name": "Nikunj Maheshwari",
  "email": "nikunj@students.nehu.ac.in",
  "password": "mysecurepassword",
  "role": "student",
  "idCardImageBase64": "<base64_jpeg_or_png>",
  "fcmToken": "<firebase_token_or_null>"
}
```

**Response 201:**

```json
{
  "tokens": {
    "accessToken": "jwt...",
    "refreshToken": "jwt...",
    "expiresIn": 3600
  },
  "user": {
    "id": "uuid",
    "name": "Nikunj Maheshwari",
    "email": "nikunj@students.nehu.ac.in",
    "role": "student",
    "avatarUrl": "https://storage.nehu.ac.in/id-cards/uuid.jpg",
    "createdAt": "2026-09-21T03:00:00Z"
  }
}
```

---

### POST /auth/login

**Request:**

```json
{
  "email": "nikunj@students.nehu.ac.in",
  "password": "mysecurepassword",
  "fcmToken": "<firebase_token_or_null>"
}
```

**Response 200:** Same shape as `/auth/register` response.

---

### POST /auth/refresh

**Request:**

```json
{ "refreshToken": "jwt..." }
```

**Response 200:**

```json
{
  "accessToken": "jwt...",
  "refreshToken": "jwt...",
  "expiresIn": 3600
}
```

---

### POST /auth/logout _(protected)_

No request body. Invalidates the refresh token server-side.
**Response 204:** No content.

---

### PATCH /auth/fcm-token _(protected)_

**Request:**

```json
{
  "fcmToken": "<new_firebase_token>",
  "platform": "android"
}
```

**Response 204:** No content.

---

### DELETE /auth/fcm-token _(protected)_

De-register an FCM token upon user sign-out to prevent notifications on shared devices.

**Request:**

```json
{
  "fcmToken": "<firebase_token>"
}
```

**Response 204:** No content.

---

## Issues

### POST /issues _(protected)_

Submit a new issue. Same endpoint for both FORM and CHATBOT sources.

**Request:**

```json
{
  "title": "WiFi not working in hostel",
  "description": "The WiFi has been completely down on floor 3 of Boys Hostel Block A since morning. All students on this floor are affected...",
  "category": "IT_SERVICES",
  "subcategory": "IT_WIFI",
  "location": {
    "label": "Boys Hostel Block A, Floor 3",
    "latitude": 25.5788,
    "longitude": 91.8933,
    "autoFetched": true
  },
  "attachments": [],
  "source": "CHATBOT",
  "metadata": {
    "appVersion": "1.0.0",
    "platform": "android"
  }
}
```

**Response 201:**

```json
{
  "issueId": "uuid",
  "status": "SUBMITTED",
  "isDuplicate": false,
  "linkedIssueId": null,
  "message": "Your issue has been submitted successfully."
}
```

**If duplicate detected (isDuplicate = true):**

```json
{
  "issueId": "uuid-of-new-link-record",
  "status": "SUBMITTED",
  "isDuplicate": true,
  "linkedIssueId": "uuid-of-existing-issue",
  "message": "Your report was linked to an existing issue."
}
```

> The app will show a toast with the message field. No confirmation needed from user.

---

### GET /issues _(protected)_

Get the authenticated user's issues (paginated).

**Query params:** `?page=1&pageSize=20&status=IN_PROGRESS`

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "title": "WiFi not working in hostel",
      "status": "IN_PROGRESS",
      "category": "IT_SERVICES",
      "subcategory": "IT_WIFI",
      "createdAt": "2026-09-21T03:00:00Z",
      "updatedAt": "2026-09-21T09:00:00Z",
      "isDuplicate": false,
      "linkedCount": 3
    }
  ],
  "total": 5,
  "page": 1,
  "pageSize": 20,
  "hasNextPage": false
}
```

---

### GET /issues/:id _(protected)_

Get full issue detail with timeline.

**Response 200:**

```json
{
  "id": "uuid",
  "title": "WiFi not working in hostel",
  "description": "...",
  "status": "IN_PROGRESS",
  "category": "IT_SERVICES",
  "subcategory": "IT_WIFI",
  "location": {
    "label": "Boys Hostel Block A, Floor 3",
    "latitude": 25.5788,
    "longitude": 91.8933,
    "autoFetched": true
  },
  "source": "CHATBOT",
  "isDuplicate": false,
  "linkedIssueId": null,
  "linkedCount": 3,
  "assignedTo": "IT Department",
  "createdAt": "2026-09-21T03:00:00Z",
  "updatedAt": "2026-09-21T09:00:00Z",
  "timeline": [
    {
      "id": "t1",
      "event": "SUBMITTED",
      "message": "Issue submitted by you.",
      "timestamp": "2026-09-21T03:00:00Z",
      "actor": "system"
    },
    {
      "id": "t2",
      "event": "UNDER_REVIEW",
      "message": "Issue is being reviewed by the admin.",
      "timestamp": "2026-09-21T07:00:00Z",
      "actor": "system"
    },
    {
      "id": "t3",
      "event": "ASSIGNED",
      "message": "Assigned to IT Department.",
      "timestamp": "2026-09-21T08:00:00Z",
      "actor": "admin",
      "actorName": "Admin Office"
    }
  ],
  "attachments": []
}
```

**Status values:** `SUBMITTED | UNDER_REVIEW | ASSIGNED | IN_PROGRESS | RESOLVED | CLOSED | ESCALATED`

---

## Chatbot

### POST /chatbot/message _(protected)_

Send a user message. The FastAPI server handles LLM provider selection (Gemini → Groq → OpenAI).

**First message (sessionId = null):**

```json
{
  "sessionId": null,
  "message": "wifi nhi chal rha hostel me",
  "sessionState": null
}
```

**Subsequent messages:**

```json
{
  "sessionId": "uuid",
  "message": "Boys Hostel Block A, 3rd floor",
  "sessionState": {
    "category": "IT_SERVICES",
    "subcategory": "IT_WIFI",
    "collectedFields": ["category", "subcategory"],
    "pendingFields": ["location", "description"],
    "complete": false,
    "draftIssue": null
  }
}
```

**Response (mid-session):**

```json
{
  "sessionId": "uuid",
  "botMessage": "Which hostel are you in, and which floor? (e.g. Boys Hostel Block A, 3rd floor)",
  "sessionState": {
    "category": "IT_SERVICES",
    "subcategory": "IT_WIFI",
    "collectedFields": ["category", "subcategory"],
    "pendingFields": ["location", "description"],
    "complete": false,
    "draftIssue": null
  }
}
```

**Response (session complete):**

```json
{
  "sessionId": "uuid",
  "botMessage": "Got it! Here's what I'll submit for you. Please review and confirm.",
  "sessionState": {
    "category": "IT_SERVICES",
    "subcategory": "IT_WIFI",
    "collectedFields": ["category", "subcategory", "location", "description"],
    "pendingFields": [],
    "complete": true,
    "draftIssue": {
      "title": "WiFi not working in hostel",
      "description": "WiFi has been down on 3rd floor of Boys Hostel Block A. All students on the floor are affected. Started this morning.",
      "category": "IT_SERVICES",
      "subcategory": "IT_WIFI",
      "location": {
        "label": "Boys Hostel Block A, Floor 3",
        "latitude": null,
        "longitude": null,
        "autoFetched": false
      }
    }
  }
}
```

---

### DELETE /chatbot/:sessionId _(protected)_

Abandon an in-progress session. Best-effort — app ignores failure.

**Response 204:** No content.

---

## Notifications

Detailed guide available at: [`docs/NOTIFICATIONS_AND_FCM_BACKEND_GUIDE.md`](./NOTIFICATIONS_AND_FCM_BACKEND_GUIDE.md).

### GET /notifications _(protected)_

Fetch paginated campus notifications for the authenticated user.

**Query params:** `?page=1&pageSize=20&filter=ALL` (filters: `ALL | GRIEVANCES | ADMINISTRATIVE`)

**Response 200:**

```json
{
  "data": [
    {
      "id": "uuid",
      "category": "Grievance",
      "type": "ASSIGNED",
      "status": "In Progress",
      "title": "Wi-Fi Outage Assigned to Network Engineering",
      "message": "Grievance #IT-9402 assigned to Senior Network Engineer.",
      "timestamp": "2026-11-15T02:45:00Z",
      "isRead": false,
      "issueId": "uuid-issue",
      "icon": "wifi-outline",
      "badgeVariant": "primary"
    }
  ],
  "total": 12,
  "page": 1,
  "pageSize": 20,
  "hasNextPage": false,
  "unreadCount": 1
}
```

---

### GET /notifications/unread-count _(protected)_

Returns the count of unread notifications for badge rendering.

**Response 200:**

```json
{
  "unreadCount": 1
}
```

---

### PATCH /notifications/:id/read _(protected)_

Mark a single notification as read.

**Response 200:**

```json
{
  "id": "uuid",
  "isRead": true,
  "readAt": "2026-11-15T03:30:00Z"
}
```

---

### PATCH /notifications/read-all _(protected)_

Mark all notifications for the user as read.

**Response 200:**

```json
{
  "markedCount": 3,
  "message": "All notifications marked as read."
}
```

---

### DELETE /notifications/:id _(protected)_

Dismiss/delete a notification item.

**Response 204:** No content.

---

## Error Format

ALL error responses must use this shape:

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Description too long.",
  "field": "description",
  "details": null
}
```

**Common error codes:**

| Code               | HTTP Status | Meaning                                   |
| ------------------ | ----------- | ----------------------------------------- |
| `VALIDATION_ERROR` | 400         | Invalid request data                      |
| `UNAUTHORIZED`     | 401         | Missing or invalid token                  |
| `FORBIDDEN`        | 403         | Valid token but insufficient permissions  |
| `NOT_FOUND`        | 404         | Resource doesn't exist                    |
| `CONFLICT`         | 409         | Duplicate (e.g. email already registered) |
| `RATE_LIMITED`     | 429         | Too many requests                         |
| `INTERNAL_ERROR`   | 500         | Server error                              |

---

## Payload Limits (Enforced by App — Backend Must Also Validate)

| Field             | Limit                          |
| ----------------- | ------------------------------ |
| Issue title       | 5–100 chars                    |
| Issue description | 5–300 words, max 2000 chars    |
| Location label    | max 200 chars                  |
| Chatbot message   | 1–500 chars                    |
| Attachments       | max 3 files, 5MB each (future) |
| Name              | 2–80 chars                     |
| Password          | 8–128 chars                    |
