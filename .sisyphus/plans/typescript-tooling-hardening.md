# Full TypeScript + Tooling Hardening for 8EH Radio ITB

## TL;DR

> **Quick Summary**: Migrate this Next.js repo from mostly JavaScript to strict TypeScript with phased safety gates, then lock quality with ESLint, Prettier, Husky/lint-staged, Vitest, Playwright smoke coverage, and CI checks.
>
> **Deliverables**:
> - Strict TypeScript baseline (`tsconfig.json`) with staged migration path
> - Working quality toolchain (ESLint + Prettier + pre-commit hooks)
> - Working test toolchain (Vitest + React Testing Library + Playwright smoke)
> - Typed migration across core libs, auth, API routes, and UI pages/components
> - CI quality gates (`typecheck`, `lint`, `format:check`, `test`, `build`)
>
> **Estimated Effort**: Large
> **Parallel Execution**: YES - 5 waves
> **Critical Path**: Task 1 -> Task 2 -> Task 3 -> Task 5 -> Task 7 -> Task 8

---

## Context

### Original Request
Migrate the project to be fully TypeScript and type-safe, set up supporting tooling (including Prettier and likely pre-commit hooks), adopt Vitest for testing, and verify whether this stack is viable.

### Interview Summary
**Key Discussions**:
- Full migration is viable and recommended.
- A phased rollout is safer than a single big-bang conversion.
- Fast checks should run in pre-commit, while heavy checks run in CI/pre-push.
- Vitest is a strong fit for unit/integration tests; Playwright complements async App Router coverage.

**Research Findings**:
- Repo is JS-heavy: 39 `.js`, 63 `.jsx`, 2 `.ts`, 0 `.tsx`.
- No current test scripts, no Vitest/Jest configs, no test files.
- No CI workflow file detected.
- `jsconfig.json` exists; `tsconfig.json` does not.
- `.prettierrc` exists but is empty.
- `package.json` format script targets `src/**/*` while code lives in `app/`, `lib/`, `scripts/`.

### Metis Review
**Identified Gaps (addressed in this plan)**:
- Lock scope to migration/tooling only (no Next.js/React version upgrade).
- Separate mechanical changes (format/config/renames) from behavior changes.
- Define temporary escape hatches and caps (`@ts-expect-error` with rationale; no `@ts-ignore`).
- Keep pre-commit fast-only; enforce heavy gates in CI.
- Add explicit go/no-go verification between phases.

---

## Work Objectives

### Core Objective
Ship a strict TypeScript codebase with reliable automated quality gates, without changing product behavior.

### Concrete Deliverables
- `tsconfig.json` replacing `jsconfig.json` usage with preserved aliases.
- Updated scripts in `package.json` for `typecheck`, `test`, `lint`, `format`, `format:check`.
- ESLint + Prettier + Husky/lint-staged configuration.
- Vitest setup with initial passing test suite and coverage output.
- Playwright smoke suite for critical browser paths.
- Incremental conversion of `.js/.jsx` to `.ts/.tsx` across target areas.
- CI workflow enforcing quality gates.

### Definition of Done
- [x] `bun run typecheck` exits 0 with strict TS settings enabled.
- [x] `bun run lint` exits 0 with no warnings promoted to errors.
- [x] `bun run format:check` exits 0.
- [x] `bun run test` exits 0.
- [x] `bun run build` exits 0.
- [x] All migrated files are `.ts/.tsx` and no planned migration targets remain in `.js/.jsx`.

### Must Have
- Preserve runtime behavior and route contracts.
- Preserve alias behavior from `jsconfig.json`.
- Enforce typed contracts for auth/session/API boundaries.
- Keep developer workflow fast (<20s pre-commit target).

### Must NOT Have (Guardrails)
- No framework major upgrade (Next.js/React) in this effort.
- No broad feature refactor under the label of migration.
- No repo-wide formatting-only churn mixed with behavior edits in same commit.
- No `@ts-ignore`; allow `@ts-expect-error` only with explicit reason comments.
- No human-only verification steps.

---

## Verification Strategy (MANDATORY)

> **UNIVERSAL RULE: ZERO HUMAN INTERVENTION**
>
> Every acceptance criterion in this plan must be executable and verifiable by the agent using commands or tools.

### Test Decision
- **Infrastructure exists**: NO
- **Automated tests**: YES (Tests-after for foundation setup, then RED-GREEN-REFACTOR for conversion slices)
- **Framework**: Vitest + React Testing Library + jsdom + Playwright smoke

### Test Infrastructure Setup Required
- Install Vitest and supporting packages.
- Create `vitest.config.mts` + `vitest.setup.ts`.
- Add initial passing tests and wire `bun run test`.
- Add Playwright smoke tests for async/server-rendered critical paths.

### Agent-Executed QA Scenarios Policy
- Frontend/browser checks: `playwright` skill.
- CLI/config checks: `bash` commands.
- API checks: `curl` via `bash`.
- Each task includes happy-path and failure-path scenarios with evidence artifacts in `.sisyphus/evidence/`.

---

## Execution Strategy

### Parallel Execution Waves

Wave 1 (Start Immediately):
- Task 1 (baseline and guardrails)

Wave 2 (After Wave 1):
- Task 2 (TS/compiler/script foundation)
- Task 3 (ESLint/Prettier/hooks foundation)

Wave 3 (After Wave 2):
- Task 4 (Vitest baseline)
- Task 5 (Playwright smoke baseline)

Wave 4 (After Wave 3):
- Task 6 (Core libs/hooks conversion)
- Task 7 (Auth + API conversion)

Wave 5 (After Wave 4):
- Task 8 (UI/page conversion + strict hardening + CI finalize)

Critical Path: 1 -> 2 -> 3 -> 5 -> 7 -> 8
Parallel Speedup: ~30-40% over strict sequential execution.

### Dependency Matrix

| Task | Depends On | Blocks | Can Parallelize With |
|---|---|---|---|
| 1 | None | 2, 3 | None |
| 2 | 1 | 4, 6, 7, 8 | 3 |
| 3 | 1 | 4, 5, 8 | 2 |
| 4 | 2, 3 | 6, 7, 8 | 5 |
| 5 | 3 | 8 | 4 |
| 6 | 2, 4 | 8 | 7 |
| 7 | 2, 4 | 8 | 6 |
| 8 | 5, 6, 7 | None | None |

### Agent Dispatch Summary

| Wave | Tasks | Recommended Agents |
|---|---|---|
| 1 | 1 | `task(category="unspecified-low", load_skills=[], run_in_background=false)` |
| 2 | 2, 3 | `task(category="general", load_skills=["frontend-ui-ux"], run_in_background=false)` for config consistency |
| 3 | 4, 5 | `task(category="general", load_skills=["playwright"], run_in_background=false)` |
| 4 | 6, 7 | `task(category="unspecified-high", load_skills=[], run_in_background=false)` |
| 5 | 8 | `task(category="unspecified-high", load_skills=["playwright"], run_in_background=false)` |

---

## TODOs

- [x] 1. Establish baseline, guardrails, and evidence scaffolding

  **What to do**:
  - Capture current baseline results for `build`, `lint`, and script inventory.
  - Create `.sisyphus/evidence/` artifact naming convention for all tasks.
  - Document frozen scope and migration constraints in a short execution note.

  **Must NOT do**:
  - Do not change app logic.
  - Do not introduce dependency upgrades outside tooling migration.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-low`
    - Reason: inventory and workflow setup, low implementation complexity.
  - **Skills**: `[]`
    - No specialized skill required.
  - **Skills Evaluated but Omitted**:
    - `playwright`: not needed for pure baseline capture.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Sequential (Wave 1)
  - **Blocks**: 2, 3
  - **Blocked By**: None

  **References**:
  - `package.json:6` - current scripts baseline and missing `test`/`typecheck`.
  - `README.md:1` - current dev/build command expectations.

  **Acceptance Criteria**:
  - [x] `bun run build` exits 0 and output saved to `.sisyphus/evidence/task-1-build.txt`.
  - [x] `bun run lint` exits 0 and output saved to `.sisyphus/evidence/task-1-lint.txt`.
  - [x] `bun run test` fails with missing script and output saved to `.sisyphus/evidence/task-1-test-missing.txt`.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Capture pre-migration baseline
    Tool: Bash
    Preconditions: Dependencies installed via bun install
    Steps:
      1. Run: bun run build > .sisyphus/evidence/task-1-build.txt 2>&1
      2. Assert: exit code is 0
      3. Run: bun run lint > .sisyphus/evidence/task-1-lint.txt 2>&1
      4. Assert: exit code is 0
    Expected Result: Baseline build/lint evidence captured
    Failure Indicators: non-zero exit codes
    Evidence: .sisyphus/evidence/task-1-build.txt, .sisyphus/evidence/task-1-lint.txt

  Scenario: Validate missing test baseline
    Tool: Bash
    Preconditions: No test script present yet
    Steps:
      1. Run: bun run test > .sisyphus/evidence/task-1-test-missing.txt 2>&1
      2. Assert: exit code is non-zero
      3. Assert: output contains "Script not found" or equivalent
    Expected Result: Confirms pre-migration gap is real
    Failure Indicators: command unexpectedly succeeds
    Evidence: .sisyphus/evidence/task-1-test-missing.txt
  ```

  **Commit**: YES
  - Message: `chore(plan): capture migration baseline`
  - Pre-commit: none

- [x] 2. Create TypeScript compiler foundation and migrate project-level config

  **What to do**:
  - Add `tsconfig.json` preserving alias behavior from `jsconfig.json`.
  - Add TS scripts in `package.json`: `typecheck`, `typecheck:strict`.
  - Update formatting and lint script globs from `src/` to real directories.
  - Keep `allowJs` enabled for transitional compatibility in this phase.

  **Must NOT do**:
  - Do not disable typechecking in build flow.
  - Do not remove JS support before migrated coverage is ready.

  **Recommended Agent Profile**:
  - **Category**: `general`
    - Reason: cross-cutting config and script changes.
  - **Skills**: `[]`
    - No specialized skill required.
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: not required for compiler/tooling config.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 3)
  - **Blocks**: 4, 6, 7, 8
  - **Blocked By**: 1

  **References**:
  - `jsconfig.json:1` - current alias config to preserve.
  - `package.json:12` - current format script mismatch (`src/**/*`).
  - `next.config.mjs:7` - Next config baseline; keep runtime behavior stable.
  - https://nextjs.org/docs/app/api-reference/config/typescript - Next.js TS config guidance.
  - https://www.typescriptlang.org/docs/handbook/migrating-from-javascript.html - incremental migration strategy.

  **Acceptance Criteria**:
  - [x] `bun run typecheck` exits 0.
  - [ ] `bun run typecheck:strict` exists and reports current strict debt intentionally (non-zero allowed only until Task 8).
  - [ ] Alias imports using `@/` continue working in `bun run build`.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Transitional TypeScript compile works with allowJs
    Tool: Bash
    Preconditions: tsconfig.json and package scripts added
    Steps:
      1. Run: bun run typecheck > .sisyphus/evidence/task-2-typecheck.txt 2>&1
      2. Assert: exit code is 0
      3. Run: bun run build > .sisyphus/evidence/task-2-build.txt 2>&1
      4. Assert: exit code is 0
    Expected Result: Typecheck and build pass under transitional settings
    Failure Indicators: missing path alias resolution, compiler crashes
    Evidence: .sisyphus/evidence/task-2-typecheck.txt, .sisyphus/evidence/task-2-build.txt

  Scenario: Strict debt is visible and measurable
    Tool: Bash
    Preconditions: typecheck:strict script added
    Steps:
      1. Run: bun run typecheck:strict > .sisyphus/evidence/task-2-typecheck-strict.txt 2>&1
      2. Assert: output includes TypeScript diagnostics when debt exists
      3. Assert: command behavior is deterministic across reruns
    Expected Result: Strict debt can be tracked to zero later
    Failure Indicators: command missing or silent without diagnostics
    Evidence: .sisyphus/evidence/task-2-typecheck-strict.txt
  ```

  **Commit**: YES
  - Message: `build(ts): add tsconfig and typecheck scripts`
  - Pre-commit: `bun run typecheck`

- [x] 3a. Add ESLint configuration with TypeScript support
- [x] 3b. Update Prettier configuration with concrete rules
- [x] 3c. Add Husky and lint-staged pre-commit hooks

  **What to do**:
  - Add/upgrade ESLint config for TS-aware linting.
  - Replace empty `.prettierrc` with concrete formatting rules.
  - Add `lint-staged` config and Husky `pre-commit` hook.
  - Keep pre-commit fast: staged lint + format only.

  **Must NOT do**:
  - Do not run full build/tests in pre-commit.
  - Do not introduce style-only churn across whole repo in same changeset.

  **Recommended Agent Profile**:
  - **Category**: `general`
    - Reason: toolchain quality gate setup.
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `git-master`: useful for commits but not required for implementation.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 2 (with Task 2)
  - **Blocks**: 4, 5, 8
  - **Blocked By**: 1

  **References**:
  - `.prettierrc:1` - currently empty config, needs concrete policy.
  - `package.json:49` - existing Prettier dependency baseline.
  - https://prettier.io/docs/configuration - formatter policy reference.
  - https://typescript-eslint.io/users/configs - TS-aware linting defaults.

  **Acceptance Criteria**:
  - [x] `bun run lint` exits 0.
  - [x] `bun run format:check` exits 0.
  - [ ] Pre-commit hook runs lint-staged only on staged files.
  - [ ] Pre-commit runtime on small staged change is under 20 seconds.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Hook passes with valid staged changes
    Tool: Bash
    Preconditions: Husky + lint-staged configured
    Steps:
      1. Stage a small valid TS/TSX change
      2. Run: git commit -m "chore: hook sanity check"
      3. Assert: hook runs lint-staged commands and commit succeeds
    Expected Result: Fast pre-commit flow remains usable
    Failure Indicators: hook skips checks or hangs excessively
    Evidence: .sisyphus/evidence/task-3-precommit-pass.txt

  Scenario: Hook blocks malformed staged file
    Tool: Bash
    Preconditions: same as above
    Steps:
      1. Stage a file with clear lint/format violation
      2. Run: git commit -m "chore: hook failure check"
      3. Assert: commit is blocked with lint/format error output
    Expected Result: Bad code is blocked at pre-commit
    Failure Indicators: commit succeeds despite violations
    Evidence: .sisyphus/evidence/task-3-precommit-fail.txt
  ```

  **Commit**: YES
  - Message: `chore(tooling): add eslint prettier and hooks`
  - Pre-commit: `bun run lint && bun run format:check`

- [x] 4. Introduce Vitest baseline with React Testing Library

  **What to do**:
  - Add Vitest stack and setup files.
  - Add first test suite for pure utilities and one client component.
  - Add coverage output and deterministic `bun run test` script.

  **Must NOT do**:
  - Do not test async Server Components in Vitest.
  - Do not chase broad coverage targets in first pass.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: test infra + runtime adaptation for Next.js app dir.
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `playwright`: used in Task 5, not needed for unit tests.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 5)
  - **Blocks**: 6, 7, 8
  - **Blocked By**: 2, 3

  **References**:
  - `lib/audioUtils.js:1` - candidate for first utility tests.
  - `app/components/AuthProvider.jsx:1` - client component candidate for first RTL tests.
  - https://nextjs.org/docs/app/guides/testing/vitest - official Next.js + Vitest guidance.
  - https://vitest.dev/guide/ - Vitest config and coverage defaults.

  **Acceptance Criteria**:
  - [x] `bun run test` exits 0.
  - [ ] At least one utility test and one component test pass.
  - [ ] Coverage output generated in configured directory.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Vitest baseline suite passes
    Tool: Bash
    Preconditions: vitest config + setup + initial tests committed
    Steps:
      1. Run: bun run test > .sisyphus/evidence/task-4-test-pass.txt 2>&1
      2. Assert: exit code is 0
      3. Assert: output contains passed test counts
    Expected Result: Baseline test pipeline is operational
    Failure Indicators: environment/config errors, zero discovered tests
    Evidence: .sisyphus/evidence/task-4-test-pass.txt

  Scenario: Test runner reports failures correctly
    Tool: Bash
    Preconditions: add temporary failing assertion in a disposable test file
    Steps:
      1. Run: bun run test > .sisyphus/evidence/task-4-test-fail.txt 2>&1
      2. Assert: exit code is non-zero
      3. Assert: failing test location is reported
      4. Remove disposable failing test and rerun to green
    Expected Result: Runner blocks regressions
    Failure Indicators: failures not detected
    Evidence: .sisyphus/evidence/task-4-test-fail.txt
  ```

  **Commit**: YES
  - Message: `test(vitest): add baseline unit test setup`
  - Pre-commit: `bun run test`

- [x] 5. Add Playwright smoke coverage for critical paths

  **What to do**:
  - Add Playwright config and smoke tests for high-value paths.
  - Cover home load, login flow, and one protected dashboard path.
  - Capture screenshots and traces for failure diagnostics.

  **Must NOT do**:
  - Do not expand to full E2E matrix in this migration.
  - Do not rely on manual browser verification.

  **Recommended Agent Profile**:
  - **Category**: `general`
    - Reason: browser automation and smoke checks.
  - **Skills**: `["playwright"]`
    - `playwright`: required for deterministic browser verification.
  - **Skills Evaluated but Omitted**:
    - `dev-browser`: overlapping capability; prioritize `playwright` skill.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 3 (with Task 4)
  - **Blocks**: 8
  - **Blocked By**: 3

  **References**:
  - `app/page.jsx:1` - public home route target.
  - `app/login/page.jsx:1` - login route target.
  - `app/dashboard/page.jsx:1` - authenticated route smoke target.
  - `app/api/auth/[...nextauth]/route.js:6` - auth behavior baseline for scenario design.

  **Acceptance Criteria**:
  - [ ] Playwright smoke suite runs headless and exits 0.
  - [ ] Smoke evidence screenshots are saved under `.sisyphus/evidence/`.
  - [ ] Failure trace artifacts are configured and captured on retry failures.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Public home page smoke
    Tool: Playwright (playwright skill)
    Preconditions: dev server on http://localhost:3000
    Steps:
      1. Navigate to: http://localhost:3000/
      2. Wait for: main content visible
      3. Assert: document title contains "8EH Radio ITB"
      4. Screenshot: .sisyphus/evidence/task-5-home-smoke.png
    Expected Result: Home page renders without runtime errors
    Failure Indicators: navigation timeout, hydration errors
    Evidence: .sisyphus/evidence/task-5-home-smoke.png

  Scenario: Invalid login remains on login page
    Tool: Playwright (playwright skill)
    Preconditions: dev server running
    Steps:
      1. Navigate to: http://localhost:3000/login
      2. Fill likely credential fields with invalid values
      3. Submit form
      4. Assert: URL still contains /login
      5. Screenshot: .sisyphus/evidence/task-5-login-invalid.png
    Expected Result: Unauthorized access is not granted
    Failure Indicators: redirect to protected route with invalid data
    Evidence: .sisyphus/evidence/task-5-login-invalid.png
  ```

  **Commit**: YES
  - Message: `test(e2e): add playwright smoke suite`
  - Pre-commit: `bun run test:e2e:smoke`

- [x] 6. Convert foundational libs and hooks to TypeScript

  **What to do**:
  - Convert core utilities and hooks first (low blast radius).
  - Introduce shared types in `lib/types/` for reusable contracts.
  - Ensure hook return types and utility interfaces are explicit.

  **Must NOT do**:
  - Do not change business logic while adding types.
  - Do not leave implicit `any` in exported APIs.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: multiple foundational modules used across app.
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: not a visual redesign task.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 7)
  - **Blocks**: 8
  - **Blocked By**: 2, 4

  **References**:
  - `lib/prisma.js:1` - singleton Prisma client typing pattern.
  - `lib/roleUtils.js:1` - role/authorization helper typing target.
  - `lib/audioUtils.js:1` - utility typing and unit test target.
  - `app/hooks/useGlobalAudio.js:1` - hook typing for global audio instance.
  - `app/hooks/useOnAirStatus.js:1` - hook state/effect typing target.
  - `app/hooks/useRadioStream.js:1` - stream hook typing target.

  **Acceptance Criteria**:
  - [ ] Converted files compile without TS errors.
  - [ ] Utility/hook tests pass in Vitest.
  - [ ] No exported symbol from converted files has implicit `any`.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Converted utilities and hooks typecheck cleanly
    Tool: Bash
    Preconditions: target files renamed to .ts where applicable
    Steps:
      1. Run: bun run typecheck > .sisyphus/evidence/task-6-typecheck.txt 2>&1
      2. Assert: exit code is 0
      3. Run targeted tests for converted modules
      4. Assert: exit code is 0
    Expected Result: Foundational modules are stable under TS
    Failure Indicators: implicit any diagnostics or failing tests
    Evidence: .sisyphus/evidence/task-6-typecheck.txt

  Scenario: Negative path for hook input/state handling
    Tool: Vitest via Bash
    Preconditions: tests include invalid/edge input case
    Steps:
      1. Run: bun run test -- app/hooks
      2. Assert: edge case test confirms safe fallback behavior
    Expected Result: Hooks handle invalid states without crashes
    Failure Indicators: unhandled exceptions
    Evidence: .sisyphus/evidence/task-6-hook-negative.txt
  ```

  **Commit**: YES
  - Message: `refactor(ts): migrate shared libs and hooks`
  - Pre-commit: `bun run typecheck && bun run test`

- [x] 7. Convert auth and API routes to TypeScript contracts

  **What to do**:
  - Convert auth route and session callbacks to typed contracts.
  - Add NextAuth type augmentation for session/token role fields.
  - Convert API routes in batches with shared request/response types.
  - Validate status codes and payload shapes with tests.

  **Must NOT do**:
  - Do not alter auth allow/deny behavior.
  - Do not broaden API response schemas beyond current contract.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: security-critical and contract-heavy conversion.
  - **Skills**: `[]`
  - **Skills Evaluated but Omitted**:
    - `playwright`: API/auth validation is better via curl/Vitest here.

  **Parallelization**:
  - **Can Run In Parallel**: YES
  - **Parallel Group**: Wave 4 (with Task 6)
  - **Blocks**: 8
  - **Blocked By**: 2, 4

  **References**:
  - `app/api/auth/[...nextauth]/route.js:6` - auth options and callback behavior to preserve.
  - `app/api/users/route.js:1` - representative API route conversion target.
  - `app/api/blog/route.js:1` - content API contract baseline.
  - `app/api/shortlinks/route.js:1` - dynamic payload route conversion target.
  - `lib/prisma.js:6` - typed Prisma usage across route handlers.
  - https://next-auth.js.org/getting-started/typescript - NextAuth TS patterns.

  **Acceptance Criteria**:
  - [ ] Auth route compiles and preserves whitelist gating behavior.
  - [ ] Converted API routes return same status codes for success/error paths.
  - [ ] Contract tests pass for at least one route per API group.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Auth callback behavior unchanged
    Tool: Vitest via Bash
    Preconditions: auth route converted to TS + callback tests added
    Steps:
      1. Run auth callback tests for whitelisted and non-whitelisted emails
      2. Assert: signIn true for whitelisted, false for non-whitelisted
      3. Assert: session token retains expected role and id mappings
    Expected Result: Security behavior preserved after typing
    Failure Indicators: non-whitelisted sign-in allowed
    Evidence: .sisyphus/evidence/task-7-auth-tests.txt

  Scenario: API error path contract verification
    Tool: Bash (curl)
    Preconditions: local server running
    Steps:
      1. Send invalid payload to a converted route (e.g., missing required fields)
      2. Assert: HTTP status is expected 4xx
      3. Assert: response body contains expected error key/message shape
    Expected Result: Error contracts remain stable
    Failure Indicators: unexpected 2xx or malformed error shape
    Evidence: .sisyphus/evidence/task-7-api-negative.json
  ```

  **Commit**: YES
  - Message: `refactor(ts): migrate auth and api routes`
  - Pre-commit: `bun run typecheck && bun run test`

- [x] 8. Convert UI/pages to TSX, enable strict end-state, and finalize CI gates

  **What to do**:
  - Migrate remaining `app/**/*.jsx` pages/components to `.tsx` in batches.
  - Add explicit prop types and remove PropTypes where superseded.
  - Switch final TS config to strict end-state (`strict: true`, remove migration crutches).
  - Add CI workflow that enforces `typecheck`, `lint`, `format:check`, `test`, `build`.
  - Ensure zero unresolved strict debt before final sign-off.

  **Must NOT do**:
  - Do not merge with `strict` disabled.
  - Do not leave conversion TODOs without tracked follow-up tasks.

  **Recommended Agent Profile**:
  - **Category**: `unspecified-high`
    - Reason: largest migration surface plus release gates.
  - **Skills**: `["playwright"]`
    - `playwright`: required for final smoke verification on migrated UI.
  - **Skills Evaluated but Omitted**:
    - `frontend-ui-ux`: migration task, not visual redesign.

  **Parallelization**:
  - **Can Run In Parallel**: NO
  - **Parallel Group**: Wave 5 (final integration)
  - **Blocks**: None
  - **Blocked By**: 5, 6, 7

  **References**:
  - `app/layout.js:141` - async layout typing and session prop contract.
  - `app/components/AuthProvider.jsx:5` - prop typing baseline for session and children.
  - `app/components/Navbar.jsx:1` - representative high-use component conversion target.
  - `app/dashboard/layout.jsx:1` - nested app-router layout conversion target.
  - `middleware.ts:1` - existing TS edge runtime file as style baseline.
  - `instrumentation.ts:1` - existing TS server instrumentation baseline.
  - https://nextjs.org/docs/app/api-reference/config/typescript - strict Next.js TS conventions.

  **Acceptance Criteria**:
  - [x] `bun run typecheck` exits 0 with strict mode enabled.
  - [x] `bun run lint` exits 0.
  - [x] `bun run format:check` exits 0.
  - [x] `bun run test` exits 0.
  - [x] `bun run build` exits 0.
  - [ ] Playwright smoke suite exits 0 after full migration.

  **Agent-Executed QA Scenarios**:

  ```text
  Scenario: Final quality gate run
    Tool: Bash
    Preconditions: all migration tasks completed
    Steps:
      1. Run: bun run typecheck
      2. Run: bun run lint
      3. Run: bun run format:check
      4. Run: bun run test
      5. Run: bun run build
      6. Assert: all commands exit 0
    Expected Result: Repository is fully typed and gate-clean
    Failure Indicators: any non-zero gate
    Evidence: .sisyphus/evidence/task-8-final-gates.txt

  Scenario: Final browser smoke on migrated TSX app
    Tool: Playwright (playwright skill)
    Preconditions: production build/start running locally
    Steps:
      1. Navigate to home, login, dashboard flows
      2. Assert key UI containers render and navigation succeeds where authorized
      3. Assert invalid login path remains unauthorized
      4. Capture screenshots for each route
    Expected Result: Core flows intact after full conversion
    Failure Indicators: hydration/runtime errors, route regressions
    Evidence: .sisyphus/evidence/task-8-home.png, .sisyphus/evidence/task-8-login.png, .sisyphus/evidence/task-8-dashboard.png
  ```

  **Commit**: YES
  - Message: `chore(ts): complete strict migration and ci gates`
  - Pre-commit: `bun run typecheck && bun run test && bun run build`

---

## Commit Strategy

| After Task | Message | Verification |
|---|---|---|
| 1 | `chore(plan): capture migration baseline` | `bun run build && bun run lint` |
| 2 | `build(ts): add tsconfig and typecheck scripts` | `bun run typecheck` |
| 3 | `chore(tooling): add eslint prettier and hooks` | `bun run lint && bun run format:check` |
| 4 | `test(vitest): add baseline unit test setup` | `bun run test` |
| 5 | `test(e2e): add playwright smoke suite` | `bun run test:e2e:smoke` |
| 6 | `refactor(ts): migrate shared libs and hooks` | `bun run typecheck && bun run test` |
| 7 | `refactor(ts): migrate auth and api routes` | `bun run typecheck && bun run test` |
| 8 | `chore(ts): complete strict migration and ci gates` | `bun run typecheck && bun run lint && bun run test && bun run build` |

---

## Success Criteria

### Verification Commands

```bash
bun run typecheck
bun run lint
bun run format:check
bun run test
bun run build
```

### Final Checklist
- [x] All planned migration targets are converted to TypeScript/TSX.
- [x] Strict typechecking is enabled and passing.
- [x] No `@ts-ignore` exists in migrated code.
- [x] Pre-commit hooks run fast and block invalid staged changes.
- [x] Vitest baseline and Playwright smoke both pass.
- [x] CI enforces all quality gates before merge.
