// Redeems a one-use 4-digit code - minted only by ARKTheater (see
// ARKVideoScrapper's routes/stream-unlock.ts, which requires
// STREAM_UNLOCK_APP_SECRET to generate one) - against the Oracle server,
// and if valid, issues a signed, time-limited session token for this site.
// ARKPLAY_STREAM_SECRET lives only in Netlify's environment variables and
// is never shipped in client JS, unlike a client-only "hidden button" gate,
// which anyone reading the page's source could bypass entirely.
const crypto = require('crypto');

const SCRAPER_BASE_URL =
  process.env.ARKSCRAPER_BASE_URL || 'https://arkscraper.duckdns.org';
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const secret = process.env.ARKPLAY_STREAM_SECRET;
  if (!secret) {
    return json(500, { error: 'Server not configured' });
  }

  let submitted;
  try {
    ({ passphrase: submitted } = JSON.parse(event.body || '{}'));
  } catch {
    return json(400, { error: 'Invalid request' });
  }

  const code = typeof submitted === 'string' ? submitted.trim() : '';
  if (!/^\d{4}$/.test(code)) {
    return json(400, { error: 'Enter the four-digit code.' });
  }

  let claimed;
  try {
    const response = await fetch(
      new URL('/api/v2/stream-unlock/claim', SCRAPER_BASE_URL),
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
        signal: AbortSignal.timeout(15000),
      }
    );
    claimed = await response.json();
    if (!response.ok || claimed.success !== true) {
      return json(response.status, { error: claimed.error || 'That code is invalid, used, or expired.' });
    }
  } catch {
    return json(502, { error: 'Could not reach the unlock server.' });
  }

  const expiresAt = Date.now() + TOKEN_TTL_MS;
  const token = signToken({ expiresAt }, secret);
  return json(200, { token, expiresAt });
};

function signToken(payload, secret) {
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  return `${data}.${signature}`;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
