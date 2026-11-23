# NEHU Issue Report & Feedback — Technical Documentation

> **North-Eastern Hill University (NEHU), Shillong**  
> AI-Assisted Campus Issue Reporting & Grievance Redressal System  
> Master Documentation Directory for Frontend Developers, Backend Engineers, and AI Integrators.

---

## 📚 Documentation Index

| Document | Primary Audience | Description |
| :--- | :--- | :--- |
| **[`API_CONTRACT.md`](./API_CONTRACT.md)** | Full Team (Mobile + Backend) | **Single Source of Truth.** Master bidirectional API specification detailing all request/response payloads, headers, query parameters, validation limits, and error codes. |
| **[`NOTIFICATIONS_AND_FCM_BACKEND_GUIDE.md`](./NOTIFICATIONS_AND_FCM_BACKEND_GUIDE.md)** | Go Backend & FastAPI Engineers | Complete backend specification for Firebase Cloud Messaging (FCM HTTP v1), PostgreSQL schemas (`user_fcm_tokens`, `notifications`), push trigger matrix, and sample Go/Python dispatchers. |
| **[`NOTIFICATION_SYSTEM_AND_DEEP_LINKING.md`](./NOTIFICATION_SYSTEM_AND_DEEP_LINKING.md)** | Mobile Engineers & QA | Comprehensive mobile architecture guide for foreground/background/killed state handling, in-app toast banners, Android notification channels, and curl test commands. |
| **[`TIMELINE_BACKEND_GUIDE.md`](./TIMELINE_BACKEND_GUIDE.md)** | Go Backend Engineers | PostgreSQL relational schema, timeline event tracking models (`issue_timeline_events`), status progression rules, and actor attribution logic for the grievance resolution timeline. |
| **[`CHATBOT_ARCHITECTURE_AND_AI_GUIDE.md`](./CHATBOT_ARCHITECTURE_AND_AI_GUIDE.md)** | FastAPI / LLM Engineers | Conversational AI triage pipeline architecture, session state machine, prompt schemas, and multi-turn field extraction (category, location, description). |
| **[`REPORT_AND_TIMELINE_IMPLEMENTATION.md`](./REPORT_AND_TIMELINE_IMPLEMENTATION.md)** | Full Stack & Contributors | Architectural breakdown of the Standard Grievance Reporting Form, GPS acquisition, reverse geocoding, campus landmark chips, and duplicate detection UX. |
| **[`id_card_image_from_app_to_backend.md`](./id_card_image_from_app_to_backend.md)** | Mobile & Auth Backend | Student identity verification pipeline: camera/gallery capture, on-device JPEG compression, Base64 encoding, and one-time registration upload rules. |
| **[`PRESENTATION_SCENARIOS_AND_UI_SPEC.md`](./PRESENTATION_SCENARIOS_AND_UI_SPEC.md)** | Product Leads & Presenters | Comprehensive demonstration scenarios (Academic Wi-Fi Outage and Kyllang Hostel Water Shortage) specifying exact dialogue turns, triage state transitions, and presentation layout. |

---

## 🏛️ System Architecture Summary

The NEHU Issue Reporting & Feedback platform connects campus members to university administration via an intelligent, multi-channel architecture:

```
[ NEHU Students / Faculty / Staff ]
                │
                ├── Standard Report Form (GPS auto-detect + Landmark chips)
                └── AI Chatbot Reporter (Gemini / Groq / OpenAI Conversational Triage)
                │
                ▼
      [ Mobile App (Expo / React Native) ]
                │
                ├── Secure Storage (Encrypted JWTs & FCM Device Tokens)
                ├── TanStack Query (Real-time caching & optimistic offline fallbacks)
                └── Deep Linking Engine (nehu:// & native notification routing)
                │
        HTTP / JSON REST API
                │
                ▼
      [ University Gateway Server (Go) ] ◀───▶ [ AI Service (FastAPI / LLM) ]
                │                                         │
                ├── PostgreSQL (Relational Data & Timelines)
                └── Firebase Cloud Messaging (FCM HTTP v1 API)
                                │
                                ▼
                [ Google Play Services / Remote Push ]
                                │
                                ▼
                    [ User's Mobile Device ]
```

---

## 🚀 Quick Reference for Contributing Developers

1. **Working on Mobile Screens:**
   - Refer to [`API_CONTRACT.md`](./API_CONTRACT.md) for data schemas before creating or modifying hooks in `src/hooks/`.
   - Never call `axios` directly; always route requests through `apiClient` in `src/api/client.ts`.
2. **Working on Backend Endpoints:**
   - Refer to [`NOTIFICATIONS_AND_FCM_BACKEND_GUIDE.md`](./NOTIFICATIONS_AND_FCM_BACKEND_GUIDE.md) and [`TIMELINE_BACKEND_GUIDE.md`](./TIMELINE_BACKEND_GUIDE.md) for database schemas and exact response formats.
3. **Working on AI / Chatbot:**
   - Refer to [`CHATBOT_ARCHITECTURE_AND_AI_GUIDE.md`](./CHATBOT_ARCHITECTURE_AND_AI_GUIDE.md) and [`PRESENTATION_SCENARIOS_AND_UI_SPEC.md`](./PRESENTATION_SCENARIOS_AND_UI_SPEC.md) for session state transitions.

