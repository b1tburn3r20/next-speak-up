
import DOMPurify from 'dompurify';

export const sanitizeText = (dirtytext: string) => {
  return DOMPurify.sanitize(dirtytext, { USE_PROFILES: { html: true } })
}


