import { useEffect, useState } from 'react'
import { buildMoodAnalysis, averageFeatures } from '../lib/analysisEngine'
import { fetchEnrichedTopTracks } from '../lib/spotifyData'
import type { EnrichedTrack, MoodAnalysis, PeriodKey } from '../lib/types'
import { PERIOD_TO_TIME_RANGE } from '../lib/types'

function barsFor(
  snap: Partial<Record<PeriodKey, { analysis: MoodAnalysis; tracks: EnrichedTrack[] }>>,
  period: PeriodKey
) {
  const block = snap[period]
  const af = block?.tracks ? averageFeatures(block.tracks) : null
  if (!af) return []
  const base = [
    af.valence * 100,
    af.energy * 100,
    af.danceability * 100,
    af.acousticness * 100,
    af.instrumentalness * 100,
    (af.tempo / 200) * 100,
    af.valence * 80,
  ]
  return base.map((h) => Math.min(100, Math.max(8, h)))
}

export function Compare() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState<string | null>(null)
  const [snap, setSnap] = useState<
    Partial<Record<PeriodKey, { analysis: MoodAnalysis; tracks: EnrichedTrack[] }>>
  >({})

  useEffect(() => {
    ;(async () => {
      setLoading(true)
      setErr(null)
      try {
        const [w, m, y] = await Promise.all([
          fetchEnrichedTopTracks(PERIOD_TO_TIME_RANGE.week, 10),
          fetchEnrichedTopTracks(PERIOD_TO_TIME_RANGE.month, 10),
          fetchEnrichedTopTracks(PERIOD_TO_TIME_RANGE.year, 10),
        ])
        setSnap({
          week: { analysis: buildMoodAnalysis(w), tracks: w },
          month: { analysis: buildMoodAnalysis(m), tracks: m },
          year: { analysis: buildMoodAnalysis(y), tracks: y },
        })
      } catch (e) {
        setErr(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  const week = snap.week?.analysis
  const month = snap.month?.analysis

  const synthesis =
    week && month
      ? (() => {
          const diff = week.averages.valence - month.averages.valence
          if (Math.abs(diff) < 0.05) {
            return 'Week and month sit close together in average valence — you might be experiencing a stable listening palette across horizons.'
          }
          if (diff > 0) {
            return 'The recent week leans slightly brighter than the monthly window — this may suggest a short-term shift toward more consonant or uplifted selections.'
          }
          return 'The recent week leans somewhat lower in valence than your monthly baseline — often this tracks a season of heavier or more interior listening, not necessarily distress.'
        })()
      : null

  const weekBars = barsFor(snap, 'week')
  const monthBars = barsFor(snap, 'month')

  return (
    <div>
      <header className="mb-16 md:mb-20">
        <span className="font-label text-[0.75rem] uppercase tracking-widest text-outline mb-4 block">
          Comparative study
        </span>
        <h1 className="font-headline text-3xl md:text-[3.5rem] leading-tight hanging-indent italic">
          Longitudinal drift: week vs month
        </h1>
      </header>

      {loading && <p className="font-label text-outline tracking-widest text-sm">Loading…</p>}
      {err && <p className="text-error text-sm mb-8">{err}</p>}

      {!loading && !err && (
        <>
          <div className="flex flex-col lg:flex-row lg:items-stretch gap-12 lg:gap-6 border-t border-outline/10 pt-12">
            <section className="flex-1 min-w-0">
              <div className="mb-8">
                <p className="font-label text-[0.75rem] text-primary tracking-widest mb-1 uppercase">
                  Phase A
                </p>
                <h2 className="font-headline text-2xl italic mb-6">Current interval (week)</h2>
              </div>
              <div className="bg-tertiary-container p-8 mb-10">
                <p className="font-label text-[0.65rem] text-tertiary tracking-tighter mb-4 uppercase">
                  Dominant read
                </p>
                <p className="font-body text-lg leading-relaxed text-on-surface">
                  {week?.emotionalSummary}
                </p>
              </div>
              <div className="mb-10 border-l border-outline/20 pl-6">
                <p className="font-label text-[0.75rem] text-outline tracking-widest mb-4">
                  FEATURE INTENSITY
                </p>
                <div className="h-40 w-full flex items-end gap-1">
                  {weekBars.map((h, i) => (
                    <div key={i} className="w-full bg-primary" style={{ height: `${h}%` }} />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-baseline border-b border-outline/10 pb-2">
                  <span className="font-label text-[0.75rem] text-outline uppercase">
                    Valence (avg)
                  </span>
                  <span className="font-body text-xl font-semibold">
                    {week ? (week.averages.valence * 100).toFixed(0) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline border-b border-outline/10 pb-2">
                  <span className="font-label text-[0.75rem] text-outline uppercase">
                    Energy (avg)
                  </span>
                  <span className="font-body text-xl font-semibold">
                    {week ? (week.averages.energy * 100).toFixed(0) : '—'}
                  </span>
                </div>
              </div>
            </section>

            <div className="hidden lg:flex flex-col items-center justify-start w-14 shrink-0 pt-24">
              <div className="h-44 w-px bg-outline/20 relative">
                <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-surface px-1 py-2">
                  <span className="material-symbols-outlined text-outline">compare_arrows</span>
                </div>
              </div>
            </div>

            <section className="flex-1 min-w-0">
              <div className="mb-8">
                <p className="font-label text-[0.75rem] text-primary tracking-widest mb-1 uppercase">
                  Phase B
                </p>
                <h2 className="font-headline text-2xl italic mb-6">Historical baseline (month)</h2>
              </div>
              <div className="bg-surface-container p-8 mb-10">
                <p className="font-label text-[0.65rem] text-outline tracking-tighter mb-4 uppercase">
                  Reference summary
                </p>
                <p className="font-body text-lg leading-relaxed text-on-surface">
                  {month?.emotionalSummary}
                </p>
              </div>
              <div className="mb-10 border-l border-outline/20 pl-6">
                <p className="font-label text-[0.75rem] text-outline tracking-widest mb-4">
                  HISTORICAL DRIFT
                </p>
                <div className="h-40 w-full flex items-end gap-1">
                  {monthBars.map((h, i) => (
                    <div
                      key={i}
                      className="w-full bg-outline opacity-50"
                      style={{ height: `${h}%` }}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-6">
                <div className="flex justify-between items-baseline border-b border-outline/10 pb-2">
                  <span className="font-label text-[0.75rem] text-outline uppercase">
                    Valence (avg)
                  </span>
                  <span className="font-body text-xl font-semibold">
                    {month ? (month.averages.valence * 100).toFixed(0) : '—'}
                  </span>
                </div>
                <div className="flex justify-between items-baseline border-b border-outline/10 pb-2">
                  <span className="font-label text-[0.75rem] text-outline uppercase">
                    Energy (avg)
                  </span>
                  <span className="font-body text-xl font-semibold">
                    {month ? (month.averages.energy * 100).toFixed(0) : '—'}
                  </span>
                </div>
              </div>
            </section>
          </div>

          {snap.year && (
            <section className="mt-16 max-w-3xl border-t border-outline/10 pt-12">
              <h3 className="font-headline text-xl italic mb-4">Year-long arc</h3>
              <p className="font-body text-on-surface-variant leading-relaxed">
                {snap.year.analysis.emotionalSummary}
              </p>
            </section>
          )}

          <section className="mt-20 max-w-3xl">
            <div className="flex gap-10 items-start">
              <div className="w-1 bg-primary h-24 shrink-0" />
              <div>
                <h3 className="font-headline text-2xl md:text-3xl italic mb-6">
                  Synthesis of change
                </h3>
                <p className="font-body text-lg leading-[1.8] text-on-surface mb-8">{synthesis}</p>
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  )
}
