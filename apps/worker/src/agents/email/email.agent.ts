import { getSupabase } from '../../lib/supabase'
import { fetchUnreadEmails } from './email.fetcher'
import { fetchUnreadOutlookEmails } from './outlook.fetcher'
import { processEmail } from './email.processor'
import { ConnectedAccount } from './email.types'
import logger from '../../lib/logger'
import { storeEmailAttachments } from './email.attachments'
import { enrichAttachmentsWithExtractedText } from './email.extract'

export const emailAgent = {
  run: async () => {
    const supabase = getSupabase()
    logger.info('Email agent starting...')

    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .in('provider', ['gmail', 'outlook'])

    if (error) throw new Error(`Failed to fetch accounts: ${error.message}`)
    if (!accounts || accounts.length === 0) {
      logger.info('No connected Gmail or Outlook accounts found')
      return
    }

    logger.info(`Found ${accounts.length} connected account(s)`)

    for (const account of accounts as ConnectedAccount[]) {
      logger.info(`Processing emails for ${account.user_email} (${account.provider})`)

      await supabase.from('agent_logs').insert({
        agent: 'email',
        status: 'started',
        summary: `Processing emails for ${account.user_email}`
      })

      try {
        const emails = account.provider === 'outlook'
          ? await fetchUnreadOutlookEmails(account)
          : await fetchUnreadEmails(account)

        logger.info(`Found ${emails.length} unread emails`)

        for (const email of emails) {
          // Check if already processed
          const { data: existing } = await supabase
            .from('emails')
            .select('id')
            .eq('gmail_id', email.id)
            .single()

          if (existing) {
            logger.info(`Skipping already processed email: ${email.id}`)
            continue
          }

          const processed = await processEmail(
            {
              ...email,
              attachments: await enrichAttachmentsWithExtractedText(email.attachments)
            },
            {
              email_signature_text: account.email_signature_text,
              email_voice_guidelines: account.email_voice_guidelines
            }
          )

          // Find or create contact
          let contactId = null
          const contactEmail = processed.fromEmail || processed.from
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', contactEmail)
            .single()

          if (existingContact) {
            contactId = existingContact.id
          } else {
            const { data: newContact } = await supabase
              .from('contacts')
              .insert({ email: contactEmail, type: 'lead', source: 'email' })
              .select('id')
              .single()
            contactId = newContact?.id
          }

          const { data: insertedEmail, error: insertError } = await supabase.from('emails').insert({
            gmail_id: email.id,
            provider: account.provider,
            provider_message_id: email.id,
            account_email: account.user_email,
            contact_id: contactId,
            subject: processed.subject,
            body: processed.bodyText,
            body_text: processed.bodyText,
            body_html: processed.bodyHtml,
            snippet: processed.snippet,
            from_name: processed.fromName,
            from_email: processed.fromEmail,
            has_attachments: processed.attachments.length > 0,
            attachment_count: processed.attachments.length,
            category: processed.category,
            urgency: processed.urgency,
            summary: processed.summary,
            draft_reply: processed.draftReply,
            status: 'pending_review',
            received_at: processed.receivedAt
          }).select('id').single()

          if (insertError || !insertedEmail) {
            throw new Error(`Failed to insert processed email: ${insertError?.message || 'unknown error'}`)
          }

          await storeEmailAttachments(
            supabase,
            insertedEmail.id,
            account.user_email,
            email.id,
            processed.attachments
          )

          logger.info(`Processed: ${processed.subject} [${processed.category}]`)
        }

        await supabase.from('agent_logs').insert({
          agent: 'email',
          status: 'completed',
          summary: `Processed ${emails.length} emails for ${account.user_email}`
        })

      } catch (err: any) {
        logger.error(`Error processing ${account.user_email}: ${err.message}`)
        await supabase.from('agent_logs').insert({
          agent: 'email',
          status: 'failed',
          summary: err.message
        })
      }
    }

    logger.info('Email agent finished')
  }
}
