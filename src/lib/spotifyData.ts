import { FunctionsHttpError, FunctionsRelayError } from '@supabase/supabase-js'
import { supabase, supabaseConfigured } from './supabase'
import type { AudioFeatures, EnrichedTrack, SpotifyTrack, TimeRange } from './types'

function mapInvokeError(err: unknown): string {
  if (err && typeof err === 'object' && 'message' in err) {
    const m = String((err as { message: string }).message)
    if (
      m === 'Failed to fetch' ||
      m.includes('NetworkError') ||
      m.includes('Load failed')
    ) {
      return (
        'No se pudo conectar con Supabase Functions. Suele pasar si no has desplegado las funciones ' +
        '"spotify-oauth" y "spotify-api" en tu proyecto, o si hay firewall/VPN. ' +
        'En Supabase: Edge Functions → despliega esas dos. Ver README del proyecto.'
      )
    }
    return m
  }
  return 'Error desconocido al llamar a Supabase'
}

/** Supabase puts a fetch Response in error.context — never use String(response.body) (ReadableStream). */
async function readFunctionsErrorMessage(error: unknown): Promise<string> {
  if (error instanceof FunctionsHttpError || error instanceof FunctionsRelayError) {
    const res = error.context
    if (res instanceof Response) {
      try {
        const text = await res.text()
        if (!text) return mapInvokeError(error)
        try {
          const j = JSON.parse(text) as { error?: string; message?: string; msg?: string }
          return j.error ?? j.message ?? j.msg ?? text.slice(0, 400)
        } catch {
          return text.slice(0, 400)
        }
      } catch {
        return mapInvokeError(error)
      }
    }
  }
  return mapInvokeError(error)
}

function parseInvokeJson<T>(data: unknown): T {
  if (data === null || data === undefined) {
    throw new Error('Respuesta vacía del servidor')
  }
  if (typeof data === 'string') {
    try {
      return JSON.parse(data) as T
    } catch {
      throw new Error(data)
    }
  }
  return data as T
}

export async function exchangeSpotifyOAuth(body: {
  code: string
  redirect_uri: string
  code_verifier: string
}): Promise<{ ok?: boolean; error?: string }> {
  if (!supabaseConfigured || !supabase) {
    return { error: 'Supabase is not configured' }
  }

  await supabase.auth.refreshSession().catch(() => null)
  const { data: session } = await supabase.auth.getSession()
  const token = session.session?.access_token
  if (!token) {
    return { error: 'No hay sesión. Vuelve a la página e inténtalo de nuevo.' }
  }

  try {
    const { data, error } = await supabase.functions.invoke('spotify-oauth', {
      body,
    })

    if (error) {
      const msg = await readFunctionsErrorMessage(error)
      return { error: msg }
    }

    const parsed = parseInvokeJson<{ ok?: boolean; error?: string }>(data)
    if (parsed.error) {
      return { error: parsed.error }
    }
    return { ok: true }
  } catch (e) {
    return { error: mapInvokeError(e) }
  }
}

async function spotifyApiJson<T>(path: string): Promise<T> {
  if (!supabaseConfigured || !supabase) {
    throw new Error('Supabase is not configured')
  }

  const { data: session } = await supabase.auth.getSession()
  if (!session.session?.access_token) {
    throw new Error('Not signed in')
  }

  try {
    const { data, error } = await supabase.functions.invoke('spotify-api', {
      body: { path },
    })

    if (error) {
      throw new Error(await readFunctionsErrorMessage(error))
    }

    return parseInvokeJson<T>(data)
  } catch (e) {
    if (e instanceof Error && e.message.includes('Supabase')) {
      throw e
    }
    throw new Error(mapInvokeError(e))
  }
}

export async function fetchTopTracks(
  timeRange: TimeRange,
  limit = 10
): Promise<SpotifyTrack[]> {
  const q = new URLSearchParams({ time_range: timeRange, limit: String(limit) })
  const data = await spotifyApiJson<{ items: SpotifyTrack[] }>(
    `/v1/me/top/tracks?${q.toString()}`
  )
  return data.items ?? []
}

export async function fetchAudioFeatures(ids: string[]): Promise<Record<string, AudioFeatures>> {
  if (!ids.length) return {}
  const q = new URLSearchParams({ ids: ids.join(',') })
  const data = await spotifyApiJson<{ audio_features: (AudioFeatures & { id: string })[] }>(
    `/v1/audio-features?${q.toString()}`
  )
  const map: Record<string, AudioFeatures> = {}
  for (const af of data.audio_features ?? []) {
    if (af?.id) {
      map[af.id] = {
        valence: af.valence,
        energy: af.energy,
        danceability: af.danceability,
        tempo: af.tempo,
        acousticness: af.acousticness,
        instrumentalness: af.instrumentalness,
      }
    }
  }
  return map
}

export async function fetchEnrichedTopTracks(
  timeRange: TimeRange,
  limit = 10
): Promise<EnrichedTrack[]> {
  const tracks = await fetchTopTracks(timeRange, limit)
  const ids = tracks.map((t) => t.id)
  const feats = await fetchAudioFeatures(ids)
  return tracks.map((t) => ({
    ...t,
    audio_features: feats[t.id] ?? null,
  }))
}
