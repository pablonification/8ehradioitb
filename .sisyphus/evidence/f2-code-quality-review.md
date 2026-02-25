# F2 Code Quality Review - Form Builder Production-Grade Scope

Verdict: CONCERNS

Scope reviewed:

- `app/events/[eventSlug]/register/page.jsx`
- `app/profile/page.jsx`
- `app/dashboard/form/page.jsx`
- `app/components/forms/FieldRenderer.jsx`
- `app/api/events/[eventSlug]/submissions/route.js`
- `app/api/events/[eventSlug]/uploads/route.js`
- `tests/events-submissions.route.test.js`
- `tests/events-uploads.route.test.js`
- `tests/events-form.route.test.js`

## Severity-ranked findings

### High

1. Required file-field completeness is inconsistent between client and server contracts.

- Anchors:
  - `app/events/[eventSlug]/register/page.jsx:144` (required check treats any non-empty object as filled)
  - `app/profile/page.jsx:31` (file value accepts any object shape)
  - `app/profile/page.jsx:164` (required validation does not assert file metadata fields)
  - `app/api/events/[eventSlug]/submissions/route.js:337` (server enforces strict normalized answer validation)
- Risk:
  - Users can pass client-side "required" checks with malformed file objects, then fail on submit with server 400. This creates correctness and UX drift across profile/register vs submission contract.
- Remediation:
  - Introduce one shared `isFileMetadata` validator in a common utility (UI + API contract package) and use it in register/profile required checks before allowing review/save/submit.
  - Keep current server strictness; align clients to same shape (`key/name/mime/size > 0`).

2. File key scope validation in submission route does not fully enforce the intended path contract (`source` segment and field position semantics).

- Anchors:
  - `app/api/events/[eventSlug]/submissions/route.js:55` (prefix only validates `events/<slug>/users/<id>`)
  - `app/api/events/[eventSlug]/submissions/route.js:93` (field key accepted by `indexOf`, not strict segment position)
- Risk:
  - Keys can pass scope checks while not following the intended `events/<event>/users/<user>/<source>/<fieldKey>/...` structure, weakening contract integrity and future policy controls.
- Remediation:
  - Replace current segment search with strict structural validation:
    - exact prefix match,
    - source in allowed set (`form|profile`),
    - exact field segment equals current `question.key`,
    - non-empty trailing object path.
  - Add explicit negative tests for wrong source position and wrong field segment order.

### Medium

3. Form builder page is overly monolithic, mixing data fetching, state orchestration, and large UI rendering in one component.

- Anchors:
  - `app/dashboard/form/page.jsx:232`
  - `app/dashboard/form/page.jsx:638`
- Risk:
  - Higher regression risk and slower review cycles because business logic and rendering are tightly coupled in a 1700+ line file.
- Remediation:
  - Extract into focused units: `FormBuilderHeader`, `QuestionEditorPanel`, `ResponsesPanel`, `ProfileCatalogRail`.
  - Move side-effect/data logic into hooks (`useEventVersions`, `useEventSubmissions`, `useDraftFormState`) to isolate behavior and simplify testability.

4. Route test coverage has a material blind spot on form-read success path.

- Anchor:
  - `tests/events-form.route.test.js:25` (only profile-incomplete branch asserted)
- Risk:
  - The success response shape and status for `GET /api/events/[eventSlug]/form` can regress undetected.
- Remediation:
  - Add a success-case test asserting status 200 and expected payload keys (event, formVersion id/schema fragments, requested profile fields, consent text).

### Low

5. Dynamic error banners are not announced as live regions, reducing assistive-tech feedback for async failures.

- Anchors:
  - `app/events/[eventSlug]/register/page.jsx:249`
  - `app/profile/page.jsx:256`
  - `app/dashboard/form/page.jsx:760`
- Risk:
  - Screen-reader users may not be notified when network/submission errors appear after interaction.
- Remediation:
  - Add `role="alert"` (or `aria-live="polite"` where appropriate) on dynamic error containers.

## Positive patterns worth keeping

- Strong contract hardening exists in upload and submission APIs with strict payload checks and explicit 4xx responses (`app/api/events/[eventSlug]/uploads/route.js:35`, `app/api/events/[eventSlug]/submissions/route.js:345`).
- Structured server error logging includes operation/context metadata, which materially improves production troubleshooting (`app/api/events/[eventSlug]/submissions/route.js:233`, `app/api/events/[eventSlug]/uploads/route.js:178`).
- Shared field config usage (`FIELD_DEFAULTS`, `FIELD_VALIDATORS`, `ALLOWED_FIELD_TYPES`) is a solid consistency foundation across builder/render/contract surfaces.

## Verification notes

- Anti-pattern scan executed for TODO/FIXME/HACK and risky markers in scoped files.
- LSP diagnostics checked on all reviewed production files: no diagnostics reported.
- No code changes were made in product surfaces; this deliverable is documentation-only.
