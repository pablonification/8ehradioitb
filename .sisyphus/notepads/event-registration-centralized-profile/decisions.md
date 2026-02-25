# Decisions

## Task 5 Verification Decisions

- Chose live HTTP verification against `bun dev` instead of direct handler invocation to validate full middleware/auth/session behavior and real request contracts.
- Kept scope strictly to verification and evidence gathering; no API or schema modifications were introduced.

## Task 11 Implementation Decisions

- Added `app/api/events/[eventSlug]/submissions/route.js` so organizers have a dedicated submissions-read endpoint with existing event-action authorization and consent-safe payload shaping.
- Implemented consent-field filtering in both API and dashboard mapping layers to guarantee non-requested profile keys are not rendered even if stored in raw submission snapshots.
- Kept export behavior as endpoint triggers from the UI and did not implement export generation logic in frontend or page server code.

## Task 12 Implementation Decisions

- Kept `scripts/setup-test-session.mjs` focused strictly on session fixture setup (user upsert + cookie file output) with no implicit network calls.
- Implemented `scripts/registration-smoke.mjs` against shared API-layer functions instead of HTTP session auth to keep smoke validation deterministic under automation.
- Implemented `scripts/assert-export-columns.mjs` as schema-driven stability enforcement (published form version as source of truth), with optional fixture file comparison for negative/mismatch scenarios.
