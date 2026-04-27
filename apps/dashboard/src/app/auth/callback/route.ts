import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/onboarding'

  if (!code) {
    return NextResponse.redirect(`${origin}/?error=missing_code`)
  }

  // Build the redirect response first so we can attach session cookies to it.
  // Using request.cookies for getAll (reads PKCE verifier set by the browser client)
  // and response.cookies for setAll (so the session survives the redirect).
  const successUrl = `${origin}${next}`
  const response = NextResponse.redirect(successUrl)

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              request.cookies.set(name, value)
              response.cookies.set(name, value, options)
            })
          },
        },
      }
    )

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error || !data.session) {
      return NextResponse.redirect(`${origin}/?error=auth_failed`)
    }

    const { session } = data
    const providerToken = session.provider_token
    const providerRefreshToken = session.provider_refresh_token
    const userEmail = session.user.email

    // provider_token is ephemeral — only available at this moment during the exchange
    if (providerToken && userEmail) {
      const supabaseProvider = session.user.app_metadata?.provider as string | undefined
      const mappedProvider = supabaseProvider === 'google' ? 'gmail' : 'outlook'

      // Use service key for the upsert so it works on first login before RLS row exists
      const admin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_KEY!
      )

      const expiresAt = session.expires_at
        ? new Date(session.expires_at * 1000).toISOString()
        : new Date(Date.now() + 3600 * 1000).toISOString()

      await admin.from('connected_accounts').upsert(
        {
          user_email: userEmail,
          provider: mappedProvider,
          access_token: providerToken,
          refresh_token: providerRefreshToken ?? null,
          expires_at: expiresAt,
          fetch_since: new Date().toISOString(),
        },
        { onConflict: 'user_email,provider' }
      )
    }

    return response
  } catch {
    return NextResponse.redirect(`${origin}/?error=auth_failed`)
  }
}
