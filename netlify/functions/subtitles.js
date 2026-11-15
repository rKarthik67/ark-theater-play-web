// Gated proxy for ARKVideoScrapper's /api/v2/subtitles (Wyzie Subs search),
// so the web player can offer the same "Search Subtitles" feature as
// ARKTheater's beta player without carrying the Wyzie API key itself - see
// ARKTheater's lib/services/external_subtitle_service.dart for the native
// equivalent, which calls sub.wyzie.io directly with its own copy of that
// key instead of going through this server.
const crypto = require('crypto');

const SCRAPER_BASE_URL =
  process.env.ARKSCRAPER_BASE_URL || 'https://arkscraper.duckdns.org';
const REQUEST_TIMEOUT_MS = 15000;

exports.handler = async (event) => {
  const secret = process.env.ARKPLAY_STREAM_SECRET;
  if (!secret) return json(500, { error: 'Server not configured' });

  const params = event.queryStringParameters || {};
  if (!verifyToken(params.token, secret)) return json(401, { error: 'Unauthorized' });

  const { tmdbId, season, episode } = params;
  if (!/^\d+$/.test(tmdbId || '')) {
    return json(400, { error: 'Missing or invalid tmdbId' });
  }
  if ((season !== undefined) !== (episode !== undefined)) {
    return json(400, { error: 'season and episode must both be provided, or neither' });
  }

  const url = new URL('/api/v2/subtitles', SCRAPER_BASE_URL);
  url.searchParams.set('tmdbId', tmdbId);
  if (season !== undefined) {
    url.searchParams.set('season', season);
    url.searchParams.set('episode', episode);
  }

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
