import { applyEmailSignatureText, buildReplyHtml } from './email-brand.ts'
import type { AccountBranding } from './email-brand.ts'

export type InlineAttachment = {
  contentId: string
  filename: string
  contentType: string
  contentBytes: string
  sourceUrl?: string | null
}

export type ReplyContent = {
  text: string
  html: string
}

export const buildReplyContent = (
  draftReply: string,
  branding?: AccountBranding | null,
  inlineAttachment?: InlineAttachment | null
): ReplyContent => ({
  text: applyEmailSignatureText(draftReply || '', branding),
  html: buildReplyHtml(
    draftReply || '',
    branding,
    inlineAttachment
      ? { contentId: inlineAttachment.contentId, sourceUrl: inlineAttachment.sourceUrl }
      : null
  )
})

const wrapBase64 = (content: string) => content.match(/.{1,76}/g)?.join('\n') || content

export const buildGmailReplyMime = ({
  toEmail,
  subject,
  content,
  inlineAttachment
}: {
  toEmail: string
  subject: string
  content: ReplyContent
  inlineAttachment?: InlineAttachment | null
}) =>
  inlineAttachment
    ? [
        `To: ${toEmail}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: multipart/related; boundary="related-boundary"',
        '',
        '--related-boundary',
        'Content-Type: multipart/alternative; boundary="reply-boundary"',
        '',
        '--reply-boundary',
        'Content-Type: text/plain; charset=utf-8',
        '',
        content.text,
        '',
        '--reply-boundary',
        'Content-Type: text/html; charset=utf-8',
        '',
        content.html,
        '',
        '--reply-boundary--',
        '--related-boundary',
        `Content-Type: ${inlineAttachment.contentType}; name="${inlineAttachment.filename}"`,
        'Content-Transfer-Encoding: base64',
        `Content-ID: <${inlineAttachment.contentId}>`,
        `Content-Disposition: inline; filename="${inlineAttachment.filename}"`,
        '',
        wrapBase64(inlineAttachment.contentBytes),
        '',
        '--related-boundary--'
      ].join('\n')
    : [
        `To: ${toEmail}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="reply-boundary"',
        '',
        '--reply-boundary',
        'Content-Type: text/plain; charset=utf-8',
        '',
        content.text,
        '',
        '--reply-boundary',
        'Content-Type: text/html; charset=utf-8',
        '',
        content.html,
        '',
        '--reply-boundary--'
      ].join('\n')

export const encodeGmailRawMessage = (message: string) =>
  Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
