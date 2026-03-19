import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { google } from 'googleapis'
import {
  buildReplyHtml,
  applyEmailSignatureText
} from '@/lib/email-brand'
import {
  createOutlookReplyDraft,
  sendOutlookDraft,
  updateOutlookMessageBody
} from '@/lib/outlook'

export async function POST(req: NextRequest) {
  try {
    const { emailId, draftReply } = await req.json()

    const supabase = getSupabase()

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
    const finalReplyText = applyEmailSignatureText(draftReply || '', branding)
    const finalReplyHtml = buildReplyHtml(draftReply || '', branding)

    if (account.provider === 'outlook') {
      const draft = await createOutlookReplyDraft(account, email.gmail_id)
      await updateOutlookMessageBody(account, draft.id, finalReplyHtml)
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
      const message = [
        `To: ${toEmail}`,
        `Subject: ${subject}`,
        'MIME-Version: 1.0',
        'Content-Type: multipart/alternative; boundary="reply-boundary"',
        '',
        '--reply-boundary',
        'Content-Type: text/plain; charset=utf-8',
        '',
        finalReplyText,
        '',
        '--reply-boundary',
        'Content-Type: text/html; charset=utf-8',
        '',
        finalReplyHtml,
        '',
        '--reply-boundary--'
      ].join('\n')

      const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '')

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
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
