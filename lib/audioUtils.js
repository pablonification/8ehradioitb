/**
 * Get audio file URL - uses R2 if configured, falls back to local public/
 * @param {string} path - Relative path like "/voice-ann/file.m4a" or "voice-ann/file.m4a"
 * @returns {string} Full URL to audio file
 */
export function getAudioUrl(path) {
  if (!path) return "";

  const r2BaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;

  if (r2BaseUrl) {
    // Remove leading slash if present
    const cleanPath = path.startsWith("/") ? path.slice(1) : path;
    return `${r2BaseUrl}/${cleanPath}`;
  }

  // Fallback to local public/ directory
  // Ensure it starts with /
  return path.startsWith("/") ? path : `/${path}`;
}
