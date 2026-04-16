'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function SignInPage() {
  const { data: session } = useSession()
  const router = useRouter()

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
            {session && (
              <button type="button" className="button button--quiet" onClick={() => router.push('/dashboard')}>
                Back to dashboard
              </button>
            )}
          </div>

          <div className="onboarding-option-list">
            <button
              type="button"
              className="onboarding-option"
              onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
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
              onClick={() => signIn('azure-ad', { callbackUrl: '/onboarding' })}
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
