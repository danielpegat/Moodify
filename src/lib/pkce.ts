function base64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  bytes.forEach((b) => {
    binary += String.fromCharCode(b)
  })
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export async function createPkcePair(): Promise<{
  verifier: string
  challenge: string
}> {
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)).buffer)
  const encoder = new TextEncoder()
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(verifier))
  const challenge = base64url(digest)
  return { verifier, challenge }
}

export function buildSpotifyAuthUrl(params: {
  clientId: string
  redirectUri: string
  codeChallenge: string
  state: string
}): string {
  const u = new URL('https://accounts.spotify.com/authorize')
  u.searchParams.set('client_id', params.clientId)
  u.searchParams.set('response_type', 'code')
  u.searchParams.set('redirect_uri', params.redirectUri)
  u.searchParams.set(
    'scope',
    [
      'user-top-read',
      'user-read-recently-played',
      'user-read-email',
      'user-read-private',
    ].join(' ')
  )
  u.searchParams.set('code_challenge_method', 'S256')
  u.searchParams.set('code_challenge', params.codeChallenge)
  u.searchParams.set('state', params.state)
  return u.toString()
}

export function randomState(): string {
  return base64url(crypto.getRandomValues(new Uint8Array(16)).buffer)
}
