import sanitize from 'sanitize-html';

const ALLOWED_TAGS = ['p', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'h2', 'h3', 'br'];

/**
 * Sanitizes HTML content by only allowing a whitelist of safe tags.
 * Strips all attributes (no class, style, onclick, etc.).
 * Strips all non-whitelisted tags and their content (e.g., <script>, <iframe>).
 *
 * Safe for both plain text (returns unchanged) and HTML input.
 */
export function sanitizeContent(dirty: string): string {
  return sanitize(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},         // No attributes allowed on any tag
    allowedSchemes: [],            // No URL schemes (no href, src, etc.)
    disallowedTagsMode: 'discard', // Remove disallowed tags and their content
  });
}
