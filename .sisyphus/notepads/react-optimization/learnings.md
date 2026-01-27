# Learnings from Navbar Refactoring

## Architecture Decisions

- **Split Responsibility**: Navbar was too large (620 lines). Split into `NavbarAudio` (playback), `NavbarMobile` (mobile menu), and `NavbarDesktop` (desktop nav).
- **Audio Singleton**: `NavbarAudio` handles the `<audio>` element. To support both mobile and desktop play buttons, we instantiate `NavbarAudio` twice but only the 'desktop' variant renders the `<audio>` tag. The 'mobile' variant communicates via window events.
- **Event-Driven Sync**: Used `window.dispatchEvent` for `playRequested`, `pauseRequested`, `audioStateChanged` to sync state between the two button instances and the GlobalAudioPlayer.

## Fixes

- **Icon Flickering**: Changed dropdown rendering from conditional `{isOpen && <div>}` to CSS visibility `className={isOpen ? 'block' : 'hidden'}`. This keeps the images in the DOM (but hidden), allowing them to preload.
- **Image Priority**: Added `priority` prop to dropdown icons to ensure they load immediately.

## Gotchas

- **Hidden Components**: The 'desktop' variant of `NavbarAudio` is hidden on mobile via CSS (`hidden md:flex`), but it MUST remain mounted because it holds the `<audio>` element and event listeners.
- **SWR Deduplication**: `useRadioStream` is called in multiple places. SWR handles caching, so this is efficient.

## Future Improvements

- Consider moving the audio context to a real React Context provider instead of using window events, although the current event system works well for cross-component communication (GlobalAudioPlayer vs Navbar).
