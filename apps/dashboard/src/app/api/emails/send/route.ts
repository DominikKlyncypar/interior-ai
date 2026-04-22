import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { google } from 'googleapis'
import { buildReplyContent, buildGmailReplyMime, encodeGmailRawMessage } from '@/lib/email-compose'
import {
  extractSignatureImageSource,
  fetchInlineAttachmentFromUrl
} from '@/lib/email-inline-assets'
import {
  addOutlookInlineAttachment,
  createOutlookReplyDraft,
  sendOutlookDraft,
  updateOutlookMessageBody
} from '@/lib/outlook'

export async function POST(req: NextRequest) {
  try {
    const authSupabase = await createSupabaseServerClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { emailId, draftReply } = await req.json()

    const supabase = getSupabaseAdmin()

    // Get the email
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('*, contacts(email)')
      .eq('id', emailId)
      .single()

    if (emailError || !email) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_email', email.account_email)
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'No connected account' }, { status: 404 })
    }

    const branding = {
      email_signature_html: account.email_signature_html,
      email_signature_text: account.email_signature_text,
      email_voice_guidelines: account.email_voice_guidelines,
      logo_url: account.logo_url
    }
    const signatureImageSource =
      extractSignatureImageSource(branding.email_signature_html) ||
      (branding.email_signature_html?.includes('{{logo_url}}') ? branding.logo_url || null : null) ||
      branding.logo_url ||
      null
    const inlineAttachment = signatureImageSource
      ? await fetchInlineAttachmentFromUrl(signatureImageSource)
      : null
    const replyContent = buildReplyContent(draftReply || '', branding, inlineAttachment)

    if (account.provider === 'outlook') {
      const draft = await createOutlookReplyDraft(account, email.gmail_id)
      await updateOutlookMessageBody(account, draft.id, replyContent.html)
      if (inlineAttachment) {
        await addOutlookInlineAttachment(account, draft.id, inlineAttachment)
      }
      await sendOutlookDraft(account, draft.id)
    } else {
      const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      )

      oauth2Client.setCredentials({
        access_token: account.access_token,
        refresh_token: account.refresh_token
      })

      const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

      const toEmail = email.contacts?.email || ''
      const subject = `Re: ${email.subject}`
      const message = buildGmailReplyMime({
        toEmail,
        subject,
        content: replyContent,
        inlineAttachment
      })
      const encodedMessage = encodeGmailRawMessage(message)

      await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage,
          threadId: email.gmail_id
        }
      })
    }

    await supabase
      .from('emails')
      .update({ status: 'sent' })
      .eq('id', emailId)

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
