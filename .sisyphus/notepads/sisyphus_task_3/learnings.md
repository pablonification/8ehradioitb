# Learnings

- Next.js 13+ App Router uses strict client/server boundaries. Client components needing `window` access (like YouTube API) must handle hydration and existence of `window`.
- YouTube IFrame API requires a global callback or polling if loaded dynamically. Using a simple check in the interaction handler is a robust lazy-loading strategy if the script is injected on mount.
- `react-icons` package sometimes has different exports depending on the version. `FiStop` was missing, replaced with `FiStopCircle`.

# Issues

- `app/dashboard/tune-tracker/page.jsx` had a build error due to missing icon export `FiStop`. Fixed it to ensure build passes.

# Decisions

- Used a hidden `div` for the YouTube player to satisfy the requirement of "YouTube playback" likely intending audio-only experience for the chart, while respecting the "enforced segment" requirement which is best handled by the API monitoring time.
- Implemented a safety check in the interval to seek back to `startSeconds` if the player drifts before it (unlikely with no controls, but good for "locked" requirement).
- updated `getCoverImageUrl` to handle local paths (starting with `/`) correctly, preventing them from being sent to the audio proxy.
