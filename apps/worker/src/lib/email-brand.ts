export type AccountBranding = {
  email_signature_text?: string | null
  email_voice_guidelines?: string | null
}

const DEFAULT_VOICE_GUIDELINES = [
  'Write like a thoughtful interior design studio, not a generic assistant.',
  'Sound warm, grounded, and specific.',
  'Avoid corporate buzzwords, exaggerated enthusiasm, and obvious AI phrasing.',
  'Prefer natural sentence variation and concise paragraphs.',
  'Use practical, design-aware language when discussing timelines, selections, drawings, site meetings, vendors, or client feedback.'
].join(' ')

export const getEmailVoiceGuidelines = (branding?: AccountBranding | null) =>
  branding?.email_voice_guidelines?.trim() || DEFAULT_VOICE_GUIDELINES

export const getEmailSignature = (branding?: AccountBranding | null) =>
  branding?.email_signature_text?.trim() || 'The Team'
