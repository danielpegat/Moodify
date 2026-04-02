import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { supabase, supabaseConfigured } from '../lib/supabase'
import { buildSpotifyAuthUrl, createPkcePair, randomState } from '../lib/pkce'
import { getSpotifyRedirectUri } from '../lib/spotifyRedirect'

const SPOTIFY_CLIENT = import.meta.env.VITE_SPOTIFY_CLIENT_ID

export function Landing() {
  async function connectSpotify() {
    if (!supabaseConfigured || !supabase) {
      alert(
        'Supabase no está cargado desde .env.\n\n' +
          '1) Guarda el archivo .env en la raíz del proyecto (junto a package.json).\n' +
          '2) Detén el servidor (Ctrl+C) y vuelve a ejecutar: npm run dev\n' +
          '3) Si usas "npm run preview", antes ejecuta: npm run build\n\n' +
          '(Vite solo lee .env al arrancar.)'
      )
      return
    }
    if (!SPOTIFY_CLIENT) {
      alert('Set VITE_SPOTIFY_CLIENT_ID in .env')
      return
    }

    const { data: sess } = await supabase.auth.getSession()
    if (!sess.session) {
      const { error } = await supabase.auth.signInAnonymously()
      if (error) {
        alert(`Enable Anonymous sign-ins in Supabase Auth: ${error.message}`)
        return
      }
    }

    const { verifier, challenge } = await createPkcePair()
    const state = randomState()
    sessionStorage.setItem('spotify_pkce_verifier', verifier)
    sessionStorage.setItem('spotify_oauth_state', state)
    localStorage.setItem('moodify_spotify_pkce_verifier', verifier)
    localStorage.setItem('moodify_spotify_oauth_state', state)

    const redirectUri = getSpotifyRedirectUri()
    const url = buildSpotifyAuthUrl({
      clientId: SPOTIFY_CLIENT,
      redirectUri,
      codeChallenge: challenge,
      state,
    })
    window.location.href = url
  }

  return (
    <div className="min-h-screen bg-surface text-on-surface">
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 bg-cream dark:bg-stone-900 sticky top-0 z-50 border-b border-stone-200/50">
        <span className="text-xl md:text-2xl font-serif uppercase tracking-[0.2em] text-stone-900 dark:text-stone-50">
          Moodify
        </span>
        <Link
          to="/dashboard"
          className="font-serif italic text-stone-500 dark:text-stone-400 text-sm hover:opacity-80"
        >
          Reports →
        </Link>
      </nav>

      <section className="px-6 md:px-12 pt-20 md:pt-32 pb-24 md:pb-48 overflow-hidden">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start gap-12 md:gap-16">
          <motion.div
            className="w-full md:w-3/5"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-headline text-5xl sm:text-7xl md:text-8xl leading-[0.9] tracking-tighter text-on-surface mb-8 md:mb-12 italic hanging-headline">
              Your music <br />
              knows how <br />
              you feel.
            </h1>
            <div className="h-px bg-outline opacity-20 w-32 mb-8 md:mb-12" />
            <p className="font-body text-lg max-w-md leading-relaxed text-on-surface-variant mb-10">
              A structured read of the emotional textures in your Spotify listening — week, month, and
              year. Insightful, not diagnostic.
            </p>
            <button
              type="button"
              onClick={connectSpotify}
              className="bg-primary text-on-primary px-10 py-5 text-sm font-label tracking-widest uppercase hover:bg-primary-dim transition-colors active:scale-[0.99]"
            >
              Connect with Spotify
            </button>
            {supabaseConfigured && SPOTIFY_CLIENT && (
              <div className="mt-8 max-w-lg p-4 border border-outline/20 bg-surface-container-low text-left">
                <p className="font-label text-[0.65rem] uppercase tracking-widest text-outline mb-2">
                  Spotify — Redirect URI (debe estar igual en el Dashboard)
                </p>
                <code className="font-mono text-xs text-on-surface break-all block select-all">
                  {getSpotifyRedirectUri()}
                </code>
                <p className="mt-3 text-xs text-on-surface-variant leading-relaxed">
                  Si ves <em>redirect_uri: Not matching configuration</em>: copia la línea de arriba en
                  Spotify → tu app → Settings → Redirect URIs → Save. Si solo usas 127.0.0.1, añade en{' '}
                  <code className="text-[0.7rem]">.env</code>:{' '}
                  <code className="text-[0.7rem] break-all">
                    VITE_SPOTIFY_REDIRECT_ORIGIN=http://127.0.0.1:5173
                  </code>{' '}
                  (ajusta el puerto al que muestre la terminal de Vite) y reinicia{' '}
                  <code className="text-[0.7rem]">npm run dev</code>.
                </p>
              </div>
            )}
            {!supabaseConfigured && (
              <p className="mt-6 text-sm text-error max-w-md">
                Add Supabase environment variables to enable login and saved analyses.
              </p>
            )}
          </motion.div>

          <div className="w-full md:w-2/5 flex flex-col gap-8">
            <div className="bg-surface-container-high p-8 border-l border-outline/10">
              <span className="font-label text-[10px] tracking-[0.3em] uppercase opacity-50 mb-4 block">
                Method
              </span>
              <h3 className="font-headline text-2xl mb-4 italic">Audio features → patterns</h3>
              <p className="font-body text-sm leading-relaxed text-on-surface-variant">
                We average valence, energy, danceability, tempo, acousticness, and instrumentalness
                from your top tracks, then interpret those patterns in everyday psychological
                language.
              </p>
            </div>
            <img
              className="w-full grayscale contrast-125 brightness-90 max-h-64 object-cover"
              alt=""
              src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80"
            />
          </div>
        </div>
      </section>

      <section className="bg-surface-container-low px-6 md:px-12 py-24 md:py-32">
        <div className="max-w-7xl mx-auto">
          <div className="mb-16 md:mb-24 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <span className="font-label text-xs tracking-[0.4em] uppercase text-outline mb-4 block">
                The dossier
              </span>
              <h2 className="font-headline text-4xl md:text-5xl italic">What you receive</h2>
            </div>
            <p className="font-label text-xs tracking-widest text-on-surface-variant max-w-xs md:text-right">
              Compare windows, save reports to your account, export a share card.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
            <div className="md:col-span-8 bg-surface-container p-10 md:p-12 min-h-[280px] flex flex-col justify-between">
              <div>
                <h3 className="font-label text-xs tracking-[0.3em] uppercase mb-8">01. Chronology</h3>
                <p className="font-body text-lg max-w-lg leading-relaxed text-on-surface-variant">
                  Short (week), medium (month), and long (year) horizons so you can see drift, not
                  just a single snapshot.
                </p>
              </div>
              <div className="flex gap-1 mt-10">
                {[0.2, 0.4, 0.6, 0.8, 1].map((o) => (
                  <div key={o} className="h-14 w-full bg-primary" style={{ opacity: o }} />
                ))}
              </div>
            </div>
            <div className="md:col-span-4 bg-tertiary-container p-10 md:p-12">
              <h3 className="font-label text-xs tracking-[0.3em] uppercase mb-8">02. Sentiment</h3>
              <p className="font-headline text-2xl md:text-3xl italic leading-snug text-on-tertiary-container">
                “This may suggest…” — always provisional, never a label of who you are.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-24 md:py-40 px-6 bg-surface text-center">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-headline text-4xl md:text-6xl italic mb-10">Audit your listening.</h2>
          <button
            type="button"
            onClick={connectSpotify}
            className="bg-primary text-on-primary px-12 py-6 text-sm font-label tracking-[0.3em] uppercase hover:bg-primary-dim transition-colors"
          >
            Start the analysis
          </button>
        </div>
      </section>

      <footer className="flex flex-col items-center justify-center py-16 gap-6 bg-cream dark:bg-stone-900 border-t border-stone-300 dark:border-stone-700">
        <div className="font-serif text-lg tracking-[0.2em] uppercase text-stone-900 dark:text-stone-50">
          Moodify
        </div>
        <p className="font-label text-[10px] tracking-[0.3em] uppercase text-stone-500">
          © {new Date().getFullYear()} — editorial use only
        </p>
      </footer>
    </div>
  )
}
