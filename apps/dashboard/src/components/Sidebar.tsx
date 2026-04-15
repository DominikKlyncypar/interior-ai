'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'
import { useAccount } from '@/context/AccountContext'

const nav = [
  { label: 'Overview', href: '/dashboard' },
  { label: 'Emails', href: '/emails' },
  { label: 'Leads', href: '/leads' },
  { label: 'Settings', href: '/settings' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const { accounts, activeAccount, setActiveAccount } = useAccount()
  const [showAccountMenu, setShowAccountMenu] = useState(false)

  const active = accounts.find((account) => account.user_email === activeAccount)

  return (
    <aside className="app-sidebar">
      <div className="app-sidebar__panel">
        <div
          className="app-sidebar__brand"
          onClick={() => router.push('/')}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              router.push('/')
            }
          }}
        >
          <div className="eyebrow">Interior AI</div>
          <h2 className="app-sidebar__title">
            Studio
            <br />
            Operating Desk
          </h2>
        </div>

        {accounts.length > 0 && (
          <div className="app-sidebar__account">
            <button
              type="button"
              className="account-chip"
              onClick={() => setShowAccountMenu((open) => !open)}
            >
              <div
                className="account-chip__avatar"
                style={{ background: active?.provider === 'outlook' ? '#0078d4' : 'var(--gold)' }}
              >
                {active?.user_email?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="account-chip__meta">
                <div className="account-chip__name">{active?.user_email?.split('@')[0] || 'No account'}</div>
                <div className="account-chip__provider">{active?.provider || 'provider'}</div>
              </div>
              <div className="account-chip__provider">{showAccountMenu ? 'Hide' : 'Switch'}</div>
            </button>

            {showAccountMenu && (
              <div className="account-menu">
                {accounts.map((account) => {
                  const isActive = activeAccount === account.user_email
                  return (
                    <button
                      key={account.id}
                      type="button"
                      className={`account-menu__item${isActive ? ' is-active' : ''}`}
                      onClick={() => {
                        setActiveAccount(account.user_email)
                        setShowAccountMenu(false)
                      }}
                    >
                      <div
                        className="account-chip__avatar"
                        style={{ background: account.provider === 'outlook' ? '#0078d4' : 'var(--gold)' }}
                      >
                        {account.user_email.charAt(0).toUpperCase()}
                      </div>
                      <div className="account-chip__meta">
                        <div className="account-chip__name">{account.user_email.split('@')[0]}</div>
                        <div className="account-chip__provider">{account.provider}</div>
                      </div>
                    </button>
                  )
                })}
                <button
                  type="button"
                  className="account-menu__item"
                  onClick={() => {
                    setShowAccountMenu(false)
                    router.push('/')
                  }}
                >
                  <div className="account-chip__meta">
                    <div className="account-chip__name">Add account</div>
                    <div className="account-chip__provider">Return to sign-in</div>
                  </div>
                </button>
              </div>
            )}
          </div>
        )}

        <nav className="sidebar-nav">
          {nav.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`sidebar-nav__link${isActive ? ' is-active' : ''}`}
              >
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <span>v0.1.0 dev</span>
          <button
            type="button"
            className="sidebar-footer__action"
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Sign out
          </button>
        </div>
      </div>
    </aside>
  )
}
