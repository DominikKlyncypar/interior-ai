type ConnectedAccount = {
  id: string
  user_email: string
  access_token: string
  refresh_token: string
  expires_at: string
}

type TokenRefreshResponse = {
  access_token: string
  refresh_token?: string
  expires_in: number
}

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

const getTenantCandidates = () => {
  const configuredTenant = process.env.AZURE_AD_TENANT_ID?.trim()
  return Array.from(
    new Set([configuredTenant, 'common', 'organizations', 'consumers'].filter(Boolean))
  ) as string[]
}

const shouldRefreshToken = (expiresAt: string | null | undefined) => {
  if (!expiresAt) return true
  const expiryMs = new Date(expiresAt).getTime()
  if (Number.isNaN(expiryMs)) return true
  return Date.now() >= expiryMs - EXPIRY_BUFFER_MS
}

const parseTokenError = async (response: Response) => {
  try {
    const body = await response.json()
    return body.error_description || body.error || `${response.status} ${response.statusText}`
  } catch {
    const text = await response.text()
    return text || `${response.status} ${response.statusText}`
  }
}

const refreshOutlookTokenForTenant = async (
  account: ConnectedAccount,
  tenant: string
): Promise<TokenRefreshResponse> => {
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
    throw new Error(await parseTokenError(response))
  }

  return (await response.json()) as TokenRefreshResponse
}

const persistRefreshedToken = async (
  account: ConnectedAccount,
  token: TokenRefreshResponse
) => {
  const { getSupabase } = await import('@/lib/supabase')
  const supabase = getSupabase()

  const { error } = await supabase
    .from('connected_accounts')
    .update({
      access_token: token.access_token,
      refresh_token: token.refresh_token || account.refresh_token,
      expires_at: new Date(Date.now() + token.expires_in * 1000).toISOString()
    })
    .eq('id', account.id)

  if (error) {
    throw new Error(`Failed to persist refreshed Outlook token: ${error.message}`)
  }
}

const refreshOutlookToken = async (account: ConnectedAccount) => {
  const errors: string[] = []

  for (const tenant of getTenantCandidates()) {
    try {
      const token = await refreshOutlookTokenForTenant(account, tenant)
      await persistRefreshedToken(account, token)
      return token.access_token
    } catch (err: any) {
      errors.push(`[${tenant}] ${err.message}`)
    }
  }

  throw new Error(`Outlook token refresh failed: ${errors.join(' | ')}`)
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
  const requestId = response.headers.get('request-id')
  const parsed = parseGraphError(response.status, response.statusText, body)

  return requestId ? `${parsed}; request-id=${requestId}` : parsed
}

export const graphFetchWithRetry = async (
  account: ConnectedAccount,
  url: string,
  init?: RequestInit
) => {
  const makeRequest = async (token: string) =>
    fetch(url, {
      ...init,
      headers: {
        ...(init?.headers || {}),
        Authorization: `Bearer ${token}`
      }
    })

  let response = await makeRequest(await getValidOutlookToken(account))

  if (response.status === 401) {
    const refreshedToken = await refreshOutlookToken(account)
    response = await makeRequest(refreshedToken)
  }

  return response
}

export const markOutlookMessageAsRead = async (
  account: ConnectedAccount,
  messageId: string
) => {
  const response = await graphFetchWithRetry(
    account,
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ isRead: true })
    }
  )

  if (!response.ok) {
    throw new Error(`Outlook mark as read failed: ${await buildGraphError(response)}`)
  }
}

export const replyToOutlookMessage = async (
  account: ConnectedAccount,
  messageId: string,
  comment: string
) => {
  const response = await graphFetchWithRetry(
    account,
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}/reply`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ comment })
    }
  )

  if (!response.ok) {
    throw new Error(`Outlook reply failed: ${await buildGraphError(response)}`)
  }
}

export const createOutlookReplyDraft = async (
  account: ConnectedAccount,
  messageId: string
) => {
  const response = await graphFetchWithRetry(
    account,
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}/createReply`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    }
  )

  if (!response.ok) {
    throw new Error(`Outlook create reply draft failed: ${await buildGraphError(response)}`)
  }

  return await response.json()
}

export const updateOutlookMessageBody = async (
  account: ConnectedAccount,
  messageId: string,
  html: string
) => {
  const response = await graphFetchWithRetry(
    account,
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}`,
    {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        body: {
          contentType: 'html',
          content: html
        }
      })
    }
  )

  if (!response.ok) {
    throw new Error(`Outlook draft update failed: ${await buildGraphError(response)}`)
  }
}

export const sendOutlookDraft = async (
  account: ConnectedAccount,
  messageId: string
) => {
  const response = await graphFetchWithRetry(
    account,
    `https://graph.microsoft.com/v1.0/me/messages/${messageId}/send`,
    {
      method: 'POST'
    }
  )

  if (!response.ok) {
    throw new Error(`Outlook draft send failed: ${await buildGraphError(response)}`)
  }
}
