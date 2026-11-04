// Gated proxy for ARKVideoScrapper's enabled-provider list, so the client
// can replicate ARKTheater's own provider-waterfall (see
// video_providers/provider_loader.dart) instead of hardcoding one provider
// that would break the moment it goes down.
const crypto = require('crypto');

const SCRAPER_BASE_URL =
  process.env.ARKSCRAPER_BASE_URL || 'https://arkscraper.duckdns.org';
const REQUEST_TIMEOUT_MS = 15000;

exports.handler = async (event) => {
  const secret = process.env.ARKPLAY_STREAM_SECRET;
  if (!secret) return json(500, { error: 'Server not configured' });

  const token = (event.queryStringParameters || {}).token;
  if (!verifyToken(token, secret)) return json(401, { error: 'Unauthorized' });

  try {
    const response = await fetch(new URL('/api/v2/providers', SCRAPER_BASE_URL), {
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    const body = await response.json();
    return json(response.status, body);
  } catch {
    return json(502, { error: 'Upstream scraper request failed' });
  }
};

function verifyToken(token, secret) {
  if (!token || typeof token !== 'string') return false;
  const [data, signature] = token.split('.');
  if (!data || !signature) return false;
  const expectedSignature = crypto.createHmac('sha256', secret).update(data).digest('base64url');
  const sigBuf = Buffer.from(signature);
  const expectedBuf = Buffer.from(expectedSignature);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return false;
  }
  try {
    const payload = JSON.parse(Buffer.from(data, 'base64url').toString());
    return typeof payload.expiresAt === 'number' && payload.expiresAt > Date.now();
  } catch {
    return false;
  }
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  };
}
