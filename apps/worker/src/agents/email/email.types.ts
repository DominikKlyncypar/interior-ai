export interface RawAttachment {
  filename: string
  mimeType: string
  sizeBytes: number
  providerAttachmentId?: string
  isInline: boolean
  content?: Buffer
  extractedText?: string
  status?: 'stored' | 'skipped_too_large' | 'unsupported' | 'extract_failed'
}

export interface RawEmail {
  id: string
  threadId: string
  subject: string
  from: string
  fromName?: string
  fromEmail?: string
  body: string
  bodyText: string
  bodyHtml?: string
  snippet?: string
  attachments: RawAttachment[]
  receivedAt: Date
}

export interface ProcessedEmail {
  id: string
  threadId: string
  subject: string
  from: string
  fromName?: string
  fromEmail?: string
  body: string
  bodyText: string
  bodyHtml?: string
  snippet?: string
  attachments: RawAttachment[]
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
