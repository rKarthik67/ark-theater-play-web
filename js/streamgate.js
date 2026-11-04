/* Client side of the real (server-enforced) gate in netlify/functions/.
   This module only decides when to *show* the scraper-backed player option;
   whether a stream request actually succeeds is enforced by stream.js
   checking the signed token, not by anything here. Mirrors
   Movie-and-tv-show-2/src/streamGate.js. */
const StreamGate = (() => {
  const TOKEN_STORAGE_KEY = 'arkplay_stream_token';
  const UNLOCKED_EVENT = 'arkplay-stream-unlocked';
  const PROVIDERS_CACHE_TTL_MS = 5 * 60 * 1000;
  let providersCache = null; // { list, fetchedAt }

  function readStoredToken() {
    try {
      const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed?.token || !parsed?.expiresAt || parsed.expiresAt < Date.now()) {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        return null;
      }
      return parsed.token;
    } catch {
      return null;
    }
  }

  function isUnlocked() {
    return Boolean(readStoredToken());
  }

  function onUnlockedChange(callback) {
    window.addEventListener(UNLOCKED_EVENT, callback);
    return () => window.removeEventListener(UNLOCKED_EVENT, callback);
  }

  // The wire field is still named `passphrase` for backward compatibility
  // with unlock.js, but it now carries the one-use 4-digit code ARKTheater
  // mints (Settings -> ArkPlay unlock code).
  async function unlock(code) {
    const response = await fetch('/.netlify/functions/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ passphrase: code }),
    });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(body.error || 'Incorrect code');
    }
    localStorage.setItem(
      TOKEN_STORAGE_KEY,
      JSON.stringify({ token: body.token, expiresAt: body.expiresAt })
    );
    window.dispatchEvent(new Event(UNLOCKED_EVENT));
  }

  function lock() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    window.dispatchEvent(new Event(UNLOCKED_EVENT));
  }

  async function fetchEnabledProviders(token) {
    if (providersCache && Date.now() - providersCache.fetchedAt < PROVIDERS_CACHE_TTL_MS) {
      return providersCache.list;
    }
    const response = await fetch(`/.netlify/functions/providers?${new URLSearchParams({ token })}`);
    const body = await response.json().catch(() => ({}));
    if (!response.ok || !Array.isArray(body.providers)) {
      throw new Error(body.error || 'Could not load provider list');
    }
    const list = body.providers.filter((provider) => provider.enabled === true);
    providersCache = { list, fetchedAt: Date.now() };
    return list;
  }

  async function fetchFromProvider(token, { type, tmdbId, season, episode, providerId }) {
    const params = new URLSearchParams({ type, tmdbId: String(tmdbId), provider: providerId, token });
    if (type === 'tv') {
      params.set('season', String(season));
      params.set('episode', String(episode));
    }
    const response = await fetch(`/.netlify/functions/stream?${params.toString()}`);
    const body = await response.json().catch(() => ({}));
    if (!response.ok || body.success === false || !body.links?.length) {
      throw new Error(body.error || 'No stream found');
    }
    return body;
  }

  /* Unlike ARKTheater's own ProviderLoader (which stops at the first
     successful provider - fine for "just play something"), the web picker
     is meant to show every source the viewer could choose from, the same
     way Pirate Bay/Nyaa/Torrentio all show up together in the torrent
     picker. So every enabled provider is queried in parallel, and
     onResult fires as each one resolves (success or failure) instead of
     waiting for all of them - a fast provider's servers show up
     immediately rather than being held back by a slow or dead one
     elsewhere in the list. */
  async function fetchScraperStream({ type, tmdbId, season, episode, onResult }) {
    const token = readStoredToken();
    if (!token) throw new Error('Locked');
    const providers = await fetchEnabledProviders(token);
    if (!providers.length) throw new Error('No providers are available right now');

    const results = await Promise.allSettled(
      providers.map((provider) =>
        fetchFromProvider(token, { type, tmdbId, season, episode, providerId: provider.id }).then(
          (body) => {
            const links = (body.links || []).map((link) => ({ ...link, providerName: body.provider || provider.name }));
            onResult?.({ providerId: provider.id, providerName: body.provider || provider.name, links });
            return links;
          },
          (error) => {
            onResult?.({ providerId: provider.id, providerName: provider.name, error });
            throw error;
          }
        )
      )
    );
    const links = results.flatMap((result) => (result.status === 'fulfilled' ? result.value : []));
    if (!links.length) throw new Error('No streams found for this title.');
    return { links };
  }

  return { isUnlocked, onUnlockedChange, unlock, lock, fetchScraperStream };
})();
