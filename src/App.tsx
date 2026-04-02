import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { AnalysisView } from './pages/AnalysisView'
import { AuthCallback } from './pages/AuthCallback'
import { Compare } from './pages/Compare'
import { Dashboard } from './pages/Dashboard'
import { Landing } from './pages/Landing'
import { Share } from './pages/Share'
import { getEnvSpotifyOrigin } from './lib/spotifyRedirect'

function AppRoutes() {
  const required = typeof window !== 'undefined' ? getEnvSpotifyOrigin() : null
  if (required && window.location.origin !== required) {
    window.location.replace(
      required + window.location.pathname + window.location.search + window.location.hash
    )
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface px-6">
        <p className="font-body text-on-surface-variant text-center">
          Ajustando la URL para que coincida con Spotify…
        </p>
      </div>
    )
  }

  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/auth/callback" element={<AuthCallback />} />
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analysis/:period" element={<AnalysisView />} />
        <Route path="/compare" element={<Compare />} />
        <Route path="/share" element={<Share />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
