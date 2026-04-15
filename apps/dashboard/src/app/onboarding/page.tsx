'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const options = [
  { label: 'Today only', value: 0, description: 'Start clean and only process what lands from here onward.' },
  { label: 'Last 7 days', value: 7, description: 'Catch the most recent studio activity without a deep backlog.' },
  { label: 'Last 30 days', value: 30, description: 'Useful if the inbox has already been drifting for a few weeks.' },
  { label: 'Last 90 days', value: 90, description: 'A fuller catch-up pass for firms starting from a cold inbox.' },
]

export default function OnboardingPage() {
  const router = useRouter()
  const [selected, setSelected] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleContinue = async () => {
    if (selected === null) return

    setLoading(true)
    setError(null)

    const fetchSince = new Date()
    fetchSince.setDate(fetchSince.getDate() - selected)

    const fetchSinceUTC = new Date(
      Date.UTC(fetchSince.getFullYear(), fetchSince.getMonth(), fetchSince.getDate())
    )

    const response = await fetch('/api/onboarding/set-fetch-since', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fetchSince: fetchSinceUTC.toISOString() }),
    })

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'Failed to save onboarding selection' }))
      setError(body.error || 'Failed to save onboarding selection')
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="onboarding-shell">
      <section className="onboarding-card">
        <div className="onboarding-layout">
          <div className="stack-lg">
            <div>
              <div className="eyebrow">Interior AI Setup</div>
              <h1 className="page-title">
                How far back
                <br />
                <em>should we read?</em>
              </h1>
            </div>

            <div className="panel">
              <div className="eyebrow">What happens next</div>
              <div className="stack-sm">
                <div className="info-card">
                  <h2 className="info-card__title">Inbox connection stays intact</h2>
                  <p className="info-card__copy">You are only choosing how much history to process, not granting broader scope.</p>
                </div>
                <div className="info-card">
                  <h2 className="info-card__title">You can change this later</h2>
                  <p className="info-card__copy">If the first pull is too narrow or too broad, adjust the range after setup.</p>
                </div>
              </div>
            </div>
          </div>

          <div className="stack-md">
            <div className="onboarding-option-list">
              {options.map((option) => {
                const isSelected = selected === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    className={`onboarding-option${isSelected ? ' is-selected' : ''}`}
                    onClick={() => setSelected(option.value)}
                  >
                    <div>
                      <h2 className="onboarding-option__title">{option.label}</h2>
                      <p className="onboarding-option__copy">{option.description}</p>
                    </div>
                    <div className={`selection-dot${isSelected ? ' is-selected' : ''}`} />
                  </button>
                )
              })}
            </div>

            <button
              type="button"
              className="button button--dark"
              onClick={handleContinue}
              disabled={selected === null || loading}
            >
              {loading ? 'Setting up' : 'Continue'}
            </button>

            {error && <div className="error-text">{error}</div>}
          </div>
        </div>
      </section>
    </div>
  )
}
