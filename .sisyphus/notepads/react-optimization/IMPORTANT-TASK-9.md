# CRITICAL: Task 9 - Manual Verification Required

## Status: PENDING USER ACTION

Task 9 (Delete audio files from public/) **MUST NOT** be automated yet.

### Why?
The user needs to:
1. Set up Cloudflare R2 bucket
2. Set environment variables (R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, etc.)
3. Run the migration script: `node scripts/migrate-audio-to-r2.js --execute`
4. Deploy to production with `NEXT_PUBLIC_R2_PUBLIC_URL` set
5. **VERIFY audio playback works from R2 in production**
6. Monitor for 24-48 hours for any issues

### Only AFTER verification passes:
```bash
# Delete audio files (26 files, ~32MB)
find public/ -type f \( -name "*.mp3" -o -name "*.wav" -o -name "*.m4a" -o -name "*.aac" -o -name "*.ogg" \) -delete

# Or manually:
rm -rf public/voice-ann/*.{mp3,m4a,wav}
rm public/bof.mp3 public/emir.mp3
```

### Safety Checklist:
- [ ] R2 bucket created and configured
- [ ] Migration script executed successfully (--execute mode)
- [ ] All 26 files uploaded to R2
- [ ] Production deployed with R2 env vars
- [ ] Audio playback tested on production
- [ ] No 404 errors in browser console
- [ ] Monitored for 24-48 hours
- [ ] Backup created before deletion

### What NOT to delete:
- Images (*.png, *.jpg, *.svg, etc.)
- Any non-audio files

### Files to delete (26 total):
```
public/bof.mp3
public/emir.mp3
public/voice-ann/abdul.m4a
public/voice-ann/alifia.m4a
public/voice-ann/ara.m4a
public/voice-ann/barsa.m4a
public/voice-ann/claudine.m4a
public/voice-ann/dicky.m4a
public/voice-ann/emir.mp3
public/voice-ann/evangeline.m4a
public/voice-ann/fiki.m4a
public/voice-ann/hamzah.m4a
public/voice-ann/ivan.wav
public/voice-ann/jordan.m4a
public/voice-ann/juli.m4a
public/voice-ann/lia.m4a
public/voice-ann/lily.m4a
public/voice-ann/nadhifa.m4a
public/voice-ann/naura.m4a
public/voice-ann/nayel.m4a
public/voice-ann/nudia.m4a
public/voice-ann/queenie.mp3
public/voice-ann/raga.m4a
public/voice-ann/sofi.m4a
public/voice-ann/wanda.m4a
public/voice-ann/zuzu.wav
```
