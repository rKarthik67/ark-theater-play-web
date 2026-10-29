/* Client-side Watchlist, modeled on the original app's WatchlistService
   (add/remove/sort/export/import/clear), minus the cross-device sync backend. */

const Watchlist = (() => {
  const KEY = 'ark_watchlist_v1';
  const DELETED_KEY = 'ark_watchlist_deleted_v1';

  function all() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  /* Removals have to be sent to the shared-watchlist server as an explicit
     {id, type} list — it does not infer deletion from an item's absence on
     the next push. These tombstones queue up locally until the next sync. */
  function pendingDeletions() {
    try { return JSON.parse(localStorage.getItem(DELETED_KEY)) || []; }
    catch { return []; }
  }
  function queueDeletion(mediaType, id) {
    const deletions = pendingDeletions();
    if (!deletions.some(d => d.mediaType === mediaType && d.id === id)) {
      deletions.push({ mediaType, id });
      localStorage.setItem(DELETED_KEY, JSON.stringify(deletions));
    }
  }
  function clearPendingDeletions() {
    localStorage.setItem(DELETED_KEY, '[]');
  }

  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
    document.dispatchEvent(new CustomEvent('ark:watchlist-changed'));
  }

  function has(mediaType, id) {
    return all().some(i => i.mediaType === mediaType && i.id === id);
  }

  /* sync:false is used when reflecting data that already came FROM the shared
     server (see SharedWatchlist.mergeRemoteItems) — without that flag, every
     pull would immediately re-push every item it just received, looping. */
  function add(item, { sync = true } = {}) {
    const list = all();
    if (!list.some(i => i.mediaType === item.mediaType && i.id === item.id)) {
      list.unshift({ ...item, addedAt: item.addedAt ?? Date.now() });
      save(list);
      if (sync && SharedWatchlist.isLinked()) {
        console.log('[ARK watchlist] bookmark ON —', item.mediaType, item.id, item.title);
        SharedWatchlist.addItemRemote(item).catch(err => console.warn('[ARK watchlist] add sync failed', err));
      }
    }
  }

  function remove(mediaType, id, { queue = true } = {}) {
    if (queue) queueDeletion(mediaType, id);
    save(all().filter(i => !(i.mediaType === mediaType && i.id === id)));
    if (queue && SharedWatchlist.isLinked()) {
      console.log('[ARK watchlist] bookmark OFF —', mediaType, id);
      SharedWatchlist.removeItemRemote(mediaType, id).catch(err => console.warn('[ARK watchlist] remove sync failed', err));
    }
  }

  /* Patches one item's fields (e.g. genre/language metadata backfilled after
     the fact) without unshifting/re-adding it. Pass silent:true to skip the
     change event, for batch background updates that will dispatch once at the end. */
  function updateMeta(mediaType, id, patch, { silent = false } = {}) {
    const list = all();
    const idx = list.findIndex(i => i.mediaType === mediaType && i.id === id);
    if (idx === -1) return;
    list[idx] = { ...list[idx], ...patch };
    localStorage.setItem(KEY, JSON.stringify(list));
    if (!silent) document.dispatchEvent(new CustomEvent('ark:watchlist-changed'));
  }

  function toggle(item) {
    has(item.mediaType, item.id) ? remove(item.mediaType, item.id) : add(item);
  }

  function clear() {
    all().forEach(i => queueDeletion(i.mediaType, i.id));
    save([]);
    if (SharedWatchlist.isLinked()) {
      SharedWatchlist.pullSync().catch(err => console.warn('[ARK watchlist] clear sync failed', err));
    }
  }

  function sorted(by = 'addedAt') {
    const list = [...all()];
    if (by === 'title') list.sort((a, b) => a.title.localeCompare(b.title));
    else if (by === 'titleDesc') list.sort((a, b) => b.title.localeCompare(a.title));
    else if (by === 'rating') list.sort((a, b) => (b.voteAverage || 0) - (a.voteAverage || 0));
    else if (by === 'releaseDate') list.sort((a, b) => (b.releaseDate || '').localeCompare(a.releaseDate || ''));
    else list.sort((a, b) => b.addedAt - a.addedAt);
    return list;
  }

  function exportJson() {
    const payload = {
      app: 'ARKTheater Watchlist (tribute site)',
      exportedAt: new Date().toISOString(),
      items: all(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ark-theatre-watchlist-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importJson(file) {
    return file.text().then(text => {
      const data = JSON.parse(text);
      const incoming = Array.isArray(data) ? data : (data.items || []);
      const existing = all();
      const merged = [...existing];
      incoming.forEach(item => {
        if (!merged.some(i => i.mediaType === item.mediaType && i.id === item.id)) {
          merged.push(item);
        }
      });
      save(merged);
      if (SharedWatchlist.isLinked()) {
        SharedWatchlist.pullSync().catch(err => console.warn('[ARK watchlist] import sync failed', err));
      }
      return merged.length - existing.length;
    });
  }

  return { all, has, add, remove, toggle, clear, sorted, exportJson, importJson, updateMeta, pendingDeletions, clearPendingDeletions };
})();
