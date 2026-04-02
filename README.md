# Moodify

Psychological music analysis from your Spotify top tracks (week / month / year). The tone is introspective and **non-diagnostic** — suggestive language only.

## Stack

- **Frontend:** React 19, Vite, TypeScript, Tailwind CSS v4, Framer Motion, Recharts  
- **Backend:** Supabase (Postgres, Auth, Edge Functions)  
- **API:** Spotify Web API (OAuth PKCE, top tracks, audio features)

## Prerequisites

- Node 20+  
- A [Supabase](https://supabase.com) project  
- A [Spotify Developer](https://developer.spotify.com/dashboard) app  

## 1. Spotify app

1. Create an app in the Spotify Developer Dashboard.  
2. **Redirect URIs:** add `http://localhost:5173/auth/callback` (and your production URL, e.g. `https://yourdomain.com/auth/callback`).  
3. **Scopes:** the app requests `user-top-read`, `user-read-recently-played`, and `user-read-email` (for profile).  

## 2. Supabase database

1. Open **SQL Editor** in Supabase and run the migration:  
   `supabase/migrations/20260401000000_moodify_schema.sql`  
2. **Authentication → Providers → Anonymous:** enable anonymous sign-ins. Users get a Supabase session first; linking Spotify stores tokens server-side.

## 3. Supabase Edge Functions

Deploy two functions (CLI or Dashboard):

| Function        | Purpose |
|----------------|---------|
| `spotify-oauth` | Exchange OAuth code (PKCE), store Spotify refresh token, update profile. |
| `spotify-api`   | Proxy Spotify API with refresh + `Authorization: Bearer` (user JWT). |

**Secrets** (Project Settings → Edge Functions → Secrets or `supabase secrets set`):

- `SPOTIFY_CLIENT_ID` — same as the app `VITE_SPOTIFY_CLIENT_ID`  
- `SPOTIFY_CLIENT_SECRET` — optional for **PKCE public clients**; required for some refresh-token flows. If refresh fails without it, add the secret from the Spotify dashboard.  
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` — usually injected automatically when deploying.

Local serve (optional):

```bash
npx supabase start
npx supabase functions serve --env-file .env.local
```

## 4. Environment variables

Copy `.env.example` to `.env` and fill in values:

- `VITE_SUPABASE_URL`  
- `VITE_SUPABASE_ANON_KEY`  
- `VITE_SPOTIFY_CLIENT_ID`  
- `VITE_APP_URL` — must match the Spotify redirect origin (e.g. `http://localhost:5173`)  

## 5. Run locally

```bash
npm install
npm run dev
```

Open the URL shown (e.g. `http://localhost:5173`), click **Connect with Spotify**, complete OAuth, then open **Reports** for dashboards, comparisons, and share card.

## 6. Production build

```bash
npm run build
npm run preview
```

## Schema notes

The SQL migration creates:

- **`profiles`** — public profile (`id` → `auth.users`, `spotify_id`, name, email, avatar). This matches the spec’s “users” table in spirit (Supabase typically uses `profiles` for auth-linked data).  
- **`spotify_credentials`** — refresh token, **no client RLS** (only Edge Functions with service role).  
- **`analyses`** / **`tracks`** — saved analyses and top-track rows per period.

## Privacy & safety

- This app does **not** provide medical or mental health diagnoses.  
- Copy uses hedged language (“This may suggest…”, “You might be experiencing…”).  
- Spotify refresh tokens are stored only server-side in `spotify_credentials`.

## Optional extensions

- **AI deep analysis:** add an Edge Function that calls OpenAI/Anthropic with aggregated features + disclaimer.  
- **Smaller JS bundle:** lazy-load chart routes or Recharts.
