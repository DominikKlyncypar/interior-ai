import { getSupabase } from '../../lib/supabase'
import { fetchUnreadEmails } from './email.fetcher'
import { processEmail } from './email.processor'
import { ConnectedAccount } from './email.types'
import logger from '../../lib/logger'

export const emailAgent = {
  run: async () => {
    const supabase = getSupabase()
    logger.info('Email agent starting...')

    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('provider', 'gmail')

    if (error) throw new Error(`Failed to fetch accounts: ${error.message}`)
    if (!accounts || accounts.length === 0) {
      logger.info('No connected Gmail accounts found')
      return
    }

    logger.info(`Found ${accounts.length} connected account(s)`)

    for (const account of accounts as ConnectedAccount[]) {
      logger.info(`Processing emails for ${account.user_email}`)

      await supabase.from('agent_logs').insert({
        agent: 'email',
        status: 'started',
        summary: `Processing emails for ${account.user_email}`
      })
      try {
        const emails = await fetchUnreadEmails(account)
        logger.info(`Found ${emails.length} unread emails`)

        for (const email of emails) {
          const processed = await processEmail(email)

          let contactId = null
          const { data: existingContact } = await supabase
            .from('contacts')
            .select('id')
            .eq('email', processed.from)
            .single()

          if (existingContact) {
            contactId = existingContact.id
          } else {
            const { data: newContact } = await supabase
              .from('contacts')
              .insert({ email: processed.from, type: 'lead', source: 'email' })
              .select('id')
              .single()
            contactId = newContact?.id
          }

          await supabase.from('emails').insert({
            gmail_id: email.id,
            contact_id: contactId,
            subject: processed.subject,
            body: processed.body,
            category: processed.category,
            urgency: processed.urgency,
            summary: processed.summary,
            draft_reply: processed.draftReply,
            status: 'pending_review',
            received_at: processed.receivedAt
          })
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