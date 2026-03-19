export type AccountBranding = {
  email_signature_html?: string | null
  email_signature_text?: string | null
  email_voice_guidelines?: string | null
  logo_url?: string | null
}

const DEFAULT_VOICE_GUIDELINES = [
  'Write like a thoughtful interior design studio, not a generic assistant.',
  'Sound warm, grounded, and specific.',
  'Avoid corporate buzzwords, exaggerated enthusiasm, and obvious AI phrasing.',
  'Prefer natural sentence variation and concise paragraphs.',
  'Use practical, design-aware language when discussing timelines, selections, drawings, site meetings, vendors, or client feedback.'
].join(' ')

const escapeHtml = (value: string) =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const replaceLogoPlaceholder = (html: string, logoUrl?: string | null) =>
  logoUrl ? html.replace(/\{\{logo_url\}\}/g, logoUrl) : html

export const getVoiceGuidelines = (branding?: AccountBranding | null) =>
  branding?.email_voice_guidelines?.trim() || DEFAULT_VOICE_GUIDELINES

export const getSignatureText = (branding?: AccountBranding | null) =>
  branding?.email_signature_text?.trim() || 'The Team'

const stripExistingSignature = (draftReply: string, branding?: AccountBranding | null) => {
  const signature = getSignatureText(branding)
  let trimmedReply = draftReply.trim()

  if (!signature) return trimmedReply

  while (trimmedReply.endsWith(signature)) {
    trimmedReply = trimmedReply.slice(0, trimmedReply.length - signature.length).trimEnd()
  }

  return trimmedReply
}

export const getSignatureHtml = (branding?: AccountBranding | null) => {
  if (branding?.email_signature_html?.trim()) {
    return replaceLogoPlaceholder(branding.email_signature_html.trim(), branding.logo_url)
  }

  const signatureText = getSignatureText(branding)
  return `<div>${escapeHtml(signatureText).replace(/\n/g, '<br />')}</div>`
}

export const applyEmailSignatureText = (draftReply: string, branding?: AccountBranding | null) => {
  const signature = getSignatureText(branding)
  const trimmedReply = stripExistingSignature(draftReply, branding)

  if (!signature) return trimmedReply
  if (!trimmedReply) return signature

  return `${trimmedReply}\n\n${signature}`
}

export const buildReplyHtml = (draftReply: string, branding?: AccountBranding | null) => {
  const replyHtml = stripExistingSignature(draftReply, branding)
    .trim()
    .split(/\n{2,}/)
    .map(paragraph => `<p style="margin:0 0 12px;">${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')

  return `${replyHtml}<div style="margin-top:20px;">${getSignatureHtml(branding)}</div>`
}
