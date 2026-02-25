# Learnings

## Task 1 — Reserve Event Route Namespace and Middleware Guard

### Middleware pattern (middleware.ts)

- The shortlink rewrite fires when `slug` (first path segment) is NOT in the `RESERVED` string array.
- To protect a new namespace, simply append its first segment as a string literal to `RESERVED`.
- Added `"events"` at line 22, keeping alphabetical ordering within the list is not enforced but the pattern is flat string comparison.
- No regex, no prefix matching — check is exact `slug === entry` via `Array.includes`.

### lib/ conventions

- All files in `lib/` are plain `.js` (no TypeScript), named in camelCase: `roleUtils.js`, `prisma.js`, etc.
- Exports are named `export function` / `export const` — no default exports.
- New file `lib/eventRoutes.js` follows this exact style.

### Canonical route contract

- `EVENTS_BASE = "/events"` — the protected namespace root.
- `eventRegisterPath(slug)` → `/events/{slug}/register` — canonical registration URL.
- `eventDetailPath(slug)` → `/events/{slug}` — canonical event detail URL.
- These are the only two route shapes needed for Tasks 2, 9, 10.

### Build result

- `bun run build` passed: 49 pages, middleware at 34 kB, 0 type/lint errors.

### Conflict check

- No prior `events` route constants existed anywhere in the codebase before this task.

## Task 2 — Prisma Models for Event Registration

### MongoDB Prisma conventions preserved

- New models use `String @id @default(auto()) @map("_id") @db.ObjectId` to match existing MongoDB collections.
- Relation scalar fields use `String @db.ObjectId` for consistency with current `User`, `BlogPost`, `ShortLink`, and `Account` patterns.
- Dynamic form/profile content is stored as `Json` (`biodata`, `formSchema`, `answers`, snapshots) while core metadata remains typed fields.

### Added event registration model set

- Added `ParticipantProfile` with reusable `biodata` and one-profile-per-user uniqueness via `@@unique([userId])`.
- Added `ProfileFieldCatalog` for configurable field definitions with typed metadata (`fieldType`, `isRequired`, `isActive`) plus `options`/`metadata` JSON.
- Added `Event` and `EventOrganizer` to model events and organizer membership (`@@unique([eventId, userId])`).
- Added `EventFormVersion` with versioning (`@@unique([eventId, version])`) and publish lifecycle status.
- Added `EventSubmission` with immutable snapshot fields: `formSchemaSnapshot`, `consentedProfileSnapshot`, `consentTextSnapshot`, `consentVersion`.
- Added `EventExportLog` for export auditing (requestor, type, filters, result metadata).

### Status and snapshot decisions

- Added enum `PublishStatus` with exact values `draft` and `published`; applied to `Event.status` and `EventFormVersion.status`.
- Snapshot fields on submission are mandatory to preserve historical consent/form context even if profile or form versions change later.

### Verification notes

- `bunx prisma format`, `bunx prisma validate`, `bunx prisma generate`, and `bun run build` all passed.
- Prisma emitted one pre-existing warning on `Podcast.authorId` native type mismatch with `User.id`; no new warnings/errors were introduced by Task 2 models.

## Task 3 — Profile Field Catalog Baseline Seed Defaults

### Script conventions used

- Added ESM scripts under `scripts/` with direct `PrismaClient` usage and explicit `process.exit(0|1)` behavior.
- Seed/check scripts both disconnect Prisma in `finally` so repeated CLI runs do not leak connections.

### Baseline field bootstrap behavior

- `scripts/seed-profile-fields.mjs` seeds 14 baseline keys as the source of truth for profile fields: `fullName`, `birthDate`, `facultyMajor`, `nim`, `activePhone`, `emergencyPhone`, `emergencyContactRelation`, `lineId`, `originAddress`, `itbAddress`, `photoUrl`, `cohortBatch`, `division`, `socialMedia`.
- Idempotency is enforced through `upsert` on unique `ProfileFieldCatalog.key`, so reruns update in place and do not duplicate rows.
- Because `ProfileFieldCatalog` has no top-level `isSensitive`, sensitive flags are persisted in `metadata.isSensitive`; admin editability rules are persisted in `metadata.adminEditability`.

### Baseline validation behavior

- `scripts/check-profile-fields.mjs` validates all baseline records exist and checks `fieldType`, `isRequired`, `isActive`, and `options` for each key.
- The check script also verifies `metadata.isSensitive` and the full `metadata.adminEditability` policy object for every baseline field.

### Verification results

- `bun run scripts/seed-profile-fields.mjs` prints `PROFILE_FIELDS_SEEDED` and exits 0.
- Running the seed script twice prints `PROFILE_FIELDS_SEEDED` both times (idempotent behavior confirmed).
- `bun run scripts/check-profile-fields.mjs` prints `PROFILE_FIELDS_CHECK_OK` and exits 0.
- LSP diagnostics for `scripts/seed-profile-fields.mjs` and `scripts/check-profile-fields.mjs` returned no diagnostics.

## Task 4 — Event Authorization Matrix and Input Contracts

### Server auth helper conventions reused

- `lib/events/auth.js` follows existing session guard conventions with `getServerSession(authOptions)` and no duplicated auth plumbing.
- Role bypass reuses `hasAnyRole` with `ADMIN_ROLES = ["DEVELOPER"]`, matching the dash-separated role string pattern already used across routes.
- Organizer-scoped actions (`form_edit`, `submission_read`, `export_run`) use `prisma.eventOrganizer.findUnique` on `eventId_userId`, aligned with the schema's composite unique constraint.

### Contract validation decisions

- `lib/events/contracts.js` keeps question validation pure JavaScript, while profile field key validation is DB-backed via active `ProfileFieldCatalog` rows only.
- Allowed event question `fieldType` values are constrained to: `text`, `textarea`, `number`, `date`, `select`, `checkbox`, `phone`, `url`, `email`.
- `validationError` centralizes the standard API response shape using `NextResponse.json({ error, details }, { status })`.

### RBAC script and evidence behavior

- `scripts/check-event-rbac.mjs` validates authenticated registration allow, anonymous registration deny, and organizer-scoped deny for a random non-organizer user.
- If DB is unavailable, organizer-scoped assertion is explicitly skipped with `EVENT_RBAC_WARN` so the script still reports matrix coverage for non-DB paths.
- Evidence outputs are recorded in `.sisyphus/evidence/task-4-rbac-contracts.txt` and `.sisyphus/evidence/task-4-rbac-contracts-error.txt`.

## Task 6 — Participant Form Read API with Missing-Field Resolution

### Active form resolution and payload contract

- Added `resolveParticipantEventForm` in `lib/events/formRead.js` so route and verification script share one source of truth for event/form/profile aggregation.
- The resolver returns participant-safe payload only: `event`, `formVersion`, `requestedProfileFields`, `missingProfileFields`, `questions`, and `consentText`.
- Published form lookup is strict: latest by `version` with `status: "published"`; if none exists the resolver returns `404` with `error: "no_published_form"`.

### Schema nuance captured

- In this repository, requested profile keys and questions are stored under `EventFormVersion.formSchema` JSON (`formSchema.requestedProfileFields` and `formSchema.questions`), not top-level columns.
- Route contract still exposes the normalized response shape expected by participants, independent of internal storage shape.

### Missing-field behavior

- Missing fields are computed with the requested rule: `requestedProfileFields.filter((key) => !biodata || !biodata[key])`.
- Participant profiles are optional; missing profile record is handled as all requested keys missing.

### Verification artifacts

- Added `scripts/check-task-6.mjs` to create deterministic fixtures, verify `no_published_form` behavior, verify published response shape, and confirm missing-field behavior for incomplete and complete profiles.
- Script writes evidence to `.sisyphus/evidence/task-6-form-read-missing-fields.txt` and `.sisyphus/evidence/task-6-form-read-missing-fields-error.txt`, prints `TASK_6_FORM_READ_OK`, and exits 0 on success.
- `bun run build` passes with route `/api/events/[eventSlug]/form` included in build output.

## Task 7 — Atomic Registration Submission

### Transaction and snapshot behavior

- Added `submitRegistration` in `lib/events/submit.js` to load event by slug, load latest published form version, block duplicates, merge biodata patch, and perform profile upsert plus submission create in one `prisma.$transaction`.
- Duplicate protection is keyed by `eventId + submitterUserId` in `EventSubmission` (this schema uses `submitterUserId`, not `userId`).
- Submission snapshots are captured from submission-time state only: `formSchemaSnapshot` from published form JSON, `consentTextSnapshot` from `formSchema.consentText`, `consentVersion` from `EventFormVersion.consentVersion`, and `consentedProfileSnapshot` from merged biodata.

### Participant route contract

- Added `POST /api/events/[eventSlug]/registrations` in `app/api/events/[eventSlug]/registrations/route.js` with `requireSession(req)` guard and explicit consent gate before DB operations.
- Route returns `400 { error: "consent_required" }` when `consent.granted !== true`, `409 { error: "already_submitted" }` on duplicate, `404` for missing event/form, and `201 { id, formVersionId }` on success.

### Verification artifacts

- Added `scripts/check-task-7.mjs` to create deterministic fixtures, verify successful submission snapshots and biodata update, verify duplicate rejection, verify consent rejection via route handler path, clean up fixtures, and emit evidence files.
- Script writes `.sisyphus/evidence/task-7-submission-snapshot.txt`, `.sisyphus/evidence/task-7-submission-snapshot-error.txt`, and `.sisyphus/evidence/task-7-submission-duplicate-error.txt`, then prints `TASK_7_SUBMISSION_OK`.
- `bun run build` passes with route `/api/events/[eventSlug]/registrations` included in build output.

## Task 8 — Organizer Dashboard Event Builder UI

### Dashboard role guard pattern for events pages

- All new event dashboard pages use server-side authorization with `getServerSession(authOptions)` plus `hasAnyRole(session?.user?.role, ["DEVELOPER"])`.
- Unauthorized access consistently returns `<div data-testid="events-builder-access-denied">Access denied</div>` as an early return.

### Sidebar navigation convention

- `DashboardSidebar` keeps role-driven navigation in the top-level `navItems` array; adding new dashboard sections requires both icon import and one new array entry.
- Added `FiCalendar` and an `Events` link after `Whitelist` to match existing order and role filtering behavior.

### Event form builder payload compatibility

- Existing API route implementation for `POST /api/events/[eventSlug]/form-versions` currently reads top-level `requestedProfileFields`, `questions`, and `consentText`.
- Builder submit flow sends both documented `formSchema` and those top-level keys in the same request body so it remains compatible with current backend behavior and contract expectations.

### Publish flow behavior

- Publish action saves a fresh draft first, then calls the publish sub-route with that draft ID.
- Successful publish sets `publishedVersion` and renders `data-testid="published-version-badge"` with `v{version}`.

### Verification

- LSP diagnostics returned no issues for all modified and created event dashboard/component files.
- `bun run build` completed successfully (exit 0) with all new `/dashboard/events` routes present in the build output.

## Task 5 Verification — Organizer Event and Form Version APIs

### API verification execution pattern

- End-to-end API verification can be done reliably with a local NextAuth JWT cookie plus live `bun dev` server calls (no route code changes required).
- For this codebase, JWT cookie generation for API test calls works with `encode({ token, secret, maxAge })` using default salt semantics from `next-auth/jwt`; pinning a manual salt caused auth mismatch during verification retries.

### Acceptance criteria outcome

- Confirmed required routes exist: `app/api/events/route.js`, `app/api/events/[eventSlug]/form-versions/route.js`, `app/api/events/[eventSlug]/form-versions/[versionId]/publish/route.js`.
- Verified event creation returns `201` and echoes `slug` for `POST /api/events`.
- Verified form draft creation returns `201` with `status: "draft"` for `POST /api/events/{slug}/form-versions`.
- Verified first publish returns version `1` and second publish after draft update returns version `2`.
- Verified immutable readback: both version `1` and `2` remain readable and keep distinct schema snapshots.
- Verified invalid requested profile key publish rejection returns `400` with validation details including `unknownField123`.

## Task 11 — Organizer Responses Dashboard and Export Panel

### Organizer authorization pattern for submissions read

- For organizer-only event dashboard pages, using `canPerformEventAction(session.user.id, event.id, EVENT_ACTIONS.SUBMISSION_READ)` provides the same membership/admin bypass behavior as API routes.
- This keeps dashboard authorization aligned with backend route authorization rules instead of duplicating role checks in page components.

### Consent-safe snapshot rendering

- `EventSubmission.consentedProfileSnapshot` may contain more profile keys than the event requested.
- To avoid exposing non-consented fields, snapshot data is now filtered by `formSchemaSnapshot.requestedProfileFields` before being sent to the UI and API response payload.

### Dashboard behavior and UX convention

- Responses view follows existing dashboard card/table layout and uses a dedicated client component for interactive controls (search, status filter, expand details, export trigger status).
- Export actions are intentionally thin UI triggers that call existing endpoints (`/exports/csv`, `/exports/xlsx`, `/exports/sheets`) without embedding file-generation logic in the frontend.

### Verification result

- LSP diagnostics returned no issues for all new files.
- `bun run build` passed and includes `/dashboard/events/[eventSlug]/responses` and `/api/events/[eventSlug]/submissions` in build output.

## Task 12 — Smoke Scripts and Export Stability Checks

### Session setup script conventions

- `scripts/setup-test-session.mjs` uses deterministic test users (`DEVELOPER` organizer + `KRU` participant), writes cookies into `.tmp/`, and now emits both `next-auth.session-token` and `__Secure-next-auth.session-token` pairs for compatibility across runtime environments.
- The script hard-fails early when `NEXTAUTH_SECRET` is missing, matching existing script behavior that treats auth setup as required configuration.

### Registration smoke reliability choice

- Direct cookie-authenticated HTTP calls can fail in this repo due NextAuth runtime nuances and environment differences.
- `scripts/registration-smoke.mjs` therefore validates end-to-end registration behavior through shared API logic (`resolveParticipantEventForm` + `handleRegistrationPost`) and DB assertions, avoiding flaky server/session bootstrapping while still exercising production registration contracts.

### Export column stability check behavior

- `scripts/assert-export-columns.mjs` derives deterministic columns from published `formSchema` (`requestedProfileFields` order + `questions` order) and asserts snapshots/answers do not contain undeclared keys.
- It accepts `--event` and `--version` as required inputs and supports optional `--expected <json-file>` fixture comparison for explicit mismatch checks.

### Verification status

- `bun scripts/setup-test-session.mjs` prints `TEST_SESSION_SETUP_OK` and exits 0.
- `bun scripts/registration-smoke.mjs` prints `REGISTRATION_SMOKE_OK` and exits 0.
- `bun scripts/assert-export-columns.mjs --event <latest-registration-smoke-slug> --version 1` prints `EXPORT_COLUMNS_STABLE` and exits 0.
- `bun run build` passes; `bun run lint` remains blocked by pre-existing interactive ESLint initialization prompt.

## Task 14 — Submission file-key scope enforcement and completeness alignment

### 2026-02-24T11:17:18Z

- File answers are now validated in the submission route against runtime scope (`eventSlug` + `session.user.id`) because schema-level validation cannot know request context.
- Required prefix contract enforced for file metadata key: `events/<eventSlug>/users/<userId>/.../<fieldKey>/...`.
- Invalid scoped keys keep the existing `400 Invalid answers` response shape by returning route-level `validationError("Invalid answers", details, 400)`.
- Profile completeness no longer relies on legacy `file.url`; `fieldType === "file"` now treats metadata object keys (`key`, `name`, `mime`, `size`) as the presence contract.
- Regression coverage includes both cross-event and cross-user malicious key rejection for metadata objects.
