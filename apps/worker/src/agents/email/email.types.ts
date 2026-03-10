export interface RawEmail {
  id: string
  threadId: string
  subject: string
  from: string
  body: string
  receivedAt: Date
}

export interface ProcessedEmail {
  id: string
  threadId: string
  subject: string
  from: string
  body: string
  receivedAt: Date
  category: 'new_lead' | 'existing_client' | 'vendor' | 'urgent' | 'admin' | 'spam'
  urgency: 'high' | 'medium' | 'low'
  summary: string
  draftReply: string
}

export interface ConnectedAccount {
  id: string
  user_email: string
  provider: string
  access_token: string
  refresh_token: string
  expires_at: string
  fetch_since: string
}