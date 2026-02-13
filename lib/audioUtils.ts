export function getAudioUrl(path: string | null | undefined): string {
  if (!path) return ''

  const r2BaseUrl = process.env.NEXT_PUBLIC_R2_PUBLIC_URL

  if (r2BaseUrl) {
    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path
    return `${r2BaseUrl}/${cleanPath}`
  }

  // Fallback to local public/ directory
  // Ensure it starts with /
  return path.startsWith('/') ? path : `/${path}`
}
