import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { htmlToText } from '@/lib/html'

export async function POST(req: NextRequest) {
  try {
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { accountEmail } = await req.json()
    if (!accountEmail) {
      return NextResponse.json({ error: 'accountEmail is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: account, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('user_email', accountEmail)
      .eq('provider', 'gmail')
      .single()

    if (error || !account) {
      return NextResponse.json({ error: 'Gmail account not found' }, { status: 404 })
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })
    const aliases = await gmail.users.settings.sendAs.list({ userId: 'me' })
    const primary = aliases.data.sendAs?.find(alias => alias.isPrimary) || aliases.data.sendAs?.[0]

    if (!primary?.sendAsEmail) {
      return NextResponse.json({ error: 'No Gmail signature found' }, { status: 404 })
    }

    const detail = await gmail.users.settings.sendAs.get({
      userId: 'me',
      sendAsEmail: primary.sendAsEmail
    })

    const signatureHtml = detail.data.signature || ''
    const signatureText = htmlToText(signatureHtml)

    const { error: updateError } = await supabase
      .from('connected_accounts')
      .update({
        email_signature_html: signatureHtml,
        email_signature_text: signatureText,
        signature_source: 'gmail'
      })
      .eq('id', account.id)

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 })
    }

    return NextResponse.json({
      email_signature_html: signatureHtml,
      email_signature_text: signatureText,
      signature_source: 'gmail'
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
