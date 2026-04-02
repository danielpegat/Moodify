export type TimeRange = 'short_term' | 'medium_term' | 'long_term'

export type PeriodKey = 'week' | 'month' | 'year'

export const PERIOD_TO_TIME_RANGE: Record<PeriodKey, TimeRange> = {
  week: 'short_term',
  month: 'medium_term',
  year: 'long_term',
}

export const TIME_RANGE_TO_PERIOD: Record<TimeRange, PeriodKey> = {
  short_term: 'week',
  medium_term: 'month',
  long_term: 'year',
}

export interface SpotifyTrack {
  id: string
  name: string
  popularity: number
  artists: { name: string }[]
  album: { images: { url: string }[] }
}

export interface AudioFeatures {
  valence: number
  energy: number
  danceability: number
  tempo: number
  acousticness: number
  instrumentalness: number
}

export interface EnrichedTrack extends SpotifyTrack {
  audio_features: AudioFeatures | null
}

export interface PersonalityTraits {
  openness: number
  introspection: number
  sensoryFocus: number
  socialExpressiveness: number
}

export interface BehaviorPatterns {
  summary: string
  valencePattern: string
  energyPattern: string
  rhythmPattern: string
}

export interface MoodAnalysis {
  emotionalState: string
  emotionalSummary: string
  personalityTraits: PersonalityTraits
  behaviorPatterns: BehaviorPatterns
  energyLevel: string
  energyDescription: string
  averages: {
    valence: number
    energy: number
    danceability: number
    tempo: number
    acousticness: number
    instrumentalness: number
  }
  /** Narrative comparing periods when multiple snapshots exist */
  timeComparison?: string
}
