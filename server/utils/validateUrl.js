// utils/validateUrl.js
// Shared URL validation used by both the link controller and the checker.
// A URL is only accepted if it parses as a real HTTP(S) URL.

function normalizeUrl(raw) {
  // Trim whitespace and remove a trailing slash so that
  // "https://example.com" and "https://example.com/" count as the same URL
  // for the duplicate check.
  let cleaned = String(raw || '').trim();
  if (cleaned.length > 'https://x'.length && cleaned.endsWith('/')) {
    cleaned = cleaned.replace(/\/+$/, '');
  }
  return cleaned;
}

function isValidUrl(raw) {
  try {
    const parsed = new URL(normalizeUrl(raw));
    // Only http and https are allowed — javascript:, file:, data: etc.
    // would be nonsense to "check" and could be dangerous.
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false; // URL constructor throws for strings that aren't URLs
  }
}

function getDomain(raw) {
  try {
    return new URL(normalizeUrl(raw)).hostname;
  } catch {
    return '';
  }
}

module.exports = { normalizeUrl, isValidUrl, getDomain };
