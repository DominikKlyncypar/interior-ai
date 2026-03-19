import mammoth from 'mammoth'
import { PDFParse } from 'pdf-parse'
import { RawAttachment } from './email.types'

const MAX_EXTRACTED_TEXT_CHARS = 12000

const clipText = (value: string) =>
  value
    .replace(/\r/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]{2,}/g, ' ')
    .trim()
    .slice(0, MAX_EXTRACTED_TEXT_CHARS)

const isDocx = (attachment: RawAttachment) =>
  attachment.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
  attachment.filename.toLowerCase().endsWith('.docx')

const isPdf = (attachment: RawAttachment) =>
  attachment.mimeType === 'application/pdf' ||
  attachment.filename.toLowerCase().endsWith('.pdf')

const isTextLike = (attachment: RawAttachment) =>
  attachment.mimeType.startsWith('text/') ||
  ['.md', '.txt', '.csv', '.json'].some(ext => attachment.filename.toLowerCase().endsWith(ext))

const extractSingleAttachmentText = async (attachment: RawAttachment): Promise<RawAttachment> => {
  if (!attachment.content || attachment.status && attachment.status !== 'stored') {
    return attachment
  }

  try {
    if (isPdf(attachment)) {
      const parser = new PDFParse({ data: attachment.content })
      const result = await parser.getText()
      await parser.destroy()
      return {
        ...attachment,
        extractedText: clipText(result.text || '')
      }
    }

    if (isDocx(attachment)) {
      const result = await mammoth.extractRawText({ buffer: attachment.content })
      return {
        ...attachment,
        extractedText: clipText(result.value || '')
      }
    }

    if (isTextLike(attachment)) {
      return {
        ...attachment,
        extractedText: clipText(attachment.content.toString('utf8'))
      }
    }

    return attachment
  } catch {
    return {
      ...attachment,
      status: 'extract_failed'
    }
  }
}

export const enrichAttachmentsWithExtractedText = async (attachments: RawAttachment[]) =>
  Promise.all(attachments.map(extractSingleAttachmentText))
