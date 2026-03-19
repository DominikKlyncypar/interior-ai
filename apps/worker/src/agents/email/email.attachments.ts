import { SupabaseClient } from '@supabase/supabase-js'
import { RawAttachment } from './email.types'
import { safeFilename } from './email.content'

const ATTACHMENTS_BUCKET = 'email-attachments'

export const storeEmailAttachments = async (
  supabase: SupabaseClient,
  emailId: string,
  accountEmail: string,
  messageId: string,
  attachments: RawAttachment[]
) => {
  if (attachments.length === 0) return

  const rows = []

  for (const [index, attachment] of attachments.entries()) {
    let storagePath = `${accountEmail}/${messageId}/${index + 1}-${safeFilename(attachment.filename)}`
    let status = attachment.status || 'stored'

    if (attachment.content && status === 'stored') {
      const { error } = await supabase.storage
        .from(ATTACHMENTS_BUCKET)
        .upload(storagePath, attachment.content, {
          contentType: attachment.mimeType,
          upsert: false
        })

      if (error) {
        throw new Error(`Attachment upload failed for ${attachment.filename}: ${error.message}`)
      }
    } else {
      storagePath = `${accountEmail}/${messageId}/skipped-${safeFilename(attachment.filename)}`
    }

    rows.push({
      email_id: emailId,
      filename: attachment.filename,
      mime_type: attachment.mimeType,
      size_bytes: attachment.sizeBytes,
      storage_bucket: ATTACHMENTS_BUCKET,
      storage_path: storagePath,
      provider_attachment_id: attachment.providerAttachmentId,
      is_inline: attachment.isInline,
      status,
      extracted_text: attachment.extractedText
    })
  }

  const { error } = await supabase.from('email_attachments').insert(rows)
  if (error) {
    throw new Error(`Attachment metadata insert failed: ${error.message}`)
  }
}
