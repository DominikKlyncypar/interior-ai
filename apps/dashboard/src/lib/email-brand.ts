export type AccountBranding = {
  email_signature_html?: string | null
  email_signature_text?: string | null
  email_voice_guidelines?: string | null
  logo_url?: string | null
}

export type SignatureImage = {
  contentId: string
  sourceUrl?: string | null
}

const DEFAULT_SIGNATURE_LOGO_STYLE =
  'display:block; max-width:180px; max-height:64px; height:auto; width:auto;'

const buildSignatureLogoHtml = (src: string) =>
  `<div style="margin-bottom:12px;"><img src="${escapeHtml(src)}" alt="Logo" style="${DEFAULT_SIGNATURE_LOGO_STYLE}" /></div>`

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

const replaceLogoPlaceholder = (
  html: string,
  logoUrl?: string | null,
  signatureImage?: SignatureImage | null
) => {
  if (signatureImage) {
    const cidUrl = `cid:${signatureImage.contentId}`
    let nextHtml = html.replace(/\{\{logo_url\}\}/g, cidUrl)

    if (logoUrl) {
      nextHtml = nextHtml.split(logoUrl).join(cidUrl)
    }

    if (signatureImage.sourceUrl) {
      nextHtml = nextHtml.split(signatureImage.sourceUrl).join(cidUrl)
    }

    return nextHtml
  }

  return logoUrl ? html.replace(/\{\{logo_url\}\}/g, logoUrl) : html
}

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

export const getSignatureHtml = (
  branding?: AccountBranding | null,
  signatureImage?: SignatureImage | null
) => {
  if (branding?.email_signature_html?.trim()) {
    const resolvedHtml = replaceLogoPlaceholder(
      branding.email_signature_html.trim(),
      branding.logo_url,
      signatureImage
    )

    if (!/<img\b/i.test(resolvedHtml)) {
      const logoSrc = signatureImage
        ? `cid:${signatureImage.contentId}`
        : branding.logo_url

      if (logoSrc) {
        return `${buildSignatureLogoHtml(logoSrc)}${resolvedHtml}`
      }
    }

    return resolvedHtml
  }

  const signatureText = getSignatureText(branding)
  const logoSrc = signatureImage
    ? `cid:${signatureImage.contentId}`
    : branding?.logo_url
  const logoHtml = logoSrc ? buildSignatureLogoHtml(logoSrc) : ''

  return `${logoHtml}<div>${escapeHtml(signatureText).replace(/\n/g, '<br />')}</div>`
}

export const applyEmailSignatureText = (draftReply: string, branding?: AccountBranding | null) => {
  const signature = getSignatureText(branding)
  const trimmedReply = stripExistingSignature(draftReply, branding)

  if (!signature) return trimmedReply
  if (!trimmedReply) return signature

  return `${trimmedReply}\n\n${signature}`
}

export const buildReplyHtml = (
  draftReply: string,
  branding?: AccountBranding | null,
  signatureImage?: SignatureImage | null
) => {
  const replyHtml = stripExistingSignature(draftReply, branding)
    .trim()
    .split(/\n{2,}/)
    .map(paragraph => `<p style="margin:0 0 12px;">${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`)
    .join('')

  return `${replyHtml}<div style="margin-top:20px;">${getSignatureHtml(branding, signatureImage)}</div>`
}
