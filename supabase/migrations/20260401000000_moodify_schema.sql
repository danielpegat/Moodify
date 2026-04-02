-- Moodify schema: profiles, analyses, tracks, secure Spotify credentials

-- Public profile (1:1 with auth.users)
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  spotify_id text unique,
  display_name text,
  email text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "Users insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- Spotify refresh token: only service role / Edge Functions (no client access)
create table public.spotify_credentials (
  user_id uuid primary key references auth.users (id) on delete cascade,
  refresh_token text not null,
  updated_at timestamptz not null default now()
);

alter table public.spotify_credentials enable row level security;
-- No policies: deny all for anon/authenticated JWT; Edge Functions use service role.

create table public.analyses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  period text not null check (period in ('week', 'month', 'year')),
  emotional_state text not null,
  personality_traits jsonb not null default '{}',
  behavior_patterns jsonb not null default '{}',
  energy_level text not null,
  time_comparison text,
  created_at timestamptz not null default now(),
  unique (user_id, period)
);

create index analyses_user_id_idx on public.analyses (user_id);

alter table public.analyses enable row level security;

create policy "Users CRUD own analyses"
  on public.analyses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  analysis_id uuid not null references public.analyses (id) on delete cascade,
  position smallint not null,
  name text not null,
  artist text not null,
  popularity smallint,
  image_url text,
  valence real,
  energy real,
  tempo real,
  danceability real,
  acousticness real,
  instrumentalness real
);

create index tracks_analysis_id_idx on public.tracks (analysis_id);

alter table public.tracks enable row level security;

create policy "Users read own tracks"
  on public.tracks for select
  using (
    exists (
      select 1 from public.analyses a
      where a.id = tracks.analysis_id and a.user_id = auth.uid()
    )
  );

create policy "Users insert own tracks"
  on public.tracks for insert
  with check (
    exists (
      select 1 from public.analyses a
      where a.id = tracks.analysis_id and a.user_id = auth.uid()
    )
  );

create policy "Users delete own tracks"
  on public.tracks for delete
  using (
    exists (
      select 1 from public.analyses a
      where a.id = tracks.analysis_id and a.user_id = auth.uid()
    )
  );

-- Allow anonymous sign-in trigger: create empty profile
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', 'Listener'));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
