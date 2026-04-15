'use client'
import { useEffect, useState } from 'react'
import Sidebar from '@/components/Sidebar'
import { useAccount } from '@/context/AccountContext'

type Branding = {
  user_email: string
  provider: string
  email_signature_html?: string | null
  email_signature_text?: string | null
  email_voice_guidelines?: string | null
  logo_url?: string | null
  signature_source?: string | null
}

type Preview = {
  text: string
  html: string
  browserPreviewHtml: string
  diagnostics: {
    provider: string
    hasLogoUrl: boolean
    signatureUsesLogoPlaceholder: boolean
    signatureUsesLiteralLogoUrl: boolean
    detectedSignatureImageSource: string | null
    willEmbedInlineImage: boolean
    inlineAttachment: {
      filename: string
      contentType: string
      contentId: string
      sizeBytes: number
    } | null
  }
}

export default function SettingsPage() {
  const { activeAccount } = useAccount()
  const [branding, setBranding] = useState<Branding | null>(null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [previewDraft, setPreviewDraft] = useState(
    'Thanks for the update.\n\nWe can make that adjustment and send revised drawings tomorrow.'
  )
  const [preview, setPreview] = useState<Preview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)

  async function loadBranding(accountEmail: string) {
    setLoading(true)
    setMessage(null)

    const response = await fetch(`/api/settings/branding?accountEmail=${encodeURIComponent(accountEmail)}`)
    const body = await response.json().catch(() => null)

    if (!response.ok) {
      setMessage(body?.error || 'Failed to load branding settings')
      setLoading(false)
      return
    }

    setBranding(body)
    setLoading(false)
  }

  useEffect(() => {
    if (!activeAccount) return
    queueMicrotask(() => {
      void loadBranding(activeAccount)
    })
  }, [activeAccount])

  const saveBranding = async () => {
    if (!branding) return
    setSaving(true)
    setMessage(null)

    const response = await fetch('/api/settings/branding', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(branding),
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
      setMessage(body?.error || 'Failed to save branding settings')
      setSaving(false)
      return
    }

    setMessage('Branding settings saved')
    setSaving(false)
  }

  const uploadLogo = async (file: File) => {
    if (!branding) return

    const formData = new FormData()
    formData.append('accountEmail', branding.user_email)
    formData.append('file', file)

    const response = await fetch('/api/settings/branding/logo', {
      method: 'POST',
      body: formData,
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
      setMessage(body?.error || 'Failed to upload logo')
      return
    }

    setBranding({ ...branding, logo_url: body.url })
    setMessage('Logo uploaded')
  }

  const importGmailSignature = async () => {
    if (!branding) return

    const response = await fetch('/api/settings/branding/import-gmail-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountEmail: branding.user_email }),
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
      setMessage(body?.error || 'Failed to import Gmail signature')
      return
    }

    setBranding({
      ...branding,
      email_signature_html: body.email_signature_html,
      email_signature_text: body.email_signature_text,
      signature_source: body.signature_source,
    })
    setMessage('Gmail signature imported')
  }

  const loadPreview = async () => {
    if (!branding) return

    setPreviewLoading(true)
    setMessage(null)

    const response = await fetch('/api/settings/branding/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountEmail: branding.user_email,
        draftReply: previewDraft,
      }),
    })

    const body = await response.json().catch(() => null)

    if (!response.ok) {
      setMessage(body?.error || 'Failed to build preview')
      setPreviewLoading(false)
      return
    }

    setPreview(body)
    setPreviewLoading(false)
  }

  return (
    <div className="app-shell">
      <Sidebar />
      <main className="app-main">
        <div className="page-wrap page-grid">
          <section className="page-hero">
            <div className="eyebrow">Settings</div>
            <h1 className="page-title">
              Email branding
              <br />
              <em>with better structure</em>
            </h1>
          </section>

          {loading || !branding ? (
            <div className="panel">Loading settings...</div>
          ) : (
            <div className="stack-lg">
              <section className="panel">
                <div className="panel-header">
                  <div>
                    <div className="eyebrow">Account</div>
                    <h2 className="section-title">Current identity</h2>
                  </div>
                </div>
                <div className="info-strip">
                  <div className="stack-sm">
                    <div>{branding.user_email}</div>
                    <div className="queue-meta">
                      Provider: {branding.provider} | Signature source: {branding.signature_source || 'manual'}
                    </div>
                  </div>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <div className="eyebrow">Signature</div>
                    <h2 className="section-title">Reply footer system</h2>
                  </div>
                  {branding.provider === 'gmail' && (
                    <button type="button" className="button button--quiet" onClick={importGmailSignature}>
                      Import Gmail Signature
                    </button>
                  )}
                </div>

                <div className="field-stack">
                  <label className="field">
                    <span className="field-label">Signature HTML</span>
                    <textarea
                      value={branding.email_signature_html || ''}
                      onChange={(event) => setBranding({ ...branding, email_signature_html: event.target.value })}
                      style={{ minHeight: '12rem' }}
                    />
                    <span className="field-hint">
                      Use regular HTML. If you uploaded a logo, reference it with {'{{logo_url}}'} so sends can embed it inline.
                    </span>
                  </label>

                  <label className="field">
                    <span className="field-label">Signature Text</span>
                    <textarea
                      value={branding.email_signature_text || ''}
                      onChange={(event) => setBranding({ ...branding, email_signature_text: event.target.value })}
                      style={{ minHeight: '8rem' }}
                    />
                  </label>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <div className="eyebrow">Logo</div>
                    <h2 className="section-title">Brand asset</h2>
                  </div>
                </div>

                <div className="stack-md">
                  {branding.logo_url && (
                    <div className="info-strip">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={branding.logo_url}
                        alt="Logo"
                        style={{ maxHeight: '64px', maxWidth: '240px', objectFit: 'contain' }}
                      />
                    </div>
                  )}

                  <div className="field">
                    <span className="field-label">Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0]
                        if (file) void uploadLogo(file)
                      }}
                    />
                  </div>

                  <label className="field">
                    <span className="field-label">Logo URL</span>
                    <input
                      value={branding.logo_url || ''}
                      onChange={(event) => setBranding({ ...branding, logo_url: event.target.value })}
                    />
                  </label>
                </div>
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <div className="eyebrow">Preview</div>
                    <h2 className="section-title">Send output</h2>
                  </div>
                  <button type="button" className="button button--quiet" onClick={loadPreview} disabled={previewLoading}>
                    {previewLoading ? 'Building Preview' : 'Build Preview'}
                  </button>
                </div>

                <label className="field">
                  <span className="field-label">Sample Reply</span>
                  <textarea value={previewDraft} onChange={(event) => setPreviewDraft(event.target.value)} style={{ minHeight: '8rem' }} />
                </label>

                {preview && (
                  <div className="preview-grid" style={{ marginTop: '1rem' }}>
                    <article className="preview-card">
                      <h3 className="preview-card__title">Diagnostics</h3>
                      <div className="diagnostic-list">
                        <div>Provider: {preview.diagnostics.provider}</div>
                        <div>Logo uploaded: {preview.diagnostics.hasLogoUrl ? 'yes' : 'no'}</div>
                        <div>Uses {'{{logo_url}}'}: {preview.diagnostics.signatureUsesLogoPlaceholder ? 'yes' : 'no'}</div>
                        <div>Uses saved logo URL: {preview.diagnostics.signatureUsesLiteralLogoUrl ? 'yes' : 'no'}</div>
                        <div>Detected signature image source: {preview.diagnostics.detectedSignatureImageSource || 'none'}</div>
                        <div>Will embed inline image: {preview.diagnostics.willEmbedInlineImage ? 'yes' : 'no'}</div>
                        {preview.diagnostics.inlineAttachment && (
                          <>
                            <div>Attachment file: {preview.diagnostics.inlineAttachment.filename}</div>
                            <div>Attachment type: {preview.diagnostics.inlineAttachment.contentType}</div>
                            <div>Content ID: {preview.diagnostics.inlineAttachment.contentId}</div>
                            <div>Attachment size: {preview.diagnostics.inlineAttachment.sizeBytes} bytes</div>
                          </>
                        )}
                      </div>
                    </article>

                    <article className="preview-card">
                      <h3 className="preview-card__title">HTML Preview</h3>
                      <div className="preview-frame" dangerouslySetInnerHTML={{ __html: preview.browserPreviewHtml }} />
                    </article>

                    <article className="preview-card">
                      <h3 className="preview-card__title">Text Preview</h3>
                      <pre className="preview-text">{preview.text}</pre>
                    </article>
                  </div>
                )}
              </section>

              <section className="panel">
                <div className="panel-header">
                  <div>
                    <div className="eyebrow">Voice</div>
                    <h2 className="section-title">Writing direction</h2>
                  </div>
                </div>

                <label className="field">
                  <span className="field-label">Email Voice Guidelines</span>
                  <textarea
                    value={branding.email_voice_guidelines || ''}
                    onChange={(event) => setBranding({ ...branding, email_voice_guidelines: event.target.value })}
                    style={{ minHeight: '10rem' }}
                  />
                  <span className="field-hint">
                    Capture the studio’s tone, pace, and vocabulary so drafts sound like the team and not the model.
                  </span>
                </label>
              </section>

              <div className="action-row">
                <button type="button" className="button button--dark" onClick={saveBranding} disabled={saving}>
                  {saving ? 'Saving' : 'Save Branding'}
                </button>
                {message && <div className="queue-meta">{message}</div>}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
