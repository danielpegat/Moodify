import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FeatureRadar, EnergyMoodBars } from '../components/FeatureCharts'
import { useSpotifyAnalysis } from '../hooks/useSpotifyAnalysis'
import type { EnrichedTrack, MoodAnalysis, PeriodKey } from '../lib/types'

const valid = (p: string | undefined): p is PeriodKey =>
  p === 'week' || p === 'month' || p === 'year'

export function AnalysisView() {
  const { period: raw } = useParams()
  const period = valid(raw) ? raw : 'week'
  const { loadPeriod, loading, error } = useSpotifyAnalysis()
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null)
  const [tracks, setTracks] = useState<EnrichedTrack[]>([])

  useEffect(() => {
    ;(async () => {
      const res = await loadPeriod(period)
      if (res) {
        setAnalysis(res.analysis)
        setTracks(res.tracks)
      }
    })()
  }, [period, loadPeriod])

  const pt = analysis?.personalityTraits

  return (
    <div>
      <header className="mb-16 md:mb-20">
        <span className="font-label text-[0.75rem] uppercase tracking-[0.3em] text-on-surface-variant block mb-4">
          Psychological dossier
        </span>
        <h1 className="font-headline text-3xl md:text-[3.5rem] leading-tight italic hanging-indent text-stone-900">
          {analysis?.emotionalState ?? '…'}
        </h1>
        <p className="max-w-2xl mt-8 text-body leading-[1.8] text-on-surface opacity-90">
          {analysis?.emotionalSummary}
        </p>
        <Link
          to="/dashboard"
          className="inline-block mt-8 font-label text-[0.65rem] tracking-[0.2em] uppercase text-outline hover:text-on-surface"
        >
          ← Back to reports
        </Link>
      </header>

      {error && <p className="text-error text-sm mb-8">{error}</p>}
      {loading && <p className="font-label text-outline text-sm tracking-widest">Loading…</p>}

      {analysis && !loading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="grid grid-cols-12 gap-10 mb-20"
        >
          <section className="col-span-12 lg:col-span-8 bg-surface-container-lowest border-l-4 border-stone-800 p-10 md:p-12">
            <h2 className="font-headline text-2xl mb-8 border-b border-stone-200 pb-2">
              Emotional analysis
            </h2>
            <div className="space-y-6 text-base leading-relaxed text-on-surface-variant">
              <p>{analysis.behaviorPatterns.summary}</p>
              <p>{analysis.behaviorPatterns.rhythmPattern}</p>
            </div>
          </section>

          <section className="col-span-12 lg:col-span-4 bg-surface-container p-8">
            <h2 className="font-headline text-xl mb-6">Personality-style signals</h2>
            {pt && (
              <div className="space-y-8">
                {(
                  [
                    ['Openness', pt.openness],
                    ['Introspection', pt.introspection],
                    ['Sensory focus', pt.sensoryFocus],
                    ['Social expressiveness', pt.socialExpressiveness],
                  ] as const
                ).map(([label, val]) => (
                  <div key={label}>
                    <div className="flex justify-between items-end mb-2">
                      <span className="font-label text-[0.75rem] tracking-widest uppercase">
                        {label}
                      </span>
                      <span className="font-label text-xs">{val}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/60">
                      <div className="bg-primary h-full transition-all duration-500" style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
                <p className="text-xs leading-relaxed opacity-70 italic pt-4 border-t border-stone-300">
                  Derived from audio features — illustrative, not a clinical personality score.
                </p>
              </div>
            )}
          </section>

          <section className="col-span-12 bg-white border border-outline/10 p-10 md:p-12">
            <div className="flex flex-col md:flex-row gap-12">
              <div className="md:w-1/3">
                <h2 className="font-headline text-2xl mb-4">Feature radar</h2>
                <p className="text-sm leading-relaxed opacity-80">
                  Normalized view of averaged audio features across your top tracks for this window.
                </p>
              </div>
              <div className="md:w-2/3">
                <FeatureRadar analysis={analysis} />
              </div>
            </div>
          </section>

          <section className="col-span-12 bg-surface-container p-10 md:p-12">
            <h2 className="font-headline text-2xl mb-8">Energy & mood bars</h2>
            <EnergyMoodBars analysis={analysis} />
          </section>

          <section className="col-span-12 mt-8">
            <h2 className="font-headline text-3xl mb-10 -ml-2">
              Auditory evidence{' '}
              <span className="font-sans text-xs italic tracking-normal opacity-50 ml-2">
                (top tracks)
              </span>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-16 gap-y-6">
              {tracks.map((t, i) => (
                <div
                  key={t.id}
                  className="group flex items-center gap-6 pb-4 border-b border-stone-200/50 hover:bg-surface-container-low/80 transition-colors p-2"
                >
                  <span className="font-headline text-lg italic opacity-30 group-hover:opacity-100">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <div className="w-12 h-12 shrink-0 bg-stone-200 overflow-hidden">
                    {t.album?.images?.[0]?.url ? (
                      <img
                        src={t.album.images[0].url}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : null}
                  </div>
                  <div className="flex-grow min-w-0">
                    <h4 className="font-label text-sm font-semibold uppercase tracking-wider truncate">
                      {t.name}
                    </h4>
                    <p className="text-[10px] uppercase opacity-60 truncate">
                      {t.artists.map((a) => a.name).join(', ')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </motion.div>
      )}
    </div>
  )
}
