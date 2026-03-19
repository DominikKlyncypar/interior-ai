import { NextRequest, NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  try {
    const { attachmentId } = await req.json()

    if (!attachmentId) {
      return NextResponse.json({ error: 'attachmentId is required' }, { status: 400 })
    }

    const supabase = getSupabaseAdmin()
    const { data: attachment, error } = await supabase
      .from('email_attachments')
      .select('storage_bucket, storage_path')
      .eq('id', attachmentId)
      .single()

    if (error || !attachment) {
      return NextResponse.json({ error: 'Attachment not found' }, { status: 404 })
    }

    const { data, error: signedUrlError } = await supabase.storage
      .from(attachment.storage_bucket)
      .createSignedUrl(attachment.storage_path, 60 * 10)

    if (signedUrlError || !data?.signedUrl) {
      return NextResponse.json({ error: signedUrlError?.message || 'Failed to create signed URL' }, { status: 500 })
    }

    return NextResponse.json({ url: data.signedUrl })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
