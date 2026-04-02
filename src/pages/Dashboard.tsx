import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { useSpotifyAnalysis } from '../hooks/useSpotifyAnalysis'
import type { MoodAnalysis, PeriodKey } from '../lib/types'

const periods: { key: PeriodKey; label: string }[] = [
  { key: 'week', label: 'Week' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
]

export function Dashboard() {
  const { loadPeriod, loading, error } = useSpotifyAnalysis()
  const [period, setPeriod] = useState<PeriodKey>('week')
  const [data, setData] = useState<{ analysis: MoodAnalysis } | null>(null)
  const [linked, setLinked] = useState<boolean | null>(null)

  useEffect(() => {
    if (!supabase) return
    ;(async () => {
      const { data: s } = await supabase.auth.getSession()
      if (!s.session) {
        await supabase.auth.signInAnonymously()
      }
      const { data: prof } = await supabase.from('profiles').select('spotify_id').single()
      setLinked(Boolean(prof?.spotify_id))
    })()
  }, [])

  useEffect(() => {
    if (!supabaseConfigured) {
      setData(null)
      return
    }
    let cancelled = false
    ;(async () => {
      const res = await loadPeriod(period)
      if (!cancelled && res) setData(res)
    })()
    return () => {
      cancelled = true
    }
  }, [period, loadPeriod])

  return (
    <div>
      <section className="mb-14">
        <h1 className="font-headline text-4xl md:text-6xl italic text-on-surface mb-4 leading-tight">
          Welcome, investigator.
        </h1>
        <p className="font-body text-lg text-on-surface-variant max-w-2xl leading-relaxed">
          Your emotional profile is synthesized from Spotify audio features over your top tracks.
          This is suggestive context — not a diagnosis.
        </p>
        {linked === false && (
          <p className="mt-6 text-sm text-error max-w-xl">
            Connect Spotify from the home page to load top tracks. If you already connected, refresh
            after the Edge Functions are deployed.
          </p>
        )}
      </section>

      <div className="flex gap-8 mb-10 border-b border-outline-variant/20 pb-4 overflow-x-auto">
        {periods.map((p) => (
          <button
            key={p.key}
            type="button"
            onClick={() => setPeriod(p.key)}
            className={`font-label text-[0.75rem] tracking-[0.2em] font-medium pb-4 whitespace-nowrap transition-colors ${
              period === p.key
                ? 'text-primary border-b-2 border-primary -mb-[17px]'
                : 'text-outline hover:text-on-surface'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {error && (
        <p className="text-error text-sm mb-6 max-w-xl">
          {error} — ensure Supabase functions <code className="text-xs">spotify-api</code> are
          deployed and Spotify credentials are linked.
        </p>
      )}

      {loading && (
        <p className="font-label text-outline text-sm tracking-widest animate-pulse">
          Synthesizing…
        </p>
      )}

      {data && !loading && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-1 md:grid-cols-12 gap-8"
        >
          <div className="md:col-span-4 bg-surface-container-low p-8 border border-outline-variant/10">
            <label className="font-label text-[0.7rem] uppercase tracking-widest text-outline block mb-6">
              Metric 01 / Emotional state
            </label>
            <span className="font-headline text-3xl md:text-4xl italic block mb-4">
              {data.analysis.emotionalState}
            </span>
            <p className="font-body text-sm leading-relaxed text-on-surface-variant">
              {data.analysis.emotionalSummary}
            </p>
          </div>
          <div className="md:col-span-4 bg-surface-container-low p-8 border border-outline-variant/10">
            <label className="font-label text-[0.7rem] uppercase tracking-widest text-outline block mb-6">
              Metric 02 / Energy level
            </label>
            <span className="font-headline text-3xl md:text-4xl italic block mb-4">
              {data.analysis.energyLevel}
            </span>
            <p className="font-body text-sm leading-relaxed text-on-surface-variant">
              {data.analysis.energyDescription}
            </p>
          </div>
          <div className="md:col-span-4 bg-surface-container-highest p-8 min-h-[200px] flex flex-col justify-end border border-outline-variant/10">
            <label className="font-label text-[0.7rem] uppercase tracking-widest text-on-surface-variant block mb-2">
              Window
            </label>
            <p className="font-headline text-xl text-on-surface italic capitalize">{period}</p>
            <Link
              to={`/analysis/${period}`}
              className="mt-6 inline-block font-label text-[0.65rem] tracking-[0.25em] uppercase text-primary hover:opacity-80"
            >
              Open full dossier →
            </Link>
          </div>

          <div className="md:col-span-12 bg-tertiary-container p-10 md:p-14">
            <div className="flex flex-col md:flex-row gap-10">
              <div className="md:w-1/3">
                <h2 className="font-headline text-2xl md:text-3xl italic leading-tight mb-6">
                  Psychological summary
                </h2>
                <div className="h-1 w-12 bg-primary mb-6" />
                <p className="font-label text-[0.65rem] uppercase tracking-[0.3em] text-outline">
                  Non-clinical read
                </p>
              </div>
              <div className="md:w-2/3 space-y-6">
                <p className="font-body text-lg leading-relaxed text-on-surface">
                  {data.analysis.behaviorPatterns.valencePattern}
                </p>
                <p className="font-body text-base leading-relaxed text-on-surface-variant">
                  {data.analysis.behaviorPatterns.energyPattern}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  )
}
