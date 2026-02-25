# TypeScript Migration Notes

## Scope Guardrails (Frozen)

### MUST NOT Change
- **No framework major upgrades**: Next.js and React versions remain locked during migration
- **No feature refactoring**: Only type annotations, no behavior changes
- **No @ts-ignore**: Use `@ts-expect-error` with rationale only if absolutely necessary
- **No mixed commits**: Mechanical changes (renames/formatting) separated from behavior changes

### Allowed Escapes (with tracking)
- Temporary `any` types with TODO comments
- `skipLibCheck: true` during transitional phase
- `@ts-expect-error` with explicit reason in comment

## Baseline Captured

| Command | Exit Code | Status | Evidence |
|---------|-----------|--------|----------|
| `bun run build` | 0 | PASS | task-1-build.txt |
| `bun run lint` | 1 | FAIL (expected - needs ESLint setup) | task-1-lint.txt |
| `bun run test` | 1 | FAIL (expected - no test script) | task-1-test-missing.txt |

## Migration Strategy

1. **Phase 1**: Config foundation (tsconfig, ESLint, Prettier, hooks)
2. **Phase 2**: Testing baseline (Vitest, Playwright smoke)
3. **Phase 3**: Code migration (libs → hooks → auth/API → UI/pages)
4. **Phase 4**: Strict mode enable + CI gates

## Current Stats
- .js files: 39
- .jsx files: 63
- .ts files: 2
- .tsx files: 0

## Path Aliases to Preserve
- `@/*` → `./*` (from jsconfig.json)
