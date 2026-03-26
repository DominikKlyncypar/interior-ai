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
  const [previewDraft, setPreviewDraft] = useState('Thanks for the update.\n\nWe can make that adjustment and send revised drawings tomorrow.')
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
      body: JSON.stringify(branding)
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
      body: formData
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
      body: JSON.stringify({ accountEmail: branding.user_email })
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
      signature_source: body.signature_source
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
        draftReply: previewDraft
      })
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
    <div style={{ display: 'flex' }}>
      <Sidebar />
      <main style={{ marginLeft: '220px', flex: 1, padding: '48px', minHeight: '100vh' }}>
        <div style={{ marginBottom: '40px' }}>
          <div style={{
            fontFamily: 'var(--font-dm-mono)',
            fontSize: '10px',
            letterSpacing: '3px',
            color: 'var(--gold)',
            textTransform: 'uppercase',
            marginBottom: '8px'
          }}>
            Settings
          </div>
          <h1 style={{
            fontFamily: 'var(--font-cormorant)',
            fontSize: '48px',
            fontWeight: 300,
            lineHeight: 1.1
          }}>
            Email Branding
          </h1>
        </div>

        {loading || !branding ? (
          <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '11px', color: 'var(--mid)' }}>
            Loading settings...
          </div>
        ) : (
          <div style={{
            maxWidth: '860px',
            display: 'grid',
            gap: '24px'
          }}>
            <div style={{
              padding: '24px',
              background: 'var(--warm-white)',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '2px',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                marginBottom: '12px'
              }}>
                Account
              </div>
              <div style={{ fontSize: '14px', color: 'var(--slate)', marginBottom: '8px' }}>
                {branding.user_email}
              </div>
              <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mid)' }}>
                Provider: {branding.provider} | Signature source: {branding.signature_source || 'manual'}
              </div>
            </div>

            <div style={{
              padding: '24px',
              background: 'var(--warm-white)',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px'
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '9px',
                    letterSpacing: '2px',
                    color: 'var(--gold)',
                    textTransform: 'uppercase',
                    marginBottom: '8px'
                  }}>
                    Signature
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--mid)' }}>
                    Gmail accounts can import the current live signature from Google. Outlook signatures must be managed here.
                  </div>
                </div>
                {branding.provider === 'gmail' && (
                  <button
                    onClick={importGmailSignature}
                    style={secondaryButtonStyle}
                  >
                    Import Gmail Signature
                  </button>
                )}
              </div>

              <label style={labelStyle}>Signature HTML</label>
              <textarea
                value={branding.email_signature_html || ''}
                onChange={e => setBranding({ ...branding, email_signature_html: e.target.value })}
                style={{ ...textareaStyle, minHeight: '180px' }}
              />
              <div style={hintStyle}>
                Use normal HTML. If you uploaded a logo, reference it with <code>{'{{logo_url}}'}</code>. Sends will replace that with an inline embedded image automatically.
              </div>

              <label style={labelStyle}>Signature Text</label>
              <textarea
                value={branding.email_signature_text || ''}
                onChange={e => setBranding({ ...branding, email_signature_text: e.target.value })}
                style={{ ...textareaStyle, minHeight: '120px' }}
              />
            </div>

            <div style={{
              padding: '24px',
              background: 'var(--warm-white)',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '2px',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                Logo
              </div>

              {branding.logo_url && (
                <div style={{ marginBottom: '16px' }}>
                  <img
                    src={branding.logo_url}
                    alt="Logo"
                    style={{ maxHeight: '64px', maxWidth: '240px', objectFit: 'contain' }}
                  />
                </div>
              )}

              <input
                type="file"
                accept="image/*"
                onChange={e => {
                  const file = e.target.files?.[0]
                  if (file) void uploadLogo(file)
                }}
                style={{ marginBottom: '12px' }}
              />

              <label style={labelStyle}>Logo URL</label>
              <input
                value={branding.logo_url || ''}
                onChange={e => setBranding({ ...branding, logo_url: e.target.value })}
                style={inputStyle}
              />
            </div>

            <div style={{
              padding: '24px',
              background: 'var(--warm-white)',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '16px',
                gap: '16px'
              }}>
                <div>
                  <div style={{
                    fontFamily: 'var(--font-dm-mono)',
                    fontSize: '9px',
                    letterSpacing: '2px',
                    color: 'var(--gold)',
                    textTransform: 'uppercase',
                    marginBottom: '8px'
                  }}>
                    Preview
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--mid)' }}>
                    Compose the exact reply body used for sending and check whether the logo will be attached inline.
                  </div>
                </div>
                <button
                  onClick={loadPreview}
                  disabled={previewLoading}
                  style={secondaryButtonStyle}
                >
                  {previewLoading ? 'Building...' : 'Build Preview'}
                </button>
              </div>

              <label style={labelStyle}>Sample Reply</label>
              <textarea
                value={previewDraft}
                onChange={e => setPreviewDraft(e.target.value)}
                style={{ ...textareaStyle, minHeight: '120px' }}
              />

              {preview && (
                <div style={{ display: 'grid', gap: '20px', marginTop: '20px' }}>
                  <div style={{
                    padding: '16px',
                    background: 'var(--cream)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '9px',
                      letterSpacing: '2px',
                      color: 'var(--gold)',
                      textTransform: 'uppercase',
                      marginBottom: '12px'
                    }}>
                      Diagnostics
                    </div>
                    <div style={diagnosticLineStyle}>Provider: {preview.diagnostics.provider}</div>
                    <div style={diagnosticLineStyle}>Logo uploaded: {preview.diagnostics.hasLogoUrl ? 'yes' : 'no'}</div>
                    <div style={diagnosticLineStyle}>
                      Uses {'{{logo_url}}'}: {preview.diagnostics.signatureUsesLogoPlaceholder ? 'yes' : 'no'}
                    </div>
                    <div style={diagnosticLineStyle}>
                      Uses saved logo URL: {preview.diagnostics.signatureUsesLiteralLogoUrl ? 'yes' : 'no'}
                    </div>
                    <div style={diagnosticLineStyle}>
                      Detected signature image source: {preview.diagnostics.detectedSignatureImageSource || 'none'}
                    </div>
                    <div style={diagnosticLineStyle}>
                      Will embed inline image: {preview.diagnostics.willEmbedInlineImage ? 'yes' : 'no'}
                    </div>
                    {preview.diagnostics.inlineAttachment && (
                      <>
                        <div style={diagnosticLineStyle}>Attachment file: {preview.diagnostics.inlineAttachment.filename}</div>
                        <div style={diagnosticLineStyle}>Attachment type: {preview.diagnostics.inlineAttachment.contentType}</div>
                        <div style={diagnosticLineStyle}>Content-ID: {preview.diagnostics.inlineAttachment.contentId}</div>
                        <div style={diagnosticLineStyle}>Attachment size: {preview.diagnostics.inlineAttachment.sizeBytes} bytes</div>
                      </>
                    )}
                  </div>

                  <div style={{
                    padding: '16px',
                    background: 'var(--cream)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '9px',
                      letterSpacing: '2px',
                      color: 'var(--gold)',
                      textTransform: 'uppercase',
                      marginBottom: '12px'
                    }}>
                      HTML Preview
                    </div>
                    <div
                      style={{ background: '#fff', padding: '16px', border: '1px solid var(--border)' }}
                      dangerouslySetInnerHTML={{ __html: preview.browserPreviewHtml }}
                    />
                  </div>

                  <div style={{
                    padding: '16px',
                    background: 'var(--cream)',
                    border: '1px solid var(--border)'
                  }}>
                    <div style={{
                      fontFamily: 'var(--font-dm-mono)',
                      fontSize: '9px',
                      letterSpacing: '2px',
                      color: 'var(--gold)',
                      textTransform: 'uppercase',
                      marginBottom: '12px'
                    }}>
                      Text Preview
                    </div>
                    <pre style={preStyle}>{preview.text}</pre>
                  </div>
                </div>
              )}
            </div>

            <div style={{
              padding: '24px',
              background: 'var(--warm-white)',
              border: '1px solid var(--border)'
            }}>
              <div style={{
                fontFamily: 'var(--font-dm-mono)',
                fontSize: '9px',
                letterSpacing: '2px',
                color: 'var(--gold)',
                textTransform: 'uppercase',
                marginBottom: '8px'
              }}>
                Writing Voice
              </div>
              <textarea
                value={branding.email_voice_guidelines || ''}
                onChange={e => setBranding({ ...branding, email_voice_guidelines: e.target.value })}
                style={{ ...textareaStyle, minHeight: '140px' }}
              />
              <div style={hintStyle}>
                Describe how the studio actually writes: pace, warmth, vocabulary, how direct to be, what to avoid, and how to talk about design work.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <button
                onClick={saveBranding}
                disabled={saving}
                style={primaryButtonStyle}
              >
                {saving ? 'Saving...' : 'Save Branding'}
              </button>
              {message && (
                <div style={{ fontFamily: 'var(--font-dm-mono)', fontSize: '10px', color: 'var(--mid)' }}>
                  {message}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

const labelStyle = {
  display: 'block',
  fontFamily: 'var(--font-dm-mono)',
  fontSize: '9px',
  letterSpacing: '2px',
  color: 'var(--gold)',
  textTransform: 'uppercase',
  marginBottom: '8px',
  marginTop: '16px'
} as const

const hintStyle = {
  marginTop: '8px',
  fontSize: '12px',
  color: 'var(--mid)',
  lineHeight: 1.6
} as const

const diagnosticLineStyle = {
  fontSize: '13px',
  color: 'var(--slate)',
  lineHeight: 1.7
} as const

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  border: '1px solid var(--border)',
  background: 'var(--cream)',
  color: 'var(--slate)',
  fontSize: '13px',
  outline: 'none'
} as const

const textareaStyle = {
  width: '100%',
  padding: '14px',
  border: '1px solid var(--border)',
  background: 'var(--cream)',
  color: 'var(--slate)',
  fontSize: '13px',
  lineHeight: 1.6,
  outline: 'none',
  resize: 'vertical' as const
}

const preStyle = {
  margin: 0,
  whiteSpace: 'pre-wrap' as const,
  wordBreak: 'break-word' as const,
  fontFamily: 'var(--font-dm-mono)',
  fontSize: '12px',
  lineHeight: 1.7,
  color: 'var(--slate)'
} as const

const primaryButtonStyle = {
  padding: '12px 16px',
  background: 'var(--charcoal)',
  color: 'var(--cream)',
  border: 'none',
  borderRadius: '2px',
  fontFamily: 'var(--font-dm-mono)',
  fontSize: '10px',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  cursor: 'pointer'
}

const secondaryButtonStyle = {
  padding: '12px 16px',
  background: 'transparent',
  color: 'var(--charcoal)',
  border: '1px solid var(--border)',
  borderRadius: '2px',
  fontFamily: 'var(--font-dm-mono)',
  fontSize: '10px',
  letterSpacing: '2px',
  textTransform: 'uppercase' as const,
  cursor: 'pointer'
}
