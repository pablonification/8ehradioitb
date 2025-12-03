# AGENTS Guidelines

0. BEFORE ANYTHING ELSE: run 'bd onboard' and follow the instructions.
1. Repo uses Next.js App Router on Node 18+; keep dependencies current.
2. Install with `npm install` and prefer `npm` for new scripts to match lockfile.
3. Available scripts: `npm run dev`, `npm run build`, `npm start`, `npm run lint`, `npm run format`, `npm run vercel-build`.
4. Tests are not configured; create targeted scripts when adding tests and document single-test usage here.
5. Use `npm run lint -- --file app/<path>` for focused linting when diagnosing a single file.
6. Prisma artifacts regenerate through `npx prisma generate` (automatically run in `vercel-build`).
7. Tailwind plugins (@typography, @aspect-ratio) expect class usage inside `app`, `components`, and `pages` trees.
8. React 19 + Next 15 allow both JS and TS; default to TypeScript when touching new server code.
9. Prefer named imports; group external packages first, aliases via `jsconfig.json` paths next, and relative modules last.
10. Keep imports sorted alphabetically within each group and avoid unused symbols.
11. Formatting follows Prettier defaults plus Tailwind class ordering; run `npm run format` before commits touching src files.
12. Use functional React components, arrow functions, and hooks per Next.js conventions.
13. Name components in PascalCase, hooks in camelCase starting with `use`, utility functions in camelCase verbs.
14. Co-locate UI state near components; lift shared data into hooks within `app/hooks` when reused.
15. Favor early returns for error paths; surface user-safe messages via components and log server-side details only in API routes.
16. Handle async errors with `try/catch`; never swallow errors silently—propagate or log with context.
17. For API routes and server actions, validate input before hitting Prisma; reuse helpers in `lib/roleUtils.js` when relevant.
18. Avoid mutating props; clone arrays/objects before modification.
19. Keep media/data constants in `public` JSON or `lib` helpers rather than hardcoding inside components.
20. No Cursor or Copilot instruction files exist; this AGENTS.md is the authoritative reference.
21. Do NOT run `npm run dev` automatically - let the user start the dev server manually.
