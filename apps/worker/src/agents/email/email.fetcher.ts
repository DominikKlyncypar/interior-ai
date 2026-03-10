import { google } from 'googleapis'
import { ConnectedAccount, RawEmail } from './email.types'

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

  const response = await gmail.users.messages.list({
    userId: 'me',
    q: 'is:unread label:inbox category:primary',
    maxResults: 10
  })

  const messages = response.data.messages || []
  const emails: RawEmail[] = []

  // Fetch details sequentially to preserve order
  for (const message of messages) {
    const detail = await gmail.users.messages.get({
      userId: 'me',
      id: message.id!,
      format: 'metadata',
      metadataHeaders: ['Subject', 'From', 'Date']
    })

    const headers = detail.data.payload?.headers || []
    const subject = headers.find(h => h.name === 'Subject')?.value || '(no subject)'
    const from = headers.find(h => h.name === 'From')?.value || ''
    const date = headers.find(h => h.name === 'Date')?.value || ''
    const body = detail.data.snippet || ''

    emails.push({
      id: message.id!,
      threadId: message.threadId!,
      subject,
      from,
      body,
      receivedAt: new Date(date)
    })
  }

  return emails
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