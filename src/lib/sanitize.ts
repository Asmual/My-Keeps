/**
 * HTML Sanitizer for Rich Text Notes
 * Preserves safe rich-text formatting tags (headings, bold, italics, highlights, text colors, blockquotes)
 * while stripping out dangerous tags and malicious attributes (scripts, iframes, onerror, javascript: links).
 */

const ALLOWED_TAGS = new Set([
  'B',
  'STRONG',
  'I',
  'EM',
  'U',
  'S',
  'STRIKE',
  'MARK',
  'SPAN',
  'FONT',
  'H1',
  'H2',
  'H3',
  'H4',
  'H5',
  'H6',
  'P',
  'DIV',
  'BLOCKQUOTE',
  'BR',
  'HR',
  'UL',
  'OL',
  'LI',
  'A',
]);

const ALLOWED_ATTRS = new Set([
  'STYLE',
  'COLOR',
  'FACE',
  'SIZE',
  'CLASS',
  'HREF',
  'TARGET',
  'REL',
  'DATA-COLOR',
]);

export function sanitizeHtml(rawHtml: string): string {
  if (!rawHtml) return '';
  if (typeof window === 'undefined') {
    // Basic server-side regex strip for script/iframe
    return rawHtml
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
      .replace(/\s*on\w+\s*=\s*(["'][^"']*["']|[^\s>]+)/gi, '');
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(rawHtml, 'text/html');

    function cleanNode(node: Node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const element = node as HTMLElement;
        const tagName = element.tagName.toUpperCase();

        if (!ALLOWED_TAGS.has(tagName)) {
          // Replace disallowed element with its children or remove
          while (element.firstChild) {
            element.parentNode?.insertBefore(element.firstChild, element);
          }
          element.parentNode?.removeChild(element);
          return;
        }

        // Clean attributes
        const attributes = Array.from(element.attributes);
        for (const attr of attributes) {
          const attrName = attr.name.toUpperCase();
          if (!ALLOWED_ATTRS.has(attrName)) {
            element.removeAttribute(attr.name);
          } else if (attrName === 'HREF') {
            const val = attr.value.trim().toLowerCase();
            if (val.startsWith('javascript:') || val.startsWith('data:')) {
              element.removeAttribute(attr.name);
            }
          } else if (attrName === 'STYLE') {
            // Strip out dangerous CSS expressions
            const val = attr.value.toLowerCase();
            if (val.includes('expression(') || val.includes('behavior:') || val.includes('javascript:')) {
              element.removeAttribute(attr.name);
            }
          }
        }
      }

      // Recursively clean children
      const children = Array.from(node.childNodes);
      for (const child of children) {
        cleanNode(child);
      }
    }

    cleanNode(doc.body);
    return doc.body.innerHTML;
  } catch {
    return rawHtml;
  }
}

/**
 * Extracts plain text from an HTML string for word & character counting
 */
export function extractPlainText(html: string): string {
  if (!html) return '';
  if (typeof window === 'undefined') {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }
  const div = document.createElement('div');
  div.innerHTML = html;
  return (div.textContent || div.innerText || '').trim();
}
