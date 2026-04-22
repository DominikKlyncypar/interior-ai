import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'
import { google } from 'googleapis'
import { markOutlookMessageAsRead } from '@/lib/outlook'

export async function POST(req: NextRequest) {
  try {
    const authSupabase = await createSupabaseServerClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { emailId } = await req.json()

    const supabase = getSupabaseAdmin()

    const { data: email, error: emailError } = await supabase
      .from('emails')
      .select('gmail_id, account_email')
      .eq('id', emailId)
      .single()

    if (emailError || !email?.gmail_id) {
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

    if (account.provider === 'outlook') {
      await markOutlookMessageAsRead(account, email.gmail_id)
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

      await gmail.users.messages.modify({
        userId: 'me',
        id: email.gmail_id,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
