import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function POST(req: NextRequest) {
  try {
    const supabase = await createSupabaseServerClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { fetchSince, provider } = await req.json()

    if (!fetchSince || Number.isNaN(new Date(fetchSince).getTime())) {
      return NextResponse.json({ error: 'Invalid fetchSince value' }, { status: 400 })
    }

    const admin = getSupabaseAdmin()

    let query = admin
      .from('connected_accounts')
      .update({ fetch_since: fetchSince })
      .eq('user_email', user.email)

    if (provider) {
      query = query.eq('provider', provider)
    }

    const { data, error } = await query.select('id, provider')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ error: 'No connected accounts updated' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
