# TuneTracker: YouTube Segment Playback (No Upload)

## Context

### Original Request

Optimize fitur charts karena saat ini masih upload file audio lokal (workflow sulit). Ingin pakai YouTube: di web hanya play audio (segmen start-end ditentukan di admin), metadata/album cover default dari YouTube tapi bisa dioverride.

### Interview Summary

**Key Discussions**:

- Harus gratis/seamless di Vercel.
- Tidak membuat adblocker/bypass iklan YouTube.

**Decisions**:

- Playback: streaming YouTube (bukan yt-dlp/download/transcode).
- Segment: dikunci di range start-end (hide controls + enforce bounds).
- Metadata: auto-fill dari YouTube + bisa override di admin.
- Backward compatibility: entry lama tetap play via `audioUrl`.
- QA: manual (repo belum ada test infrastructure).

**Repo Findings (current implementation)**:

- Model: `prisma/schema.prisma:161` `TuneTrackerEntry` berisi `order`, `title`, `artist`, optional `coverImage`, optional `audioUrl`.
- Admin editor: `app/dashboard/tune-tracker/page.jsx:10` upload cover/audio ke R2 via `app/api/tune-tracker/upload/route.js:28`, lalu simpan entry via `app/api/tune-tracker/route.js:20`.
- Home playback: `app/components/home/TuneTracker.jsx:27` memakai `<audio>` untuk `audioUrl` via `app/api/proxy-audio/route.js:20`.

### Metis Review (gaps addressed)

- Definisikan "locked" dengan jelas: hide controls + enforce bounds (snap back/out-of-range + auto-stop di end).
- Default metadata tanpa API key: pakai oEmbed untuk title + thumbnail.
- Disarankan ada source discriminator supaya legacy `audioUrl` tetap aman (atau infer dengan aturan yang eksplisit).
- Handle URL variants (`youtu.be`, `watch?v=`, `shorts/`) dan kasus video non-embeddable/region/age.
- Tambahkan admin preview segment sebelum save.

---

## Work Objectives

### Core Objective

Hilangkan kebutuhan upload audio clip untuk TuneTracker dengan mengganti sumber playback ke YouTube, sambil tetap menjaga UX “play hanya segmen yang dipilih”.

### Concrete Deliverables

- Extend `TuneTrackerEntry` untuk menyimpan sumber YouTube + cue points (start/end seconds).
- Admin page TuneTracker bisa:
  - input YouTube URL/ID
  - auto-fill metadata (title + thumbnail) dan tetap bisa override
  - preview segmen (start-end) sebelum save
- Home TuneTracker bisa playback:
  - legacy: `audioUrl` via `<audio>` tetap jalan
  - YouTube: embed player tersembunyi + enforce segmen locked

### Definition of Done

- [ ] Admin dapat paste YouTube URL/ID, set start/end, preview berhasil, lalu save.
- [ ] Home page dapat play entry YouTube mulai dari start dan berhenti otomatis di end, serta tidak bisa seek keluar range di dalam UI situs.
- [ ] Entry legacy (punya `audioUrl`) tetap bisa diputar seperti sebelumnya.
- [ ] Manual QA checklist selesai tanpa regresi.

### Must Have

- Official embed (YouTube iframe / IFrame Player API). Tidak ada ekstraksi stream, tidak ada download.
- Validasi input YouTube + start/end di server (hindari SSRF / data invalid).
- Locked segment enforcement didefinisikan dan diimplementasikan.
- Auto-fill metadata keyless (oEmbed) + admin override.

### Must NOT Have (Guardrails)

- Tidak membangun adblocker/bypass ads atau "audio-only" dengan cara ekstrak URL stream.
- Tidak mem-proxy konten YouTube lewat `app/api/proxy-audio/route.js`.
- Tidak menambah test framework baru.
- Tidak scope creep: waveform editor, auto-chapter detection, MusicBrainz/Spotify matching, dsb.

---

## Verification Strategy

### Test Decision

- **Infrastructure exists**: NO (lihat `AGENTS.md`)
- **User wants tests**: Manual-only

### Manual QA Notes

- Untuk YouTube, “locked” tidak berarti user 100% tidak bisa akses full video di luar situs; yang dijamin: di UI situs, playback dipaksa tetap di range.

---

## Task Flow

```
Schema/API (data + validation) → Admin editor (input + preview) → Home playback (locked segment) → Manual QA
```

## TODOs

> Catatan: Karena manual QA, setiap task mencantumkan langkah verifikasi.

- [x] 1. Update model TuneTrackerEntry untuk dukung YouTube + cue points

  **What to do**:
  - Tambah fields baru di `prisma/schema.prisma` pada `TuneTrackerEntry`:
    - `youtubeUrl` (String?) atau simpan canonical watch URL
    - `youtubeVideoId` (String?) (11-char ID)
    - `startSeconds` (Int?)
    - `endSeconds` (Int?)
    - (Recommended) `sourceType` optional enum (`AUDIO_URL` | `YOUTUBE`) untuk membedakan mode; treat `null` sebagai legacy.
  - Tentukan aturan inferensi jika `sourceType` null:
    - jika ada `youtubeVideoId` → YOUTUBE
    - else jika ada `audioUrl` → AUDIO_URL
  - Jalankan Prisma generate dan sync seperlunya (MongoDB schemaless, tapi Prisma client harus update).

  **Must NOT do**:
  - Jangan hapus field `audioUrl`/`coverImage` (legacy tetap jalan).

  **Parallelizable**: YES (dengan 3)

  **References**:
  - `prisma/schema.prisma:161` - lokasi `TuneTrackerEntry` saat ini.
  - `app/api/tune-tracker/route.js:25` - payload POST saat ini hanya {order,title,artist,coverImage,audioUrl}; akan diperluas.

  **Acceptance Criteria**:
  - [ ] Prisma client berhasil digenerate (`npx prisma generate`), tanpa error.
  - [ ] Dev server bisa start (`npm run dev`) tanpa crash akibat schema mismatch.

- [x] 2. Extend API `/api/tune-tracker` untuk field YouTube + validasi

  **What to do**:
  - Update `app/api/tune-tracker/route.js:20` (POST/PATCH/DELETE) agar:
    - Menerima field YouTube baru.
    - Memvalidasi:
      - `startSeconds >= 0`
      - `endSeconds > startSeconds`
      - `youtubeVideoId` format valid (regex ketat, 11 chars)
      - `youtubeUrl` (jika disimpan) harus host YouTube yang di-allow.
    - Menentukan mode:
      - Jika mode YOUTUBE: `audioUrl` boleh null; require `youtubeVideoId`, `startSeconds`, `endSeconds`.
      - Jika mode AUDIO_URL: YouTube fields boleh null; legacy behavior tidak berubah.
  - Update DELETE handler agar bisa clear field YouTube juga (mis. `youtubeUrl`, `youtubeVideoId`, `startSeconds`, `endSeconds`, `sourceType`) jika dibutuhkan di admin.

  **Must NOT do**:
  - Jangan menambah proxy yang fetch YouTube content.
  - Jangan long-running work di API route (tetap request/response cepat).

  **Parallelizable**: NO (depends on 1)

  **References**:
  - `app/api/tune-tracker/route.js:20` - endpoint utama CRUD entry.
  - `app/dashboard/tune-tracker/page.jsx:99` - admin save via POST `/api/tune-tracker`.

  **Acceptance Criteria**:
  - [ ] Manual: coba POST entry YOUTUBE dengan payload valid → 200 dan tersimpan (cek via reload admin).
  - [ ] Manual: payload invalid (end <= start) → 400 dengan pesan error yang jelas.

- [x] 3. Tambah endpoint metadata YouTube (keyless) untuk auto-fill admin

  **What to do**:
  - Tambah route baru (mis. `app/api/youtube/metadata/route.js`) yang:
    - Hanya bisa diakses role MUSIC/DEVELOPER (ikuti pattern `app/api/tune-tracker/upload/route.js:28`).
    - Menerima input `url` atau `id`.
    - Normalize → `youtubeVideoId`.
      - Default dukung input:
        - `https://www.youtube.com/watch?v=<id>`
        - `https://youtu.be/<id>`
        - `https://www.youtube.com/shorts/<id>`
        - raw `<id>`
      - Default handling playlist: kalau ada `v=<id>` pakai `v`; kalau link playlist tanpa `v`, reject (400).
    - Fetch oEmbed: `https://www.youtube.com/oembed?url=<watch-url>&format=json`.
    - Return minimal data untuk auto-fill:
      - `title`
      - `thumbnailUrl`
      - `videoId`
      - `canonicalUrl` (optional)
    - Handle error cases dengan status yang jelas (400 invalid input, 404/unavailable, 502 upstream).

  **Must NOT do**:
  - Jangan jadikan endpoint generic proxy (hindari SSRF). Hard-allowlist host/path YouTube.
  - Jangan butuh API key.

  **Parallelizable**: YES (dengan 1)

  **References**:
  - `app/api/tune-tracker/upload/route.js:28` - contoh role check (MUSIC/DEVELOPER).
  - `app/api/proxy-audio/route.js:20` - contoh pattern parameter parsing + error handling.

  **Acceptance Criteria**:
  - [ ] Manual (admin logged-in): hit endpoint metadata dengan URL valid → returns JSON title+thumbnail.
  - [ ] Manual: URL non-YouTube → 400.

- [x] 4. Update Admin TuneTracker editor: input YouTube + preview + auto-fill + override

  **What to do**:
  - Update `app/dashboard/tune-tracker/page.jsx`:
    - Tambah field input untuk YouTube URL/ID.
    - Tambah input start/end (recommended: input `mm:ss` di UI, simpan ke state sebagai seconds).
    - Auto-fill metadata:
      - saat URL valid (onBlur / tombol "Fetch"), call endpoint metadata task (3)
      - isi default `title` jika kosong
      - set `coverImage` ke thumbnail URL (string `https://i.ytimg.com/...`) sebagai default; tetap boleh upload file untuk override.
      - Jika fetch metadata gagal: tampilkan warning, tapi tetap izinkan save selama `youtubeVideoId` + start/end valid.
    - Preview segment:
      - tombol "Preview" yang memutar segmen start-end memakai embed YouTube tersembunyi (mirror logic home playback).
    - Saat save, payload ke `/api/tune-tracker` harus include YouTube fields.
    - Backward-compat:
      - pertahankan opsi upload audio file untuk legacy/fallback (tapi boleh dibuat secondary/optional supaya workflow YouTube jadi utama).
    - Perbaiki preview cover:
      - kalau `coverImage` adalah URL (startsWith `http`), gunakan langsung (jangan lewat `/api/proxy-audio`).
      - kalau key R2, tetap gunakan `/api/proxy-audio?key=...`.

  **Must NOT do**:
  - Jangan menyimpan metadata yang fetched tanpa opsi override.
  - Jangan otomatis overwrite title/artist jika admin sudah isi.

  **Parallelizable**: NO (depends on 2,3)

  **References**:
  - `app/dashboard/tune-tracker/page.jsx:78` - `handleSave` payload ke `/api/tune-tracker`.
  - `app/dashboard/tune-tracker/page.jsx:155` - cover upload + preview (perlu handle URL vs R2 key).
  - `app/dashboard/tune-tracker/page.jsx:195` - audio upload UI (jadikan optional).

  **Acceptance Criteria**:
  - [ ] Manual: paste YouTube URL → metadata terisi (title + thumbnail) tanpa API key.
  - [ ] Manual: preview play mulai start dan stop di end.
  - [ ] Manual: save entry YouTube → reload page, data persist.

- [ ] 5. Update Home TuneTracker: dukung YouTube playback (locked) + tetap support audioUrl

  **What to do**:
  - Update `app/components/home/TuneTracker.jsx`:
    - Keep existing `<audio>` flow untuk entry yang punya `audioUrl`.
    - Tambah YouTube player flow untuk entry yang punya `youtubeVideoId` (atau `sourceType === 'YOUTUBE'`).
    - Implement "locked" enforcement:
      - saat play: `seekTo(startSeconds)` lalu play
      - monitor waktu (timer / callback) dan stop di `endSeconds`
      - jika user berusaha seek keluar range, snap balik ke range
      - hide YouTube controls di UI situs
    - Update cover rendering:
      - jika `coverImage` absolute URL → render langsung
      - else → gunakan `/api/proxy-audio?key=...` seperti saat ini
    - Enable play button untuk entry YouTube (sekarang disabled kalau `!tune.audioUrl` di `app/components/home/TuneTracker.jsx:102`).

  **Must NOT do**:
  - Jangan mem-proxy video/audio YouTube via backend.
  - Jangan menghapus behavior legacy `audioUrl`.

  **Parallelizable**: NO (depends on 2,4)

  **References**:
  - `app/components/home/TuneTracker.jsx:27` - current play logic berbasis `<audio>`.
  - `app/components/home/TuneTracker.jsx:74` - cover image rendering (perlu URL vs key handling).
  - `app/components/home/TuneTracker.jsx:98` - play button disable logic (perlu update).
  - `app/page.jsx:50` - source data tunes dari Prisma.
  - `app/contributors/page.jsx:30` - contoh sederhana embed YouTube iframe.

  **Acceptance Criteria**:
  - [ ] Manual: entry legacy dengan `audioUrl` masih play/pause seperti sekarang.
  - [ ] Manual: entry YouTube play mulai di start, berhenti di end.
  - [ ] Manual: user tidak bisa scrub/seek di dalam UI situs untuk keluar range (controls hidden + enforcement).

- [ ] 6. Manual QA full pass + edge cases

  **What to do**:
  - Jalankan `npm run dev`.
  - Admin flow:
    - Buka `http://localhost:3000/dashboard/tune-tracker`.
    - Buat 1 entry YouTube: paste URL, set start/end, preview, save.
    - Override metadata: edit title/artist, ganti cover (upload file) lalu save.
  - Home flow:
    - Buka `http://localhost:3000/`.
    - Play entry YouTube dan verifikasi start/end.
    - Play entry legacy `audioUrl` dan verifikasi masih jalan.
  - Edge cases:
    - URL invalid / non-YouTube → metadata fetch error jelas.
    - Video non-embeddable/removed → preview gagal (warning), home playback harus fail gracefully (tidak crash; tampilkan pesan user-safe / disable play).
    - start/end invalid (end <= start) → save ditolak.

  **Parallelizable**: NO

  **Acceptance Criteria**:
  - [ ] Tidak ada error di console yang menunjukkan crash/unhandled rejection.
  - [ ] UX konsisten: hanya 1 track play pada satu waktu.

---

## Commit Strategy

Prefer atomic commits:

- 1 commit untuk schema + API validation
- 1 commit untuk admin editor (YouTube fields + preview + autofill)
- 1 commit untuk home playback (YouTube locked + legacy)

---

## Success Criteria

### Verification Commands

```bash
npm run lint
npm run build
```

### Final Checklist

- [ ] Tidak ada dependency baru yang tidak perlu.
- [ ] Tidak ada implementasi adblock/bypass.
- [ ] YouTube entries bisa diputar sesuai segmen; legacy tetap jalan.
- [ ] Admin workflow tidak lagi memaksa upload audio untuk entry YouTube.
