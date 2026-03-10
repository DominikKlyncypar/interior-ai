export const dynamic = 'force-dynamic'

import Sidebar from '@/components/Sidebar'
import { getSupabase } from '@/lib/supabase'

export default async function Home() {
  const supabase = getSupabase()

  const { count: emailCount } = await supabase
    .from('emails')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending_review')

  const { count: leadCount } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'new')

  return (
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '48px', minHeight: '100vh' }}>
        
        {/* Header */}
        <div style={{ marginBottom: '48px' }}>
          <div style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '3px',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            Dashboard
          </div>
          <h1 style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '48px',
            fontWeight: 300,
            lineHeight: 1.1,
            color: 'var(--charcoal)'
          }}>
            Good morning,<br />
            <em style={{ fontStyle: 'italic', color: 'var(--gold)' }}>here's your briefing.</em>
          </h1>
        </div>

        {/* Stats */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '2px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
          marginBottom: '48px'
        }}>
          {[
            { label: 'Emails to Review', value: emailCount ?? 0, color: 'var(--gold)' },
            { label: 'New Leads', value: leadCount ?? 0, color: 'var(--teal)' },
            { label: 'Active Projects', value: '—', color: 'var(--charcoal)' },
            { label: 'Agents Running', value: '2', color: 'var(--charcoal)' },
          ].map((stat) => (
            <div key={stat.label} style={{
              background: 'var(--warm-white)',
              padding: '28px 24px',
            }}>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                color: 'var(--light)',
                marginBottom: '12px'
              }}>
                {stat.label}
              </div>
              <div style={{
                fontFamily: 'var(--font-cormorant)',
                fontSize: '42px',
                fontWeight: 300,
                color: stat.color,
                lineHeight: 1
              }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>

        {/* Agent Status */}
        <div style={{
          fontFamily: 'var(--font-dm-mono)',
          fontSize: '10px',
          letterSpacing: '3px',
          color: 'var(--gold)',
          textTransform: 'uppercase',
          marginBottom: '16px'
        }}>
          Agent Status
        </div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(2, 1fr)',
          gap: '2px',
          background: 'var(--border)',
          border: '1px solid var(--border)',
        }}>
          {[
            { name: 'Email Agent', status: 'Active', phase: 'Phase 1' },
            { name: 'Business Development', status: 'Coming Soon', phase: 'Phase 1' },
            { name: 'CRM Agent', status: 'Coming Soon', phase: 'Phase 2' },
            { name: 'Financial Agent', status: 'Coming Soon', phase: 'Phase 2' },
          ].map((agent) => (
            <div key={agent.name} style={{
              background: 'var(--warm-white)',
              padding: '20px 24px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <div style={{
                  fontFamily: 'var(--font-cormorant)',
                  fontSize: '18px',
                  fontWeight: 400,
                  marginBottom: '4px'
                }}>
                  {agent.name}
                </div>
                <div style={{
                  fontFamily: 'var(--font-dm-mono)',
                  fontSize: '9px',
                  color: 'var(--light)',
                  letterSpacing: '1px'
                }}>
                  {agent.phase}
                </div>
              </div>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '1px',
                padding: '4px 10px',
                borderRadius: '2px',
                background: agent.status === 'Active' ? 'var(--gold-pale)' : 'var(--cream)',
                color: agent.status === 'Active' ? 'var(--gold)' : 'var(--light)',
              }}>
                {agent.status}
              </div>
            </div>
          ))}
        </div>

      </main>
    </div>
  )
}