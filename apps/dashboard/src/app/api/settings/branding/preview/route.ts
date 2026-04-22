import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { buildReplyContent } from '@/lib/email-compose'
import {
  extractSignatureImageSource,
  fetchInlineAttachmentFromUrl
} from '@/lib/email-inline-assets'
import { buildReplyHtml } from '@/lib/email-brand'

export async function POST(req: NextRequest) {
  try {
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { accountEmail, draftReply } = await req.json()
    if (!accountEmail) {
      return NextResponse.json({ error: 'accountEmail is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: account, error } = await supabase
      .from('connected_accounts')
      .select(
        'user_email, provider, email_signature_html, email_signature_text, email_voice_guidelines, logo_url'
      )
      .eq('user_email', accountEmail)
      .single()

    if (error || !account) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    const signatureImageSource =
      extractSignatureImageSource(account.email_signature_html) ||
      (account.email_signature_html?.includes('{{logo_url}}') ? account.logo_url || null : null) ||
      account.logo_url ||
      null
    const inlineAttachment = signatureImageSource
      ? await fetchInlineAttachmentFromUrl(signatureImageSource)
      : null

    const content = buildReplyContent(draftReply || '', account, inlineAttachment)
    const browserPreviewHtml = buildReplyHtml(draftReply || '', account)

    return NextResponse.json({
      text: content.text,
      html: content.html,
      browserPreviewHtml,
      diagnostics: {
        provider: account.provider,
        hasLogoUrl: Boolean(account.logo_url),
        signatureUsesLogoPlaceholder: Boolean(account.email_signature_html?.includes('{{logo_url}}')),
        signatureUsesLiteralLogoUrl: Boolean(
          account.logo_url && account.email_signature_html?.includes(account.logo_url)
        ),
        detectedSignatureImageSource: signatureImageSource,
        willEmbedInlineImage: Boolean(inlineAttachment),
        inlineAttachment: inlineAttachment
          ? {
              filename: inlineAttachment.filename,
              contentType: inlineAttachment.contentType,
              contentId: inlineAttachment.contentId,
              sizeBytes: Buffer.from(inlineAttachment.contentBytes, 'base64').length
            }
          : null
      }
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
