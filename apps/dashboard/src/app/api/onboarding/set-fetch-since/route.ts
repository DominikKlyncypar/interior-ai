import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { fetchSince, provider } = await req.json()

    if (!fetchSince || Number.isNaN(new Date(fetchSince).getTime())) {
      return NextResponse.json({ error: 'Invalid fetchSince value' }, { status: 400 })
    }

    const supabase = getSupabase()

    let query = supabase
      .from('connected_accounts')
      .update({ fetch_since: fetchSince })
      .eq('user_email', session.user.email)

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
