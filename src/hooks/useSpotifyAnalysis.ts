import { useCallback, useState } from 'react'
import { buildMoodAnalysis } from '../lib/analysisEngine'
import { fetchEnrichedTopTracks } from '../lib/spotifyData'
import { saveAnalysis } from '../lib/persistAnalysis'
import { supabase } from '../lib/supabase'
import type { EnrichedTrack, MoodAnalysis, PeriodKey } from '../lib/types'
import { PERIOD_TO_TIME_RANGE } from '../lib/types'

export function useSpotifyAnalysis() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const loadPeriod = useCallback(async (period: PeriodKey) => {
    setLoading(true)
    setError(null)
    try {
      const tr = PERIOD_TO_TIME_RANGE[period]
      const tracks = await fetchEnrichedTopTracks(tr, 10)
      const analysis = buildMoodAnalysis(tracks)

      if (supabase) {
        const { data: user } = await supabase.auth.getUser()
        if (user.user) {
          await saveAnalysis(user.user.id, period, analysis, tracks)
        }
      }

      return { analysis, tracks } as { analysis: MoodAnalysis; tracks: EnrichedTrack[] }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load analysis')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  return { loadPeriod, loading, error, setError }
}
