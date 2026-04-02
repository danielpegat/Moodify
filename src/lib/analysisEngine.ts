import type {
  AudioFeatures,
  EnrichedTrack,
  MoodAnalysis,
  PeriodKey,
  PersonalityTraits,
} from './types'

function avg(nums: number[]): number {
  if (!nums.length) return 0
  return nums.reduce((a, b) => a + b, 0) / nums.length
}

function clamp01(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n * 100)))
}

function describeEnergy(energy: number, tempo: number): string {
  if (energy > 0.65 && tempo > 125) {
    return 'Elevated'
  }
  if (energy > 0.55) {
    return 'Sustained'
  }
  if (energy < 0.35) {
    return 'Contained'
  }
  return 'Balanced'
}

function describeEmotionalState(
  valence: number,
  energy: number,
  acousticness: number
): { label: string; summary: string } {
  const v = valence
  const e = energy
  const a = acousticness

  if (v > 0.55 && e > 0.55) {
    return {
      label: 'Luminous momentum',
      summary:
        'This may suggest a stretch where uplift and forward motion show up together in what you reach for musically — not necessarily “happy,” but outward-facing and activated.',
    }
  }
  if (v < 0.42 && a > 0.45) {
    return {
      label: 'Quiet interiority',
      summary:
        'You might be experiencing a pull toward softer, roomier textures — a pattern that often tracks with reflection, privacy, or the need to think without noise.',
    }
  }
  if (v > 0.5 && e < 0.45) {
    return {
      label: 'Warm steadiness',
      summary:
        'The blend here leans hopeful without rushing; it can mirror a desire for reassurance more than spectacle.',
    }
  }
  if (e > 0.65 && v < 0.5) {
    return {
      label: 'Tense activation',
      summary:
        'High energy with a more ambivalent emotional tint sometimes shows up when you are driving focus, pacing through stress, or seeking stimulation without softness.',
    }
  }
  return {
    label: 'Mixed resonance',
    summary:
      'Your selections do not collapse into a single mood label — which itself may suggest nuance, transition, or competing needs showing up in parallel.',
  }
}

function buildPersonalityTraits(f: AudioFeatures): PersonalityTraits {
  const openness =
    0.35 * f.instrumentalness +
    0.25 * (1 - Math.abs(f.valence - 0.5) * 2) +
    0.2 * f.acousticness +
    0.2 * f.danceability
  const introspection = 0.45 * f.acousticness + 0.35 * (1 - f.energy) + 0.2 * f.instrumentalness
  const sensoryFocus = 0.4 * f.instrumentalness + 0.35 * f.acousticness + 0.25 * (f.tempo / 200)
  const socialExpressiveness = 0.55 * f.danceability + 0.45 * f.energy

  return {
    openness: clamp01(openness),
    introspection: clamp01(introspection),
    sensoryFocus: clamp01(sensoryFocus),
    socialExpressiveness: clamp01(socialExpressiveness),
  }
}

function buildBehaviorPatterns(f: AudioFeatures): MoodAnalysis['behaviorPatterns'] {
  let valencePattern =
    'Valence sits in a mid-range; you might be sampling several emotional registers rather than locking into one.'
  if (f.valence > 0.6) {
    valencePattern =
      'Higher valence on average may suggest you are gravitating toward material that feels brighter or more consonant — a gentle lift in sonic “weather.”'
  } else if (f.valence < 0.4) {
    valencePattern =
      'Lower valence can track with minor tonal leanings or slower harmonic motion; for many listeners this maps to contemplation rather than distress.'
  }

  let energyPattern =
    'Energy is moderate — neither a sprint nor a whisper — which can mirror a sustainable day-to-day listening posture.'
  if (f.energy > 0.62) {
    energyPattern =
      'Elevated energy may suggest you are using music to mobilize attention, movement, or urgency.'
  } else if (f.energy < 0.38) {
    energyPattern =
      'Lower energy suggests a preference for steadier, less jagged dynamics — sometimes linked to recovery, focus, or emotional decompression.'
  }

  let rhythmPattern =
    'Tempo and danceability together point to how “body-forward” this window feels.'
  if (f.danceability > 0.62 && f.tempo > 115) {
    rhythmPattern =
      'Higher danceability with a quicker pulse may suggest expressive, rhythmic listening — music as a social or kinetic channel, even in private.'
  } else if (f.danceability < 0.38) {
    rhythmPattern =
      'Lower danceability can align with narrative, texture, or harmonic depth over groove — a more observational stance.'
  }

  return {
    summary:
      'These patterns are descriptive, not deterministic: they summarize tendencies in this slice of listening, not a fixed trait.',
    valencePattern,
    energyPattern,
    rhythmPattern,
  }
}

export function averageFeatures(tracks: EnrichedTrack[]): AudioFeatures | null {
  const feats = tracks.map((t) => t.audio_features).filter(Boolean) as AudioFeatures[]
  if (!feats.length) return null
  return {
    valence: avg(feats.map((x) => x.valence)),
    energy: avg(feats.map((x) => x.energy)),
    danceability: avg(feats.map((x) => x.danceability)),
    tempo: avg(feats.map((x) => x.tempo)),
    acousticness: avg(feats.map((x) => x.acousticness)),
    instrumentalness: avg(feats.map((x) => x.instrumentalness)),
  }
}

export function buildMoodAnalysis(
  tracks: EnrichedTrack[],
  opts?: { compare?: Partial<Record<PeriodKey, EnrichedTrack[]>> }
): MoodAnalysis {
  const f = averageFeatures(tracks)
  if (!f) {
    return {
      emotionalState: 'Insufficient signal',
      emotionalSummary:
        'Audio features were not available for enough tracks to summarize this window. This sometimes happens with very new or regional releases.',
      personalityTraits: {
        openness: 0,
        introspection: 0,
        sensoryFocus: 0,
        socialExpressiveness: 0,
      },
      behaviorPatterns: {
        summary: '',
        valencePattern: '',
        energyPattern: '',
        rhythmPattern: '',
      },
      energyLevel: 'Unknown',
      energyDescription:
        'Connect Spotify and ensure recent listening history is available to generate a fuller read.',
      averages: {
        valence: 0,
        energy: 0,
        danceability: 0,
        tempo: 0,
        acousticness: 0,
        instrumentalness: 0,
      },
    }
  }

  const { label, summary } = describeEmotionalState(f.valence, f.energy, f.acousticness)
  const energyLevel = describeEnergy(f.energy, f.tempo)
  const personalityTraits = buildPersonalityTraits(f)
  const behaviorPatterns = buildBehaviorPatterns(f)

  let energyDescription =
    'Taken together, energy and tempo suggest how much “forward voltage” sits in this sample — not good or bad, simply descriptive.'
  if (f.energy > 0.6 && f.tempo > 120) {
    energyDescription =
      'You might be experiencing music here as a stimulant — faster pulse, more kinetic weight — which many people use to match or shift internal arousal.'
  } else if (f.energy < 0.4) {
    energyDescription =
      'A softer energy profile can mirror lowered stimulation goals: winding down, reading, or staying emotionally level.'
  }

  let timeComparison: string | undefined
  const compareMap = opts?.compare
  if (compareMap) {
    const parts: string[] = []
    ;(Object.keys(compareMap) as PeriodKey[]).forEach((key) => {
      const list = compareMap[key]
      if (!list?.length) return
      const af = averageFeatures(list)
      if (!af) return
      const diffV = f.valence - af.valence
      if (Math.abs(diffV) > 0.08) {
        parts.push(
          `Compared with your ${key === 'week' ? 'recent week' : key === 'month' ? 'monthly' : 'year-long'} sample, valence ${diffV > 0 ? 'ticks slightly higher' : 'leans somewhat lower'} here.`
        )
      }
    })
    if (parts.length) {
      timeComparison = parts.join(' ')
    }
  }

  return {
    emotionalState: label,
    emotionalSummary: summary,
    personalityTraits,
    behaviorPatterns,
    energyLevel,
    energyDescription,
    averages: {
      valence: f.valence,
      energy: f.energy,
      danceability: f.danceability,
      tempo: f.tempo,
      acousticness: f.acousticness,
      instrumentalness: f.instrumentalness,
    },
    timeComparison,
  }
}
