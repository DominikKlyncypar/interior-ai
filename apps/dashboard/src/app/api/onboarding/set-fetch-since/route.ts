import { NextRequest, NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'
import { getServerSession } from 'next-auth'

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession()

    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { fetchSince } = await req.json()

    const supabase = getSupabase()

    const { error } = await supabase
      .from('connected_accounts')
      .update({ fetch_since: fetchSince })
      .eq('user_email', session.user.email)
      .eq('provider', 'gmail')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}