'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAccount } from '@/context/AccountContext'
import { getSupabase } from '@/lib/supabase'

export default function Home() {
  const { activeAccount } = useAccount()
  const [emailCount, setEmailCount] = useState<number>(0)
  const [leadCount, setLeadCount] = useState<number>(0)

  useEffect(() => {
    if (!activeAccount) return

    const fetchCounts = async () => {
      const supabase = getSupabase()

      const { count: emails } = await supabase
        .from('emails')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending_review')
        .eq('account_email', activeAccount)

      const { count: leads } = await supabase
        .from('leads')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'new')
        .eq('account_email', activeAccount)

      setEmailCount(emails ?? 0)
      setLeadCount(leads ?? 0)
    }

    void fetchCounts()
  }, [activeAccount])

  const metrics = [
    {
      label: 'Emails to Review',
      value: emailCount,
      note: 'Inbox items waiting for approval',
      accent: 'var(--gold)',
    },
    {
      label: 'New Leads',
      value: leadCount,
      note: 'Fresh opportunities surfaced by the system',
      accent: 'var(--teal)',
    },
    {
      label: 'Active Projects',
      value: '--',
      note: 'Project operations not wired in yet',
      accent: 'var(--charcoal)',
    },
    {
      label: 'Agents Running',
      value: '2',
      note: 'Email agent live, broader stack staged',
      accent: 'var(--wine)',
    },
  ]

  const agents = [
    { name: 'Email Agent', status: 'Active', phase: 'Phase 1', tone: 'var(--gold-pale)', text: 'var(--gold)' },
    { name: 'Business Development', status: 'Coming Soon', phase: 'Phase 1', tone: 'rgba(54, 49, 44, 0.08)', text: 'var(--mid)' },
    { name: 'CRM Agent', status: 'Coming Soon', phase: 'Phase 2', tone: 'rgba(54, 49, 44, 0.08)', text: 'var(--mid)' },
    { name: 'Financial Agent', status: 'Coming Soon', phase: 'Phase 2', tone: 'rgba(54, 49, 44, 0.08)', text: 'var(--mid)' },
  ]

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="page-wrap">
          <section className="page-hero">
            <div className="eyebrow">Dashboard</div>
            <h1 className="page-title">
              Daily studio
              <br />
              <em>briefing</em>
            </h1>
          </section>

          <section className="metrics-grid">
            {metrics.map((stat) => (
              <article key={stat.label} className="metric-card" style={{ ['--accent' as string]: stat.accent }}>
                <div className="metric-card__label">{stat.label}</div>
                <div className="metric-card__value">{stat.value}</div>
                <div className="stat-note">{stat.note}</div>
              </article>
            ))}
          </section>

          <section className="panel">
            <div className="panel-header">
              <div>
                <div className="eyebrow">Agent Status</div>
                <h2 className="section-title">
                  What the system is
                  <br />
                  <em>actually running</em>
                </h2>
              </div>
            </div>

            <div className="agent-grid">
              {agents.map((agent) => (
                <article key={agent.name} className="agent-card">
                  <div className="inline-row">
                    <div>
                      <h3 className="agent-card__title">{agent.name}</h3>
                      <div className="kicker" style={{ color: 'var(--light)' }}>
                        {agent.phase}
                      </div>
                    </div>
                    <div className="status-badge" style={{ background: agent.tone, color: agent.text }}>
                      {agent.status}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}
