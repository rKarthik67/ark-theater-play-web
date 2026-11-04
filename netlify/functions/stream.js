// Proxies to ARKVideoScrapper, but only for requests carrying a valid signed
// session token from unlock.js - an unauthenticated request never reaches
// the scraper at all. This is the function that actually makes the feature
// private: the client UI gate (triple-click + password modal) just decides
// when to show the button that calls this, it has no bearing on whether a
// request here succeeds.
const crypto = require('crypto');

const SCRAPER_BASE_URL =
  process.env.ARKSCRAPER_BASE_URL || 'https://arkscraper.duckdns.org';
const REQUEST_TIMEOUT_MS = 45000;

exports.handler = async (event) => {
  const secret = process.env.ARKPLAY_STREAM_SECRET;
  if (!secret) {
    return json(500, { error: 'Server not configured' });
  }

  const params = event.queryStringParameters || {};
  if (!verifyToken(params.token, secret)) {
    return json(401, { error: 'Unauthorized' });
  }

  const { type, tmdbId, season, episode, provider } = params;
  if ((type !== 'movie' && type !== 'tv') || !/^\d+$/.test(tmdbId || '')) {
    return json(400, { error: 'Missing or invalid parameters' });
  }
  if (type === 'tv' && (!/^\d+$/.test(season || '') || !/^\d+$/.test(episode || ''))) {
    return json(400, { error: 'Missing or invalid season/episode' });
  }
  // ARKVideoScrapper has no "auto-pick a provider" mode - a provider must
  // always be named explicitly. The client is expected to supply one by
  // replicating ARKTheater's own provider-waterfall (see providers.js and
  // streamGate.js) rather than this function guessing one on its own.
  if (!provider) {
    return json(400, { error: 'Missing provider parameter' });
  }

  const url = new URL(
    type === 'tv' ? '/api/v2/stream-tv' : '/api/v2/stream-movie',
    SCRAPER_BASE_URL
  );
  url.searchParams.set('tmdbId', tmdbId);
  if (type === 'tv') {
    url.searchParams.set('season', season);
    url.searchParams.set('episode', episode);
  }
  if (provider) url.searchParams.set('provider', provider);

  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
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
