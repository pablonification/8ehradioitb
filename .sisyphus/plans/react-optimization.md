# React & Next.js Performance Optimization Plan

## Context

### Objective

Refactor the `8ehradioitb` codebase to align with Vercel's React Best Practices, optimize asset delivery, and improve UX with Skeleton Loaders.

1. **React Architecture**: Move from CSR to RSC (Server Components) to eliminate waterfalls.
2. **Asset Architecture**: Migrate 138MB of static assets from git (`public/`) to Cloudflare R2.
3. **UX Polish**: Fix Navbar icon flickering and replace "Loading..." text with proper Skeleton Loaders.

### Key Goals

1.  **Eliminate Client-Side Waterfalls**: Move data fetching to Server Components.
2.  **Enable Server-Side Rendering (SSR)**: Remove unnecessary `"use client"` directives.
3.  **Optimize Audio Delivery**: Offload static audio files (`.mp3`, `.wav`) to R2 to reduce repo size and improve streaming.
4.  **Fix UI Flickers**: Preload dropdown assets in Navbar.
5.  **Skeleton Loaders**: Replace text-based loading with visual placeholders.

---

## Work Objectives

### Must Have

- `app/page.jsx` & `app/about-us/page.jsx` converted to **Server Components**.
- `Navbar.jsx` refactored and fixed (no icon flickering).
- **Migration Script** to move `public/` **AUDIO** assets to R2.
- `useRadioStream` hook updated to use `SWR`.
- **Skeleton Components** for Podcast, News, and Announcer sections.

### Must NOT Have (Guardrails)

- **No mixed data access**: Server Components must use `prisma`, not internal APIs.
- **No layout shifts**: Skeletons must match the dimensions of the final content.
- **No broken audio**: Player must persist across navigation.
- **No image migration**: Keep `vstock`, `foto-announcer`, and other images in `public/` (User request).

---

## Task Flow

```
1. Navbar Refactor ──┐
                     ├─→ 3. Home/About Page Refactor ──→ 5. Skeleton UI ──→ 6. Audio Asset Migration
2. Radio Hook SWR ───┘
```

---

## TODOs

### Phase 1: Core Architecture & Navbar

- [x] 1. Optimize `useRadioStream` hook with SWR
  - Install `swr`.
  - Rewrite hook to use `useSWR` for polling config.
  - Maintain fallback logic.

- [x] 2. Deconstruct & Fix `Navbar.jsx`
  - **Fix Icon Flicker**: Use CSS visibility for dropdowns.
  - Add `priority` prop to dropdown icons.
  - Extract `NavbarAudio.jsx`, `NavbarMobile.jsx`, `NavbarDesktop.jsx`.

### Phase 2: Home & About Page Optimization (RSC)

- [ ] 3. Create Client Wrappers for Home
  - Extract `HeroSection.jsx`, `PodcastList.jsx`, `NewsList.jsx`, `TuneTracker.jsx`.
  - Ensure they accept data via props.

- [ ] 4. Refactor `app/page.jsx` to Server Component
  - Remove `"use client"`.
  - Fetch Podcasts, News, Tunes via `prisma` in parallel.
  - Pass data to Client Wrappers.
  - **Note**: This inherently removes the need for loading states on initial load (SSR).

### Phase 3: Skeleton UI (For Client Interactions)

- [ ] 5. Create Generic Skeleton Components
  - Create `app/components/skeletons/PodcastSkeleton.jsx`.
  - Create `app/components/skeletons/NewsCardSkeleton.jsx`.
  - Create `app/components/skeletons/TuneTrackerSkeleton.jsx`.
  - **Styling**: Use `animate-pulse` with gray backgrounds matching the real component layout.

- [ ] 6. Implement Skeletons in Client Components
  - Use `Suspense` with `fallback={<PodcastSkeleton />}` where applicable.
  - Or render Skeletons when `isLoading` is true (e.g., when filtering/paginating).

### Phase 4: Audio Asset Optimization (Public -> R2)

- [ ] 7. Create Audio Migration Script
  - Script to scan `public/` for **AUDIO FILES ONLY** (`.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`).
  - Upload to R2 using env vars.
  - **Constraint**: Do NOT move images (`.png`, `.jpg`, `.svg`).

- [ ] 8. Update Audio References
  - Find/Replace references to the migrated audio files to use R2 domain URL.
  - Update `next.config.mjs` `remotePatterns` if needed.

- [ ] 9. Cleanup Public Folder
  - Delete ONLY the migrated audio files from `public/`.
  - Leave images intact.

### Phase 5: Advanced Performance

- [ ] 10. Implement Lazy Loading
  - Use `next/dynamic` for `RadioPlayer` and `BoardSlider` components.

- [ ] 11. Dynamic Metadata
  - Add `generateMetadata` to `app/blog/[slug]/page.jsx`.

---

## Commit Strategy

- `refactor(navbar): split components and fix icon loading`
- `perf(home): convert to server component`
- `feat(ui): add skeleton loaders`
- `chore(assets): migrate audio files to R2`
