import { getSupabase } from '../../lib/supabase'
import { fetchUnreadEmails } from './email.fetcher'
import { processEmail } from './email.processor'
import { ConnectedAccount } from './email.types'

export const emailAgent = {
  run: async () => {
    const supabase = getSupabase()
    console.log('📧 Email agent starting...')

    // Get all connected Gmail accounts
    const { data: accounts, error } = await supabase
      .from('connected_accounts')
      .select('*')
      .eq('provider', 'gmail')

    if (error) throw new Error(`Failed to fetch accounts: ${error.message}`)
    if (!accounts || accounts.length === 0) {
      console.log('No connected Gmail accounts found')
      return
    }

    console.log(`Found ${accounts.length} connected account(s)`)

    for (const account of accounts as ConnectedAccount[]) {
      console.log(`Processing emails for ${account.user_email}`)

      // Log agent start
      await supabase.from('agent_logs').insert({
        agent: 'email',
        status: 'started',
        summary: `Processing emails for ${account.user_email}`
      })

      try {
        // Fetch unread emails
        const emails = await fetchUnreadEmails(account)
        console.log(`Found ${emails.length} unread emails`)

        for (const email of emails) {
          // Process with Claude
          const processed = await processEmail(email)

          // Find or create contact
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

          // Save to Supabase
          await supabase.from('emails').insert({
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

          console.log(`✅ Processed: ${processed.subject} [${processed.category}]`)
        }

        // Log agent completion
        await supabase.from('agent_logs').insert({
          agent: 'email',
          status: 'completed',
          summary: `Processed ${emails.length} emails for ${account.user_email}`
        })

      } catch (err: any) {
        console.error(`❌ Error processing ${account.user_email}:`, err.message)
        await supabase.from('agent_logs').insert({
          agent: 'email',
          status: 'failed',
          summary: err.message
        })
      }
    }

    console.log('📧 Email agent finished')
  }
}