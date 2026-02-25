# F3 Real Manual QA - Critical User Flows

- Date: 2026-02-24
- Environment: local dev (`bun dev`) at `http://localhost:3000`
- Viewports tested: desktop `1280x800`, mobile `390x844`
- Tester: Playwright MCP browser automation (manual flow style checks)

## Scenario Results (PASS/FAIL)

### 1) `/events/testing/register` (form fill + review)

- **Desktop: FAIL (blocked by auth for form interaction)**
  - Repro:
    - Open `http://localhost:3000/events/testing/register`
    - Wait for loading state to complete
    - Observe login gate instead of interactive form
  - Observed:
    - Login gate text appears: "Silakan login terlebih dahulu untuk mengisi form event."
    - API error surfaced in console/network: `GET /api/events/testing/form` returns `401 Unauthorized`
    - Participant shell expectation (**no navbar**) is met on this route (main registration shell shown)
  - Screenshot: `.sisyphus/evidence/f3-desktop-register-login-required.png`

- **Mobile: FAIL (blocked by auth for form interaction)**
  - Repro: same as desktop at `390x844`
  - Observed:
    - Same login gate and `401` on `GET /api/events/testing/form`
    - No horizontal overflow (`documentElement.scrollWidth === window.innerWidth === 390`)
    - Participant shell expectation (**no navbar**) is met
  - Screenshot: `.sisyphus/evidence/f3-mobile-register-login-required.png`

- **File field interaction state:** FAIL (not reachable due auth gate before form render)

### 2) `/profile?redirect=/events/testing/register` (save + redirect)

- **Desktop: FAIL (save/redirect action blocked by auth)**
  - Repro:
    - Open `http://localhost:3000/profile?redirect=/events/testing/register`
    - Wait for loading state to complete
    - Attempt to proceed with profile update flow
  - Observed:
    - Login prompt appears: "Silakan login untuk mengakses halaman profil."
    - API error surfaced: `GET /api/profile/me` returns `401 Unauthorized`
    - "Kembali ke Form" link is visible, but authenticated save flow cannot be completed
    - Account reveal behavior is visible in section "Transparansi Data Profil" with disabled identity card state
  - Screenshot: `.sisyphus/evidence/f3-desktop-profile-login-required.png`

- **Mobile: FAIL (save/redirect action blocked by auth)**
  - Repro: same as desktop at `390x844`
  - Observed:
    - Same login gate and `401` on `GET /api/profile/me`
    - Account reveal block is visible with masked/unavailable email state
    - No horizontal overflow (`documentElement.scrollWidth === window.innerWidth === 390`)
  - Screenshot: `.sisyphus/evidence/f3-mobile-profile-login-required.png`

### 3) `/dashboard/form` (builder basics + responses surface)

- **Desktop: FAIL (redirected to login, builder unreachable unauthenticated)**
  - Repro:
    - Open `http://localhost:3000/dashboard/form`
  - Observed:
    - Immediate redirect to `/login`
    - Builder basics and responses UI are not reachable without auth
  - Screenshot: `.sisyphus/evidence/f3-desktop-dashboard-login-redirect.png`

- **Mobile: FAIL (redirected to login, builder unreachable unauthenticated)**
  - Repro: same as desktop at `390x844`
  - Observed:
    - Immediate redirect to `/login`
    - No horizontal overflow on login view (`scrollWidth === innerWidth === 390`)
  - Screenshot: `.sisyphus/evidence/f3-mobile-dashboard-login-redirect.png`

## Console/Network Anomalies

- Blocking API auth failures:
  - `GET /api/events/testing/form` -> `401 Unauthorized`
  - `GET /api/profile/me` -> `401 Unauthorized`
- Warnings observed repeatedly:
  - NextAuth debug warning: `[next-auth][warn][DEBUG_ENABLED]`
  - Deprecated meta warning: `apple-mobile-web-app-capable`
  - Next/Image migration warnings (legacy `objectFit`, sizing/priority related notices)

## Evidence Files

- `.sisyphus/evidence/f3-desktop-register-login-required.png`
- `.sisyphus/evidence/f3-desktop-profile-login-required.png`
- `.sisyphus/evidence/f3-desktop-dashboard-login-redirect.png`
- `.sisyphus/evidence/f3-mobile-register-login-required.png`
- `.sisyphus/evidence/f3-mobile-profile-login-required.png`
- `.sisyphus/evidence/f3-mobile-dashboard-login-redirect.png`
- `.sisyphus/evidence/f3-dev-server.log`

## Release Gate Note

- Critical user flows requiring authenticated interaction (register form fill/review, profile save+redirect, dashboard builder/responses) could not be fully validated in this run due unauthenticated `401`/redirect gates.
