import { supabase } from './supabase'
import type { EnrichedTrack, MoodAnalysis, PeriodKey } from './types'

export async function saveAnalysis(
  userId: string,
  period: PeriodKey,
  analysis: MoodAnalysis,
  tracks: EnrichedTrack[]
): Promise<string | null> {
  if (!supabase) return null

  const { data: existing, error: selErr } = await supabase
    .from('analyses')
    .select('id')
    .eq('user_id', userId)
    .eq('period', period)
    .maybeSingle()

  if (selErr) {
    console.error(selErr)
    return null
  }

  const payload = {
    user_id: userId,
    period,
    emotional_state: analysis.emotionalState,
    personality_traits: analysis.personalityTraits,
    behavior_patterns: analysis.behaviorPatterns,
    energy_level: analysis.energyLevel,
    time_comparison: analysis.timeComparison ?? null,
  }

  let analysisId = existing?.id as string | undefined

  if (analysisId) {
    const { error } = await supabase
      .from('analyses')
      .update(payload)
      .eq('id', analysisId)
    if (error) {
      console.error(error)
      return null
    }
    await supabase.from('tracks').delete().eq('analysis_id', analysisId)
  } else {
    const { data: ins, error } = await supabase
      .from('analyses')
      .insert(payload)
      .select('id')
      .single()
    if (error || !ins) {
      console.error(error)
      return null
    }
    analysisId = ins.id
  }

  const rows = tracks.map((t, i) => ({
    analysis_id: analysisId!,
    position: i + 1,
    name: t.name,
    artist: t.artists.map((a) => a.name).join(', '),
    popularity: t.popularity,
    image_url: t.album?.images?.[0]?.url ?? null,
    valence: t.audio_features?.valence ?? null,
    energy: t.audio_features?.energy ?? null,
    tempo: t.audio_features?.tempo ?? null,
    danceability: t.audio_features?.danceability ?? null,
    acousticness: t.audio_features?.acousticness ?? null,
    instrumentalness: t.audio_features?.instrumentalness ?? null,
  }))

  const { error: trErr } = await supabase.from('tracks').insert(rows)
  if (trErr) {
    console.error(trErr)
  }

  return analysisId ?? null
}
