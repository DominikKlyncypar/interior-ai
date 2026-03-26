import type { InlineAttachment } from './email-compose'

const DEFAULT_CONTENT_TYPE = 'application/octet-stream'
const getInlineExtension = (contentType: string) => {
  const subtype = contentType.split('/')[1]?.split(';')[0]?.trim().toLowerCase()
  if (!subtype) return 'bin'
  if (subtype === 'jpeg') return 'jpg'
  if (subtype === 'svg+xml') return 'svg'
  return subtype
}

const getInlineFilename = (contentType: string) => `image001.${getInlineExtension(contentType)}`
export const SIGNATURE_LOGO_CONTENT_ID = 'image001@interior-ai'

export const extractSignatureImageSource = (signatureHtml?: string | null) => {
  if (!signatureHtml) return null

  const match = signatureHtml.match(/<img\b[^>]*\bsrc=["']([^"']+)["']/i)
  return match?.[1] || null
}

export const fetchInlineAttachmentFromUrl = async (
  url: string,
  contentId = SIGNATURE_LOGO_CONTENT_ID
): Promise<InlineAttachment> => {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error(`Logo fetch failed: ${response.status} ${response.statusText}`)
  }

  const contentType = response.headers.get('content-type') || DEFAULT_CONTENT_TYPE
  const bytes = Buffer.from(await response.arrayBuffer())
  const filename = getInlineFilename(contentType)

  return {
    contentId,
    filename,
    contentType,
    contentBytes: bytes.toString('base64'),
    sourceUrl: url
  }
}
