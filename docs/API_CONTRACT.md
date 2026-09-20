# API Contract — NEHU Issue Report & Feedback

> **For Backend Team (Go + FastAPI)**
> This document is the single source of truth for the mobile app ↔ backend API contract.
> Any changes must be agreed upon by the team and reflected here.

## Base URL

Configurable via the app's developer settings.
Default production: `https://api.nehu.ac.in/issues/v1`
Local dev (Go server): `http://localhost:8080/v1`

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
