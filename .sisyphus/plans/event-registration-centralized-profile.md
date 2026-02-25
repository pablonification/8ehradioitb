# 8EH Event Registration with Centralized Profile

## TL;DR

> **Summary**: Build a centralized participant profile plus versioned event forms so users fill core biodata once and only answer event-specific or still-missing fields per event.
> **Deliverables**:
>
> - Reusable participant biodata profile module with configurable required field catalog
> - Event form builder in dashboard with field-request + explicit consent flow
> - Typeform-like participant registration flow with missing-field detection
> - Response exports to CSV, XLSX, and one-way Google Sheets sync
>   **Effort**: XL
>   **Parallel**: YES - 3 waves
>   **Critical Path**: 1 -> 2 -> 4 -> 6 -> 7 -> 8 -> 11 -> F3

## Context

### Original Request

Centralize repeated biodata questions across 8EH events so participants do not re-enter the same identity/contact fields every time, while organizers can request selected profile data and collect event-specific answers.

### Interview Summary

- Confirmed explicit per-event data consent before submission.
- Confirmed export target for MVP: CSV + XLSX + Google Sheets sync.
- Confirmed MVP validation preference: manual QA first (no mandatory new unit-test framework in initial scope).
- Confirmed dashboard-based form creation and modern Typeform-like participant experience.
- Confirmed baseline mandatory profile fields list from user input (name, birth date, faculty-major, NIM, phones, addresses, LINE, photo, cohort, division, social media).

### Metis Review (gaps addressed)

- Added route-collision guard for `middleware.ts` shortlink rewrite behavior.
- Added immutable form-version + immutable consent snapshot requirements.
- Added event-scoped server-side RBAC matrix for create/edit/read/export actions.
- Added deterministic export-column stability checks by form version.
- Added strict anti-scope-creep guardrails (no branching logic builder, no reverse sync, no automation workflows in MVP).

## Work Objectives

### Core Objective

Deliver a production-ready registration subsystem in the existing Next.js monolith where participant profile data is reusable across events and organizers only access data explicitly requested and consented for their event.

### Deliverables

- Data model extensions for events, profile fields, form versions, submissions, consent snapshots, and export audit logs.
- Dashboard UX for organizer event setup, field request selection, question builder, and export actions.
- Participant UX for step-based form completion with clear requested-data disclosure before submit.
- API endpoints for form version publish/read, missing-field resolution, submission, and export.
- QA evidence artifacts under `.sisyphus/evidence` for all tasks.

### Definition of Done (verifiable conditions with commands)

- `bun run lint` exits 0.
- `bun run build` exits 0.
- `bun run scripts/registration-smoke.mjs` exits 0 and prints `REGISTRATION_SMOKE_OK`.
- `bun run scripts/assert-export-columns.mjs --event open-house-2026 --version 1` exits 0 and prints `EXPORT_COLUMNS_STABLE`.
- `bun run scripts/assert-export-columns.mjs --event open-house-2026 --version 2` exits 0 and prints `EXPORT_COLUMNS_STABLE`.

### Must Have

- Explicit per-event consent summary listing requested profile fields before submission.
- Immutable published form versions; edits create new versions only.
- Submission snapshots (profile + answers + consent metadata) frozen at submit time.
- MVP participant audience is authenticated 8EH users under existing NextAuth whitelist flow.
- One final submission per participant per event in MVP; second submit attempt returns conflict (`409`).
- Organizer export actions restricted to event owners/admin roles only.
- Participant flow asks only missing requested profile fields plus event-specific questions.
- Google Sheets integration is one-way push from platform to a target sheet.
- Data retention follows existing database retention policy for MVP (no automatic purge job in this scope).

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- No in-place mutation of published form schema.
- No branching/conditional logic form builder in MVP.
- No organizer OAuth-per-user Google Sheets flow in MVP (central credential path only).
- No reverse sync from Google Sheets back to platform.
- No cross-event blanket consent reuse; consent remains explicit per event submission.
- No PII values in server logs or QA evidence files.

## Verification Strategy

> ZERO HUMAN INTERVENTION - all verification is agent-executed.

- Test decision: none (manual-QA-first scope) + command-driven smoke/API/Playwright checks without introducing mandatory unit-test framework.
- QA policy: every implementation task includes happy-path and failure/edge QA scenario with evidence files.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave.
> Wave 1: routing safeguards, schema foundation, shared contracts, auth/RBAC guard layer, scaffold routes.
> Wave 2: organizer builder UX, participant dynamic flow, atomic submission + snapshots, export engine.
> Wave 3: dashboard integration, rollout controls, smoke scripts, hardening, release checklist.

### Dependency Matrix (full, all tasks)

| Task | Depends On    | Blocks           |
| ---- | ------------- | ---------------- |
| 1    | -             | 2, 9, 10         |
| 2    | 1             | 3, 4, 5, 6, 7, 8 |
| 3    | 2             | 6, 7, 8, 9, 10   |
| 4    | 2             | 5, 6, 7, 8       |
| 5    | 2, 4          | 9, 10            |
| 6    | 2, 3, 4       | 7, 10            |
| 7    | 2, 3, 4, 6    | 8, 10, 11        |
| 8    | 2, 3, 4, 7    | 11               |
| 9    | 1, 3, 5       | 11               |
| 10   | 1, 3, 5, 6, 7 | 11               |
| 11   | 7, 8, 9, 10   | 12               |
| 12   | 7, 8, 11      | F1, F2, F3, F4   |

### Agent Dispatch Summary (wave -> task count -> categories)

- Wave 1 -> 5 tasks -> `deep`, `unspecified-high`, `quick`
- Wave 2 -> 4 tasks -> `visual-engineering`, `unspecified-high`, `deep`
- Wave 3 -> 3 tasks -> `unspecified-high`, `quick`, `general`

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task includes Agent Profile + Parallelization + QA Scenarios.

- [x] 1. Reserve Event Route Namespace and Middleware Guard

  **What to do**: Reserve `/events` namespace in `middleware.ts` shortlink exclusion list, define canonical registration route convention (`/events/[eventSlug]/register`), and add route-contract constants in a shared module used by API/UI.
  **Must NOT do**: Do not change existing shortlink behavior for unrelated routes and do not add broad wildcard exclusions beyond required event paths.

  **Recommended Agent Profile**:
  - Category: `quick` - Reason: Small but critical safeguard in routing layer.
  - Skills: [] - No specialized skill required for one-file guard plus constants.
  - Omitted: [`playwright`] - UI browser work not needed in this task.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [2, 9, 10] | Blocked By: [-]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `middleware.ts:4` - Reserved slug list currently controls rewrite eligibility.
  - Pattern: `middleware.ts:53` - Rewrite logic that can hijack non-reserved routes.
  - Pattern: `app/components/DashboardSidebar.jsx:12` - Existing route naming style and dashboard navigation conventions.
  - External: `https://nextjs.org/docs/app/building-your-application/routing/middleware` - Middleware matching/rewrite guard best practices.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bun run build` exits 0 after middleware and shared route constants update.
  - [ ] `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/events/test/register` returns `200` or `302`, never shortlink rewrite behavior.
  - [ ] `curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/random-short-slug` still behaves as shortlink rewrite path.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Event path bypasses shortlink rewrite
    Tool: Bash
    Steps: Start dev server; request /events/open-house/register and inspect response headers/body for absence of /api/redirect rewrite target.
    Expected: Route resolves as app route, not rewritten shortlink API.
    Evidence: .sisyphus/evidence/task-1-route-guard.txt

  Scenario: Non-reserved slug still rewrites
    Tool: Bash
    Steps: Request /abc123-slug and inspect Next response path.
    Expected: Request is rewritten to /api/redirect/abc123-slug path.
    Evidence: .sisyphus/evidence/task-1-route-guard-error.txt
  ```

  **Commit**: YES | Message: `fix(routing): reserve events namespace` | Files: [`middleware.ts`, `lib/eventRoutes.*`]

- [x] 2. Add Prisma Models for Profiles, Events, Form Versions, and Submissions

  **What to do**: Extend Prisma schema with typed plus JSON hybrid models: `ParticipantProfile`, `ProfileFieldCatalog`, `Event`, `EventOrganizer`, `EventFormVersion`, `EventSubmission`, `EventExportLog`; include immutable snapshot fields (`formSchemaSnapshot`, `consentedProfileSnapshot`, `consentTextSnapshot`, `consentVersion`) and status fields (`draft`, `published`).
  **Must NOT do**: Do not mutate or remove existing models used by blog/podcast/links; do not store submission answers only as live references without snapshots.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Core domain modeling with long-lived data invariants.
  - Skills: [] - Prisma plus Mongo modeling can be done with in-repo patterns.
  - Omitted: [`frontend-ui-ux`] - No UI design work in schema task.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: [3, 4, 5, 6, 7, 8] | Blocked By: [1]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `prisma/schema.prisma:1` - Existing Prisma Mongo datasource conventions.
  - Pattern: `prisma/schema.prisma:18` - ObjectId model style and relation mapping conventions.
  - Pattern: `prisma/schema.prisma:84` - Relation plus cascade style for ownership-linked entities.
  - API/Type: `prisma/schema.prisma:121` - Access allowlist table pattern (`WhitelistedEmail`).
  - External: `https://www.prisma.io/docs/orm/overview/databases/mongodb` - Prisma Mongo modeling constraints.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bunx prisma format` exits 0.
  - [ ] `bunx prisma validate` exits 0.
  - [ ] `bunx prisma generate` exits 0 and updates Prisma client.
  - [ ] `bun run build` exits 0 with updated generated types.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Snapshot fields persist shape
    Tool: Bash
    Steps: Use a temporary script to create EventSubmission with formSchemaSnapshot, consentedProfileSnapshot, and answers JSON.
    Expected: Record is stored and retrieved with all snapshot fields intact.
    Evidence: .sisyphus/evidence/task-2-schema-snapshots.txt

  Scenario: Invalid relation write fails safely
    Tool: Bash
    Steps: Attempt to create EventSubmission with non-existent eventId/formVersionId.
    Expected: Prisma throws relation/constraint error and write is rejected.
    Evidence: .sisyphus/evidence/task-2-schema-snapshots-error.txt
  ```

  **Commit**: YES | Message: `feat(events): add registration domain schema` | Files: [`prisma/schema.prisma`, `prisma/migrations/*`, `package.json`]

- [x] 3. Implement Profile Field Catalog and Baseline Seed Defaults

  **What to do**: Create seed/bootstrap path for global field catalog containing required defaults from request (full name, birth date, faculty-major, NIM, phones, addresses, LINE, photo, cohort, division, social media), including flags (`isRequired`, `isActive`, `isSensitive`, `fieldType`, `options`) and admin editability rules.
  **Must NOT do**: Do not hardcode field labels only in UI; catalog must be source of truth for APIs and forms.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Data bootstrap plus policy defaults impact all downstream behavior.
  - Skills: [] - Native repo toolchain and Prisma client are sufficient.
  - Omitted: [`playwright`] - Browser automation not required.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [6, 7, 8, 9, 10] | Blocked By: [2]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/api/users/route.js:39` - Request validation style for required input fields.
  - Pattern: `app/components/BlogForm.jsx:284` - Required-field handling and warning behavior.
  - Pattern: `lib/roleUtils.js:1` - Role utility approach for admin-only catalog mutation endpoints.
  - External: `https://www.prisma.io/docs/orm/prisma-client/queries/crud` - Upsert and seed implementation guidance.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bun run scripts/seed-profile-fields.mjs` exits 0 and prints `PROFILE_FIELDS_SEEDED`.
  - [ ] `bun run scripts/check-profile-fields.mjs` exits 0 and verifies all baseline fields exist with expected types/options.
  - [ ] Re-running seed is idempotent (`bun run scripts/seed-profile-fields.mjs` exits 0 without duplicate records).

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Baseline field catalog boots correctly
    Tool: Bash
    Steps: Run seed script on clean db and run check script.
    Expected: All mandatory baseline fields exist and marked active.
    Evidence: .sisyphus/evidence/task-3-field-catalog.txt

  Scenario: Duplicate seed attempt does not duplicate rows
    Tool: Bash
    Steps: Run seed script twice, then query count by unique field keys.
    Expected: Record count remains stable; no duplicates created.
    Evidence: .sisyphus/evidence/task-3-field-catalog-error.txt
  ```

  **Commit**: YES | Message: `feat(events): seed profile field catalog` | Files: [`scripts/seed-profile-fields.mjs`, `scripts/check-profile-fields.mjs`, `app/api/profile-fields/*`]

- [x] 4. Add Event Authorization Matrix and Input Contracts

  **What to do**: Implement shared server utilities for event authorization and contract validation: organizer/admin policy (`form_edit`, `submission_read`, `export_run`), participant policy (`registration_submit`), and strict schema validation for requested profile field keys and event question definitions.
  **Must NOT do**: Do not rely on dashboard client checks for security; all checks must run in API handlers.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Security-critical policy layer reused by all event endpoints.
  - Skills: [] - Existing auth and role patterns are in repository.
  - Omitted: [`frontend-ui-ux`] - No frontend layout work required.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [5, 6, 7, 8] | Blocked By: [2]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/api/users/route.js:8` - Server session retrieval and role gate in API route.
  - Pattern: `app/api/blog/route.js:38` - Unauthorized response behavior and request validation pattern.
  - Pattern: `lib/roleUtils.js:10` - Centralized role predicate helper (`hasAnyRole`).
  - Pattern: `app/api/auth/[...nextauth]/route.js:48` - Session payload shape (`session.user.id`, `session.user.role`).
  - External: `https://next-auth.js.org/configuration/nextjs#getserversession` - Recommended server auth checks.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bun run build` exits 0 after adding shared authorization and validation modules.
  - [ ] `bun run scripts/check-event-rbac.mjs` exits 0 and validates deny/allow matrix for organizer, participant, and unauthorized users.
  - [ ] API handlers under `app/api/events/**` import shared guard/validator utilities rather than duplicating inline auth logic.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Organizer allowed to edit event form
    Tool: Bash
    Steps: Use organizer cookie; call protected form publish endpoint.
    Expected: HTTP 200 or 201 with published version payload.
    Evidence: .sisyphus/evidence/task-4-rbac-contracts.txt

  Scenario: Participant denied organizer export action
    Tool: Bash
    Steps: Use participant cookie; call export endpoint.
    Expected: HTTP 403 with forbidden error payload.
    Evidence: .sisyphus/evidence/task-4-rbac-contracts-error.txt
  ```

  **Commit**: YES | Message: `feat(events): add rbac and validation contracts` | Files: [`lib/events/auth.*`, `lib/events/contracts.*`, `app/api/events/**`]

- [ ] 5. Build Organizer Event and Form Version APIs

  **What to do**: Implement event CRUD and form-definition draft/publish API routes under `app/api/events/*`, with immutable publish behavior (`v1`, `v2`, ...) and server-side validation against field catalog allowlist.
  **Must NOT do**: Do not permit in-place editing of already-published versions; do not accept unknown profile field keys.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Multiple linked APIs and version lifecycle logic.
  - Skills: [] - Existing route conventions are enough.
  - Omitted: [`playwright`] - Endpoint implementation is primary.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [9, 10] | Blocked By: [2, 4]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/api/blog/route.js:8` - GET and POST handler organization in route files.
  - Pattern: `app/api/blog/[slug]/route.js` - Parameterized route pattern for resource operations.
  - Pattern: `app/api/users/route.js:31` - PATCH-like update flow and error responses.
  - Pattern: `middleware.ts:29` - Existing API route path behavior under middleware.
  - External: `https://nextjs.org/docs/app/building-your-application/routing/route-handlers` - Route handlers for App Router.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `curl -s -b .tmp/organizer.cookie -X POST http://localhost:3000/api/events -H "Content-Type: application/json" -d '{"slug":"open-house-2026","title":"Open House 2026"}' | jq -r '.slug'` outputs `open-house-2026`.
  - [ ] First publish call returns version `1`; second publish call on updated schema returns version `2`.
  - [ ] Publish call with unknown profile field key returns HTTP `400` with field-validation error.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Draft publish increments immutable version
    Tool: Bash
    Steps: Publish form definition twice with changed schema payload.
    Expected: Response versions are 1 then 2; prior version remains readable unchanged.
    Evidence: .sisyphus/evidence/task-5-form-versioning.txt

  Scenario: Invalid requested profile key is rejected
    Tool: Bash
    Steps: Send publish payload with requestedProfileFields including unknown key.
    Expected: HTTP 400 and explicit invalid field key message.
    Evidence: .sisyphus/evidence/task-5-form-versioning-error.txt
  ```

  **Commit**: YES | Message: `feat(events): add event and form publish apis` | Files: [`app/api/events/**`, `lib/events/*`]

- [ ] 6. Build Participant Form Read API with Missing-Field Resolution

  **What to do**: Create participant-facing endpoint to fetch active form version for an event, requested profile fields, computed missing profile fields, event questions, and consent summary payload for UI rendering.
  **Must NOT do**: Do not expose organizer-only metadata (internal notes, unpublished drafts, export logs) in participant payload.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Dynamic assembly of multiple data sources into one contract.
  - Skills: [] - Implement with Prisma queries and contract layer from task 4.
  - Omitted: [`frontend-ui-ux`] - API contract first.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: [7, 10] | Blocked By: [2, 3, 4]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/api/blog/route.js:10` - Query + include style for read endpoints.
  - Pattern: `app/api/users/route.js:16` - Order and response patterns for list endpoints.
  - API/Type: `app/api/auth/[...nextauth]/route.js:49` - Participant identity from session token.
  - External: `https://nextjs.org/docs/app/building-your-application/data-fetching/fetching` - Response-shape stability guidance.

  **Acceptance Criteria** (agent-executable only):
  - [ ] For participant with incomplete profile, endpoint returns `missingProfileFields` array containing unresolved requested keys.
  - [ ] For participant with complete profile, endpoint returns empty `missingProfileFields` and still includes consent disclosure and event questions.
  - [ ] Unpublished event form returns HTTP `404` or `409` with explicit state error.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Missing profile fields are correctly computed
    Tool: Bash
    Steps: Create participant with partial profile; fetch /api/events/open-house-2026/form.
    Expected: missingProfileFields includes requested keys not yet filled.
    Evidence: .sisyphus/evidence/task-6-form-read-missing-fields.txt

  Scenario: No published version returns safe error
    Tool: Bash
    Steps: Query participant form endpoint for event without published form.
    Expected: HTTP 404 or 409 with stable error code indicating unpublished form.
    Evidence: .sisyphus/evidence/task-6-form-read-missing-fields-error.txt
  ```

  **Commit**: YES | Message: `feat(events): add participant form read api` | Files: [`app/api/events/[eventSlug]/form/route.*`, `lib/events/*`]

- [ ] 7. Implement Atomic Registration Submission with Immutable Snapshots

  **What to do**: Build submission endpoint that atomically (a) updates participant profile only for submitted missing fields, (b) validates event-specific answers, and (c) creates immutable `EventSubmission` with `formVersionId`, `consentedProfileSnapshot`, `answers`, `consentVersion`, and `consentTextSnapshot`.
  **Must NOT do**: Do not write profile and submission in separate non-atomic flows; do not allow submission when consent is missing/false.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: Core transactional integrity and privacy-critical write path.
  - Skills: [] - Prisma transaction and route-handler patterns exist.
  - Omitted: [`playwright`] - Server correctness is priority.

  **Parallelization**: Can Parallel: NO | Wave 2 | Blocks: [8, 10, 11, 12] | Blocked By: [2, 3, 4, 6]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/api/blog/route.js:45` - Body parse plus required-field validation style.
  - Pattern: `app/api/users/route.js:41` - Missing-input error response conventions.
  - API/Type: `prisma/schema.prisma:18` - User identity model linked from NextAuth session.
  - External: `https://www.prisma.io/docs/orm/prisma-client/queries/transactions` - Transaction pattern for multi-write consistency.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Valid submit with consent true returns created submission id and stored `formVersionId`.
  - [ ] Submit with `consent.granted=false` returns HTTP `400` and no profile/submission write occurs.
  - [ ] Second submit for same participant and same event returns HTTP `409` with `already_submitted` error code.
  - [ ] Stored submission preserves snapshot values even after participant profile is updated later.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Successful submit updates profile and stores snapshot
    Tool: Bash
    Steps: POST /api/events/open-house-2026/registrations with consent true, missing profile values, and valid event answers.
    Expected: HTTP 201; submission contains immutable consentedProfileSnapshot and formVersionId.
    Evidence: .sisyphus/evidence/task-7-submission-snapshot.txt

  Scenario: Consent rejection blocks writes
    Tool: Bash
    Steps: Repeat submit with consent.granted false; query db for created submission/profile changes.
    Expected: HTTP 400; no new submission; profile unchanged from previous state.
    Evidence: .sisyphus/evidence/task-7-submission-snapshot-error.txt

  Scenario: Duplicate submission is rejected
    Tool: Bash
    Steps: Submit valid payload twice for same participant and event.
    Expected: First submit HTTP 201; second submit HTTP 409 with already_submitted code.
    Evidence: .sisyphus/evidence/task-7-submission-duplicate-error.txt
  ```

  **Commit**: YES | Message: `feat(events): add atomic registration submit` | Files: [`app/api/events/[eventSlug]/registrations/route.*`, `lib/events/submit.*`]

- [ ] 8. Implement Export Endpoints for CSV, XLSX, and Google Sheets Push

  **What to do**: Build organizer-only export actions that flatten snapshot data by form version into deterministic columns, generate CSV/XLSX files, and push one-way to Google Sheets target; persist export audit logs with actor/event/version metadata.
  **Must NOT do**: Do not export live profile values in place of stored submission snapshots; do not support reverse sync from Sheets.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Multi-format output and external integration.
  - Skills: [] - Existing stack can handle server-side generation and API calls.
  - Omitted: [`frontend-ui-ux`] - Export backend first.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [11, 12] | Blocked By: [2, 3, 4, 7]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/api/program-videos/upload-url/route.js` - Existing API pattern for external service interaction.
  - Pattern: `app/api/shortlinks/[id]/analytics/route.js` - Analytics-like aggregation response style.
  - Pattern: `app/api/users/route.js:11` - Role-gated API enforcement style.
  - External: `https://developers.google.com/sheets/api/guides/concepts` - One-way write model.
  - External: `https://www.papaparse.com/` - CSV serialization reference (if dependency selected).

  **Acceptance Criteria** (agent-executable only):
  - [ ] Organizer export CSV endpoint returns file with deterministic header order for a given form version.
  - [ ] Organizer export XLSX endpoint returns binary file with same logical column mapping as CSV.
  - [ ] Google Sheets push endpoint writes rows successfully and records export log entry.
  - [ ] Participant/non-organizer receives HTTP `403` on all export endpoints.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Deterministic export output by version
    Tool: Bash
    Steps: Run CSV export twice for same event/version and compare headers/content order.
    Expected: Column order and mapping are identical across runs.
    Evidence: .sisyphus/evidence/task-8-export-determinism.txt

  Scenario: Unauthorized export attempt denied
    Tool: Bash
    Steps: Call export endpoint using participant cookie.
    Expected: HTTP 403 with forbidden payload and no export log write.
    Evidence: .sisyphus/evidence/task-8-export-determinism-error.txt
  ```

  **Commit**: YES | Message: `feat(events): add csv xlsx sheets exports` | Files: [`app/api/events/[eventSlug]/exports/**`, `lib/events/export.*`]

- [ ] 9. Build Organizer Dashboard for Event Form Builder

  **What to do**: Add dashboard pages/components for event creation, requested profile-field selection from catalog, event-question builder, draft save, publish version, and role-gated navigation links.
  **Must NOT do**: Do not expose builder controls to non-organizer roles and do not allow publish without at least one consent disclosure block.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Form builder UX and dashboard integration work.
  - Skills: [`frontend-ui-ux`] - Needed for modern but consistent dashboard experience.
  - Omitted: [`playwright`] - Browser tests handled in task 12.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [11] | Blocked By: [1, 3, 5]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/dashboard/layout.jsx:12` - Dashboard container and mobile behavior.
  - Pattern: `app/components/DashboardSidebar.jsx:12` - Role-filtered nav registration pattern.
  - Pattern: `app/dashboard/blog/page.jsx:41` - Existing dashboard table/list interactions.
  - Pattern: `app/components/BlogForm.jsx:434` - Form state/validation/feedback style.
  - External: `https://www.typeform.com/` - Interaction benchmark (step-based, focused prompts).

  **Acceptance Criteria** (agent-executable only):
  - [ ] Organizer can create event, select requested profile fields, add event questions, save draft, and publish from dashboard UI.
  - [ ] Non-authorized role visiting builder route sees access denied state.
  - [ ] Published version number shown in UI matches API response version.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Organizer publishes form from dashboard
    Tool: Playwright
    Steps: Login as organizer; open /dashboard/events/new; fill [data-testid="event-title-input"], select fields via [data-testid="profile-field-phone"], add question [data-testid="question-add-button"], click [data-testid="publish-form-button"].
    Expected: Success toast appears and [data-testid="published-version-badge"] shows v1.
    Evidence: .sisyphus/evidence/task-9-organizer-builder.png

  Scenario: Unauthorized user blocked from builder
    Tool: Playwright
    Steps: Login as participant role; navigate to /dashboard/events/new.
    Expected: Access denied message rendered via [data-testid="events-builder-access-denied"].
    Evidence: .sisyphus/evidence/task-9-organizer-builder-error.png
  ```

  **Commit**: YES | Message: `feat(events): add organizer form builder ui` | Files: [`app/dashboard/events/**`, `app/components/events/**`, `app/components/DashboardSidebar.jsx`]

- [ ] 10. Build Participant Registration UI (Typeform-like Step Flow)

  **What to do**: Implement participant-facing multi-step registration page at `/events/[eventSlug]/register` that displays requested-data notice first, then only missing requested profile fields plus event-specific questions, with progress indicator, validation, and submit confirmation.
  **Must NOT do**: Do not ask already-complete profile fields again; do not hide requested-data disclosure behind collapsible or secondary UI.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UX-heavy flow with modern interaction and mobile responsiveness.
  - Skills: [`frontend-ui-ux`] - Needed to achieve Typeform-like flow while preserving project style.
  - Omitted: [`git-master`] - No git surgery needed in implementation task.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: [11, 12] | Blocked By: [1, 3, 5, 6, 7]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/components/BlogForm.jsx:427` - Client form composition and sectioned state handling.
  - Pattern: `app/dashboard/layout.jsx:33` - Responsive layout constraints and mobile-safe spacing.
  - Pattern: `app/components/BlogForm.jsx:138` - Toast feedback pattern for errors/success.
  - Pattern: `middleware.ts:53` - Ensure event route namespace is unaffected by shortlink rewrite.
  - External: `https://www.typeform.com/` - Interaction model reference for focused one-question-at-a-time feel.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Participant sees requested profile field notice before entering answers.
  - [ ] Only missing requested profile fields are rendered as editable inputs.
  - [ ] Submit success creates submission and shows confirmation state with submission id.
  - [ ] Client-side required validation blocks next/submit until current required step is complete.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Participant completes dynamic form with missing fields only
    Tool: Playwright
    Steps: Open /events/open-house-2026/register; verify [data-testid="requested-fields-notice"]; complete [data-testid="field-phone-input"] and [data-testid="question-tshirtSize-select"]; click [data-testid="registration-submit-button"].
    Expected: Confirmation card [data-testid="registration-success"] appears with submission id.
    Evidence: .sisyphus/evidence/task-10-participant-flow.png

  Scenario: Required step validation prevents progression
    Tool: Playwright
    Steps: Leave required field empty and click [data-testid="step-next-button"].
    Expected: Inline error [data-testid="field-validation-error"] appears and step does not advance.
    Evidence: .sisyphus/evidence/task-10-participant-flow-error.png
  ```

  **Commit**: YES | Message: `feat(events): add participant registration flow` | Files: [`app/events/[eventSlug]/register/page.*`, `app/components/events/ParticipantFlow.*`]

- [ ] 11. Build Organizer Responses and Export Control Dashboard

  **What to do**: Add organizer dashboard page to view submissions (consented snapshots + event answers), filter/search participants, and trigger CSV/XLSX/Sheets exports with status feedback and recent export logs.
  **Must NOT do**: Do not display non-consented profile fields in table/detail views; do not expose export controls to non-organizer roles.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: Data-table UX with role-aware actions.
  - Skills: [`frontend-ui-ux`] - Needed for readable data presentation with dense fields.
  - Omitted: [`playwright`] - UI verification done in task 12.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: [12] | Blocked By: [7, 8, 9, 10]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/dashboard/blog/page.jsx:48` - Existing dashboard table UI baseline.
  - Pattern: `app/components/DashboardSidebar.jsx:30` - Role-based nav visibility.
  - Pattern: `app/api/users/route.js:11` - Server gate pattern to mirror for responses API.
  - External: `https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations` - Mutation/refresh patterns.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Organizer can list submissions for selected event and see requested snapshot fields plus event answers.
  - [ ] Export action buttons trigger corresponding backend endpoint and show success/error state.
  - [ ] Participant user cannot access responses dashboard route or data APIs.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Organizer exports from responses dashboard
    Tool: Playwright
    Steps: Login organizer; navigate to /dashboard/events/open-house-2026/responses; click [data-testid="export-csv-button"] then [data-testid="export-xlsx-button"].
    Expected: Success notices [data-testid="export-success-toast"] shown and export log row appears.
    Evidence: .sisyphus/evidence/task-11-responses-export.png

  Scenario: Participant blocked from responses dashboard
    Tool: Playwright
    Steps: Login participant; open /dashboard/events/open-house-2026/responses.
    Expected: Access denied state [data-testid="responses-access-denied"] or redirect to allowed page.
    Evidence: .sisyphus/evidence/task-11-responses-export-error.png
  ```

  **Commit**: YES | Message: `feat(events): add responses dashboard and exports ui` | Files: [`app/dashboard/events/[eventSlug]/responses/**`, `app/components/events/ResponsesTable.*`]

- [ ] 12. Add End-to-End Smoke Scripts, Export Stability Checks, and Evidence Capture

  **What to do**: Implement command-driven smoke scripts for setup/auth fixtures, end-to-end API flow, and export-column stability assertions; document exact invocation in repo scripts and generate evidence files for each core path.
  **Must NOT do**: Do not rely on manual-only acceptance; do not leave script outputs non-deterministic (timestamps should be excluded from strict compare artifacts where needed).

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: Cross-module verification orchestration and release hardening.
  - Skills: [`playwright`] - Needed for deterministic browser-based scenarios.
  - Omitted: [`frontend-ui-ux`] - Focus is verification harness, not UI redesign.

  **Parallelization**: Can Parallel: NO | Wave 3 | Blocks: [F1, F2, F3, F4] | Blocked By: [7, 8, 10, 11]

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `.github/workflows/pr-checks.yml:27` - Existing CI quality gate baseline.
  - Pattern: `.sisyphus/evidence/hardening-final-test.txt` - Prior evidence artifact convention.
  - Pattern: `.sisyphus/evidence/task-5-playwright.txt` - Existing Playwright evidence naming style.
  - External: `https://playwright.dev/docs/test-assertions` - Assertion patterns for deterministic pass/fail.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bun run scripts/setup-test-session.mjs` exits 0 and writes `.tmp/organizer.cookie` and `.tmp/participant.cookie`.
  - [ ] `bun run scripts/registration-smoke.mjs` exits 0 and prints `REGISTRATION_SMOKE_OK`.
  - [ ] `bun run scripts/assert-export-columns.mjs --event open-house-2026 --version 1` exits 0 and prints `EXPORT_COLUMNS_STABLE`.
  - [ ] `bun run lint && bun run build` exits 0.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Full happy-path automation passes
    Tool: Bash
    Steps: Run setup-test-session, registration-smoke, and export-column assertion scripts sequentially.
    Expected: All commands exit 0; required success markers appear in stdout.
    Evidence: .sisyphus/evidence/task-12-smoke-suite.txt

  Scenario: Export schema mismatch is detected
    Tool: Bash
    Steps: Run assert-export-columns script with intentionally wrong expected schema fixture.
    Expected: Script exits non-zero with explicit mismatch message.
    Evidence: .sisyphus/evidence/task-12-smoke-suite-error.txt
  ```

  **Commit**: YES | Message: `chore(events): add smoke and export verification scripts` | Files: [`scripts/setup-test-session.mjs`, `scripts/registration-smoke.mjs`, `scripts/assert-export-columns.mjs`, `.sisyphus/evidence/*`]

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit - oracle
- [ ] F2. Code Quality Review - unspecified-high
- [ ] F3. Real Manual QA - unspecified-high (+ playwright)
- [ ] F4. Scope Fidelity Check - deep

## Commit Strategy

- Use 6-9 atomic commits grouped by vertical slices (schema/contracts, APIs, organizer UI, participant UI, exports, hardening).
- Keep commit messages short and scoped, for example: `feat(events): add versioned form schema snapshot`.
- Never commit secrets or `.env` files; include lockfile updates if dependencies are added.

## Success Criteria

- Participants can register multiple events without re-entering already-known biodata.
- Organizers can request only allowed profile fields and see consented snapshots in results.
- Exports (CSV/XLSX/Sheets) are reproducible and stable per form version.
- Dashboard and participant flow are mobile-safe and visually modern within existing design language.
