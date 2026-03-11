'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const options = [
  { label: 'Today only', value: 0, description: 'Only process emails from today forward' },
  { label: 'Last 7 days', value: 7, description: 'Catch up on the past week' },
  { label: 'Last 30 days', value: 30, description: 'Catch up on the past month' },
  { label: 'Last 90 days', value: 90, description: 'Go back three months' },
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
    // Force UTC midnight to avoid timezone issues
    const fetchSinceUTC = new Date(Date.UTC(
      fetchSince.getFullYear(),
      fetchSince.getMonth(),
      fetchSince.getDate()
    ))

    const response = await fetch('/api/onboarding/set-fetch-since', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fetchSince: fetchSinceUTC.toISOString() })
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
    <div style={{
      minHeight: '100vh',
      background: 'var(--cream)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px'
    }}>
      <div style={{ maxWidth: '560px', width: '100%' }}>

        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '3px',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginBottom: '16px'
          }}>
            Interior AI — Setup
          </div>
          <h1 style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '48px',
            fontWeight: 300,
            lineHeight: 1.1,
            marginBottom: '16px'
          }}>
            How far back should<br />
            <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>we look?</em>
          </h1>
          <p style={{
            fontSize: '14px',
            color: 'var(--mid)',
            lineHeight: 1.75,
            maxWidth: '420px'
          }}>
            We'll start processing your emails from this point forward. 
            You can always change this later in settings.
          </p>
        </div>

        {/* Options */}
        <div style={{
          display: 'grid',
          gap: '2px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
          marginBottom: '24px'
        }}>
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => setSelected(option.value)}
              style={{
                background: selected === option.value ? 'white' : 'var(--warm-white)',
                padding: '24px 28px',
                cursor: 'pointer',
                borderLeft: selected === option.value ? '3px solid var(--gold)' : '3px solid transparent',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                transition: 'all 0.15s ease'
              }}
            >
              <div>
                <div style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '22px',
                  fontWeight: 400,
                  marginBottom: '4px'
                }}>
                  {option.label}
                </div>
                <div style={{
                  fontSize: '13px',
                  color: 'var(--mid)'
                }}>
                  {option.description}
                </div>
              </div>
              <div style={{
                width: '20px',
                height: '20px',
                borderRadius: '50%',
                border: selected === option.value ? '2px solid var(--gold)' : '2px solid var(--border)',
                background: selected === option.value ? 'var(--gold)' : 'transparent',
                flexShrink: 0,
                transition: 'all 0.15s ease'
              }} />
            </div>
          ))}
        </div>

        {/* Continue Button */}
        <button
          onClick={handleContinue}
          disabled={selected === null || loading}
          style={{
            width: '100%',
            padding: '16px',
            background: selected !== null ? 'var(--charcoal)' : 'var(--border)',
            color: selected !== null ? 'var(--cream)' : 'var(--light)',
            border: 'none',
            borderRadius: '2px',
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '11px',
            letterSpacing: '3px',
            textTransform: 'uppercase',
            cursor: selected !== null ? 'pointer' : 'not-allowed',
            transition: 'all 0.15s ease'
          }}
        >
          {loading ? 'Setting up...' : 'Continue'}
        </button>

        {error && (
          <div style={{
            marginTop: '12px',
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '0.5px',
            color: '#8B4A4A'
          }}>
            {error}
          </div>
        )}

      </div>
    </div>
  )
}
