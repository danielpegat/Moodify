/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL: string
  readonly VITE_SUPABASE_ANON_KEY: string
  readonly VITE_SPOTIFY_CLIENT_ID: string
  readonly VITE_APP_URL: string
  readonly VITE_SUPABASE_FUNCTIONS_URL?: string
  /** e.g. http://127.0.0.1:5173 — must match Spotify redirect URI if not using browser origin */
  readonly VITE_SPOTIFY_REDIRECT_ORIGIN?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
