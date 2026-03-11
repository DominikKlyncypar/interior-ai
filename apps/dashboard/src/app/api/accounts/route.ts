import { NextResponse } from 'next/server'
import { getSupabase } from '@/lib/supabase'

export async function GET() {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('connected_accounts')
    .select('id, user_email, provider')

  if (error) return NextResponse.json([], { status: 500 })
  return NextResponse.json(data)
}