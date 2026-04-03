/**
 * Strips HTML tags from content and converts to clean plain text.
 * Handles common HTML patterns found in AI-generated teacher guides.
 */
export function cleanHtmlContent(text: string): string {
  if (!text || typeof text !== 'string') return text || '';

  let cleaned = text;

  // Replace <br>, <br/>, <br /> with newlines
  cleaned = cleaned.replace(/<br\s*\/?>/gi, '\n');

  // Replace block-level closing tags with newlines
  cleaned = cleaned.replace(/<\/(p|div|h[1-6]|li|tr)>/gi, '\n');

  // Replace <li> with dash prefix
  cleaned = cleaned.replace(/<li[^>]*>/gi, '- ');

  // Replace <ul>, <ol> tags with newlines
  cleaned = cleaned.replace(/<\/?(ul|ol)[^>]*>/gi, '\n');

  // Replace <strong>, <b> content with *content*
  cleaned = cleaned.replace(/<(strong|b)>(.*?)<\/\1>/gi, '*$2*');

  // Replace <em>, <i> content with _content_ (but not icon tags like <i class="fas...">)
  cleaned = cleaned.replace(/<em>(.*?)<\/em>/gi, '_$1_');
  cleaned = cleaned.replace(/<i>(.*?)<\/i>/gi, '_$1_');

  // Remove icon tags like <i class="fas fa-bullseye"></i>
  cleaned = cleaned.replace(/<i\s+class="[^"]*">\s*<\/i>/gi, '');

  // Remove all remaining HTML tags
  cleaned = cleaned.replace(/<[^>]*>/g, '');

  // Decode common HTML entities
  cleaned = cleaned.replace(/&amp;/g, '&');
  cleaned = cleaned.replace(/&lt;/g, '<');
  cleaned = cleaned.replace(/&gt;/g, '>');
  cleaned = cleaned.replace(/&quot;/g, '"');
  cleaned = cleaned.replace(/&#39;/g, "'");
  cleaned = cleaned.replace(/&nbsp;/g, ' ');

  // Clean up excessive whitespace / newlines
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  cleaned = cleaned.replace(/[ \t]+/g, ' ');

  // Clean up lines (trim each line)
  cleaned = cleaned
    .split('\n')
    .map(line => line.trim())
    .join('\n');

  return cleaned.trim();
}
