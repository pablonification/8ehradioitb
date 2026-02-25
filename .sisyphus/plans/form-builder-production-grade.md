# Production-Grade Form UX and Builder Overhaul

## TL;DR

> **Summary**: Redesign participant form filling and dashboard form builder into a Google Forms-like, mobile-first, production-grade experience while preserving existing event/version backend contracts.
> **Deliverables**:
>
> - New distraction-free participant form shell (no navbar, proper account reveal, strong accessibility)
> - Re-architected dashboard form builder UX with lower learning curve and clearer interaction model
> - First-class file upload field support using Cloudflare R2 presigned upload flow
> - Hardened validation/contract alignment across UI + API + submission pipeline
> - Automated QA for desktop/mobile UX and upload security paths
>   **Effort**: Large
>   **Parallel**: YES - 4 waves
>   **Critical Path**: 1 -> 2 -> 4 -> 7 -> 8 -> 11 -> 12

## Context

### Original Request

User requests a complete upgrade from prototype-like form UX to production-grade quality with Google Forms-like familiarity, including:

- no navbar for form filling page
- account identity presentation that is proper (reveal interaction, not blunt static email)
- mobile UX quality
- corrected placeholders and no accidental prefill behavior
- file upload support via existing Cloudflare R2 infrastructure
- stronger builder UX quality and intuition in dashboard

### Interview Summary

- Form filling must align visually with dashboard language but without dashboard sidebar/nav distractions.
- Footer can stay if it does not reduce form focus.
- Benchmark interaction model and learning curve to Google Forms.
- Builder must be significantly more intuitive and production-ready.
- Plan must include proper delegation guidance for implementation agents.

### Metis Review (gaps addressed)

- Enforced scope boundaries (no auth-system redesign, no full domain rewrite).
- Added guardrails for file upload security (event/user/question scoped object keys and server-side verification).
- Added explicit mobile/a11y acceptance criteria to remove subjective “looks better” ambiguity.
- Added backward compatibility guardrails so existing non-file forms keep working.

### Defaults Applied

- File field mode defaults to **single-file per question** for v1.
- File allowlist defaults to **image/\* + application/pdf**.
- File max size defaults to **10 MB per file**.
- File visibility defaults to **private object key storage** with controlled access (no permanent public URLs in answers).
- Existing published/draft non-file forms remain backward-compatible (no mandatory schema migration in v1).

## Work Objectives

### Core Objective

Deliver a production-grade form platform experience (fill + build) that is intuitive for Google Forms users, visually coherent with current dashboard style language, secure for file uploads, and robust on mobile.

### Deliverables

- Participant form shell redesign at `app/events/[eventSlug]/register/page.jsx`
- Profile UX refinement at `app/profile/page.jsx`
- Builder UX overhaul at `app/dashboard/form/page.jsx`
- Shared form schema/type config and shared render primitives
- New event-scoped upload API route for participant/form file fields
- Extended contracts for `file` type in form schema and submission validation
- Response table usability upgrades in dashboard form page
- Integration + E2E test coverage for critical UX/security flows

### Definition of Done (verifiable conditions with commands)

- `bun run test` passes with new contract/integration tests for file field and submission verification.
- `bun run build` passes with updated pages/routes and no runtime parameter warnings.
- Playwright scenarios for desktop and mobile pass for register/profile/builder critical flows.
- Upload flow rejects cross-event or invalid object-key submissions with expected 4xx responses.
- Protected-route visual QA evidence is captured through user-provided screenshots when OAuth login cannot be automated in test browser.

### Must Have

- No navbar in participant form page.
- Account identity shown as proper reveal interaction (chip/dropdown behavior) and consistent privacy posture.
- Mobile responsive behavior for participant and builder views (touch targets, spacing, readability).
- File upload field is first-class and does not rely on manual URL input.
- Shared form field logic to eliminate drift between builder/renderer/contracts.

### Must NOT Have (guardrails, AI slop patterns, scope boundaries)

- Must NOT rewrite event-based backend model (`Event`, `EventFormVersion`, `EventSubmission`) in this initiative.
- Must NOT introduce generic placeholder text/prefill artifacts in production UI.
- Must NOT expose permanent public upload URLs in submission answers.
- Must NOT leave builder as one large unstructured interaction block.
- Must NOT rely on manual-only QA for “professional” quality claims.

## Verification Strategy

> PRIMARY: agent-executed verification. EXCEPTION: protected-route visual evidence can use user screenshots due OAuth automation constraints.

- Test decision: tests-after + integration/E2E focus (Bun + Playwright)
- QA policy: Every implementation task includes happy-path and failure-path scenarios.
- Evidence: `.sisyphus/evidence/task-{N}-{slug}.{ext}`
- Protected-route visual evidence path (if SSO blocks automation): `.sisyphus/evidence/user-captured/task-{N}-{slug}.png`
- Automation fallback policy: if protected-route Playwright login is unavailable, keep API/integration/build checks automated and request targeted screenshots for visual acceptance only.

## Execution Strategy

### Parallel Execution Waves

> Target: 5-8 tasks per wave. <3 per wave (except final) = under-splitting.
> Extract shared dependencies as Wave-1 tasks for max parallelism.

Wave 1: Contract alignment + shared UI foundation + shell architecture
Wave 2: Participant/Profile production UX + file upload API and client flow
Wave 3: Builder UX overhaul + responses UX polish + accessibility/mobile hardening
Wave 4: Security, regression, and release hardening

### Dependency Matrix (full, all tasks)

- 1 -> 2, 7, 10, 11
- 2 -> 3, 4, 6
- 3 -> 5, 9
- 4 -> 5, 6
- 5 -> 13
- 6 -> 9, 13
- 7 -> 8, 9, 14
- 8 -> 9, 14
- 9 -> 13, 14
- 10 -> 11, 12, 13
- 11 -> 13
- 12 -> 13
- 13 -> 14, 15
- 14 -> 15
- 15 -> Final Verification Wave

### Agent Dispatch Summary (wave -> task count -> categories)

- Wave 1 -> 4 tasks -> `unspecified-high`, `visual-engineering`
- Wave 2 -> 5 tasks -> `visual-engineering`, `unspecified-high`, `writing`
- Wave 3 -> 3 tasks -> `visual-engineering`
- Wave 4 -> 3 tasks -> `deep`, `unspecified-high`, `general`

## TODOs

> Implementation + Test = ONE task. Never separate.
> EVERY task MUST have: Agent Profile + Parallelization + QA Scenarios.

<!-- TASKS INSERTED HERE -->

- [x] 1. Unify Form Field Contracts Across UI and API

  **What to do**: Create one shared field-type/config module consumed by builder UI, register UI, profile UI, and server contracts so `allowed field types`, defaults, and per-type validation are identical.
  **Must NOT do**: Do not keep duplicated type arrays in page-level components.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: cross-layer refactor touching both client and server contracts.
  - Skills: [`frontend-ui-ux`] - why needed: preserve UX semantics while refactoring shared config.
  - Omitted: [`playwright`] - why not needed: this task is contract foundation, not UI behavior validation.

  **Parallelization**: Can Parallel: NO | Wave 1 | Blocks: 2, 5, 7, 10, 11 | Blocked By: none

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/dashboard/form/page.jsx` - current local `ALLOWED_FIELD_TYPES` source.
  - Pattern: `app/events/[eventSlug]/register/page.jsx` - current field rendering switches.
  - Pattern: `app/profile/page.jsx` - current profile field type handling.
  - API/Type: `lib/events/contracts.js` - schema validation source of truth.
  - API/Type: `lib/events/submissionContracts.js` - submission answer validation paths.

  **Acceptance Criteria** (agent-executable only):
  - [ ] `bun run test` passes and includes tests proving shared field config is imported by contracts and UI modules.
  - [ ] `bun run build` succeeds without duplicated local field-type constants in target pages.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Shared field set used everywhere
    Tool: Bash
    Steps: Run `rg -n "ALLOWED_FIELD_TYPES|fieldType ===" app/dashboard/form/page.jsx app/events/[eventSlug]/register/page.jsx app/profile/page.jsx lib/events/contracts.js lib/events/submissionContracts.js`
    Expected: Type definitions are imported from shared module; no divergent hardcoded list remains.
    Evidence: .sisyphus/evidence/task-1-shared-field-contracts.txt

  Scenario: Unsupported type rejection still works
    Tool: Bash
    Steps: Run test script that POSTs invalid fieldType to `/api/events/{slug}/form-versions`.
    Expected: API returns 400 validation error for invalid fieldType.
    Evidence: .sisyphus/evidence/task-1-invalid-fieldtype.txt
  ```

  **Commit**: YES | Message: `refactor(forms): centralize shared field contracts` | Files: [shared config module, `lib/events/contracts.js`, `lib/events/submissionContracts.js`, UI consumers]

- [x] 2. Build Reusable Form Primitives for Professional UX

  **What to do**: Create reusable UI primitives (`FormShell`, `QuestionCard`, `FieldLabel`, `RequiredMarker`, `HelperText`, `FieldError`, `AccountReveal`) and replace duplicated inline rendering logic in register/profile pages.
  **Must NOT do**: Do not leave register and profile pages with separate bespoke field render trees.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI architecture and visual consistency task.
  - Skills: [`frontend-ui-ux`] - why needed: production-grade visual and interaction quality.
  - Omitted: [`playwright`] - why not needed: component creation precedes E2E validation.

  **Parallelization**: Can Parallel: PARTIAL | Wave 1 | Blocks: 3, 4, 5, 6 | Blocked By: 1

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/events/[eventSlug]/register/page.jsx` - current participant form UI to decompose.
  - Pattern: `app/profile/page.jsx` - current profile form UI to decompose.
  - Pattern: `app/dashboard/form/page.jsx` - style language to align with dashboard visual tone.
  - API/Type: `app/globals.css` - global typography/utility baseline.
  - External: `https://carbondesignsystem.com/patterns/forms-pattern/` - form spacing/help/error conventions.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Register and profile pages import shared primitives instead of custom duplicated JSX blocks.
  - [ ] `bun run build` succeeds and UI snapshots show no critical layout regressions.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Primitive reuse across pages
    Tool: Bash
    Steps: Run `rg -n "FormShell|QuestionCard|AccountReveal" app/events/[eventSlug]/register/page.jsx app/profile/page.jsx`
    Expected: Both pages consume the shared primitives.
    Evidence: .sisyphus/evidence/task-2-primitive-reuse.txt

  Scenario: Error/required semantics remain visible
    Tool: Playwright
    Steps: Open `/events/testing/register`, trigger required-field errors, inspect labels and error blocks.
    Expected: Required marker and inline error are consistently rendered and readable.
    Evidence: .sisyphus/evidence/task-2-error-required.png
  ```

  **Commit**: YES | Message: `feat(forms): add reusable form primitives` | Files: [new shared UI primitives, register/profile page integrations]

- [x] 3. Redesign Participant Form Shell (No Navbar, Focused Flow)

  **What to do**: Redesign `/events/[eventSlug]/register` into a distraction-free shell: remove global navbar, retain lightweight footer, single-column Google Forms-like content rhythm, clearer section separation, and stable call-to-actions.
  **Must NOT do**: Do not reintroduce header navigation or dashboard sidebar on participant form page.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: high-impact user-facing page redesign.
  - Skills: [`frontend-ui-ux`] - why needed: layout hierarchy and interaction polish.
  - Omitted: [`git-master`] - why not needed: no special git operations needed.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5, 9, 13 | Blocked By: 2

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/events/[eventSlug]/register/page.jsx` - current implementation baseline.
  - Pattern: `app/dashboard/layout.jsx` - dashboard visual language cues (not sidebar behavior).
  - Pattern: `app/components/FooterSection.jsx` - footer component to preserve.
  - External: `https://www.nngroup.com/articles/mobile-input-checklist/` - mobile form ergonomics.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Participant form renders without `Navbar` import/usage.
  - [ ] CTA hierarchy and spacing remain usable at 390px and 1280px widths.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: No-navbar participant form
    Tool: Playwright
    Steps: Open `/events/testing/register`, capture top section.
    Expected: No global navigation menu appears; form title starts near top content container.
    Evidence: .sisyphus/evidence/task-3-no-navbar.png

  Scenario: Mobile layout stability
    Tool: Playwright
    Steps: Set viewport 390x844, open `/events/testing/register`, scroll through form and review mode.
    Expected: No horizontal overflow; controls remain tappable and readable.
    Evidence: .sisyphus/evidence/task-3-mobile-layout.png
  ```

  **Commit**: YES | Message: `feat(forms): redesign participant form shell` | Files: [`app/events/[eventSlug]/register/page.jsx`, shared shell styles/components]

- [x] 4. Implement Proper Account Reveal Indicator

  **What to do**: Replace blunt static email text with a professional account chip/reveal interaction showing signed-in identity details on demand (name/email/avatar/fallback), with privacy-conscious default collapsed state.
  **Must NOT do**: Do not always display raw email in main content body.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: interaction pattern + visual affordance task.
  - Skills: [`frontend-ui-ux`] - why needed: interaction quality and clarity.
  - Omitted: [`playwright`] - why not needed: implementation first, e2e validated later.

  **Parallelization**: Can Parallel: YES | Wave 1 | Blocks: 5, 6, 13 | Blocked By: 2

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/profile/page.jsx` - current account text placement.
  - Pattern: `app/events/[eventSlug]/register/page.jsx` - current active-account indicator text.
  - Pattern: `app/components/UserDropdown.jsx` - style/interaction cue for account disclosure.
  - External: `https://developers.google.com/identity/gsi/web/guides/personalized-button` - account affordance patterns.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Account identity is hidden by default and visible after explicit reveal interaction.
  - [ ] Component works consistently in both profile and participant form pages.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Reveal interaction works
    Tool: Playwright
    Steps: Open `/events/testing/register`, click account chip.
    Expected: Identity panel opens with account details; closes when toggled again.
    Evidence: .sisyphus/evidence/task-4-account-reveal.png

  Scenario: Unauthenticated fallback
    Tool: Playwright
    Steps: Open page without valid session cookie.
    Expected: Indicator shows safe fallback state and login CTA; no leaked user data.
    Evidence: .sisyphus/evidence/task-4-account-fallback.png
  ```

  **Commit**: YES | Message: `feat(forms): add account reveal indicator` | Files: [shared account reveal component, register/profile integrations]

- [x] 5. Participant Form Content Polish (Copy, Placeholders, Prefill Hygiene)

  **What to do**: Rewrite placeholder/helper/error copy for clarity, remove accidental prefilled values, enforce empty-state defaults, and ensure review-step output mirrors actual answers without confusing placeholders.
  **Must NOT do**: Do not use generic placeholder text as primary instruction or persist placeholder values as real answers.

  **Recommended Agent Profile**:
  - Category: `writing` - Reason: UX microcopy + clarity corrections.
  - Skills: [`frontend-ui-ux`] - why needed: copy aligns with interaction model.
  - Omitted: [`librarian`] - why not needed: local product copy refinement.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 13, 14 | Blocked By: 3, 4

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/events/[eventSlug]/register/page.jsx` - current labels/placeholders/review rendering.
  - Pattern: `app/profile/page.jsx` - current placeholder patterns and required-state messaging.
  - External: `https://www.nngroup.com/articles/form-design-placeholders/` - placeholder anti-pattern guidance.

  **Acceptance Criteria** (agent-executable only):
  - [ ] No question displays non-empty default answer unless explicitly configured by schema.
  - [ ] Placeholder and helper text are semantically correct and non-conflicting with labels.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: No accidental prefill
    Tool: Playwright
    Steps: Open `/events/testing/register` with clean state; inspect all inputs before typing.
    Expected: All answer fields are empty by default unless schema default is explicitly set.
    Evidence: .sisyphus/evidence/task-5-no-prefill.png

  Scenario: Review page value fidelity
    Tool: Playwright
    Steps: Fill subset of questions, leave others empty, open review mode.
    Expected: Entered values show correctly; empty answers show explicit placeholder marker (`-`) only in review.
    Evidence: .sisyphus/evidence/task-5-review-fidelity.png
  ```

  **Commit**: YES | Message: `fix(forms): polish copy and placeholder behavior` | Files: [register/profile pages, shared field components]

- [x] 6. Profile Completion UX Overhaul for Production Use

  **What to do**: Redesign `/profile` into a clean completion workflow with section grouping, stronger required-state guidance, account reveal integration, and redirect-back behavior after completion.
  **Must NOT do**: Do not expose profile completion status only as raw list without hierarchy/context.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: high-impact UX redesign for profile completion gateway.
  - Skills: [`frontend-ui-ux`] - why needed: professional form UX and visual hierarchy.
  - Omitted: [`playwright`] - why not needed: implementation first; e2e in later task.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 13, 14 | Blocked By: 2, 4

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/profile/page.jsx` - current profile completion screen.
  - Pattern: `app/api/profile/me/route.js` - payload contract (`profile`, `completion`, `schema`).
  - Pattern: `lib/events/profileCompleteness.js` - required/missing logic.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Profile screen clearly distinguishes required vs optional fields and completion progress.
  - [ ] Redirect query (`?redirect=`) still returns user to intended form page after successful completion.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Completion workflow clarity
    Tool: Playwright
    Steps: Open `/profile` with incomplete account data.
    Expected: Required missing fields are visually prioritized and actionable.
    Evidence: .sisyphus/evidence/task-6-profile-completion.png

  Scenario: Redirect-back after completion
    Tool: Playwright
    Steps: Open `/profile?redirect=/events/testing/register`, complete required fields, save.
    Expected: User is redirected back to `/events/testing/register`.
    Evidence: .sisyphus/evidence/task-6-profile-redirect.png
  ```

  **Commit**: YES | Message: `feat(profile): redesign completion workflow ux` | Files: [`app/profile/page.jsx`, shared form primitives]

- [x] 7. Add First-Class `file` Field Type to Contracts and Validators

  **What to do**: Extend schema and submission contracts so `file` is a valid type in builder/render/validators, with strict payload expectations (`key`, `name`, `size`, `mime`) for answer values.
  **Must NOT do**: Do not treat file answers as URL strings.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: backend contract and validation correctness.
  - Skills: [] - why needed: pure contract logic based on existing patterns.
  - Omitted: [`frontend-ui-ux`] - why not needed: no UI polish in this task.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 8, 9, 14 | Blocked By: 1

  **References** (executor has NO interview context - be exhaustive):
  - API/Type: `lib/events/contracts.js` - schema validation and allowed field rules.
  - API/Type: `lib/events/submissionContracts.js` - answer value validation logic.
  - API/Type: `lib/events/profileCompleteness.js` - existing `file` missing-value branch to align.
  - Test: `tests/events-submissions.route.test.js` - route contract behavior baseline.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Form schema validator accepts `file` type with appropriate option/shape rules.
  - [ ] Submission validator rejects malformed file payloads and accepts valid metadata objects.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Contract accepts valid file field
    Tool: Bash
    Steps: Run test suite for form schema validation with `fieldType: "file"` question.
    Expected: Validation passes with no schema errors.
    Evidence: .sisyphus/evidence/task-7-file-contract-valid.txt

  Scenario: Malformed file answer rejected
    Tool: Bash
    Steps: POST submission with `answers.fileQuestion = "https://..."`.
    Expected: API returns 400 with invalid answer details.
    Evidence: .sisyphus/evidence/task-7-file-contract-invalid.txt
  ```

  **Commit**: YES | Message: `feat(forms): support file field type in contracts` | Files: [`lib/events/contracts.js`, `lib/events/submissionContracts.js`, tests]

- [x] 8. Build Event-Scoped R2 Upload API for Form/Profile Files

  **What to do**: Add new upload endpoint dedicated to participant form/profile file fields using server-generated event/user/field-scoped keys and short-lived presigned PUT URLs.
  **Must NOT do**: Do not reuse admin media upload endpoints directly for participant submission files.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: security-sensitive backend/API task.
  - Skills: [] - why needed: existing repository upload patterns are sufficient.
  - Omitted: [`visual-engineering`] - why not needed: no major UI work here.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 9, 14 | Blocked By: 7

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/api/tune-tracker/upload/route.js` - signed URL issuance pattern.
  - Pattern: `app/api/player-config/upload/route.js` - image upload signed URL pattern.
  - Pattern: `app/api/podcast/upload-url/route.js` - type-based upload route contract.
  - Pattern: `app/api/events/[eventSlug]/submissions/route.js` - auth + event context enforcement.
  - External: `https://developers.cloudflare.com/r2/api/s3/presigned-urls/` - presigned URL guardrails.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Upload API returns short-lived presigned PUT URL plus server-generated key scoped to event and user.
  - [ ] Unauthorized or cross-event upload attempts are denied with 4xx responses.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Valid upload token issuance
    Tool: Bash
    Steps: POST to new upload endpoint with authenticated user, eventSlug, file metadata.
    Expected: Response includes `uploadUrl`, `key`, `expiresIn` <= 120 seconds.
    Evidence: .sisyphus/evidence/task-8-upload-issued.json

  Scenario: Unauthorized upload blocked
    Tool: Bash
    Steps: POST same payload without session cookie/token.
    Expected: 401 or 403 response; no upload key returned.
    Evidence: .sisyphus/evidence/task-8-upload-unauthorized.txt
  ```

  **Commit**: YES | Message: `feat(forms): add event scoped r2 upload endpoint` | Files: [new upload route, shared upload utils, tests]

- [x] 9. Integrate File Upload Controls in Participant and Profile Forms

  **What to do**: Add `file` field renderer/control that uploads to R2 via signed URL flow, shows progress/state, persists metadata answer shape, and supports replace/remove behavior.
  **Must NOT do**: Do not block entire form state during single file upload retry.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: UI + API interaction task with nuanced UX.
  - Skills: [`frontend-ui-ux`] - why needed: upload UX clarity and error handling.
  - Omitted: [`oracle`] - why not needed: architecture already fixed.

  **Parallelization**: Can Parallel: YES | Wave 2 | Blocks: 13, 14 | Blocked By: 3, 6, 7, 8

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/dashboard/tune-tracker/page.jsx` - client upload flow (`get signed URL -> PUT -> persist key`).
  - Pattern: `app/dashboard/player-config/page.jsx` - upload progress + image handling style.
  - Pattern: `app/events/[eventSlug]/register/page.jsx` - field rendering integration point.
  - Pattern: `app/profile/page.jsx` - profile field rendering integration point.
  - API/Type: `app/api/events/[eventSlug]/submissions/route.js` - submission payload endpoint.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Selecting a file uploads to R2 and stores metadata object (not URL string) in local answer/profile state.
  - [ ] Failed upload shows recoverable error state without losing other form inputs.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: File upload success path
    Tool: Playwright
    Steps: On `/events/testing/register`, upload test image/pdf in file question and submit.
    Expected: Submission succeeds and response payload contains file metadata object.
    Evidence: .sisyphus/evidence/task-9-file-upload-success.png

  Scenario: File upload failure path
    Tool: Playwright
    Steps: Simulate failed PUT request (network intercept), then retry upload.
    Expected: User sees clear error and can retry; non-file answers remain intact.
    Evidence: .sisyphus/evidence/task-9-file-upload-retry.png
  ```

  **Commit**: YES | Message: `feat(forms): integrate file upload controls` | Files: [register/profile page, shared field components, upload client util]

- [x] 10. Re-architect Dashboard Builder Information Hierarchy

  **What to do**: Redesign `/dashboard/form` layout to mirror Google Forms mental model: clear top bar, concise metadata panel, question list focus, right/inline config patterns, and cleaner draft/publish affordances.
  **Must NOT do**: Do not keep current crowded mixed panel hierarchy that feels prototype-like.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: high-fidelity dashboard UX architecture.
  - Skills: [`frontend-ui-ux`] - why needed: complex interface simplification.
  - Omitted: [`playwright`] - why not needed: verification done later.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 11, 12, 13 | Blocked By: 1, 2

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/dashboard/form/page.jsx` - current baseline to refactor.
  - Pattern: `app/dashboard/layout.jsx` - dashboard spacing/visual tone baseline.
  - Pattern: `app/components/DashboardSidebar.jsx` - navigation context constraints.
  - External: `https://carbondesignsystem.com/patterns/forms-pattern/` - hierarchy and spacing.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Builder shows clear, low-cognitive-load flow for event selection -> schema editing -> save/publish.
  - [ ] Interaction density remains usable at 1280px desktop and 390px mobile without overlap/overflow.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Builder clarity flow
    Tool: Playwright
    Steps: Open `/dashboard/form`, perform event selection, add question, save draft.
    Expected: User can complete flow without hidden controls or ambiguous CTAs.
    Evidence: .sisyphus/evidence/task-10-builder-flow.png

  Scenario: Mobile layout resilience
    Tool: Playwright
    Steps: Set viewport 390x844, open `/dashboard/form`, interact with top bar and question list.
    Expected: Layout remains readable; controls are tappable; no clipped panels.
    Evidence: .sisyphus/evidence/task-10-builder-mobile.png
  ```

  **Commit**: YES | Message: `feat(builder): redesign dashboard form information architecture` | Files: [`app/dashboard/form/page.jsx`, supporting components]

- [x] 11. Upgrade Question Editing Interactions to Google-Forms-Like Ergonomics

  **What to do**: Implement professional question-card UX including duplicate/reorder, section divider support, required toggle, preview parity, and clearer per-field configuration affordances; add drag-and-drop reorder with keyboard fallback.
  **Must NOT do**: Do not rely only on hidden icon-only actions without accessible labels.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: interaction-heavy form builder controls.
  - Skills: [`frontend-ui-ux`] - why needed: ergonomics and discoverability quality.
  - Omitted: [`librarian`] - why not needed: interaction model already benchmarked.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 13, 14 | Blocked By: 10

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/dashboard/form/page.jsx` - current question card actions.
  - Pattern: `lib/events/contracts.js` - question schema requirements and constraints.
  - Pattern: `app/events/[eventSlug]/register/page.jsx` - preview/render parity target.
  - External: `https://www.nngroup.com/articles/web-form-design/` - usability constraints.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Question actions are discoverable, keyboard-accessible, and produce deterministic ordering.
  - [ ] Builder preview behavior matches participant render for all supported field types.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Reorder + duplicate + section flow
    Tool: Playwright
    Steps: Add 4 questions, duplicate one, drag reorder, insert section divider, save draft.
    Expected: Persisted order and section structure match UI order after reload.
    Evidence: .sisyphus/evidence/task-11-builder-order.png

  Scenario: Keyboard fallback reordering
    Tool: Playwright
    Steps: Use keyboard focus controls (no mouse drag) to reorder questions.
    Expected: Reorder succeeds and ARIA/live feedback is present.
    Evidence: .sisyphus/evidence/task-11-builder-keyboard.png
  ```

  **Commit**: YES | Message: `feat(builder): improve question editing ergonomics` | Files: [builder page/components, optional DnD helper modules]

- [x] 12. Professionalize Responses Experience in Dashboard Form Module

  **What to do**: Upgrade responses table UX (clear columns, filters/search, stable sort, detail drawer/modal, loading/empty/error states) and align visual quality with dashboard standards.
  **Must NOT do**: Do not keep raw JSON as only primary response exploration mode.

  **Recommended Agent Profile**:
  - Category: `visual-engineering` - Reason: data-table UX and dashboard quality polish.
  - Skills: [`frontend-ui-ux`] - why needed: discoverability and scannability improvements.
  - Omitted: [`deep`] - why not needed: no complex algorithmic design.

  **Parallelization**: Can Parallel: YES | Wave 3 | Blocks: 13, 14 | Blocked By: 10

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/dashboard/form/page.jsx` - current responses section baseline.
  - API/Type: `app/api/events/[eventSlug]/submissions/route.js` - response list payload structure.
  - Pattern: `app/dashboard/links/page.jsx` - card/list action patterns for dashboard modules.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Organizer can find a response by submitter name/email/answer keyword within dashboard UI.
  - [ ] Detail view is readable and actionable without exposing unformatted payload blobs by default.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Search and inspect response
    Tool: Playwright
    Steps: Open `/dashboard/form`, search by known submitter email, open detail view.
    Expected: Matching row appears and detail panel shows formatted answer groups.
    Evidence: .sisyphus/evidence/task-12-response-search.png

  Scenario: Empty/error state clarity
    Tool: Playwright
    Steps: Select event with no submissions and trigger failed fetch simulation.
    Expected: Distinct empty and error states shown with retry action.
    Evidence: .sisyphus/evidence/task-12-response-states.png
  ```

  **Commit**: YES | Message: `feat(builder): upgrade responses dashboard experience` | Files: [`app/dashboard/form/page.jsx`, any extracted response UI components]

- [x] 13. Accessibility + Mobile Hardening Across Fill, Profile, and Builder

  **What to do**: Enforce WCAG-aligned form semantics (labels, `aria-required`, focus-to-error behavior, keyboard nav, contrast-safe states) and mobile ergonomics (touch targets, spacing, no horizontal overflow) for register/profile/builder screens.
  **Must NOT do**: Do not rely on visual-only required indicators or inaccessible icon actions.

  **Recommended Agent Profile**:
  - Category: `unspecified-high` - Reason: cross-surface accessibility hardening.
  - Skills: [`playwright`] - why needed: reproducible keyboard/mobile validation.
  - Omitted: [`artistry`] - why not needed: conventional standards-based hardening.

  **Parallelization**: Can Parallel: NO | Wave 4 | Blocks: 14, 15 | Blocked By: 5, 6, 9, 10, 11, 12

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/events/[eventSlug]/register/page.jsx` - participant flow.
  - Pattern: `app/profile/page.jsx` - profile completion flow.
  - Pattern: `app/dashboard/form/page.jsx` - builder flow.
  - External: `https://www.w3.org/WAI/WCAG21/Understanding/labels-or-instructions.html` - labels/instructions.
  - External: `https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA2` - required semantics.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Keyboard-only navigation and submission is possible in all key flows.
  - [ ] Mobile viewport (390px width) has no horizontal scroll and all primary controls are tappable.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Keyboard-only register flow
    Tool: Playwright
    Steps: Navigate `/events/testing/register` using keyboard only (Tab/Shift+Tab/Enter/Space).
    Expected: Focus order is logical, errors are announced and visible, submission flow completes.
    Evidence: .sisyphus/evidence/task-13-keyboard-register.mp4

  Scenario: Mobile builder controls
    Tool: Playwright
    Steps: Open `/dashboard/form` at 390x844 and interact with add/reorder/save controls.
    Expected: Controls remain reachable with touch target-safe spacing; no clipped text or overflow.
    Evidence: .sisyphus/evidence/task-13-mobile-builder.png
  ```

  **Commit**: YES | Message: `fix(forms): harden accessibility and mobile behavior` | Files: [register/profile/builder pages and shared primitives]

- [x] 14. Security + Regression Test Wave for Form and Upload Contracts

  **What to do**: Expand automated tests for upload security boundaries, submission/file validation, profile gate behavior, version mismatch handling, and backward compatibility with non-file forms.
  **Must NOT do**: Do not ship file-field support without negative-path coverage.

  **Recommended Agent Profile**:
  - Category: `deep` - Reason: multi-layer regression and security coverage design.
  - Skills: [`playwright`] - why needed: E2E validation for real UX + upload interactions.
  - Omitted: [`frontend-ui-ux`] - why not needed: testing focus, not design.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: 15 | Blocked By: 7, 8, 9, 13

  **References** (executor has NO interview context - be exhaustive):
  - Test: `tests/events-submissions.route.test.js` - baseline route tests.
  - Test: `tests/events-form.route.test.js` - profile gate route test baseline.
  - API/Type: `app/api/events/[eventSlug]/submissions/route.js` - submission state machine.
  - API/Type: upload endpoint from task 8 - new security contract.

  **Acceptance Criteria** (agent-executable only):
  - [ ] New tests cover success + failure cases for upload and submission contracts.
  - [ ] Existing tests remain green and build passes with full suite.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Contract regression suite
    Tool: Bash
    Steps: Run `bun run test` with all form/upload-related tests.
    Expected: 100% pass; failures include actionable assertions for contract mismatches.
    Evidence: .sisyphus/evidence/task-14-test-suite.txt

  Scenario: Cross-event upload key rejection
    Tool: Bash
    Steps: Attempt submission with file key scoped to different event/user.
    Expected: Submission API returns 400/403 and does not create EventSubmission record.
    Evidence: .sisyphus/evidence/task-14-cross-event-rejection.txt
  ```

  **Commit**: YES | Message: `test(forms): add security and regression coverage` | Files: [route tests, e2e tests, helper fixtures]

- [x] 15. Production Readiness Sweep (Telemetry, Error Handling, Release Safety)

  **What to do**: Standardize loading/error/retry behavior, add lightweight telemetry logs for upload/submission failures, and verify release checklist for rollback safety and observability.
  **Must NOT do**: Do not leave silent failures for upload or submission critical paths.

  **Recommended Agent Profile**:
  - Category: `general` - Reason: cross-cutting polish and release hardening.
  - Skills: [] - why needed: straightforward reliability work.
  - Omitted: [`oracle`] - why not needed: architecture decisions already settled.

  **Parallelization**: Can Parallel: YES | Wave 4 | Blocks: none | Blocked By: 13, 14

  **References** (executor has NO interview context - be exhaustive):
  - Pattern: `app/api/events/[eventSlug]/submissions/route.js` - critical error paths and response codes.
  - Pattern: `app/api/profile/me/route.js` - profile update/read failure handling.
  - Pattern: `app/dashboard/form/page.jsx` - user-facing retry and error copy touchpoints.

  **Acceptance Criteria** (agent-executable only):
  - [ ] Critical failure paths produce user-visible, actionable messages and server logs.
  - [ ] Release checklist confirms no blocking regressions and includes rollback notes.

  **QA Scenarios** (MANDATORY - task incomplete without these):

  ```
  Scenario: Upload/submission failure messaging
    Tool: Playwright
    Steps: Simulate upload API and submission API failures in UI flows.
    Expected: User gets clear retry guidance; app state does not deadlock.
    Evidence: .sisyphus/evidence/task-15-failure-messaging.png

  Scenario: Production readiness command set
    Tool: Bash
    Steps: Run `bun run test && bun run build`.
    Expected: Commands pass and output saved as release evidence.
    Evidence: .sisyphus/evidence/task-15-release-check.txt
  ```

  **Commit**: YES | Message: `chore(forms): production readiness hardening` | Files: [UI/API error handling paths, release notes/checklist artifact]

## Final Verification Wave (4 parallel agents, ALL must APPROVE)

- [ ] F1. Plan Compliance Audit - oracle
- [ ] F2. Code Quality Review - unspecified-high
- [ ] F3. Real Manual QA - unspecified-high (+ playwright if UI)
- [ ] F4. Scope Fidelity Check - deep

## Commit Strategy

- Use focused commits by capability slice (shell/layout, shared field primitives, upload API, builder UX, tests).
- Preserve semantic commit format: `type(scope): desc`.
- Avoid mixing unrelated modules in one commit.

## Success Criteria

- Form completion UX is focused, clean, and mobile-safe without global navbar distractions.
- Builder is understandable within minutes by users familiar with Google Forms.
- File fields operate via secure R2 uploads and validated object metadata.
- Account identity indication is clear, professional, and privacy-conscious.
- No regressions for existing non-file forms and submission snapshots.
