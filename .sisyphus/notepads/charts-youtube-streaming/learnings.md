# TuneTracker YouTube Streaming - Learnings

## Conventions Discovered

### Role Check Pattern

```javascript
import { hasAnyRole } from "@/lib/roleUtils";
function isMusic(roleString) {
  return hasAnyRole(roleString, ["MUSIC", "DEVELOPER"]);
}
```

### Prisma with MongoDB

- Use `@db.ObjectId` for ObjectId fields
- Schema changes require `npx prisma generate`
- MongoDB is schemaless but Prisma client needs explicit field definitions

### Cover Image Handling

- Absolute URL (starts with `http`): Render directly as `<img src={coverImage} />`
- R2 key: Use `/api/proxy-audio?key=${coverImage}`
- YouTube thumbnail: `https://i.ytimg.com/vi/{videoId}/hqdefault.jpg`

## Successful Approaches

### YouTube URL Parsing

Support multiple formats:

- `https://www.youtube.com/watch?v={id}`
- `https://youtu.be/{id}`
- `https://www.youtube.com/shorts/{id}`
- Raw 11-character video ID

Regex for validation: `/^[a-zA-Z0-9_-]{11}$/`

### Keyless Metadata Fetch

Use YouTube oEmbed (no API key required):

```
https://www.youtube.com/oembed?url={watchUrl}&format=json
```

Returns: `{ title, thumbnail_url, author_name, author_url }`

### Locked Segment Enforcement

1. Initialize player with `start` and `end` parameters
2. Hide controls: `controls: 0, disablekb: 1`
3. Monitor time with `setInterval`
4. Stop playback when `currentTime >= endSeconds`
5. Snap back to start if seeked before `startSeconds`

### Mode Detection Logic

```javascript
let mode = sourceType;
if (!mode) {
  if (youtubeVideoId) mode = "YOUTUBE";
  else if (audioUrl) mode = "AUDIO_URL";
}
```

## Technical Gotchas

1. **YouTube IFrame API**: Must load script dynamically and wait for `onYouTubeIframeAPIReady`
2. **Player lifecycle**: Destroy player when component unmounts or video changes
3. **Time format**: Admin UI uses `mm:ss` but stores seconds in database
4. **CORS**: oEmbed works without CORS issues since it's a simple GET request

## Commands

```bash
# Regenerate Prisma client after schema changes
npx prisma generate

# Build project
npm run build

# Start dev server
npm run dev
```
