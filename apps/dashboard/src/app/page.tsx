'use client'
import { signIn, useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export default function HomePage() {
  const { data: session } = useSession()
  const router = useRouter()

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--charcoal)',
      color: 'var(--cream)',
      fontFamily: 'var(--font-manrope)',
      overflowX: 'hidden'
    }}>

      {/* Nav */}
      <nav style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '32px 60px',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          letterSpacing: '3px',
          color: 'var(--gold)',
          textTransform: 'uppercase'
        }}>
          Interior AI
        </div>

        {session && (
          <div
            onClick={() => router.push('/dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '8px 16px',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '2px',
              cursor: 'pointer',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
          >
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: 'var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--charcoal)',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '11px',
              fontWeight: 600,
              flexShrink: 0
            }}>
              {session.user?.name?.charAt(0).toUpperCase() || '?'}
            </div>
            <div>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                letterSpacing: '1px',
                color: 'var(--cream)',
              }}>
                {session.user?.name?.split(' ')[0]}
              </div>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                color: 'var(--mid)',
                letterSpacing: '1px'
              }}>
                Go to dashboard →
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* Hero */}
      <div style={{
        padding: '120px 60px 100px',
        maxWidth: '1100px',
        margin: '0 auto',
        position: 'relative'
      }}>
        {/* Decorative circles */}
        <div style={{
          position: 'absolute',
          top: '60px',
          right: '0',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          border: '1px solid rgba(184,147,63,0.1)',
          pointerEvents: 'none'
        }} />
        <div style={{
          position: 'absolute',
          top: '100px',
          right: '40px',
          width: '340px',
          height: '340px',
          borderRadius: '50%',
          border: '1px solid rgba(184,147,63,0.15)',
          pointerEvents: 'none'
        }} />

        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          letterSpacing: '3px',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: '24px'
        }}>
          AI Operating System — Interior Design
        </div>

        <h1 style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: 'clamp(52px, 7vw, 88px)',
          fontWeight: 300,
          lineHeight: 1.05,
          maxWidth: '760px',
          marginBottom: '32px'
        }}>
          Your firm,<br />
          running on<br />
          <em style={{ fontStyle: 'italic', color: 'var(--gold-light)' }}>intelligence.</em>
        </h1>

        <p style={{
          fontSize: '16px',
          color: 'var(--light)',
          maxWidth: '480px',
          lineHeight: 1.8,
          marginBottom: '48px'
        }}>
          A fleet of AI agents that finds leads, manages your inbox,
          tracks finances, and keeps your firm visible —
          so your team can focus on design.
        </p>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          <button
            onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
            style={{
              padding: '16px 40px',
              background: 'var(--gold)',
              color: 'var(--charcoal)',
              border: 'none',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-light)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold)')}
          >
            Sign in with Gmail
          </button>
          <button
            onClick={() => signIn('azure-ad', { callbackUrl: '/onboarding' })}
            style={{
              padding: '16px 40px',
              background: 'transparent',
              color: 'var(--cream)',
              border: '1px solid rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
          >
            Sign in with Outlook
          </button>
        </div>

        <div style={{
          marginTop: '16px',
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          color: 'var(--mid)',
          letterSpacing: '1px'
        }}>
          Free to start · No credit card required
        </div>
      </div>

      {/* Stats strip */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1px',
        background: 'rgba(255,255,255,0.06)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        margin: '0 0 100px'
      }}>
        {[
          { value: '8', label: 'AI Agents' },
          { value: '24/7', label: 'Always Running' },
          { value: '10min', label: 'Check Interval' },
        ].map((stat) => (
          <div key={stat.label} style={{
            padding: '40px 48px',
            background: 'var(--charcoal)'
          }}>
            <div style={{
              fontFamily: 'var(--font-cormorant)',
              fontSize: '48px',
              fontWeight: 300,
              color: 'var(--gold-light)',
              lineHeight: 1,
              marginBottom: '8px'
            }}>
              {stat.value}
            </div>
            <div style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '10px',
              color: 'var(--mid)',
              letterSpacing: '2px',
              textTransform: 'uppercase'
            }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* Features */}
      <div style={{ padding: '0 60px 100px', maxWidth: '1100px', margin: '0 auto 100px' }}>
        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          letterSpacing: '3px',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          What it does
        </div>
        <h2 style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: 'clamp(36px, 4vw, 52px)',
          fontWeight: 300,
          marginBottom: '64px',
          paddingBottom: '24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}>
          Eight agents. One operating system.
        </h2>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2px',
          background: 'rgba(255,255,255,0.06)'
        }}>
          {[
            {
              icon: '🎯',
              title: 'Business Development',
              desc: 'Monitors permit filings, LinkedIn signals, and RFPs 24/7. Drafts personalized outreach for every new lead it finds.'
            },
            {
              icon: '✉️',
              title: 'Email & Communications',
              desc: "Reads, categorizes, and drafts replies in your firm's voice. Your inbox handled before you sit down in the morning."
            },
            {
              icon: '🤝',
              title: 'Relationship & CRM',
              desc: 'Tracks every architect, developer, and property manager in your orbit. Surfaces the right moment to reach out.'
            },
            {
              icon: '💰',
              title: 'Financial Intelligence',
              desc: 'Tracks invoices, monitors project profitability, and delivers a weekly P&L to your inbox every Monday.'
            },
          ].map((feature) => (
            <div key={feature.title} style={{
              background: 'var(--charcoal)',
              padding: '40px 36px',
              borderLeft: '1px solid rgba(255,255,255,0.04)'
            }}>
              <div style={{ fontSize: '28px', marginBottom: '16px' }}>{feature.icon}</div>
              <h3 style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '24px',
                fontWeight: 400,
                marginBottom: '12px',
                color: 'var(--cream)'
              }}>
                {feature.title}
              </h3>
              <p style={{
                fontSize: '13px',
                color: 'var(--mid)',
                lineHeight: 1.75
              }}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* How it works */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        padding: '100px 60px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '3px',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginBottom: '16px'
          }}>
            How it works
          </div>
          <h2 style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: 'clamp(36px, 4vw, 52px)',
            fontWeight: 300,
            marginBottom: '64px'
          }}>
            Up and running in minutes.
          </h2>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '2px',
            background: 'rgba(255,255,255,0.06)'
          }}>
            {[
              {
                step: '01',
                title: 'Connect your email',
                desc: 'Sign in with Gmail or Outlook and grant access. Takes 30 seconds. Your credentials are encrypted and never shared.'
              },
              {
                step: '02',
                title: 'Choose your starting point',
                desc: 'Tell the system how far back to look. Today, last week, last month — you decide what gets processed.'
              },
              {
                step: '03',
                title: 'Agents go to work',
                desc: 'Your email agent starts immediately. Every 10 minutes it checks for new emails, categorizes them, and drafts replies for your review.'
              },
            ].map((item) => (
              <div key={item.step} style={{
                background: 'var(--charcoal)',
                padding: '40px 36px'
              }}>
                <div style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '72px',
                  fontWeight: 300,
                  color: 'rgba(255,255,255,0.06)',
                  lineHeight: 1,
                  marginBottom: '16px'
                }}>
                  {item.step}
                </div>
                <h3 style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '22px',
                  fontWeight: 400,
                  marginBottom: '12px'
                }}>
                  {item.title}
                </h3>
                <p style={{
                  fontSize: '13px',
                  color: 'var(--mid)',
                  lineHeight: 1.75
                }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom CTA */}
      <div style={{
        padding: '100px 60px',
        textAlign: 'center',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <h2 style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: 'clamp(42px, 5vw, 64px)',
          fontWeight: 300,
          lineHeight: 1.1,
          marginBottom: '32px'
        }}>
          Ready to run your firm on <em style={{ color: 'var(--gold-light)', fontStyle: 'italic' }}>intelligence?</em>
        </h2>
        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <button
            onClick={() => signIn('google', { callbackUrl: '/onboarding' })}
            style={{
              padding: '16px 48px',
              background: 'var(--gold)',
              color: 'var(--charcoal)',
              border: 'none',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--gold-light)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--gold)')}
          >
            Get Started with Gmail
          </button>
          <button
            onClick={() => signIn('azure-ad', { callbackUrl: '/onboarding' })}
            style={{
              padding: '16px 48px',
              background: 'transparent',
              color: 'var(--cream)',
              border: '1px solid rgba(255,255,255,0.3)',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '11px',
              letterSpacing: '3px',
              textTransform: 'uppercase',
              cursor: 'pointer',
              borderRadius: '2px',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--gold)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.3)')}
          >
            Get Started with Outlook
          </button>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(255,255,255,0.06)',
        padding: '32px 60px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          color: 'var(--mid)',
          letterSpacing: '2px'
        }}>
          INTERIOR AI
        </div>
        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          color: 'var(--mid)',
          letterSpacing: '1px'
        }}>
          © 2026
        </div>
      </div>

    </div>
  )
}