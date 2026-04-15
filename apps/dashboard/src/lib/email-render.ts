const BLOCKED_TAGS = ['script', 'noscript', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'textarea', 'select', 'base']

const BLOCKED_ATTRS = new Set(['srcdoc'])

const isUnsafeUrl = (value: string) => /^\s*(javascript:|data:text\/html)/i.test(value)

const looksLikeHtml = (value?: string | null) =>
  Boolean(value?.trim() && /<\/?(html|body|div|span|p|br|table|tr|td|h[1-6]|a|img|style|section|article|ul|ol|li)\b/i.test(value))

export const buildEmailPreviewDocument = (bodyHtml?: string | null, bodyText?: string | null) => {
  const source = bodyHtml?.trim() || (looksLikeHtml(bodyText) ? bodyText!.trim() : null)
  if (!source) return null

  const parser = new DOMParser()
  const doc = parser.parseFromString(source, 'text/html')

  for (const tag of BLOCKED_TAGS) {
    doc.querySelectorAll(tag).forEach((node) => node.remove())
  }

  doc.querySelectorAll<HTMLElement>('*').forEach((node) => {
    for (const attr of Array.from(node.attributes)) {
      const name = attr.name.toLowerCase()
      const value = attr.value || ''

      if (name.startsWith('on') || BLOCKED_ATTRS.has(name)) {
        node.removeAttribute(attr.name)
        continue
      }

      if ((name === 'href' || name === 'src') && isUnsafeUrl(value)) {
        node.removeAttribute(attr.name)
      }
    }
  })

  return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      html, body {
        margin: 0;
        padding: 0;
        background: #ffffff;
      }

      body {
        color: #111111;
        overflow-wrap: anywhere;
      }

      img, table {
        max-width: 100%;
      }
    </style>
  </head>
  <body>${doc.body.innerHTML}</body>
</html>`
}
