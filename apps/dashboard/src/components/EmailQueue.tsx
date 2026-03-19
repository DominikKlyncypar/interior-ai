'use client'
import { useEffect, useState } from 'react'
import { getSupabase } from '@/lib/supabase'
import { useAccount } from '@/context/AccountContext'

interface Email {
  id: string
  subject: string
  body: string
  body_text?: string
  body_html?: string
  snippet?: string
  from_email?: string
  from_name?: string
  has_attachments?: boolean
  attachment_count?: number
  category: string
  urgency: string
  summary: string
  draft_reply: string
  status: string
  received_at: string
  contacts?: { email: string }
  email_attachments?: Attachment[]
}

interface Attachment {
  id: string
  filename: string
  mime_type: string
  size_bytes: number
  status: string
  extracted_text?: string
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
  const { activeAccount } = useAccount()

  useEffect(() => {
    if (activeAccount) fetchEmails()
  }, [activeAccount])

  const fetchEmails = async () => {
    setLoading(true)
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('emails')
      .select('*, contacts(email), email_attachments(*)')
      .eq('status', 'pending_review')
      .eq('account_email', activeAccount)
      .order('received_at', { ascending: false })

    if (error) console.error(error)
    else setEmails(data || [])
    setLoading(false)
  }

  const markEmailAsRead = async (id: string) => {
    const response = await fetch('/api/emails/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId: id })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Mark read failed' }))
      throw new Error(err.error || 'Mark read failed')
    }
  }

  const openAttachment = async (attachmentId: string, action: 'open' | 'download' = 'open') => {
    const response = await fetch('/api/emails/attachments/url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ attachmentId, action })
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Attachment open failed' }))
      console.error('Attachment open failed:', err)
      return
    }

    const body = await response.json()

    if (action === 'download') {
      const link = document.createElement('a')
      link.href = body.url
      link.rel = 'noopener noreferrer'
      document.body.appendChild(link)
      link.click()
      link.remove()
      return
    }

    window.open(body.url, '_blank', 'noopener,noreferrer')
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
    try {
      await markEmailAsRead(id)
    } catch (err) {
      console.error('Mark read failed:', err)
    }
  } else {
      await supabase.from('emails').update({ status }).eq('id', id)

      if (status === 'dismissed') {
          try {
            await markEmailAsRead(id)
          } catch (err) {
            console.error('Mark read failed:', err)
          }
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
              {selected.body_text || selected.body}
            </div>
          </div>

          {!!selected.email_attachments?.length && (
            <div style={{ marginBottom: '24px' }}>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '2px',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                Attachments
              </div>
              <div style={{
                display: 'grid',
                gap: '8px'
              }}>
                {selected.email_attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '12px 14px',
                      background: 'var(--cream)',
                      border: '1px solid var(--border)',
                      borderRadius: '2px'
                    }}
                  >
                    <div>
                      <div style={{
                        fontSize: '13px',
                        color: 'var(--slate)',
                        marginBottom: '2px'
                      }}>
                        {attachment.filename}
                      </div>
                      <div style={{
                        fontFamily: 'var(--font-dm-mono)',
                        fontSize: '9px',
                        color: 'var(--mid)',
                        letterSpacing: '1px',
                        textTransform: 'uppercase'
                      }}>
                        {attachment.mime_type} | {formatBytes(attachment.size_bytes)} | {attachment.status}
                      </div>
                      {attachment.extracted_text && (
                        <div style={{
                          marginTop: '8px',
                          fontSize: '12px',
                          lineHeight: 1.6,
                          color: 'var(--mid)',
                          maxWidth: '480px'
                        }}>
                          {attachment.extracted_text.slice(0, 220)}
                          {attachment.extracted_text.length > 220 ? '...' : ''}
                        </div>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => openAttachment(attachment.id, 'open')}
                        disabled={attachment.status === 'skipped_too_large' || attachment.status === 'unsupported'}
                        style={{
                          padding: '8px 12px',
                          background: attachment.status === 'skipped_too_large' || attachment.status === 'unsupported' ? 'var(--border)' : 'var(--charcoal)',
                          color: attachment.status === 'skipped_too_large' || attachment.status === 'unsupported' ? 'var(--light)' : 'var(--cream)',
                          border: 'none',
                          borderRadius: '2px',
                          fontFamily: 'var(--font-dm-mono)',
                          fontSize: '9px',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          cursor: attachment.status === 'skipped_too_large' || attachment.status === 'unsupported' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Open
                      </button>
                      <button
                        onClick={() => openAttachment(attachment.id, 'download')}
                        disabled={attachment.status === 'skipped_too_large' || attachment.status === 'unsupported'}
                        style={{
                          padding: '8px 12px',
                          background: 'transparent',
                          color: attachment.status === 'skipped_too_large' || attachment.status === 'unsupported' ? 'var(--light)' : 'var(--charcoal)',
                          border: '1px solid var(--border)',
                          borderRadius: '2px',
                          fontFamily: 'var(--font-dm-mono)',
                          fontSize: '9px',
                          letterSpacing: '1px',
                          textTransform: 'uppercase',
                          cursor: attachment.status === 'skipped_too_large' || attachment.status === 'unsupported' ? 'not-allowed' : 'pointer'
                        }}
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

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

const formatBytes = (value: number) => {
  if (!value) return '0 B'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}
