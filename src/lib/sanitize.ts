import sanitizeHtml from 'sanitize-html';

// Configuração de sanitização para prevenir XSS
// Compatível com ambiente serverless (não depende de jsdom)
const SANITIZE_CONFIG: sanitizeHtml.IOptions = {
  allowedTags: [
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'strike',
    'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'blockquote', 'code', 'pre',
    'img', 'a', 'span', 'div', 'mark'
  ],
  allowedAttributes: {
    'a': ['href', 'target', 'rel'],
    'img': ['src', 'alt', 'width', 'height', 'data-width', 'data-height', 'data-align'],
    'span': ['class', 'style'],
    'div': ['class', 'style'],
    'p': ['class', 'style'],
    'mark': ['class', 'style', 'data-color'],
    '*': ['class']
  },
  allowedStyles: {
    '*': {
      'color': [/.*/],
      'background-color': [/.*/],
      'text-align': [/^left$/, /^right$/, /^center$/, /^justify$/],
      'font-family': [/.*/],
      'font-size': [/.*/],
      'font-weight': [/.*/],
      'font-style': [/.*/],
      'text-decoration': [/.*/],
    }
  },
  disallowedTagsMode: 'discard',
  selfClosing: ['img', 'br'],
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesByTag: {
    img: ['http', 'https', 'data']
  },
};

/**
 * Sanitiza HTML para prevenir XSS
 * Usa sanitize-html que funciona em ambiente serverless (sem jsdom)
 */
export function sanitizeHTML(html: string): string {
  if (!html) return '';
  return sanitizeHtml(html, SANITIZE_CONFIG);
}
