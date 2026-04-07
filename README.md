# Moodify

Psychological music analysis from your Spotify top tracks (week / month / year). The tone is introspective and **non-diagnostic** — suggestive language only.

## Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Recharts  
- **Backend:** Supabase (Postgres, Auth, Edge Functions)  
- **API:** Spotify Web API (OAuth PKCE, top tracks, audio features)

## Privacy & safety

- This app does **not** provide medical or mental health diagnoses.  
- Copy uses hedged language (“This may suggest…”, “You might be experiencing…”).  
- Spotify refresh tokens are stored only server-side in `spotify_credentials`.

## Optional extensions

- **AI deep analysis:** add an Edge Function that calls OpenAI/Anthropic with aggregated features + disclaimer.  
- **Smaller JS bundle:** lazy-load chart routes or Recharts.
