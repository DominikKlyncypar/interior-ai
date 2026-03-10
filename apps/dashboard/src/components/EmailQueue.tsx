'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'

interface Email {
  id: string
  subject: string
  body: string
  category: string
  urgency: string
  summary: string
  draft_reply: string
  status: string
  received_at: string
  contacts?: { email: string }
}

const urgencyColor: Record<string, string> = {
  high: '#8B4A4A',
  medium: 'var(--gold)',
  low: 'var(--mid)'
}

const categoryColor: Record<string, string> = {
  new_lead: 'var(--teal)',
  existing_client: 'var(--gold)',
  vendor: 'var(--mid)',
  urgent: '#8B4A4A',
  admin: 'var(--mid)',
  spam: 'var(--light)'
}

export default function EmailQueue() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Email | null>(null)

  useEffect(() => {
    fetchEmails()
  }, [])

  const fetchEmails = async () => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('emails')
      .select('*, contacts(email)')
      .eq('status', 'pending_review')
      .order('received_at', { ascending: false })

    if (error) console.error(error)
    else setEmails(data || [])
    setLoading(false)
  }

const updateStatus = async (id: string, status: string) => {
  const supabase = getSupabase()

  if (status === 'approved') {
      // Get the current draft reply from textarea
      const textarea = document.querySelector('textarea') as HTMLTextAreaElement
      const draftReply = textarea?.value || selected?.draft_reply || ''

      const res = await fetch('/api/emails/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: id, draftReply })
      })

      if (!res.ok) {
          const err = await res.json()
          console.error('Send failed:', err)
          return
        }
    await fetch('/api/emails/mark-read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailId: id })
    })
  } else {
      await supabase.from('emails').update({ status }).eq('id', id)

      if (status === 'dismissed') {
          await fetch('/api/emails/mark-read', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ emailId: id })
          })
      }
  }

  setEmails(emails.filter(e => e.id !== id))
  if (selected?.id === id) setSelected(null)
}

  if (loading) return (
    <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--mid)' }}>
      Loading emails...
    </div>
  )

  if (emails.length === 0) return (
    <div style={{
      background: 'var(--warm-white)',
      border: '1px solid var(--border)',
      padding: '48px',
      textAlign: 'center'
    }}>
      <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '28px', marginBottom: '8px' }}>
        All caught up
      </div>
      <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--mid)' }}>
        No emails pending review
      </div>
    </div>
  )

  return (
    <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 1fr' : '1fr', gap: '2px' }}>
      
      {/* Email List */}
      <div style={{ background: 'var(--border)', border: '1px solid var(--border)' }}>
        {emails.map((email) => (
          <div
            key={email.id}
            onClick={() => setSelected(email)}
            style={{
              background: selected?.id === email.id ? 'white' : 'var(--warm-white)',
              padding: '20px 24px',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              borderLeft: selected?.id === email.id ? '3px solid var(--gold)' : '3px solid transparent',
              transition: 'all 0.15s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
              <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '18px', fontWeight: 400, flex: 1, paddingRight: '12px' }}>
                {email.subject}
              </div>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '1px',
                padding: '3px 8px',
                borderRadius: '2px',
                background: 'var(--cream)',
                color: categoryColor[email.category] || 'var(--mid)',
                whiteSpace: 'nowrap',
                textTransform: 'uppercase'
              }}>
                {email.category}
              </div>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--mid)', marginBottom: '8px' }}>
              {email.summary}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--light)' }}>
                {email.contacts?.email || 'Unknown'}
              </div>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                color: urgencyColor[email.urgency] || 'var(--mid)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}>
                {email.urgency}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Email Detail */}
      {selected && (
        <div style={{
          background: 'var(--warm-white)',
          border: '1px solid var(--border)',
          padding: '32px',
          position: 'sticky',
          top: '24px',
          alignSelf: 'start'
        }}>
          <div style={{ fontFamily: 'var(--font-cormorant)', fontSize: '24px', fontWeight: 400, marginBottom: '24px' }}>
            {selected.subject}
          </div>

          {/* Original */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '9px',
              letterSpacing: '2px',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              Original Email
            </div>
            <div style={{
              fontSize: '13px',
              color: 'var(--slate)',
              lineHeight: 1.75,
              padding: '16px',
              background: 'var(--cream)',
              borderRadius: '2px'
            }}>
              {selected.body}
            </div>
          </div>

          {/* Draft Reply */}
          <div style={{ marginBottom: '24px' }}>
            <div style={{
              fontFamily: 'var(--font-dm-mono)',
              fontSize: '9px',
              letterSpacing: '2px',
              color: 'var(--gold)',
              textTransform: 'uppercase',
              marginBottom: '8px'
            }}>
              Draft Reply
            </div>
            <textarea
              defaultValue={selected.draft_reply}
              style={{
                width: '100%',
                minHeight: '160px',
                padding: '16px',
                background: 'var(--cream)',
                border: '1px solid var(--border)',
                borderRadius: '2px',
                fontSize: '13px',
                color: 'var(--slate)',
                lineHeight: 1.75,
                fontFamily: 'var(--font-manrope)',
                resize: 'vertical',
                outline: 'none'
              }}
            />
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => updateStatus(selected.id, 'approved')}
              style={{
                flex: 1,
                padding: '12px',
                background: 'var(--charcoal)',
                color: 'var(--cream)',
                border: 'none',
                borderRadius: '2px',
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              Approve
            </button>
            <button
              onClick={() => updateStatus(selected.id, 'dismissed')}
              style={{
                flex: 1,
                padding: '12px',
                background: 'transparent',
                color: 'var(--mid)',
                border: '1px solid var(--border)',
                borderRadius: '2px',
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '10px',
                letterSpacing: '2px',
                textTransform: 'uppercase',
                cursor: 'pointer'
              }}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </div>
  )
}