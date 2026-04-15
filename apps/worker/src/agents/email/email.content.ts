import { RawAttachment } from './email.types'

const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024

export const decodeBase64Url = (value: string) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64')
}

export const extractPlainTextFromHtml = (html: string) =>
  html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()

export const looksLikeHtml = (value: string) => {
  const trimmed = value.trim()
  if (!trimmed) return false

  return /<\/?(html|body|div|span|p|br|table|tr|td|h[1-6]|a|img|style|section|article|ul|ol|li)\b/i.test(trimmed)
}

export const parseFromHeader = (value: string) => {
  const match = value.match(/^(?:"?([^"]*)"?\s)?<?([^<>@\s]+@[^<>@\s]+)>?$/)

  if (!match) {
    return {
      from: value,
      fromName: undefined,
      fromEmail: value.includes('@') ? value : undefined
    }
  }

  const fromName = match[1]?.trim() || undefined
  const fromEmail = match[2]?.trim()

  return {
    from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
    fromName,
    fromEmail
  }
}

export const buildAttachmentRecord = (attachment: Omit<RawAttachment, 'status'> & { status?: RawAttachment['status'] }) => {
  if (attachment.content && attachment.sizeBytes > MAX_ATTACHMENT_BYTES) {
    return {
      ...attachment,
      content: undefined,
      status: 'skipped_too_large' as const
    }
  }

  return {
    ...attachment,
    status: attachment.status || 'stored'
  }
}

export const safeFilename = (filename: string) =>
  filename.replace(/[^a-zA-Z0-9._-]/g, '_')
