import { google } from 'googleapis'
import { ConnectedAccount, RawEmail } from './email.types'
import logger from '../../lib/logger'

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