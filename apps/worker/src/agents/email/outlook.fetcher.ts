import { ConnectedAccount, RawAttachment, RawEmail } from './email.types'
import logger from '../../lib/logger'
import {
  buildAttachmentRecord,
  extractPlainTextFromHtml
} from './email.content'

const OUTLOOK_SCOPE = [
  'openid',
  'email',
  'profile',
  'offline_access',
  'https://graph.microsoft.com/User.Read',
  'https://graph.microsoft.com/Mail.Read',
  'https://graph.microsoft.com/Mail.ReadWrite',
  'https://graph.microsoft.com/Mail.Send'
].join(' ')

const EXPIRY_BUFFER_MS = 2 * 60 * 1000

type TokenRefreshError = {
  error?: string
  error_description?: string
}

type TokenRefreshResult = {
  access_token: string
  refresh_token?: string
  expires_in: number
}

type GraphMessagesResult = {
  value?: any[]
}

type OutlookMessageDetail = {
  id: string
  conversationId?: string
  subject?: string
  receivedDateTime: string
  bodyPreview?: string
  body?: {
    contentType?: string
    content?: string
  }
  from?: {
    emailAddress?: {
      address?: string
      name?: string
    }
  }
  hasAttachments?: boolean
}

type OutlookAttachmentsResult = {
  value?: Array<{
    id?: string
    name?: string
    contentType?: string
    size?: number
    isInline?: boolean
    '@odata.type'?: string
  }>
}

type OutlookAttachmentDetail = {
  id?: string
  name?: string
  contentType?: string
  size?: number
  isInline?: boolean
  contentBytes?: string
  '@odata.type'?: string
}

type JwtPayload = {
  aud?: string
  tid?: string
  iss?: string
  scp?: string
}

const getTenantCandidates = () => {
  const configuredTenant = process.env.AZURE_AD_TENANT_ID?.trim()
  const candidates = [configuredTenant, 'common', 'organizations', 'consumers']
    .filter((tenant): tenant is string => Boolean(tenant))

  return Array.from(new Set(candidates))
}

const decodeJwtPayload = (token: string): JwtPayload | null => {
  try {
    const parts = token.split('.')
    if (parts.length < 2) return null

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=')
    const decoded = Buffer.from(padded, 'base64').toString('utf8')
    return JSON.parse(decoded) as JwtPayload
  } catch {
    return null
  }
}

const tokenSummary = (token: string) => {
  const payload = decodeJwtPayload(token)
  if (!payload) return 'token=unparseable'

  return `aud=${payload.aud || 'n/a'} tid=${payload.tid || 'n/a'} iss=${payload.iss || 'n/a'} scp=${payload.scp || 'n/a'}`
}

const saveRefreshedToken = async (
  account: ConnectedAccount,
  data: TokenRefreshResult
) => {
  const { getSupabase } = await import('../../lib/supabase')
  const supabase = getSupabase()
  await supabase
    .from('connected_accounts')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token || account.refresh_token,
      expires_at: new Date(Date.now() + data.expires_in * 1000).toISOString()
    })
    .eq('id', account.id)
}

const parseTokenRefreshError = async (response: Response) => {
  try {
    const err = (await response.json()) as TokenRefreshError
    return err.error_description || err.error || `${response.status} ${response.statusText}`
  } catch {
    const body = await response.text()
    return body || `${response.status} ${response.statusText}`
  }
}

const refreshOutlookTokenForTenant = async (
  account: ConnectedAccount,
  tenant: string
): Promise<TokenRefreshResult> => {
  const response = await fetch(`https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.AZURE_AD_CLIENT_ID!,
      client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
      refresh_token: account.refresh_token,
      grant_type: 'refresh_token',
      scope: OUTLOOK_SCOPE
    })
  })

  if (!response.ok) {
    const errMsg = await parseTokenRefreshError(response)
    throw new Error(errMsg)
  }

  return (await response.json()) as TokenRefreshResult
}

const refreshOutlookToken = async (account: ConnectedAccount): Promise<string> => {
  const tenantCandidates = getTenantCandidates()
  const errors: string[] = []

  for (const tenant of tenantCandidates) {
    try {
      const data = await refreshOutlookTokenForTenant(account, tenant)
      await saveRefreshedToken(account, data)
      logger.info(
        `Outlook token refresh succeeded for ${account.user_email} via tenant ${tenant}; ${tokenSummary(data.access_token)}`
      )
      return data.access_token
    } catch (err: any) {
      errors.push(`[${tenant}] ${err.message}`)
    }
  }

  throw new Error(`Token refresh failed across tenant endpoints: ${errors.join(' | ')}`)
}

const shouldRefreshToken = (expiresAt: string | null | undefined) => {
  if (!expiresAt) return true
  const expiryMs = new Date(expiresAt).getTime()
  if (Number.isNaN(expiryMs)) return true
  return Date.now() >= expiryMs - EXPIRY_BUFFER_MS
}

const getValidOutlookToken = async (account: ConnectedAccount) => {
  if (shouldRefreshToken(account.expires_at)) {
    return refreshOutlookToken(account)
  }
  return account.access_token
}

const parseGraphError = (status: number, statusText: string, body: string) => {
  if (!body) return `status=${status} ${statusText}`

  try {
    const parsed = JSON.parse(body)
    const code = parsed?.error?.code || parsed?.error || 'unknown_error'
    const message = parsed?.error?.message || parsed?.error_description || body
    return `status=${status} ${statusText}; code=${code}; message=${message}`
  } catch {
    return `status=${status} ${statusText}; body=${body}`
  }
}

const buildGraphError = async (response: Response) => {
  const body = await response.text()
  const parsed = parseGraphError(response.status, response.statusText, body)
  const wwwAuthenticate = response.headers.get('www-authenticate')
  const requestId = response.headers.get('request-id')

  const extra = [
    wwwAuthenticate ? `www-authenticate=${wwwAuthenticate}` : null,
    requestId ? `request-id=${requestId}` : null
  ]
    .filter(Boolean)
    .join('; ')

  return extra ? `${parsed}; ${extra}` : parsed
}

const graphFetchWithRetry = async (account: ConnectedAccount, url: string, init?: RequestInit) => {
  const makeRequest = async (token: string) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`
      }
    })

  let accessToken = await getValidOutlookToken(account)
  let response = await makeRequest(accessToken)

  if (response.status === 401) {
    const tenantCandidates = getTenantCandidates()
    const attempts: string[] = []

    for (const tenant of tenantCandidates) {
      try {
        const refreshed = await refreshOutlookTokenForTenant(account, tenant)
        response = await makeRequest(refreshed.access_token)

        if (response.status !== 401) {
          await saveRefreshedToken(account, refreshed)
          logger.info(
            `Outlook Graph auth recovered for ${account.user_email} via tenant ${tenant}; ${tokenSummary(refreshed.access_token)}`
          )
          return response
        }

        const wwwAuthenticate = response.headers.get('www-authenticate')
        attempts.push(
          `[${tenant}] Graph401${wwwAuthenticate ? ` ${wwwAuthenticate}` : ''} ${tokenSummary(refreshed.access_token)}`
        )
      } catch (err: any) {
        attempts.push(`[${tenant}] refresh_failed ${err.message}`)
      }
    }

    logger.error(`Outlook Graph 401 for ${account.user_email} across tenant candidates: ${attempts.join(' | ')}`)
  }

  return response
}

export const fetchUnreadOutlookEmails = async (account: ConnectedAccount): Promise<RawEmail[]> => {
  const fetchSince = account.fetch_since
    ? new Date(account.fetch_since)
    : new Date()

  const sinceISO = fetchSince.toISOString().split('.')[0] + 'Z'

  const params = new URLSearchParams({
    $top: '25',
    $select: 'id',
    $orderby: 'receivedDateTime DESC',
    $filter: `isRead eq false and receivedDateTime ge ${sinceISO}`
  })

  const response = await graphFetchWithRetry(
    account,
    `https://graph.microsoft.com/v1.0/me/mailFolders/inbox/messages?${params.toString()}`
  )

  if (!response.ok) {
    throw new Error(`Graph API error: ${await buildGraphError(response)}`)
  }

  const data = (await response.json()) as GraphMessagesResult
  const messages = data.value || []
  const emails: RawEmail[] = []

  logger.info(
    `Fetched ${messages.length} Outlook messages for ${account.user_email} since ${sinceISO}`
  )

  for (const message of messages) {
    const detail = await fetchOutlookMessageDetail(account, message.id)
    if (new Date(detail.receivedDateTime) < fetchSince) continue

    const bodyHtml = detail.body?.contentType?.toLowerCase() === 'html'
      ? detail.body?.content || ''
      : undefined
    const bodyText = detail.body?.contentType?.toLowerCase() === 'html'
      ? extractPlainTextFromHtml(detail.body?.content || '')
      : detail.body?.content || detail.bodyPreview || ''
    const fromEmail = detail.from?.emailAddress?.address || ''
    const fromName = detail.from?.emailAddress?.name || undefined
    const attachments = detail.hasAttachments
      ? await fetchOutlookAttachments(account, message.id)
      : []

    emails.push({
      id: detail.id,
      threadId: detail.conversationId || detail.id,
      subject: detail.subject || '(no subject)',
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      fromName,
      fromEmail,
      body: bodyText,
      bodyText,
      bodyHtml,
      snippet: detail.bodyPreview || '',
      attachments,
      receivedAt: new Date(detail.receivedDateTime)
    })
  }

  return emails
}

export const markOutlookAsRead = async (account: ConnectedAccount, emailId: string) => {
  const response = await graphFetchWithRetry(
    account,
    `https://graph.microsoft.com/v1.0/me/messages/${emailId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isRead: true })
    }
  )

  if (!response.ok) {
    throw new Error(`Mark Outlook email as read failed: ${await buildGraphError(response)}`)
  }
}

const fetchOutlookMessageDetail = async (
  account: ConnectedAccount,
  messageId: string
): Promise<OutlookMessageDetail> => {
  const params = new URLSearchParams({
    $select: 'id,conversationId,subject,from,receivedDateTime,bodyPreview,body,hasAttachments'
  })

  const response = await graphFetchWithRetry(
    account,
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}?${params.toString()}`
  )

  if (!response.ok) {
    throw new Error(`Outlook message detail failed: ${await buildGraphError(response)}`)
  }

  return (await response.json()) as OutlookMessageDetail
}

const fetchOutlookAttachments = async (
  account: ConnectedAccount,
  messageId: string
): Promise<RawAttachment[]> => {
  const params = new URLSearchParams({
    $select: 'id,name,contentType,size,isInline'
  })
  const response = await graphFetchWithRetry(
    account,
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments?${params.toString()}`
  )

  if (!response.ok) {
    throw new Error(`Outlook attachment fetch failed: ${await buildGraphError(response)}`)
  }

  const data = (await response.json()) as OutlookAttachmentsResult

  const attachments: RawAttachment[] = []

  for (const attachment of data.value || []) {
    if (!attachment.id) continue

    const detail = await fetchOutlookAttachmentDetail(account, messageId, attachment.id)

    if (detail['@odata.type'] && detail['@odata.type'] !== '#microsoft.graph.fileAttachment') {
      attachments.push(buildAttachmentRecord({
        filename: detail.name || attachment.name || 'attachment',
        mimeType: detail.contentType || attachment.contentType || 'application/octet-stream',
        sizeBytes: detail.size || attachment.size || 0,
        providerAttachmentId: detail.id || attachment.id,
        isInline: Boolean(detail.isInline ?? attachment.isInline),
        status: 'unsupported'
      }))
      continue
    }

    const built = buildAttachmentRecord({
      filename: detail.name || attachment.name || 'attachment',
      mimeType: detail.contentType || attachment.contentType || 'application/octet-stream',
      sizeBytes: detail.size || attachment.size || 0,
      providerAttachmentId: detail.id || attachment.id,
      isInline: Boolean(detail.isInline ?? attachment.isInline)
    })

    attachments.push({
      ...built,
      content: built.status === 'stored' && detail.contentBytes
        ? Buffer.from(detail.contentBytes, 'base64')
        : undefined
    })
  }

  return attachments
}

const fetchOutlookAttachmentDetail = async (
  account: ConnectedAccount,
  messageId: string,
  attachmentId: string
): Promise<OutlookAttachmentDetail> => {
  const response = await graphFetchWithRetry(
    account,
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}/attachments/${attachmentId}`
  )

  if (!response.ok) {
    throw new Error(`Outlook attachment detail failed: ${await buildGraphError(response)}`)
  }

  return (await response.json()) as OutlookAttachmentDetail
}
