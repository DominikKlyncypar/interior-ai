import { google } from 'googleapis'
import { gmail_v1 } from 'googleapis'
import { ConnectedAccount, RawAttachment, RawEmail } from './email.types'
import logger from '../../lib/logger'
import {
  buildAttachmentRecord,
  decodeBase64Url,
  extractPlainTextFromHtml,
  parseFromHeader
} from './email.content'

export const createGmailClient = (account: ConnectedAccount) => {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token
  })

  return google.gmail({ version: 'v1', auth: oauth2Client })
}

export const fetchUnreadEmails = async (account: ConnectedAccount): Promise<RawEmail[]> => {
  const gmail = createGmailClient(account)

  // Convert fetch_since to Gmail date filter format
  const fetchSince = account.fetch_since 
    ? new Date(account.fetch_since) 
    : new Date()
  
  const after = Math.floor(fetchSince.getTime() / 1000)

  logger.info(`Fetching emails after: ${new Date(after * 1000).toISOString()}`)

  // Gmail search query to get unread emails in the inbox received after fetch_since
  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread label:inbox category:primary',
    maxResults: 10
  })

  const messages = response.data.messages || []
  const emails: RawEmail[] = []

  for (const message of messages) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: 'full'
    })

    const payload = detail.data.payload
    const headers = payload?.headers || []
    const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)'
    const fromHeader = headers.find(h => h.name === 'From')?.value || ''
    const date = headers.find(h => h.name === 'Date')?.value || ''
    const parsedFrom = parseFromHeader(fromHeader)
    const { bodyText, bodyHtml } = await extractGmailBodies(gmail, message.id!, payload)
    const attachments = await extractGmailAttachments(gmail, message.id!, payload)

    emails.push({
      id: message.id!,
      threadId: message.threadId!,
      subject,
      from: parsedFrom.from,
      fromName: parsedFrom.fromName,
      fromEmail: parsedFrom.fromEmail,
      body: bodyText || detail.data.snippet || '',
      bodyText: bodyText || detail.data.snippet || '',
      bodyHtml,
      snippet: detail.data.snippet || '',
      attachments,
      receivedAt: new Date(date)
    })
  }

  // Filter out emails older than fetch_since
  const filteredEmails = emails.filter(email => 
    email.receivedAt >= fetchSince
  )

  return filteredEmails
}

export const markAsRead = async (account: ConnectedAccount, emailId: string) => {
  const gmail = createGmailClient(account)
  await gmail.users.messages.modify({
    userId: 'me',
    id: emailId,
    requestBody: {
      removeLabelIds: ['UNREAD']
    }
  })
}

const extractGmailBodies = async (
  gmail: gmail_v1.Gmail,
  messageId: string,
  payload: gmail_v1.Schema$MessagePart | undefined
) => {
  const plainBodies: string[] = []
  const htmlBodies: string[] = []

  const walk = (part: gmail_v1.Schema$MessagePart | undefined) => {
    if (!part) return

    if (part.parts?.length) {
      for (const child of part.parts) walk(child)
    }

    const data = part.body?.data
    if (!data) return

    const decoded = decodeBase64Url(data).toString('utf8')
    if (part.mimeType === 'text/plain') plainBodies.push(decoded)
    if (part.mimeType === 'text/html') htmlBodies.push(decoded)
  }

  walk(payload)

  const bodyHtml = htmlBodies.join('\n\n').trim() || undefined
  const bodyText = plainBodies.join('\n\n').trim() || (bodyHtml ? extractPlainTextFromHtml(bodyHtml) : '')

  logger.debug(`Fetched Gmail body for message ${messageId}; textLength=${bodyText.length} htmlLength=${bodyHtml?.length || 0}`)

  return { bodyText, bodyHtml }
}

const extractGmailAttachments = async (
  gmail: gmail_v1.Gmail,
  messageId: string,
  payload: gmail_v1.Schema$MessagePart | undefined
): Promise<RawAttachment[]> => {
  const attachments: RawAttachment[] = []

  const walk = async (part: gmail_v1.Schema$MessagePart | undefined): Promise<void> => {
    if (!part) return

    if (part.parts?.length) {
      for (const child of part.parts) {
        await walk(child)
      }
    }

    const attachmentId = part.body?.attachmentId
    const filename = part.filename || ''

    if (!attachmentId || !filename) return

    const disposition = part.headers?.find(h => h.name?.toLowerCase() === 'content-disposition')?.value || ''
    const attachment = buildAttachmentRecord({
      filename,
      mimeType: part.mimeType || 'application/octet-stream',
      sizeBytes: part.body?.size || 0,
      providerAttachmentId: attachmentId,
      isInline: disposition.toLowerCase().includes('inline')
    })

    if (attachment.status === 'skipped_too_large') {
      attachments.push(attachment)
      return
    }

    const response = await gmail.users.messages.attachments.get({
      userId: 'me',
      messageId,
      id: attachmentId
    })

    const data = response.data.data
    attachments.push({
      ...attachment,
      content: data ? decodeBase64Url(data) : undefined
    })
  }

  await walk(payload)
  return attachments
}
