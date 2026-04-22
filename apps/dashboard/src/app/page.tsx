'use client'
import { createSupabaseBrowserClient } from '@/lib/supabase-browser'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { User } from '@supabase/supabase-js'

const stats = [
  { value: '8', label: 'Agents planned' },
  { value: '24/7', label: 'Monitoring cadence' },
  { value: '10 min', label: 'Email check interval' },
]

const features = [
  {
    accent: 'Lead Engine',
    title: 'Business development that watches the market while the studio sleeps.',
    copy: 'Permit filings, RFPs, and relationship signals get turned into leads and outreach drafts instead of disappearing into someone’s bookmarks.',
  },
  {
    accent: 'Inbox Desk',
    title: 'Email review shaped like an editorial workflow, not a ticket queue.',
    copy: 'Messages are categorized, summarized, and drafted in your studio voice so approval takes minutes instead of cognitive overhead.',
  },
  {
    accent: 'Relationship Memory',
    title: 'Your contact history stops depending on whoever happens to remember it.',
    copy: 'The system keeps timing, context, and prior interactions visible, so outreach has continuity and actual relevance.',
  },
  {
    accent: 'Financial Pulse',
    title: 'Profitability and invoicing become part of the weekly operating rhythm.',
    copy: 'Instead of waiting for end-of-month surprises, the studio gets a clear running read on cash movement and project health.',
  },
]

const steps = [
  {
    step: '01',
    title: 'Connect your email',
    copy: 'Use Gmail or Outlook. Initial setup is short and the first useful workflow is the inbox review pass.',
  },
  {
    step: '02',
    title: 'Choose the first processing window',
    copy: 'Pick how far back the agent should go so the rollout matches the messiness of the actual inbox.',
  },
  {
    step: '03',
    title: 'Approve work, don’t babysit it',
    copy: 'The system surfaces drafts, triage, and attachments in a review surface built for quick human decisions.',
  },
]

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const router = useRouter()

  useEffect(() => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })
    return () => subscription.unsubscribe()
  }, [])

  const signInWithGoogle = () => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding&provider=google`,
        scopes: 'https://www.googleapis.com/auth/gmail.modify https://www.googleapis.com/auth/gmail.send',
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    })
  }

  const signInWithAzure = () => {
    const supabase = createSupabaseBrowserClient()
    supabase.auth.signInWithOAuth({
      provider: 'azure',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/onboarding&provider=azure`,
        scopes: 'offline_access https://graph.microsoft.com/Mail.Read https://graph.microsoft.com/Mail.ReadWrite https://graph.microsoft.com/Mail.Send https://graph.microsoft.com/User.Read',
      },
    })
  }

  return (
    <div className="landing-shell">
      <nav className="landing-nav">
        <div className="landing-nav__brand">Interior AI</div>
        {user && (
          <button type="button" className="landing-nav__button" onClick={() => router.push('/dashboard')}>
            <span>{(user.user_metadata?.full_name as string)?.split(' ')[0] || user.email?.split('@')[0] || 'User'}</span>
            <span className="eyebrow eyebrow--muted" style={{ marginBottom: 0 }}>
              Dashboard
            </span>
          </button>
        )}
      </nav>

      <section className="landing-section landing-hero">
        <div>
          <div className="eyebrow">Operating system for interior design firms</div>
          <h1 className="landing-hero__title">
            A sharper
            <br />
            studio desk
            <br />
            built on <em>agents</em>
          </h1>

          <div className="landing-actions">
            <button
              type="button"
              className="button button--primary"
              onClick={signInWithGoogle}
            >
              Sign in with Gmail
            </button>
            <button
              type="button"
              className="button button--secondary"
              onClick={signInWithAzure}
            >
              Sign in with Outlook
            </button>
          </div>
        </div>

        <div className="landing-hero__card">
          <div className="eyebrow">Studio Snapshot</div>
          <div className="stack-sm">
            <div className="info-card">
              <h2 className="info-card__title">Morning queue, already triaged</h2>
              <p className="info-card__copy">Important messages rise to the top with a draft reply and the context that usually lives in someone’s head.</p>
            </div>
            <div className="info-card">
              <h2 className="info-card__title">Lead signals, captured in one rhythm</h2>
              <p className="info-card__copy">Instead of scattered tools and spreadsheets, the operating layer keeps business development visible and current.</p>
            </div>
            <div className="info-card">
              <h2 className="info-card__title">A product surface with actual taste</h2>
              <p className="info-card__copy">A tighter operating surface keeps the system readable when the studio is moving quickly.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-stats">
          {stats.map((stat) => (
            <article key={stat.label} className="landing-stat">
              <div className="landing-stat__value">{stat.value}</div>
              <div className="landing-stat__label">{stat.label}</div>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <div className="eyebrow">What it does</div>
          <h2 className="landing-section__title">
            One system,
            <br />
            <em>multiple operating roles</em>
          </h2>
        </div>

        <div className="landing-features">
          {features.map((feature) => (
            <article key={feature.accent} className="feature-card">
              <div className="feature-card__accent">{feature.accent}</div>
              <h3 className="landing-feature__title">{feature.title}</h3>
              <p className="feature-card__copy">{feature.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-section__header">
          <div className="eyebrow">How it works</div>
          <h2 className="landing-section__title">
            Fast to start,
            <br />
            <em>clear to review</em>
          </h2>
        </div>

        <div className="landing-steps">
          {steps.map((item) => (
            <article key={item.step} className="step-card">
              <div className="step-card__step">{item.step}</div>
              <h3 className="step-card__title">{item.title}</h3>
              <p className="step-card__copy">{item.copy}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" style={{ textAlign: 'center' }}>
        <div className="landing-section__header">
          <div className="eyebrow">Start</div>
          <h2 className="landing-section__title">
            Put the studio on a
            <br />
            <em>better operating surface</em>
          </h2>
        </div>

        <div className="landing-actions" style={{ justifyContent: 'center' }}>
          <button
            type="button"
            className="button button--primary"
            onClick={signInWithGoogle}
          >
            Get started with Gmail
          </button>
          <button
            type="button"
            className="button button--secondary"
            onClick={signInWithAzure}
          >
            Get started with Outlook
          </button>
        </div>
      </section>

      <footer className="landing-footer">
        <span>Interior AI</span>
        <span>2026</span>
      </footer>
    </div>
  )
}
