import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useSpotifyAnalysis } from '../hooks/useSpotifyAnalysis'
import type { MoodAnalysis } from '../lib/types'

export function Share() {
  const { loadPeriod, loading } = useSpotifyAnalysis()
  const [analysis, setAnalysis] = useState<MoodAnalysis | null>(null)

  useEffect(() => {
    ;(async () => {
      const res = await loadPeriod('month')
      if (res) setAnalysis(res.analysis)
    })()
  }, [loadPeriod])

  const quote =
    analysis?.emotionalSummary ??
    'Connect Spotify and open this page to generate a shareable editorial line from your monthly window.'

  const handleCopy = async () => {
    const url = window.location.href
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      /* ignore */
    }
  }

  return (
    <main className="min-h-[calc(100vh-160px)] flex flex-col items-center justify-start px-4 py-12 md:py-20">
      <div className="max-w-4xl w-full mb-12 text-left">
        <p className="font-label text-[0.7rem] uppercase tracking-[0.3em] text-outline mb-4">
          Export analysis
        </p>
        <h1 className="font-headline italic text-4xl md:text-5xl text-on-surface leading-tight hanging-headline">
          Digital monograph share
        </h1>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-[600px] aspect-square bg-tertiary-container flex flex-col items-center justify-between p-10 md:p-16 relative overflow-hidden ring-1 ring-outline/10"
      >
        <div className="w-full flex justify-center">
          <span className="font-serif text-lg tracking-[0.4em] uppercase text-on-surface">Moodify</span>
        </div>
        <div className="flex flex-col items-center text-center max-w-md">
          <span className="material-symbols-outlined text-tertiary-dim mb-8" style={{ fontSize: '2.5rem' }}>
            psychology
          </span>
          <blockquote className="font-headline italic text-xl md:text-3xl text-on-surface leading-snug mb-8">
            “{quote}”
          </blockquote>
          <div className="w-12 h-px bg-outline-variant mb-6" />
          <p className="font-label uppercase tracking-[0.2em] text-[0.7rem] text-on-surface-variant">
            Cognitive pattern report — monthly window
          </p>
        </div>
        <div className="w-full flex justify-between items-end border-t border-outline/10 pt-8">
          <div>
            <p className="font-label text-[10px] tracking-widest text-outline-variant uppercase">
              Insight ID
            </p>
            <p className="font-label text-[10px] text-on-surface font-medium">
              MOODIFY-{new Date().getFullYear()}
            </p>
          </div>
          <div className="text-right">
            <p className="font-label text-[10px] tracking-widest text-outline-variant uppercase">
              Date observed
            </p>
            <p className="font-label text-[10px] text-on-surface font-medium">
              {new Date().toLocaleDateString(undefined, {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
            </p>
          </div>
        </div>
        <div className="absolute top-0 right-0 p-8 opacity-[0.12] pointer-events-none font-headline text-6xl italic text-stone-400">
          +
        </div>
      </motion.div>

      <div className="mt-12 flex flex-col md:flex-row gap-4 w-full max-w-[600px]">
        <button
          type="button"
          disabled={loading}
          onClick={() => window.print()}
          className="flex-1 bg-primary text-on-primary py-4 px-6 font-label text-[0.75rem] font-medium tracking-[0.2em] uppercase hover:bg-primary-dim transition-colors disabled:opacity-50"
        >
          Print / PDF
        </button>
        <button
          type="button"
          onClick={handleCopy}
          className="flex-1 border border-outline/30 py-4 px-6 font-label text-[0.75rem] font-medium tracking-[0.2em] uppercase hover:bg-surface-container transition-colors"
        >
          Copy page link
        </button>
      </div>

      <div className="mt-24 max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="bg-tertiary-container p-10">
          <h3 className="font-headline italic text-2xl text-on-tertiary-container mb-6">
            Psychological insight
          </h3>
          <p className="font-body text-on-tertiary-container leading-relaxed opacity-90">
            This card summarizes language from your analysis engine. It is a mirror for reflection,
            not a clinical assessment.
          </p>
        </div>
        <div className="p-10 border-l border-outline/10">
          <h3 className="font-label font-semibold text-[0.75rem] tracking-[0.2em] uppercase text-outline mb-6">
            Visual standards
          </h3>
          <ul className="space-y-4 text-[0.75rem] tracking-wide uppercase text-on-surface-variant">
            <li className="flex items-center gap-4">
              <span className="w-2 h-2 bg-primary shrink-0" />0px radius — editorial grid
            </li>
            <li className="flex items-center gap-4">
              <span className="w-2 h-2 bg-primary shrink-0" />
              Cream / ink contrast
            </li>
            <li className="flex items-center gap-4">
              <span className="w-2 h-2 bg-primary shrink-0" />
              Newsreader + Inter
            </li>
          </ul>
        </div>
      </div>
    </main>
  )
}
