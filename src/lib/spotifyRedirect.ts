/**
 * OAuth redirect URI must match Spotify Developer Dashboard exactly (scheme + host + port + path).
 *
 * Set VITE_SPOTIFY_REDIRECT_ORIGIN in .env if you only registered 127.0.0.1 (not localhost)
 * or to match a fixed port — then restart `npm run dev`.
 */
export function getEnvSpotifyOrigin(): string | null {
  const o = import.meta.env.VITE_SPOTIFY_REDIRECT_ORIGIN?.trim()
  return o ? o.replace(/\/$/, '') : null
}

export function getSpotifyRedirectUri(): string {
  const override = getEnvSpotifyOrigin()
  const base = override
    ? override
    : typeof window !== 'undefined'
      ? window.location.origin.replace(/\/$/, '')
      : ''
  return `${base}/auth/callback`
}
