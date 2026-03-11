'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { useAccount } from '@/context/AccountContext'

const nav = [
  { label: 'Overview', href: '/dashboard', icon: '◈' },
  { label: 'Emails', href: '/emails', icon: '✉' },
  { label: 'Leads', href: '/leads', icon: '◎' },
  { label: 'Settings', href: '/settings', icon: '⚙' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { accounts, activeAccount, setActiveAccount } = useAccount()
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  const active = accounts.find(a => a.user_email === activeAccount)

  return (
    <aside style={{
      width: '220px',
      minHeight: '100vh',
      background: 'var(--charcoal)',
      display: 'flex',
      flexDirection: 'column',
      padding: '40px 0',
      position: 'fixed',
      left: 0,
      top: 0,
    }}>
      {/* Logo — click to go home */}
      <div
        onClick={() => router.push('/')}
        style={{
          padding: '0 28px 40px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          cursor: 'pointer'
        }}
      >
        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          letterSpacing: '3px',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: '6px'
        }}>
          Interior AI
        </div>
        <div style={{
          fontFamily: 'var(--font-cormorant)',
          fontSize: '22px',
          fontWeight: 300,
          color: 'var(--cream)',
          lineHeight: 1.2
        }}>
          Command<br />Center
        </div>
      </div>

      {/* Account Switcher */}
      {accounts.length > 0 && (
        <div style={{
          padding: '16px 28px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          position: 'relative'
        }}>
          <div
            onClick={() => setShowAccountMenu(!showAccountMenu)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
              padding: '8px 10px',
              borderRadius: '2px',
              border: '1px solid rgba(255,255,255,0.08)',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.2)')}
            onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)')}
          >
            <div style={{
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              background: active?.provider === 'outlook' ? '#0078d4' : 'var(--gold)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '10px',
              fontWeight: 600,
              flexShrink: 0
            }}>
              {active?.user_email?.charAt(0).toUpperCase() || '?'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                color: 'var(--cream)',
                letterSpacing: '1px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {active?.user_email?.split('@')[0]}
              </div>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '8px',
                color: 'var(--mid)',
                letterSpacing: '1px',
                textTransform: 'uppercase'
              }}>
                {active?.provider}
              </div>
            </div>
            <div style={{ color: 'var(--mid)', fontSize: '10px' }}>
              {showAccountMenu ? '▲' : '▼'}
            </div>
          </div>

          {/* Dropdown */}
          {showAccountMenu && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: '28px',
              right: '28px',
              background: '#1a1a1a',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '2px',
              zIndex: 100,
              overflow: 'hidden'
            }}>
              {accounts.map(account => (
                <div
                  key={account.id}
                  onClick={() => {
                    setActiveAccount(account.user_email)
                    setShowAccountMenu(false)
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 12px',
                    cursor: 'pointer',
                    background: activeAccount === account.user_email ? 'rgba(255,255,255,0.06)' : 'transparent',
                    borderLeft: activeAccount === account.user_email ? '2px solid var(--gold)' : '2px solid transparent',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = activeAccount === account.user_email ? 'rgba(255,255,255,0.06)' : 'transparent')}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    background: account.provider === 'outlook' ? '#0078d4' : 'var(--gold)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontSize: '9px',
                    fontWeight: 600,
                    flexShrink: 0
                  }}>
                    {account.user_email.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '9px',
                      color: 'var(--cream)',
                      letterSpacing: '1px'
                    }}>
                      {account.user_email.split('@')[0]}
                    </div>
                    <div style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '8px',
                      color: 'var(--mid)',
                      textTransform: 'uppercase'
                    }}>
                      {account.provider}
                    </div>
                  </div>
                </div>
              ))}
              <div
                onClick={() => {
                  setShowAccountMenu(false)
                  router.push('/')
                }}
                style={{
                  padding: '10px 12px',
                  borderTop: '1px solid rgba(255,255,255,0.06)',
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '9px',
                  color: 'var(--gold)',
                  letterSpacing: '1px',
                  cursor: 'pointer',
                  textTransform: 'uppercase'
                }}
              >
                + Add account
              </div>
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav style={{ padding: '24px 0', flex: 1 }}>
        {nav.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 28px',
                color: isActive ? 'var(--cream)' : 'var(--mid)',
                textDecoration: 'none',
                fontSize: '13px',
                fontFamily: 'var(--font-manrope)',
                fontWeight: isActive ? 500 : 300,
                borderLeft: isActive ? '2px solid var(--gold)' : '2px solid transparent',
                background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer — sign out */}
      <div style={{
        padding: '24px 28px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}>
        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          color: 'var(--mid)',
          letterSpacing: '1px'
        }}>
          v0.1.0 — DEV
        </div>
        <div
          onClick={() => signOut({ callbackUrl: '/' })}
          style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            color: 'var(--mid)',
            letterSpacing: '1px',
            cursor: 'pointer',
            textTransform: 'uppercase',
            transition: 'color 0.15s ease'
          }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--cream)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--mid)')}
        >
          Sign out →
        </div>
      </div>
    </aside>
  )
}
