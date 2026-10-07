// utils/checkUrl.js
// THE core feature of LinkGraveyard: actually visiting a saved URL and
// reporting what happened. The strategy is deliberately simple:
//
//   1. Send one request with redirects DISABLED so a 3xx response is visible
//      to us instead of being silently followed.
//   2. Classify the result:
//        2xx       -> healthy
//        3xx       -> redirected (record where it points to)
//        4xx/5xx   -> broken
//        timeout / DNS failure -> unknown (a temporary problem should not
//        permanently mark a link as dead)
//
//   A network problem (site is down right now, DNS hiccup) is reported as
//   'never_checked' on purpose: the resource is probably not gone forever, we
//   simply could not reach it this time.

const axios = require('axios');
const dns = require('dns').promises;
const net = require('net');

const TIMEOUT_MS = 12000; // never let a user-supplied URL hang the server

// Returns true if an IP address is private / loopback / link-local.
// Checking a URL that points at a private address would be a security
// problem (SSRF): a user could trick the server into probing internal
// services (e.g. localhost, cloud metadata endpoints like 169.254.169.254).
function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const parts = ip.split('.').map(Number);
    return (
      parts[0] === 10 || // 10.0.0.0/8
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) || // 172.16.0.0/12
      (parts[0] === 192 && parts[1] === 168) || // 192.168.0.0/16
      parts[0] === 127 || // 127.0.0.0/8 (loopback)
      ip === '169.254.169.254' || // cloud instance metadata
      parts[0] === 0
    );
  }
  if (net.isIPv6(ip)) {
    const lower = ip.toLowerCase();
    return (
      lower === '::1' || // loopback
      lower.startsWith('fc') || // unique local
      lower.startsWith('fd') || // unique local
      lower.startsWith('fe80') // link-local
    );
  }
  return true; // unknown format -> refuse to check
}

// Resolve the hostname to an IP and reject private targets BEFORE sending
// any request. Also rejects obviously bad protocols.
async function guardAgainstInternalTargets(url) {
  const parsed = new URL(url);
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new Error('Blocked: only http and https URLs can be checked.');
  }

  const hostname = parsed.hostname;
  if (hostname === 'localhost' || hostname.endsWith('.localhost')) {
    throw new Error('Blocked: localhost URLs cannot be checked.');
  }

  let addresses;
  try {
    // all: true returns every resolved address (A and AAAA records).
    addresses = await dns.lookup(hostname, { all: true });
  } catch {
    // DNS failed entirely — the domain probably doesn't exist.
    // We surface this as a plain network error so checkUrl can report 'never_checked'.
    throw new Error('Network error: could not resolve the domain name.');
  }

  if (addresses.every((a) => isPrivateIp(a.address))) {
    throw new Error('Blocked: this URL points to a private or internal address.');
  }
}

async function checkUrl(rawUrl) {
  const startedAt = Date.now();
  const url = String(rawUrl).trim();

  // Fail fast on internal targets before any network traffic.
  try {
    await guardAgainstInternalTargets(url);
  } catch (err) {
    return {
      status: 'never_checked',
      httpStatus: null,
      finalUrl: null,
      responseTime: Date.now() - startedAt,
      errorMessage: err.message,
    };
  }

  try {
    // maxRedirects: 0 means axios throws on 3xx instead of following it,
    // so we can see the redirect ourselves and store the target URL.
    const response = await axios.get(url, {
      timeout: TIMEOUT_MS,
      maxRedirects: 0,
      // Some sites reject requests without a normal browser User-Agent.
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36 LinkGraveyard/1.0',
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      // Do not let axios throw on 4xx/5xx — we want to classify them ourselves.
      validateStatus: () => true,
    });

    const responseTime = Date.now() - startedAt;
    return { ...classifyResponse(response.status, response.headers.location, url), responseTime };
  } catch (err) {
    const responseTime = Date.now() - startedAt;

    if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
      return {
        status: 'never_checked',
        httpStatus: null,
        finalUrl: null,
        responseTime,
        errorMessage: 'The request timed out. The site may be slow or temporarily unreachable.',
      };
    }

    // DNS failures are temporary — the domain didn't resolve, which says
    // nothing about whether the resource still exists.
    if (err.code === 'ENOTFOUND' || err.code === 'EAI_AGAIN') {
      return {
        status: 'never_checked',
        httpStatus: null,
        finalUrl: null,
        responseTime,
        errorMessage: 'Could not reach the site. This may be temporary (DNS failure).',
      };
    }

    // SSL/TLS failures get their own message so the user knows it's a
    // certificate problem (expired, self-signed, wrong hostname) — not a
    // dead link and not a network hiccup.
    const SSL_CODES = new Set([
      'CERT_HAS_EXPIRED',
      'UNABLE_TO_VERIFY_LEAF_SIGNATURE',
      'ERR_TLS_CERT_ALT_NAME_INVALID',
      'DEPTH_ZERO_SELF_SIGNED_CERT',
      'SELF_SIGNED_CERT_IN_CHAIN',
    ]);
    if (err.code && SSL_CODES.has(err.code)) {
      return {
        status: 'never_checked',
        httpStatus: null,
        finalUrl: null,
        responseTime,
        errorMessage: "SSL certificate error — the site's certificate is invalid or expired.",
      };
    }

    return {
      status: 'never_checked',
      httpStatus: null,
      finalUrl: null,
      responseTime,
      errorMessage: 'Could not reach the site. This may be temporary.',
    };
  }
}

// Pure function: map an HTTP status code to a link status.
// Exported separately so it can be unit-tested without network access.
function classifyResponse(httpStatus, locationHeader, originalUrl) {
  if (httpStatus >= 200 && httpStatus < 300) {
    return { status: 'healthy', httpStatus, finalUrl: null, errorMessage: null };
  }

  if (httpStatus >= 300 && httpStatus < 400) {
    // Where does the redirect point? Prefer the Location header, and try
    // to resolve it to an absolute URL relative to the original.
    let finalUrl = locationHeader || null;
    if (finalUrl) {
      try {
        finalUrl = new URL(finalUrl, originalUrl).toString();
      } catch {
        // keep the raw value if it can't be resolved
      }
    }
    return {
      status: 'redirected',
      httpStatus,
      finalUrl,
      errorMessage: `Redirected to ${finalUrl || 'another location'}`,
    };
  }

  // 4xx and 5xx: the server answered, but the resource is not available.
  // NOTE: this is a real response (e.g. 404), so we mark it 'broken' —
  // unlike network failures, which become 'never_checked'.
  return {
    status: 'broken',
    httpStatus,
    finalUrl: null,
    errorMessage: `HTTP ${httpStatus}: the page could not be loaded.`,
  };
}

module.exports = { checkUrl, classifyResponse, TIMEOUT_MS };
