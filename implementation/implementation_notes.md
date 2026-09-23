# NEHU Mobile App — Local Reference & Implementation Notes

## Finalized Decisions (2026-09-21)

| Decision | Choice |
|---|---|
| Duplicate UX | Silent link → show toast "Your report was linked to an existing issue" |
| Anonymous reporting | NOT allowed — full identity always required |
| ID card upload | One-time at registration only |
| Chatbot language | English only (handle informal/WhatsApp-style text) |
| File attachments | Future — scaffold exists, button shows "Coming Soon" |
| Backend URL setting | Long-press version text in Profile → modal |
| LLM keys | Server-side only (FastAPI) |

## Phase Completion Log

### Phase 1 — Scaffolding & Core Infrastructure ✅
- Expo SDK 57, blank TypeScript template
- Expo Router v3, Zustand, TanStack Query, Axios
- expo-secure-store, expo-location, expo-image-picker, expo-font
- @expo-google-fonts/inter, react-native-reanimated, react-native-gesture-handler
- @react-native-async-storage/async-storage
- ESLint + Prettier configured
- Strict TypeScript, @/ path alias
- Full folder structure created

**Files created:**
- `tsconfig.json` — strict TS + @/ alias
- `babel.config.js` — reanimated plugin last
- `app.json` — expo config with all plugins
- `eslint.config.js`, `.prettierrc`
- `.gitignore` — added .local/, .env, google-services.json

**src/ files:**
- `constants/theme.ts` — full design system
- `constants/limits.ts` — all payload limits
- `constants/categories.ts` — issue category taxonomy
- `types/api.types.ts` — complete API contract
- `store/auth.store.ts` — Zustand auth store
- `store/settings.store.ts` — Zustand settings (backend URL)
- `services/storage.service.ts` — SecureStore + AsyncStorage abstraction
- `api/client.ts` — Axios client with interceptors + token refresh
- `api/auth.api.ts` — auth endpoints
- `api/issues.api.ts` — issues endpoints
- `api/chatbot.api.ts` — chatbot endpoint
- `utils/text.utils.ts` — text helpers
- `utils/date.utils.ts` — date formatters
- `utils/validation.utils.ts` — form validators

**app/ files:**
- `_layout.tsx` — root layout (fonts, QueryClient, GestureHandler)
- `(auth)/_layout.tsx` — auth route guard
- `(app)/_layout.tsx` — protected layout + tab navigator
- All placeholder screens for all routes

### Phase 2 — Authentication Screens & Verification ✅
- Documented ID card pipeline in `docs/id_card_image_from_app_to_backend.md`
- Installed `@expo/vector-icons` for professional native icons (Ionicons)
- `src/utils/error.utils.ts` — friendly normalized error parser
- `src/services/image.service.ts` — camera + gallery picker, JPEG compression via expo-image-manipulator, Base64 converter
- `src/components/common/Button.tsx` — Canva-inspired button (primary, secondary, outline, ghost, danger)
- `src/components/common/Input.tsx` — Accessible input with floating labels, error text, and password eye toggle
- `src/components/common/Card.tsx` — Elevated surface card
- `src/components/layout/ScreenWrapper.tsx` — SafeAreaView + KeyboardAvoidingView container
- `src/hooks/useAuth.ts` — TanStack Query mutations for login, register, logout with SecureStore tokens sync
- `app/(auth)/login.tsx` — Full production login UI with NEHU branding, credentials validation, error handling
- `app/(auth)/register.tsx` — Full production register UI with role selection (Student/Faculty/Staff), ID card camera/gallery capture, preview & remove, and validation
- TypeScript check: **0 errors**

### Phase 3 — Common Components & Design System Polish ✅
- `src/components/common/Badge.tsx` — Semantic badges (primary, secondary, success, warning, error, info, neutral)
- `src/components/common/StatusChip.tsx` — Grievance status indicator with colored dot mapping to all 7 IssueStatus values
- `src/components/common/Avatar.tsx` — Canva-inspired profile photo with fallback to initials
- `src/components/layout/Header.tsx` — Standard top bar with back navigation and right slot

### Phase 4 — Home Dashboard, Grievance List & Details ✅
- `src/hooks/useIssues.ts` — TanStack Query hooks (`useMyIssues`, `useIssueDetail`, `useSubmitIssue`) with resilient demo fallback data for phone testing
- `src/components/issue/IssueCard.tsx` — Grievance summary card with category, status, title, location, and relative time
- `src/components/issue/EmptyState.tsx` — Clean placeholder state with call-to-action button
- `app/(app)/_layout.tsx` — Tab bar upgraded with native Ionicons & prominent central report action
- `app/(app)/index.tsx` — Home Dashboard with live metrics, quick action cards, recent grievances, and emergency contacts
- `app/(app)/issues/index.tsx` — My Issues list with search, status filters (All, In Progress, Resolved, Closed), and pull-to-refresh
- `app/(app)/issues/[id].tsx` — Detailed grievance view with status tracking, duplicate alert, location, and timeline
- `app/(app)/profile.tsx` — Profile view with ID verified badge, logout, and hidden dev settings
- Added "Explore with Demo Account" button to `app/(auth)/login.tsx` for immediate mobile testing
- TypeScript check: **0 errors**

### Phase 5 — Grievance Resolution Timeline ✅
- `src/components/issue/TimelineStep.tsx` — Step item with color-coded status icons, connecting vertical tracking lines, actor badges (Admin/User/System), and timestamps
- `src/components/issue/Timeline.tsx` — Chronological sorting timeline container, empty state for new grievances, and resolution milestone footer
- `app/(app)/issues/[id].tsx` — Integrated the modular `<Timeline />` component and cleaned up inline styles
- `docs/TIMELINE_BACKEND_GUIDE.md` — Guide for Harsh on PostgreSQL timeline schema and event structure
- TypeScript check: **0 errors**

### Phase 6 — Standard Grievance Reporting Form ✅
- `src/services/location.service.ts` — `expo-location` GPS coordinate acquisition, reverse geocoding, and pre-defined NEHU landmarks (`CAMPUS_LANDMARKS`)
- `src/components/issue/CategoryPicker.tsx` — Canva-inspired 2-column visual grid covering all 8 NEHU categories with active states and dynamic subcategory chip shelf
- `app/(app)/report/index.tsx` — Report Hub screen presenting Standard Form vs AI Chatbot channels, SLA turnaround guidance, and anti-ragging helpline notice
- `app/(app)/report/form.tsx` — Full production-grade reporting form with verified student identity badge, character counter, GPS auto-detect + 1-tap landmark chips, word counter badge (5–300 words), attachment placeholder, and duplicate detection alert
- `src/hooks/useIssues.ts` — Updated `useSubmitIssue` with local fallback so offline testing succeeds smoothly
- `docs/REPORT_AND_TIMELINE_IMPLEMENTATION.md` — Comprehensive architectural guide for backend and AI teammates
- TypeScript check: **0 errors**

## Next: Phase 7 — AI Chatbot Reporter
- Chatbot session state machine & types (`src/types/api.types.ts`)
- Chatbot API client (`src/api/chatbot.api.ts` connecting to FastAPI microservice)
- Chat UI components: `ChatBubble.tsx`, `ChatInput.tsx`, `TypingIndicator.tsx`
- Full conversational reporter screen: `app/(app)/report/chatbot.tsx`
- Structured draft review card with 1-tap approval & submission into `POST /issues`

## Known Issues / Notes
- Node v22.12.0 is one patch behind required ^22.13.0 — just warnings, works fine
- All EBADENGINE warnings can be ignored — they are non-blocking
- ESLint installed with --legacy-peer-deps due to React 19 peer dep conflict
- google-services.json is gitignored — each dev generates their own from Firebase Console
