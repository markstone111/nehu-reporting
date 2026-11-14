# NEHU Issue Report & Feedback System 📱🏛️

> **North-Eastern Hill University (NEHU), Shillong**  
> AI-Assisted Campus Issue Reporting, Intelligent Triage & Grievance Redressal System.

[![Expo SDK](https://img.shields.io/badge/Expo-SDK%2057%2F58-000020?style=flat&logo=expo)](https://expo.dev/)
[![React Native](https://img.shields.io/badge/React%20Native-0.86-61DAFB?style=flat&logo=react)](https://reactnative.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](./LICENSE)

---

## 🌟 Key Features

* **Verified University Identity:** Secure student/faculty registration with mandatory one-time ID Card image capture, on-device compression, and verification.
* **Dual-Channel Grievance Submission:**
  * **Standard Form:** GPS auto-detect, 1-tap campus landmark chips (Central Library, Science Complex, Kyllang Hostel, etc.), dynamic subcategory picker, and 5–300 word counter badge.
  * **AI Chatbot Reporter:** Multi-turn conversational triage powered by LLMs (Gemini / Groq / OpenAI) with natural language comprehension and 1-tap structured draft card generation.
* **Interactive Resolution Timeline:** Real-time step-by-step grievance tracking (`SUBMITTED` → `UNDER_REVIEW` → `ASSIGNED` → `IN_PROGRESS` → `RESOLVED` → `CLOSED` / `ESCALATED`) with actor attribution (Student, Admin Office, Maintenance Technicians).
* **Silent Duplicate Linking:** Detects existing issues in the same department/hostel and links reports to prevent duplicate administrative tickets while keeping all reporters notified.
* **Remote Push & In-App Notification Center:**
  * Firebase Cloud Messaging (FCM HTTP v1) integration.
  * Canva-inspired animated in-app floating toast banners for foreground alerts.
  * Deep linking: tapping a notification navigates straight into that grievance's detail view.
  * Filterable notification history (`All`, `Grievances`, `Advisory`) with unread badge counters.
* **Resilient Offline / Demo Mode:** Fully equipped with local mock fallbacks and a 1-tap "Verified Student Fast Sign-In" for rapid testing without requiring backend uptime.

---

## 🛠️ Technology Stack

* **Framework:** React Native with Expo (Expo Router v3 file-based routing)
* **Language:** TypeScript (Strict mode enabled)
* **State Management:** Zustand (Auth, Gateway Settings, UI state)
* **Server State & Caching:** TanStack React Query v5
* **Network & HTTP:** Axios with automatic JWT token refresh interceptors
* **Secure Storage:** `expo-secure-store` (Encrypted JWT tokens & FCM device tokens)
* **UI & Animations:** React Native Reanimated, Gesture Handler, Expo Vector Icons (Ionicons)
* **Location & Media:** `expo-location`, `expo-image-picker`, `expo-image-manipulator`
* **Notifications:** `expo-notifications`, `expo-device`

---

## 📖 Complete Documentation & API Contracts

All architectural specifications, database schemas, and API contracts live in the [`docs/`](./docs/README.md) directory:

* **[Master API Contract](./docs/API_CONTRACT.md):** Complete bidirectional specification of all payloads sent by the app and all responses expected from the server.
* **[Push Notifications & FCM Backend Guide](./docs/NOTIFICATIONS_AND_FCM_BACKEND_GUIDE.md):** Backend specification for FCM HTTP v1 dispatch, triggers, and PostgreSQL database schemas.
* **[Mobile Notification System & Deep Linking](./docs/NOTIFICATION_SYSTEM_AND_DEEP_LINKING.md):** Architecture of in-app banners, system tray handling, and deep link routing.
* **[Grievance Timeline Backend Guide](./docs/TIMELINE_BACKEND_GUIDE.md):** PostgreSQL schema for `issues` and `issue_timeline_events`.
* **[Chatbot Architecture & AI Guide](./docs/CHATBOT_ARCHITECTURE_AND_AI_GUIDE.md):** LLM triage state machine and prompt schemas.
* **[Presentation Scenarios & UI Specs](./docs/PRESENTATION_SCENARIOS_AND_UI_SPEC.md):** Exact dialogue turns and presentation demo scenarios.

---

## 🚀 Getting Started

### Prerequisites
* Node.js v20+ or v22+
* npm or pnpm
* Android or iOS device with **Expo Go** (or a development build)

### Installation
```bash
# Clone the repository
git clone https://github.com/markstone111/nehu-reporting.git
cd nehu-issue-report-feedback

# Install dependencies
npm install

# Start the Expo Metro Bundler
npx expo start -c
```

### Running on Your Phone
1. Open **Expo Go** on your Android device (or native Camera on iOS).
2. Scan the QR code displayed in your terminal.
3. Tap **"Verified Student Fast Sign-In"** on the login screen to enter the app immediately!

---

## 🧪 Verification & Linting

```bash
# TypeScript strict type check
npm run type-check

# ESLint code quality check
npm run lint

# Code formatting check
npm run format:check
```

---

## 📄 License
This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.
