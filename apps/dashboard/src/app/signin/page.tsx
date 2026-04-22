'use client'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

export default function SignInPage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
  }, [])

  const hasGoogle = user?.identities?.some((id) => id.provider === 'google')
  const hasAzure = user?.identities?.some((id) => id.provider === 'azure')

  const linkGoogle = () => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.linkIdentity({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings&provider=google`,
        scopes: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  const linkAzure = () => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.linkIdentity({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/settings&provider=azure`,
        scopes: 'offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
      },
    })
  }

  return (
    <div className="onboarding-shell">
      <section className="onboarding-card">
        <div className="onboarding-layout">
          <div>
            <div className="eyebrow">Connect account</div>
            <h1 className="section-title">
              Choose a
              <br />
              sign-in option
            </h1>
            <p className="page-copy">
              Add Gmail or Outlook to the operating desk without returning to the marketing page.
            </p>
            {user && (
              <button type="button" className="button button--quiet" onClick={() => router.push('/dashboard')}>
                Back to dashboard
              </button>
            )}
          </div>

          <div className="onboarding-option-list">
            <button
              type="button"
              className="onboarding-option"
              onClick={linkGoogle}
              disabled={hasGoogle ?? false}
            >
              <div>
                <h2 className="onboarding-option__title">Gmail {hasGoogle && '(connected)'}</h2>
                <p className="onboarding-option__copy">Connect a Google account for Gmail review and sending.</p>
              </div>
              <span className="selection-dot" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="onboarding-option"
              onClick={linkAzure}
              disabled={hasAzure ?? false}
            >
              <div>
                <h2 className="onboarding-option__title">Outlook {hasAzure && '(connected)'}</h2>
                <p className="onboarding-option__copy">Connect a Microsoft account for Outlook review and sending.</p>
              </div>
              <span className="selection-dot" aria-hidden="true" />
            </button>
          </div>
        </div>
      </section>
    </div>
  )
}
