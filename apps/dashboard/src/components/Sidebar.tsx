'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { label: 'Overview', href: '/dashboard', icon: '◈' },
  { label: 'Emails', href: '/emails', icon: '✉' },
  { label: 'Leads', href: '/leads', icon: '◎' },
  { label: 'Settings', href: '/settings', icon: '⚙' },
]

export default function Sidebar() {
  const pathname = usePathname()

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
      {/* Logo */}
      <div style={{ padding: '0 28px 40px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
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

      {/* Nav */}
      <nav style={{ padding: '24px 0', flex: 1 }}>
        {nav.map((item) => {
          const active = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '12px 28px',
                color: active ? 'var(--cream)' : 'var(--mid)',
                textDecoration: 'none',
                fontSize: '13px',
                fontFamily: 'var(--font-manrope)',
                fontWeight: active ? 500 : 300,
                borderLeft: active ? '2px solid var(--gold)' : '2px solid transparent',
                background: active ? 'rgba(255,255,255,0.04)' : 'transparent',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ fontSize: '16px' }}>{item.icon}</span>
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{
        padding: '24px 28px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        fontFamily: 'var(--font-dm-mono)',
        fontSize: '10px',
        color: 'var(--mid)',
        letterSpacing: '1px'
      }}>
        v0.1.0 — DEV
      </div>
    </aside>
  )
}