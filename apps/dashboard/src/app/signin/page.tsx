'use client'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const router = useRouter()

  const connectGoogle = () => {
    sessionStorage.setItem('oauth_provider', 'google')
    const supabase = createSupabaseBrowserClient()
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  const connectAzure = () => {
    sessionStorage.setItem('oauth_provider', 'azure')
    const supabase = createSupabaseBrowserClient()
    supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
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
            <button type="button" className="button button--quiet" onClick={() => router.push('/dashboard')}>
              Back to dashboard
            </button>
          </div>

          <div className="onboarding-option-list">
            <button
              type="button"
              className="onboarding-option"
              onClick={connectGoogle}
            >
              <div>
                <h2 className="onboarding-option__title">Gmail</h2>
                <p className="onboarding-option__copy">Connect a Google account for Gmail review and sending.</p>
              </div>
              <span className="selection-dot" aria-hidden="true" />
            </button>

            <button
              type="button"
              className="onboarding-option"
              onClick={connectAzure}
            >
              <div>
                <h2 className="onboarding-option__title">Outlook</h2>
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
