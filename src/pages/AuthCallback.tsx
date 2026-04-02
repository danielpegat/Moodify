import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { exchangeSpotifyOAuth } from '../lib/spotifyData'
import { getSpotifyRedirectUri } from '../lib/spotifyRedirect'

export function AuthCallback() {
  const navigate = useNavigate()
  const [msg, setMsg] = useState('Completing Spotify connection…')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const code = params.get('code')
    const state = params.get('state')
    const err = params.get('error')

    if (err) {
      setMsg(`Spotify: ${err}`)
      return
    }

    const savedState =
      sessionStorage.getItem('spotify_oauth_state') ?? localStorage.getItem('moodify_spotify_oauth_state')
    const verifier =
      sessionStorage.getItem('spotify_pkce_verifier') ?? localStorage.getItem('moodify_spotify_pkce_verifier')

    if (!code || !verifier || !state || state !== savedState) {
      setMsg(
        'Sesión OAuth inválida o caducada.\n\n' +
          '• Vuelve a la página principal y pulsa otra vez «Connect with Spotify».\n' +
          '• Usa siempre la misma URL en el navegador (no mezcles localhost con 127.0.0.1).\n' +
          '• Si tienes VITE_SPOTIFY_REDIRECT_ORIGIN en .env, la app debe abrirse en esa misma dirección.'
      )
      return
    }

    const redirect_uri = getSpotifyRedirectUri()

    ;(async () => {
      const res = await exchangeSpotifyOAuth({ code, redirect_uri, code_verifier: verifier })
      sessionStorage.removeItem('spotify_oauth_state')
      sessionStorage.removeItem('spotify_pkce_verifier')
      localStorage.removeItem('moodify_spotify_oauth_state')
      localStorage.removeItem('moodify_spotify_pkce_verifier')
      if (res.error) {
        setMsg(res.error)
        return
      }
      navigate('/dashboard', { replace: true })
    })().catch((e) => {
      setMsg(e instanceof Error ? e.message : 'Connection failed')
    })
  }, [navigate])

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface px-6">
      <p className="font-body text-on-surface-variant text-center max-w-md whitespace-pre-line">{msg}</p>
    </div>
  )
}
