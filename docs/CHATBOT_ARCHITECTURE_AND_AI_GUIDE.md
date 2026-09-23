# NEHU Grievance System — AI Chatbot Reporter Architecture

> **Audience**: Soumojit (FastAPI / AI Microservice), Harsh (Go Backend), and Nikunj (Mobile App).  
> **Status**: Mobile App Phase 7 (AI Chatbot Reporter) Completed.

---

## 1. Overview & Vision

The **AI Chatbot Reporter** is designed to eliminate friction for students and faculty filing campus grievances at North-Eastern Hill University (NEHU, Shillong). Instead of navigating complex category dropdowns and writing formal letters, users can describe their problem in **natural language, campus slang, or WhatsApp-style informal phrasing**.

The AI assistant engages in a rapid, multi-turn conversational interview to:

1. Identify the administrative domain (e.g., `HOSTEL`, `IT_SERVICES`, `INFRASTRUCTURE`).
2. Pinpoint the exact campus location (building, floor, hostel, room).
3. Elicit critical missing details (e.g., duration, severity, affected students).
4. Synthesize a formal grievance draft.
5. Present a **Draft Review Card** for 1-tap student approval and submission to Harsh's Go backend.

```
[Student Mobile App]
      │
      │ 1. POST /chatbot/message (raw informal text)
      ▼
[Soumojit's FastAPI Microservice] ◄──► [LLM: Groq / Gemini / OpenAI]
      │
      │ 2. Returns botMessage + sessionState (draftIssue when complete)
      ▼
[Mobile App: Draft Review Card]
      │
      │ 3. Student taps "Confirm & Submit Grievance"
      ▼
[Harsh's Go Backend: POST /issues]
      │
      ▼
[PostgreSQL Database & Vector Duplicate Engine]
```

---

## 2. API Contract with Soumojit's FastAPI Service

### 2.1 Endpoint: `POST /chatbot/message`

- **Timeout**: `30,000ms` (30 seconds)
- **Authentication**: Bearer Token in HTTP Authorization header (`Authorization: Bearer <JWT>`)

#### Request Body (`ChatMessageRequest`):

```json
{
  "sessionId": "b4c1e092-2345-4a6f-9876-123456789abc",
  "message": "bro no drinking water in boys hostel 2 since yesterday morning taps are totally dry",
  "sessionState": {
    "category": null,
    "subcategory": null,
    "collectedFields": [],
    "pendingFields": ["category", "location", "description"],
    "complete": false,
    "draftIssue": null
  }
}
```

_Note_: On the first message, `sessionId` and `sessionState` can be `null`. The server initializes the session and generates a `sessionId`.

#### Response Body (`ChatMessageResponse`):

```json
{
  "sessionId": "b4c1e092-2345-4a6f-9876-123456789abc",
  "botMessage": "Got it. I've noted that drinking water is unavailable in Boys Hostel 2. Which floor or wing is most affected, and have you notified the caretaker?",
  "sessionState": {
    "category": "HOSTEL",
    "subcategory": "HOSTEL_WATER",
    "collectedFields": ["category", "location"],
    "pendingFields": ["description"],
    "complete": false,
    "draftIssue": null
  }
}
```

---

### 2.2 Completion Response & Draft Synthesis

When the LLM determines all necessary fields have been collected (or user provides enough context in 1–2 turns), it sets `complete: true` and includes `draftIssue`:

```json
{
  "sessionId": "b4c1e092-2345-4a6f-9876-123456789abc",
  "botMessage": "I have structured your complaint into a formal grievance draft below. Please review the details and confirm to submit it directly to the estate office.",
  "sessionState": {
    "category": "HOSTEL",
    "subcategory": "HOSTEL_WATER",
    "collectedFields": ["category", "location", "description"],
    "pendingFields": [],
    "complete": true,
    "draftIssue": {
      "title": "Drinking water supply failure in Boys Hostel 2",
      "category": "HOSTEL",
      "subcategory": "HOSTEL_WATER",
      "description": "Drinking water taps have been completely dry since yesterday morning on the second floor of Boys Hostel 2. Multiple residents are affected.",
      "location": {
        "label": "Boys Hostel 2, 2nd Floor",
        "latitude": 25.6054,
        "longitude": 91.8988,
        "autoFetched": false
      }
    }
  }
}
```

---

### 2.3 Endpoint: `DELETE /chatbot/:sessionId`

- Called when the user exits the chatbot screen mid-session or taps **Reset**.
- Best-effort cleanup allowing FastAPI to release conversational context / Redis memory.

---

## 3. Submission to Harsh's Go Backend (`POST /issues`)

When the student reviews the **Draft Review Card** and taps **Confirm & Submit Grievance**, the mobile app automatically packages the draft into the standard `SubmitIssueRequest` payload:

```json
{
  "title": "Drinking water supply failure in Boys Hostel 2",
  "category": "HOSTEL",
  "subcategory": "HOSTEL_WATER",
  "description": "Drinking water taps have been completely dry since yesterday morning on the second floor of Boys Hostel 2. Multiple residents are affected.",
  "location": {
    "label": "Boys Hostel 2, 2nd Floor",
    "latitude": 25.6054,
    "longitude": 91.8988,
    "autoFetched": false
  },
  "attachments": [],
  "source": "CHATBOT",
  "metadata": {
    "appVersion": "1.0.0",
    "platform": "android"
  }
}
```

### Key Synergy:

- **`source: "CHATBOT"`**: Informs Harsh's backend that this report was generated through AI conversational triage.
- Duplicate detection runs **identically** as it does for standard forms (cosine similarity against PostgreSQL pgvector embeddings).
- On success, the student is redirected to `app/(app)/issues/[id].tsx` to see their report tracked on the live timeline!

---

## 4. Mobile App UI/UX Details

1. **[ChatBubble.tsx](file:///c:/Users/nikun/OneDrive/Desktop/minor_project_NEHU/nehu-issue-report-feedback/src/components/chatbot/ChatBubble.tsx)**:
   - User speech bubble in NEHU Blue (`#003DA5`) with white text and delivery time.
   - Assistant speech bubble in crisp white with subtle border and sparkle AI badge.
   - System message chip for informational status updates.

2. **[TypingIndicator.tsx](file:///c:/Users/nikun/OneDrive/Desktop/minor_project_NEHU/nehu-issue-report-feedback/src/components/chatbot/TypingIndicator.tsx)**:
   - 3 looping animated pulsing dots providing instant feedback during LLM latency.

3. **[ChatInput.tsx](file:///c:/Users/nikun/OneDrive/Desktop/minor_project_NEHU/nehu-issue-report-feedback/src/components/chatbot/ChatInput.tsx)**:
   - Multiline expandable input with character counter (max 500 characters).
   - 1-tap quick suggestion prompt chips for common complaints (WiFi in Library, Hostel water, Broken streetlights, Washrooms).

4. **[DraftReviewCard.tsx](file:///c:/Users/nikun/OneDrive/Desktop/minor_project_NEHU/nehu-issue-report-feedback/src/components/chatbot/DraftReviewCard.tsx)**:
   - Amber-accented review surface presenting the synthesized title, category badges, location, and description.
   - 1-tap **Confirm & Submit** button, **Add More Details** button, and **Start Over** button.

5. **[useChatbot.ts](file:///c:/Users/nikun/OneDrive/Desktop/minor_project_NEHU/nehu-issue-report-feedback/src/hooks/useChatbot.ts)**:
   - React state machine managing messages, typing state, session IDs, and draft generation.
   - Embedded intelligent local simulator for offline phone testing prior to backend deployment.
