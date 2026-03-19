import Anthropic from '@anthropic-ai/sdk'
import { RawEmail, ProcessedEmail } from './email.types'

const client = new Anthropic()

export const processEmail = async (email: RawEmail): Promise<ProcessedEmail> => {
  const attachmentSummary = email.attachments.length > 0
    ? email.attachments
        .map(attachment => {
          const extracted = attachment.extractedText
            ? `\nExtracted text:\n${attachment.extractedText.slice(0, 3000)}`
            : ''
          return `${attachment.filename} (${attachment.mimeType}, ${attachment.sizeBytes} bytes, ${attachment.status || 'stored'})${extracted}`
        })
        .join('\n')
    : 'None'

  const prompt = `You are the email assistant for an interior design firm that specializes in commercial projects - office, hospitality, and medical spaces.

Your job is to read this email and respond with a JSON object containing:
1. category: one of "new_lead", "existing_client", "vendor", "urgent", "admin", "spam"
   - Only use "spam" for obvious mass marketing emails with no personal relevance
   - Receipts, notifications, and personal emails should be "admin"
   - Anything that could be a business opportunity should be "new_lead"
2. urgency: one of "high", "medium", "low"
3. summary: one sentence describing what this email is about
4. draftReply: a helpful, professional reply in our voice - warm, concise, never salesy.
   - For admin/notification emails, draft a brief acknowledgment
   - For leads, draft an enthusiastic but professional response
   - Sign off as "The Team"

Email:
Subject: ${email.subject}
From: ${email.from}
Body:
${email.bodyText || email.body}

Attachments:
${attachmentSummary}

Respond ONLY with a valid JSON object, no markdown, no explanation.`

  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1000,
    messages: [{ role: 'user', content: prompt }]
  })

  const text = message.content[0].type === 'text' ? message.content[0].text : ''
  const parsed = JSON.parse(text)

  return {
    ...email,
    category: parsed.category,
    urgency: parsed.urgency,
    summary: parsed.summary,
    draftReply: parsed.draftReply
  }
}
