'use client'
import { useCallback, useEffect, useState } from 'react'
import { useAccount } from '@/context/AccountContext'
import { getSupabase } from '@/lib/supabase'
import { buildEmailPreviewDocument } from '@/lib/email-render'

interface Email {
  id: string
  subject: string
  body: string
  body_text?: string
  body_html?: string
  snippet?: string
  from_email?: string
  from_name?: string
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
  high: 'var(--wine)',
  medium: 'var(--gold)',
  low: 'var(--mid)',
}

const categoryColor: Record<string, string> = {
  new_lead: 'var(--teal)',
  existing_client: 'var(--gold)',
  vendor: 'var(--mid)',
  urgent: 'var(--wine)',
  admin: 'var(--mid)',
  spam: 'var(--light)',
}

export default function EmailQueue() {
  const [emails, setEmails] = useState<Email[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Email | null>(null)
  const [draftReply, setDraftReply] = useState('')
  const [activeAction, setActiveAction] = useState<'approved' | 'dismissed' | null>(null)
  const [actionError, setActionError] = useState('')
  const { activeAccount } = useAccount()
  const emailPreviewHtml = selected ? buildEmailPreviewDocument(selected.body_html, selected.body_text || selected.body) : null

  const fetchEmails = useCallback(async () => {
    setLoading(true)
    setActionError('')
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('emails')
      .select('*, contacts(email), email_attachments(*)')
      .eq('status', 'pending_review')
      .eq('account_email', activeAccount)
      .order('received_at', { ascending: false })

    if (error) {
      console.error(error)
    } else {
      setEmails(data || [])
      setSelected((current) => (current ? data?.find((email) => email.id === current.id) ?? data?.[0] ?? null : data?.[0] ?? null))
    }

    setLoading(false)
  }, [activeAccount])

  useEffect(() => {
    if (activeAccount) void fetchEmails()
  }, [activeAccount, fetchEmails])

  useEffect(() => {
    setDraftReply(selected?.draft_reply || '')
    setActionError('')
  }, [selected?.id, selected?.draft_reply])

  const markEmailAsRead = async (id: string) => {
    const response = await fetch('/api/emails/mark-read', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ emailId: id }),
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
      body: JSON.stringify({ attachmentId, action }),
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
    setActiveAction(status === 'approved' ? 'approved' : 'dismissed')
    setActionError('')
    const supabase = getSupabase()

    try {
      if (status === 'approved') {
        const res = await fetch('/api/emails/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ emailId: id, draftReply }),
        })

        if (!res.ok) {
          const err = await res.json().catch(() => ({ error: 'Send failed' }))
          throw new Error(err.error || 'Send failed')
        }

        try {
          await markEmailAsRead(id)
        } catch (err) {
          console.error('Mark read failed:', err)
        }
      } else {
        const { error } = await supabase.from('emails').update({ status }).eq('id', id)
        if (error) throw error

        if (status === 'dismissed') {
          try {
            await markEmailAsRead(id)
          } catch (err) {
            console.error('Mark read failed:', err)
          }
        }
      }

      setEmails((current) => {
        const nextEmails = current.filter((email) => email.id !== id)
        const nextSelected = getNextSelectedEmail(current, id)
        setSelected(nextSelected ? nextEmails.find((email) => email.id === nextSelected.id) ?? nextEmails[0] ?? null : nextEmails[0] ?? null)
        return nextEmails
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Email action failed'
      setActionError(message)
    } finally {
      setActiveAction(null)
    }
  }

  if (!activeAccount) {
    return (
      <div className="empty-state">
        <h2 className="empty-state__title">No account selected</h2>
        <p className="empty-state__copy">Add or choose an account to review email.</p>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="panel email-loading">
        <div className="email-loading__bar" />
        <div className="email-loading__bar" />
        <div className="email-loading__bar" />
      </div>
    )
  }

  if (emails.length === 0) {
    return (
      <div className="empty-state">
        <h2 className="empty-state__title">All caught up</h2>
        <p className="empty-state__copy">There are no emails pending review for this account.</p>
      </div>
    )
  }

  return (
    <div className="email-workspace">
      <div className="email-toolbar">
        <div>
          <div className="eyebrow">Email queue</div>
          <h1 className="email-toolbar__title">{emails.length} pending</h1>
        </div>
        <button type="button" className="button button--quiet" onClick={() => void fetchEmails()}>
          Refresh
        </button>
      </div>

      <div className={`queue-layout${selected ? '' : ' queue-layout--single'}`}>
      <div className="queue-list">
        {emails.map((email) => {
          const isSelected = selected?.id === email.id
          return (
            <button
              key={email.id}
              type="button"
              className={`queue-item${isSelected ? ' is-selected' : ''}`}
              onClick={() => setSelected(email)}
            >
              <div className="queue-item__header">
                <h2 className="queue-item__subject">{email.subject}</h2>
                <div
                  className="pill"
                  style={{ background: 'rgba(255,255,255,0.58)', color: categoryColor[email.category] || 'var(--mid)' }}
                >
                  {formatLabel(email.category)}
                </div>
              </div>

              <div className="queue-item__summary">{email.summary || email.snippet || 'No summary available.'}</div>

              <div className="queue-item__meta">
                <div className="queue-meta">{email.contacts?.email || email.from_email || 'Unknown sender'}</div>
                <div className="pill" style={{ background: 'rgba(255,255,255,0.58)', color: urgencyColor[email.urgency] || 'var(--mid)' }}>
                  {formatLabel(email.urgency)}
                </div>
              </div>
            </button>
          )
        })}
      </div>

      {selected && (
        <aside className="queue-detail">
          <div className="eyebrow">Selected Email</div>
          <h2 className="queue-detail__title">{selected.subject}</h2>

          <div className="inline-row">
            <div className="queue-meta">{selected.contacts?.email || selected.from_email || 'Unknown sender'}</div>
            <div className="pill" style={{ background: 'var(--gold-pale)', color: categoryColor[selected.category] || 'var(--mid)' }}>
              {formatLabel(selected.category)}
            </div>
          </div>

          <div className="detail-block">
            <div className="field-label">Original Email</div>
            <div className="detail-surface">
              {emailPreviewHtml ? (
                <iframe
                  className="email-preview-frame"
                  sandbox=""
                  srcDoc={emailPreviewHtml}
                  title={`Original email: ${selected.subject}`}
                />
              ) : (
                <div className="detail-text">{selected.body_text || selected.body}</div>
              )}
            </div>
          </div>

          {!!selected.email_attachments?.length && (
            <div className="detail-block">
              <div className="field-label">Attachments</div>
              <div className="attachment-list">
                {selected.email_attachments.map((attachment) => {
                  const disabled = attachment.status === 'skipped_too_large' || attachment.status === 'unsupported'
                  return (
                    <div key={attachment.id} className="attachment-card">
                      <div>
                        <div>{attachment.filename}</div>
                        <div className="attachment-card__meta">
                          {formatBytes(attachment.size_bytes)} | {formatLabel(attachment.status)}
                        </div>
                      </div>

                      {attachment.extracted_text && (
                        <div className="detail-text">
                          {attachment.extracted_text.slice(0, 220)}
                          {attachment.extracted_text.length > 220 ? '...' : ''}
                        </div>
                      )}

                      <div className="attachment-card__actions">
                        <button
                          type="button"
                          className="button button--dark"
                          onClick={() => openAttachment(attachment.id, 'open')}
                          disabled={disabled}
                        >
                          Open
                        </button>
                        <button
                          type="button"
                          className="button button--quiet"
                          onClick={() => openAttachment(attachment.id, 'download')}
                          disabled={disabled}
                        >
                          Download
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          <div className="detail-block">
            <div className="field-label">Draft Reply</div>
            <div className="field">
              <textarea value={draftReply} onChange={(event) => setDraftReply(event.target.value)} style={{ minHeight: '16rem' }} />
            </div>
          </div>

          {actionError && <div className="error-text">{actionError}</div>}

          <div className="action-row" style={{ marginTop: '1.5rem' }}>
            <button
              type="button"
              className="button button--dark"
              onClick={() => updateStatus(selected.id, 'approved')}
              disabled={Boolean(activeAction)}
            >
              {activeAction === 'approved' ? 'Approving...' : 'Approve'}
            </button>
            <button
              type="button"
              className="button button--quiet"
              onClick={() => updateStatus(selected.id, 'dismissed')}
              disabled={Boolean(activeAction)}
            >
              {activeAction === 'dismissed' ? 'Dismissing...' : 'Dismiss'}
            </button>
          </div>
        </aside>
      )}
    </div>
    </div>
  )
}

const getNextSelectedEmail = (emails: Email[], currentId: string) => {
  const currentIndex = emails.findIndex((email) => email.id === currentId)
  if (currentIndex === -1) return emails[0] ?? null
  return emails[currentIndex + 1] ?? emails[currentIndex - 1] ?? null
}

const formatLabel = (value: string) => value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase())

const formatBytes = (value: number) => {
  if (!value) return '0 B'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}
