# NEHU Mobile App — Task Tracker

## Phase 1 — Project Scaffolding & Core Infrastructure ✅
- [x] Scaffold Expo project (blank TypeScript template)
- [x] Install all core dependencies
- [x] Configure path aliases (@/ → src/)
- [x] Set up ESLint + Prettier + TypeScript strict mode
- [x] Create full folder structure (all directories + index files)
- [x] src/constants/theme.ts — colors, fonts, spacing, shadows
- [x] src/constants/limits.ts — all payload limits
- [x] src/constants/categories.ts — issue categories + subcategories
- [x] src/api/client.ts — Axios instance, interceptors, token refresh
- [x] src/store/settings.store.ts — backend URL, dev toggles
- [x] src/store/auth.store.ts — user, tokens
- [x] src/services/storage.service.ts — AsyncStorage + SecureStore abstraction
- [x] src/utils/ — text, date, validation utils
- [x] src/api/auth.api.ts, issues.api.ts, chatbot.api.ts
- [x] src/types/api.types.ts — complete API contract types
- [x] app/_layout.tsx — root layout with auth guard
- [x] app/(auth)/_layout.tsx + app/(app)/_layout.tsx
- [x] All placeholder screens for all routes
- [x] docs/API_CONTRACT.md — full backend contract
- [x] .gitignore (includes .local/, .env, google-services.json)
- [x] .env.example, .prettierrc, eslint.config.js
- [x] TypeScript check: 0 errors

## Phase 2 — Authentication ✅
- [x] docs/id_card_image_from_app_to_backend.md — full ID card lifecycle doc
- [x] src/utils/error.utils.ts — normalized error strings & messages
- [x] src/services/image.service.ts — camera/gallery ID card picker & manipulator compression
- [x] src/components/common/Button.tsx — Canva-style button with loading, variants, sizes
- [x] src/components/common/Input.tsx — Canva-style input with eye password toggle, focus ring, errors
- [x] src/components/common/Card.tsx — Elevated Canva surface card
- [x] src/components/layout/ScreenWrapper.tsx — SafeArea + KeyboardAvoidingView
- [x] src/hooks/useAuth.ts — TanStack Query login, register, logout with SecureStore sync
- [x] app/(auth)/login.tsx — complete production-grade UI with NEHU branding
- [x] app/(auth)/register.tsx — complete production-grade UI with role selection & ID card verification
- [x] Auth guard in layout & hydration check verified
- [x] TypeScript check: 0 errors

## Phase 3 — Common Components & Design System ✅
- [x] Button, Input, Badge, Card, Avatar, StatusChip
- [x] ScreenWrapper, Header layout components

## Phase 4 — Home + Issue List & Details ✅
- [x] src/api/issues.api.ts — verified contract endpoints
- [x] src/hooks/useIssues.ts — TanStack Query hooks with demo fallbacks
- [x] src/components/issue/IssueCard.tsx — Canva-inspired card with status, category, location, time
- [x] src/components/issue/EmptyState.tsx — clean placeholder with action CTA
- [x] Tab bar layout updated with native Ionicons & central report action
- [x] app/(app)/index.tsx — Home Dashboard with metrics, quick report cards, recent grievances, safety cell
- [x] app/(app)/issues/index.tsx — My Issues list with search, status filter chips, pull-to-refresh
- [x] app/(app)/issues/[id].tsx — Issue detail screen with tracking code, duplicate alert, location, timeline
- [x] app/(app)/profile.tsx — Profile view with ID verified badge, logout, and hidden dev settings
- [x] TypeScript check: 0 errors

## Phase 5 — Issue Timeline ✅
- [x] Timeline + TimelineStep components
- [x] Integrate into Issue detail screen

## Phase 6 — Standard Report Form
- [ ] Location service (Expo Location + reverse geocode)
- [ ] Category picker component
- [ ] Full report form (word count, category, location, attachment placeholder)

## Phase 7 — AI Chatbot Reporter
- [ ] Chatbot types + session state machine
- [ ] src/api/chatbot.api.ts
- [ ] ChatBubble, ChatInput, TypingIndicator components
- [ ] Full chatbot screen + draft review card

## Phase 8 — Notifications
- [ ] FCM service setup
- [ ] Notification history screen
- [ ] In-app foreground toast
- [ ] Deep link handler

## Phase 9 — Profile + Dev Settings
- [ ] Profile screen
- [ ] Long-press → backend URL modal (hidden)

## Phase 10 — Docs, Tests, CI
- [ ] All docs/ files
- [ ] Unit tests (Jest + RNTL)
- [ ] E2E flows (Maestro)
- [ ] GitHub Actions CI
