import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { google } from 'googleapis'

export async function POST(req: NextRequest) {
  try {
    const { emailId } = await req.json()

    const supabase = getSupabase()

    // Get the email's gmail_id
    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('gmail_id, contacts(email)')
      .eq('id', emailId)
      .single()

    if (emailError || !email?.gmail_id) {
      return NextResponse.json({ error: 'Email not found' }, { status: 404 })
    }

    // Get the connected account
    const { data: account, error: accountError } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('provider', 'gmail')
      .single()

    if (accountError || !account) {
      return NextResponse.json({ error: 'No connected account' }, { status: 404 })
    }

    // Mark as read in Gmail
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET
    )

    oauth2Client.setCredentials({
      access_token: account.access_token,
      refresh_token: account.refresh_token
    })

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client })

    await gmail.users.messages.modify({
      userId: 'me',
      id: email.gmail_id,
      requestBody: {
        removeLabelIds: ['UNREAD']
      }
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}