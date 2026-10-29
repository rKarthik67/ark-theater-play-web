/* Cross-device watchlist sharing against ARK Theater's own shared-watchlist
   backend (arkscraper.duckdns.org). Mirrors the sibling Ark Play React
   build's watchlistStorage.js: individual adds/removes go straight to their
   own dedicated endpoints (POST /items, DELETE /items/:type/:id) the instant
   they happen, instead of batching into the bulk /sync snapshot — that bulk
   endpoint is reserved for the periodic catch-up poll and bulk operations
   (Clear Watchlist, Import). All confirmed working against the live server
   with a real pairing code from the official app. This does not touch the
   app's video scraper endpoints. */

const SharedWatchlist = (() => {
  const BASE = 'https://arkscraper.duckdns.org/api/v2/watchlist';
  const SECRET_KEY = 'ark_library_secret';

  const secret = () => localStorage.getItem(SECRET_KEY) || '';
  const setSecret = (s) => localStorage.setItem(SECRET_KEY, s);

  async function call(path, { method = 'GET', body } = {}) {
    const res = await fetch(BASE + path, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(secret() ? { Authorization: `Bearer ${secret()}` } : {}),
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || data.success === false) {
      throw new Error(data.error || `Shared-watchlist request failed (${res.status})`);
    }
    return data;
  }

  async function ensureLibrary() {
    if (secret()) return secret();
    const data = await call('/libraries', { method: 'POST', body: {} });
    setSecret(data.librarySecret);
    return data.librarySecret;
  }

  async function createPairingCode() {
    await ensureLibrary();
    return call('/pairings', { method: 'POST', body: {} });
  }

  function toRemoteItem(item) {
    return {
      id: item.id,
      type: item.mediaType,
      title: item.title,
      posterPath: item.posterPath,
      voteAverage: item.voteAverage,
      addedAt: new Date(item.addedAt || Date.now()).toISOString(),
    };
  }

  function fromRemoteItem(remote) {
    const mediaType = remote.type;
    const id = remote.id;
    if (!mediaType || id === undefined) return null;
    return {
      mediaType,
      id,
      title: remote.title || remote.name || 'Untitled',
      posterPath: remote.posterPath || null,
      voteAverage: remote.voteAverage ?? null,
      releaseDate: remote.releaseDate || null,
      addedAt: remote.addedAt ? Date.parse(remote.addedAt) : Date.now(),
    };
  }

  function mergeRemoteItems(remoteItems = [], remoteDeleted = []) {
    /* sync:false / queue:false — this data just came FROM the server, so
       reflecting it locally must not immediately re-push it right back. */
    remoteItems.forEach(r => { const item = fromRemoteItem(r); if (item) Watchlist.add(item, { sync: false }); });
    remoteDeleted.forEach(r => { const item = fromRemoteItem(r); if (item) Watchlist.remove(item.mediaType, item.id, { queue: false }); });
  }

  /* Every remote call (add/remove/pull) is serialized into one chain so two
     requests can never resolve out of order — a slow add/remove landing after
     a newer pull previously caused deleted items to reappear. */
  let chain = Promise.resolve();
  function enqueue(fn) {
    chain = chain.then(fn, fn);
    return chain;
  }

  async function joinPairingCode(code) {
    await ensureLibrary();
    const data = await call('/pairings/join', { method: 'POST', body: { code } });
    setSecret(data.librarySecret);
    mergeRemoteItems(data.items, data.deleted);
    return data;
  }

  function addItemRemote(item) {
    return enqueue(async () => {
      await ensureLibrary();
      const body = { item: toRemoteItem(item) };
      console.log('[ARK watchlist] POST /items (add)', body);
      const data = await call('/items', { method: 'POST', body });
      console.log('[ARK watchlist] add response', data);
      mergeRemoteItems(data.items, data.deleted);
      return data;
    });
  }

  function removeItemRemote(mediaType, id) {
    return enqueue(async () => {
      await ensureLibrary();
      console.log(`[ARK watchlist] DELETE /items/${mediaType}/${id} (remove)`);
      const data = await call(`/items/${mediaType}/${id}`, { method: 'DELETE' });
      console.log('[ARK watchlist] remove response', data);
      mergeRemoteItems(data.items, data.deleted);
      return data;
    });
  }

  /* Bulk upsert of the full local list, for Clear Watchlist / Import / the
     periodic background poll that picks up changes made on other devices. */
  function pullSync() {
    return enqueue(async () => {
      await ensureLibrary();
      const deletions = Watchlist.pendingDeletions();
      const data = await call('/sync', {
        method: 'POST',
        body: {
          revision: 0,
          items: Watchlist.all().map(toRemoteItem),
          deleted: deletions.map(d => ({ id: d.id, type: d.mediaType })),
        },
      });
      mergeRemoteItems(data.items, data.deleted);
      Watchlist.clearPendingDeletions();
      return data;
    });
  }

  return {
    isLinked: () => !!secret(),
    unlink: () => localStorage.removeItem(SECRET_KEY),
    ensureLibrary, createPairingCode, joinPairingCode,
    addItemRemote, removeItemRemote, pullSync,
  };
})();
