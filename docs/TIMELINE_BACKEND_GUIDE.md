# Grievance Timeline & Status Tracking: Backend Specification

> **For Harsh Kumar Chaurasia (Go Backend Team)**  
> **Project:** NEHU AI-Assisted Feedback & Issue Resolution System  
> **Reference Document:** Single source of truth for grievance timeline event tracking.

---

## 1. Overview & Architecture

In campus grievance redressal, transparency is essential. When a student or faculty member files a complaint, they must not feel that it "disappeared into a black hole."

The mobile app includes a **Resolution Timeline** in the Issue Detail screen. Every status change, assignment, inspection note, or resolution action recorded by university administration creates an immutable **Timeline Event**.

---

## 2. Recommended Database Schema (PostgreSQL)

### `issues` table
```sql
CREATE TABLE issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    title VARCHAR(120) NOT NULL,
    description TEXT NOT NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'SUBMITTED', 
    -- 'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED'
    category VARCHAR(50) NOT NULL,
    subcategory VARCHAR(50),
    location_label VARCHAR(150) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    auto_fetched_location BOOLEAN DEFAULT FALSE,
    assigned_to VARCHAR(100), -- e.g. "Hostel Maintenance Division (Estate Office)"
    is_duplicate BOOLEAN DEFAULT FALSE,
    linked_issue_id UUID REFERENCES issues(id),
    linked_count INT DEFAULT 1,
    source VARCHAR(20) NOT NULL DEFAULT 'FORM', -- 'FORM' or 'CHATBOT'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### `issue_timeline_events` table
```sql
CREATE TABLE issue_timeline_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    issue_id UUID NOT NULL REFERENCES issues(id) ON DELETE CASCADE,
    event VARCHAR(30) NOT NULL, 
    -- 'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'ESCALATED', 'COMMENT'
    message TEXT NOT NULL,
    actor VARCHAR(20) NOT NULL, -- 'user', 'admin', 'system'
    actor_name VARCHAR(100) NOT NULL, -- e.g. "Nikunj Maheshwari (Student)", "Proctor Office", "Technician B. Sangma"
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_timeline_issue_id ON issue_timeline_events(issue_id, created_at ASC);
```

---

## 3. Standard Grievance Lifecycle Events

When building the Go backend logic, trigger timeline entries automatically as follows:

| Stage | Trigger Condition | Example `event` | Example `message` | `actor` |
|---|---|---|---|---|
| **1. Submission** | On `POST /issues` | `SUBMITTED` | "Grievance submitted by student." | `user` |
| **2. Triage** | Admin opens & reviews | `UNDER_REVIEW` | "Report reviewed and verified by Proctor Office." | `admin` |
| **3. Delegation** | Admin assigns dept/officer | `ASSIGNED` | "Assigned to Estate Maintenance Team (Technician: B. Sangma)." | `admin` |
| **4. In Action** | Work/repair begins | `IN_PROGRESS` | "Inspection in progress. Replacement heating element requested." | `admin` |
| **5. Resolution** | Work completed | `RESOLVED` | "Heating coil replaced. Hot water service verified and restored." | `admin` |
| **6. Closure** | Student confirms or after 7 days | `CLOSED` | "Issue closed upon student confirmation." | `system` / `user` |
| **Escalation** | Exceeds SLA timeframe | `ESCALATED` | "Issue escalated to Dean of Student Welfare due to delay." | `system` |

---

## 4. Expected API Response: `GET /issues/:id`

When the mobile app requests `GET /issues/:id`, the Go backend should return the issue object with the ordered `timeline` array:

```json
{
  "id": "c7a8b6e2-1a2b-4c3d-8e4f-5a6b7c8d9e0f",
  "title": "Water geyser malfunctioning in Boys Hostel 3",
  "description": "The geyser in the second-floor bathroom has been tripping the circuit breaker for 3 days. No hot water in morning hours.",
  "status": "IN_PROGRESS",
  "category": "HOSTEL",
  "subcategory": "HOSTEL_MESS",
  "assignedTo": "Hostel Maintenance Division (Estate Office)",
  "location": {
    "label": "Boys Hostel 3, 2nd Floor East Wing",
    "latitude": 25.6054,
    "longitude": 91.8988,
    "autoFetched": true
  },
  "attachments": [],
  "source": "FORM",
  "isDuplicate": false,
  "linkedIssueId": null,
  "linkedCount": 1,
  "createdAt": "2026-09-21T06:00:00Z",
  "updatedAt": "2026-09-21T10:30:00Z",
  "timeline": [
    {
      "id": "tl-001",
      "event": "SUBMITTED",
      "message": "Grievance registered and queued for triage.",
      "timestamp": "2026-09-21T06:00:00Z",
      "actor": "user",
      "actorName": "Nikunj Maheshwari (Student)"
    },
    {
      "id": "tl-002",
      "event": "UNDER_REVIEW",
      "message": "Reviewed by Proctorial & Estate Cell.",
      "timestamp": "2026-09-21T07:45:00Z",
      "actor": "admin",
      "actorName": "NEHU Estate Office"
    },
    {
      "id": "tl-003",
      "event": "ASSIGNED",
      "message": "Assigned to Estate Maintenance Team (Technician: B. Sangma).",
      "timestamp": "2026-09-21T09:15:00Z",
      "actor": "admin",
      "actorName": "Estate Supervisor"
    },
    {
      "id": "tl-004",
      "event": "IN_PROGRESS",
      "message": "Heating element replacement ordered from central store.",
      "timestamp": "2026-09-21T10:30:00Z",
      "actor": "admin",
      "actorName": "Technician B. Sangma"
    }
  ]
}
```

---

## 5. Field Types & Validation Summary

| Field | Type | Description |
|---|---|---|
| `id` | `string` (UUID) | Unique timeline event ID |
| `event` | `string` (Enum) | One of: `SUBMITTED`, `UNDER_REVIEW`, `ASSIGNED`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`, `ESCALATED`, `COMMENT` |
| `message` | `string` | 1-2 sentence human description of what action occurred |
| `timestamp` | `string` (ISO 8601) | e.g. `2026-09-21T10:30:00Z` |
| `actor` | `string` (Enum) | `'user'` \| `'admin'` \| `'system'` |
| `actorName` | `string` | Display name of the person or department performing the step |

---

## 6. How Mobile Handles the Data

- Mobile hook: `useIssueDetail(id)` in [`src/hooks/useIssues.ts`](../src/hooks/useIssues.ts).
- Mobile UI: renders each step chronologically with color-coded nodes, actor credentials, and relative timestamps ("2 hours ago").
- While backend development is underway, the mobile app utilizes mock fallbacks matching this exact schema so testing continues seamlessly.
- Once the Go endpoint is live, the app switches without any frontend redesign.
