# NEHU Grievance System — Reporting & Timeline Architecture

> **Audience**: Harsh (Go Backend), Soumojit (FastAPI AI), and Nikunj (Mobile App).  
> **Status**: Mobile App Phase 5 (Issue Timeline) & Phase 6 (Standard Report Form) Completed.

---

## 1. Overview & System Context

This document explains **what has been built** in the mobile app across **Phase 5** and **Phase 6**, **how it functions**, and **how it integrates with the backend API**:

```
[Student / Faculty Mobile App]
       │
       ├──► 1. Report Hub (/report) ──► Choice: Standard Form OR AI Chatbot
       │
       ├──► 2. Standard Form (/report/form)
       │        ├── Verified Student Identity Banner
       │        ├── Category & Subcategory Visual Picker
       │        ├── GPS Auto-detect & NEHU Campus Landmarks
       │        ├── Title (5–100 chars) & Description (5–300 words)
       │        └── [Submit] ──► POST /issues (Go Backend)
       │                              │
       │                   ┌──────────┴──────────┐
       │                   ▼                     ▼
       │            [Standard Report]     [Duplicate Linked]
       │                   │                     │
       └──◄ 3. Grievance Detail Screen (/issues/:id) ◄───┘
                └── Interactive Chronological Resolution Timeline (<Timeline />)
```

---

## 2. Phase 5: Grievance Resolution Timeline

### 2.1 Component Architecture
- **Location**: `src/components/issue/TimelineStep.tsx` & `src/components/issue/Timeline.tsx`
- **Integrated In**: `app/(app)/issues/[id].tsx`

### 2.2 Visual Node Design
Each timeline event represents an administrative action or status transition:
- **Status Icons & Color Scheme**:
  - `SUBMITTED`: Blue paper plane (`#003DA5`)
  - `UNDER_REVIEW`: Sky blue magnifying glass (`#0284C7`)
  - `ASSIGNED`: Purple person assigned (`#7C3AED`)
  - `IN_PROGRESS`: Amber wrench/hammer (`#B45309`)
  - `RESOLVED`: Green checkmark (`#16A34A`)
  - `CLOSED`: Gray padlock (`#4B5563`)
  - `ESCALATED`: Red warning circle (`#DC2626`)
  - `COMMENT`: Blue speech bubble (`#003DA5`)
- **Actor Badges**:
  - `Admin`: Primary blue badge (e.g. "NEHU Estate Office", "Technician B. Sangma")
  - `User`: Secondary amber badge (e.g. "Nikunj Maheshwari (Student)")
  - `System`: Neutral gray badge (e.g. "Automated Triage")
- **Timestamps**:
  - Displays relative time (`3 hours ago`, `Yesterday`) plus exact formatted date/time (`21 Sep 2026, 04:30 PM`).

### 2.3 Expected Backend Timeline Event Payload
When `GET /issues/:id` is called by the app, Harsh's Go backend should return the `timeline` array:

```json
{
  "id": "e3b0c442-98fc-1c14-9afb-4c9012345678",
  "title": "Water geyser malfunctioning in Boys Hostel 3",
  "status": "IN_PROGRESS",
  "assignedTo": "Estate Maintenance Division (Technician: B. Sangma)",
  "timeline": [
    {
      "id": "tl-001",
      "event": "SUBMITTED",
      "title": "Grievance Submitted",
      "message": "Report filed successfully and queued for administrative review.",
      "timestamp": "2026-09-21T06:00:00Z",
      "actor": "user",
      "actorName": "Nikunj Maheshwari (Student)"
    },
    {
      "id": "tl-002",
      "event": "UNDER_REVIEW",
      "title": "Verified by Proctor & Estate Cell",
      "message": "Inspected and confirmed as urgent electrical heating defect.",
      "timestamp": "2026-09-21T08:30:00Z",
      "actor": "admin",
      "actorName": "Estate Supervisor"
    },
    {
      "id": "tl-003",
      "event": "ASSIGNED",
      "title": "Assigned to Electrician On Duty",
      "message": "Assigned to maintenance technician B. Sangma.",
      "timestamp": "2026-09-21T10:15:00Z",
      "actor": "admin",
      "actorName": "NEHU Estate Office"
    },
    {
      "id": "tl-004",
      "event": "IN_PROGRESS",
      "title": "Inspection & Parts Order",
      "message": "Replacement heating coil and 16A breaker ordered from central store.",
      "timestamp": "2026-09-21T12:00:00Z",
      "actor": "admin",
      "actorName": "Technician B. Sangma"
    }
  ]
}
```

---

## 3. Phase 6: Standard Grievance Reporting Form

### 3.1 Report Hub (`app/(app)/report/index.tsx`)
Accessible via the central `+` action button in the bottom navigation bar:
- Presents the student with two reporting channels:
  1. **Standard Form**: Structured manual reporting with category selector and GPS.
  2. **AI Assistant**: Natural conversational audio/chat reporting with automatic categorization.
- Outlines the official NEHU Redressal SLA (3–7 business days) and 24x7 Emergency Anti-Ragging Helpline (`0364-272-1000`).

---

### 3.2 Category & Subcategory Picker (`src/components/issue/CategoryPicker.tsx`)
A visual 2-column grid covering all 8 official NEHU categories:

| Category ID | Display Label | Description | Subcategories |
|---|---|---|---|
| `INFRASTRUCTURE` | Infrastructure | Buildings, roads, electricity, water | Electricity, Water, Building, Road, Furniture |
| `HOSTEL` | Hostel | Rooms, facilities, mess, warden | Room Condition, Mess Food, Warden/Staff, Water, Electricity |
| `ACADEMICS` | Academics | Classes, faculty, exams, timetable | Classes, Faculty, Exam/Results, Timetable, Library |
| `HYGIENE` | Hygiene & Sanitation | Cleanliness, washrooms, waste | Washrooms, Waste Disposal, Campus Cleanliness |
| `SAFETY` | Safety & Ragging | Ragging, harassment, security | Ragging, Harassment, Security Concern, Accident |
| `IT_SERVICES` | IT & Network | WiFi, lab PCs, student portal | WiFi/Internet, Computer Lab, Student Portal, Printer |
| `ADMINISTRATION`| Administration | Fees, certificates, ID cards | Fee/Scholarship, Certificates, ID Card, Admin Staff |
| `OTHER` | Other | General campus issues | General Issue |

When a category is selected:
- The card highlights with a 2px colored border.
- A horizontal chip carousel expands below showing specific subcategories.
- The user can select a subcategory or proceed with general category triage.

---

### 3.3 Campus Location & GPS Auto-Detection (`src/services/location.service.ts`)
- **GPS Auto-Detection**:
  - Calls `expo-location` to get coordinates (`latitude`, `longitude`).
  - Calls `Location.reverseGeocodeAsync` to resolve street/subdistrict name.
  - Automatically tags `autoFetched: true` in payload.
- **1-Tap Quick NEHU Campus Landmarks**:
  Students can click any pre-configured landmark chip to populate the location instantly:
  - `Central Library, Reference Hall`
  - `School of Technology (Dept of IT / ECE / BME)`
  - `Science Complex (Physics & Chemistry Depts)`
  - `Administration Block (VC & Registrar Office)`
  - `Multi-Purpose Convention Hall`
  - `Boys Hostel Blocks 1, 2, 3, 4`
  - `Girls Hostel Blocks 1, 2, 3`
  - `NEHU Health Centre`
  - `Student Activity Centre (SAC)`
  - `Campus Main Gate 1 (Mawkynroh) / Gate 2 (Umshing)`

---

### 3.4 Client-Side Form Validation Rules
Matches server constraints defined in `src/constants/limits.ts`:
1. **Title**:
   - Minimum: 5 characters
   - Maximum: 100 characters
   - Character counter badge displayed in real-time.
2. **Category**:
   - Mandatory selection (`INFRASTRUCTURE`, `HOSTEL`, etc.).
3. **Location**:
   - Mandatory text (`label`), max 200 characters.
4. **Description**:
   - Minimum: 5 words
   - Maximum: 300 words (and max 2,000 characters)
   - Real-time word counter badge:
     - Amber if `< 5 words` ("Needs at least 5 words to explain the issue")
     - Green if `5–300 words`
     - Red if `> 300 words` ("Exceeds 300 word limit")

---

### 3.5 Exact Submission Payload Sent to Backend
When the student taps **Submit Grievance**, the app sends an authenticated `POST /issues` HTTP request:

```json
{
  "title": "Water geyser malfunctioning in Boys Hostel 3",
  "category": "HOSTEL",
  "subcategory": "HOSTEL_MESS",
  "description": "The geyser in the second-floor east wing bathroom has been tripping the circuit breaker for the past three days. No hot water in morning hours.",
  "location": {
    "label": "Boys Hostel 3, 2nd Floor East Wing",
    "latitude": 25.6054,
    "longitude": 91.8988,
    "autoFetched": true
  },
  "attachments": [],
  "source": "FORM",
  "metadata": {
    "appVersion": "1.0.0",
    "platform": "android"
  }
}
```

> **Note for Soumojit (AI Service)**:
> In **Phase 7 (AI Chatbot Reporter)**, when the student completes the chatbot interview and approves the draft, the app sends the **exact same payload structure**, with `"source": "CHATBOT"`.

---

### 3.6 Backend Response Handling
Harsh's Go backend returns a `SubmitIssueResponse`:

```json
{
  "issueId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "status": "SUBMITTED",
  "isDuplicate": false,
  "linkedIssueId": null,
  "message": "Grievance registered successfully."
}
```

- **Standard Case (`isDuplicate: false`)**:
  - Displays alert: *"Grievance Filed Successfully (#A1B2C3D4)"*.
  - Immediately navigates to `/(app)/issues/:id`.
- **Duplicate Linked Case (`isDuplicate: true`)**:
  - Go backend detects that cosine similarity against an existing active report is $\ge 0.85$.
  - App shows alert: *"Linked to Existing Campus Report: A similar grievance was already reported in this zone. Your report has been grouped for priority redressal."*
  - Automatically redirects to the linked issue tracking screen.

---

### 3.7 Offline Testing Support
If the Go backend is not running while Nikunj tests the mobile app:
- `src/hooks/useIssues.ts` detects the connection failure.
- Synthesizes a valid demo response with a real reference code (`#DEMO-XXXX`).
- Prepends the new issue to the local list so it immediately appears under "Recent Grievances" and "My Issues".
- Allows end-to-end testing on physical devices with zero server dependency.
