# Issues

## Task 5 Verification Issues

- Initial verification attempt failed with `401` due to token construction mismatch (`next-auth` JWT salt handling); resolved by using default `encode` behavior matching runtime decode path.
- `GET /api/auth/session` can return HTTP `200` with empty payload when token decryption fails, so status alone is not sufficient as an auth verification gate.

## Task 11 Implementation Issues

- No blocking implementation issues. The primary gap was missing route/component files, now created.

## Task 12 Implementation Issues

- `bun run lint` is currently non-automatable in CI/agent mode because `next lint` opens an interactive ESLint setup prompt and exits with code 1 when no config exists.
