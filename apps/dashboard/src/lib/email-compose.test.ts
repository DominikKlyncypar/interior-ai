import assert from 'node:assert/strict'

import {
  buildReplyContent,
  buildGmailReplyMime,
  encodeGmailRawMessage
} from './email-compose.ts'

const tests: Array<{ name: string; run: () => void }> = [
  {
    name: 'buildReplyContent appends the signature once in text output',
    run: () => {
      const branding = {
        email_signature_text: 'Jordan\nStudio North'
      }

      const content = buildReplyContent('Thanks for the update.\n\nJordan\nStudio North', branding)

      assert.equal(content.text, 'Thanks for the update.\n\nJordan\nStudio North')
    }
  },
  {
    name: 'buildReplyContent escapes html and injects the branded signature html',
    run: () => {
      const branding = {
        email_signature_text: 'Jordan',
        email_signature_html:
          '<table><tr><td><img src="{{logo_url}}" /></td><td>Jordan</td></tr></table>',
        logo_url: 'https://cdn.example.com/logo.png'
      }
      const inlineAttachment = {
        contentId: 'signature-logo@interior-ai',
        filename: 'logo.png',
        contentType: 'image/png',
        contentBytes: 'aGVsbG8='
      }

      const content = buildReplyContent(
        'Line one\nLine two\n\n<script>alert(1)</script>',
        branding,
        inlineAttachment
      )

      assert.match(content.html, /<p style="margin:0 0 12px;">Line one<br \/>Line two<\/p>/)
      assert.match(content.html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/)
      assert.match(content.html, /cid:signature-logo@interior-ai/)
    }
  },
  {
    name: 'buildReplyContent swaps a literal saved logo url for cid when embedding inline',
    run: () => {
      const branding = {
        email_signature_text: 'Jordan',
        email_signature_html:
          '<table><tr><td><img src="https://cdn.example.com/logo.png" /></td><td>Jordan</td></tr></table>',
        logo_url: 'https://cdn.example.com/logo.png'
      }
      const inlineAttachment = {
        contentId: 'signature-logo@interior-ai',
        filename: 'logo.png',
        contentType: 'image/png',
        contentBytes: 'aGVsbG8='
      }

      const content = buildReplyContent('Hello', branding, inlineAttachment)

      assert.doesNotMatch(content.html, /https:\/\/cdn\.example\.com\/logo\.png/)
      assert.match(content.html, /cid:signature-logo@interior-ai/)
    }
  },
  {
    name: 'buildReplyContent swaps any detected signature image source for cid when embedding inline',
    run: () => {
      const branding = {
        email_signature_text: 'Jordan',
        email_signature_html:
          '<table><tr><td><img src="https://mail.google.com/sig/logo.png?abc=1" /></td><td>Jordan</td></tr></table>',
        logo_url: 'https://cdn.example.com/logo.png'
      }
      const inlineAttachment = {
        contentId: 'signature-logo@interior-ai',
        filename: 'logo.png',
        contentType: 'image/png',
        contentBytes: 'aGVsbG8=',
        sourceUrl: 'https://mail.google.com/sig/logo.png?abc=1'
      }

      const content = buildReplyContent('Hello', branding, inlineAttachment)

      assert.doesNotMatch(content.html, /mail\.google\.com\/sig\/logo\.png/)
      assert.match(content.html, /cid:signature-logo@interior-ai/)
    }
  },
  {
    name: 'buildReplyContent injects an uploaded logo when signature html has no image tag',
    run: () => {
      const branding = {
        email_signature_text: 'Jordan',
        email_signature_html: '<div>Jordan<br />Studio North</div>',
        logo_url: 'https://cdn.example.com/logo.png'
      }
      const inlineAttachment = {
        contentId: 'signature-logo@interior-ai',
        filename: 'logo.png',
        contentType: 'image/png',
        contentBytes: 'aGVsbG8=',
        sourceUrl: 'https://cdn.example.com/logo.png'
      }

      const content = buildReplyContent('Hello', branding, inlineAttachment)

      assert.match(content.html, /<img src="cid:signature-logo@interior-ai"/)
      assert.match(content.html, /Jordan<br \/>Studio North/)
    }
  },
  {
    name: 'buildGmailReplyMime builds a multipart email with text and html parts',
    run: () => {
      const content = buildReplyContent('Hello there', {
        email_signature_text: 'The Team',
        email_signature_html: '<div>The Team</div>'
      })

      const mime = buildGmailReplyMime({
        toEmail: 'client@example.com',
        subject: 'Re: Design update',
        content
      })

      assert.match(mime, /^To: client@example\.com/m)
      assert.match(mime, /^Subject: Re: Design update/m)
      assert.match(mime, /Content-Type: multipart\/alternative; boundary="reply-boundary"/)
      assert.match(mime, /Content-Type: text\/plain; charset=utf-8/)
      assert.match(mime, /Hello there\n\nThe Team/)
      assert.match(mime, /Content-Type: text\/html; charset=utf-8/)
      assert.match(mime, /<div style="margin-top:20px;"><div>The Team<\/div><\/div>/)
    }
  },
  {
    name: 'buildGmailReplyMime includes a related inline image part when provided',
    run: () => {
      const inlineAttachment = {
        contentId: 'signature-logo@interior-ai',
        filename: 'logo.png',
        contentType: 'image/png',
        contentBytes: 'aGVsbG8='
      }
      const content = buildReplyContent(
        'Hello there',
        {
          email_signature_text: 'The Team',
          email_signature_html: '<div><img src="{{logo_url}}" />The Team</div>',
          logo_url: 'https://cdn.example.com/logo.png'
        },
        inlineAttachment
      )

      const mime = buildGmailReplyMime({
        toEmail: 'client@example.com',
        subject: 'Re: Design update',
        content,
        inlineAttachment
      })

      assert.match(mime, /Content-Type: multipart\/related; boundary="related-boundary"/)
      assert.match(mime, /Content-ID: <signature-logo@interior-ai>/)
      assert.match(mime, /Content-Disposition: inline; filename="logo.png"/)
      assert.match(mime, /cid:signature-logo@interior-ai/)
      assert.match(mime, /\naGVsbG8=\n/)
    }
  },
  {
    name: 'encodeGmailRawMessage returns base64url without padding',
    run: () => {
      const encoded = encodeGmailRawMessage('test+/=')

      assert.doesNotMatch(encoded, /=/)
      assert.doesNotMatch(encoded, /\+/)
      assert.doesNotMatch(encoded, /\//)
      assert.equal(encoded, 'dGVzdCsvPQ')
    }
  }
]

let failures = 0

for (const testCase of tests) {
  try {
    testCase.run()
    console.log(`PASS ${testCase.name}`)
  } catch (error) {
    failures += 1
    console.error(`FAIL ${testCase.name}`)
    console.error(error)
  }
}

if (failures > 0) {
  process.exitCode = 1
} else {
  console.log(`PASS ${tests.length} tests`)
}
