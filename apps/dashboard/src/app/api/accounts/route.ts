import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase-server'

export async function GET() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) {
    return NextResponse.json([], { status: 401 })
  }

  const { data, error } = await supabase
    .from('connected_accounts')
    .select('id, user_email, provider')

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data)
}