import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET(req: NextRequest) {
  try {
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const accountEmail = req.nextUrl.searchParams.get('accountEmail') || user.email
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('connected_accounts')
      .select('user_email, provider, email_signature_html, email_signature_text, email_voice_guidelines, logo_url, signature_source')
      .eq('user_email', accountEmail)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Account not found' }, { status: 404 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const {
      accountEmail,
      user_email,
      email_signature_html,
      email_signature_text,
      email_voice_guidelines,
      logo_url
    } = await req.json()

    const targetAccountEmail = accountEmail || user_email

    if (!targetAccountEmail) {
      return NextResponse.json({ error: 'accountEmail is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('connected_accounts')
      .update({
        email_signature_html,
        email_signature_text,
        email_voice_guidelines,
        logo_url,
        signature_source: 'manual'
      })
      .eq('user_email', targetAccountEmail)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
