import Anthropic from '@anthropic-ai/sdk'
import { RawEmail, ProcessedEmail } from './email.types'

const client = new Anthropic()

export const processEmail = async (email: RawEmail): Promise<ProcessedEmail> => {
  const prompt = `You are the email assistant for an interior design firm that specializes in commercial projects — office, hospitality, and medical spaces.

Your job is to read this email and respond with a JSON object containing:
1. category: one of "new_lead", "existing_client", "vendor", "urgent", "admin", "spam"
2. urgency: one of "high", "medium", "low"
3. summary: one sentence describing what this email is about
4. draftReply: a reply in our voice — professional, warm, concise. Never salesy. Sign off as "The Team".

Email:
Subject: ${email.subject}
From: ${email.from}
Body: ${email.body}

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