import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import { createSupabaseServerClient } from '@/lib/supabase-server'

const BUCKET = 'email-branding'

export async function POST(req: NextRequest) {
  try {
    const authClient = await createSupabaseServerClient()
    const { data: { user } } = await authClient.auth.getUser()
    if (!user?.email) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const formData = await req.formData()
    const accountEmail = String(formData.get('accountEmail') || '')
    const file = formData.get('file')

    if (!accountEmail || !(file instanceof File)) {
      return NextResponse.json({ error: 'accountEmail and file are required' }, { status: 400 })
    }

    const bytes = Buffer.from(await file.arrayBuffer())
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const path = `${accountEmail}/${Date.now()}-${safeName}`

    const supabase = getSupabaseAdmin()
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, bytes, {
        contentType: file.type || 'application/octet-stream',
        upsert: false
      })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(path)

    await supabase
      .from('connected_accounts')
      .update({ logo_url: data.publicUrl })
      .eq('user_email', accountEmail)

    return NextResponse.json({ url: data.publicUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
