/* Recently Watched, modeled on the app's recently_watched_service/provider
   and the "Continue Watching" row it feeds on Home. Since this tribute site
   doesn't implement real video playback, there's no genuine watch position to
   track — opening a title's detail page is used as the proxy "watched" signal
   instead of fabricating fake progress. */

const RecentlyWatched = (() => {
  const KEY = 'ark_recently_watched_v1';
  const MAX = 20;

  function all() {
    try { return JSON.parse(localStorage.getItem(KEY)) || []; }
    catch { return []; }
  }

  function save(list) {
    localStorage.setItem(KEY, JSON.stringify(list));
    document.dispatchEvent(new CustomEvent('ark:recently-watched-changed'));
  }

  function record(item) {
    const list = all().filter(i => !(i.mediaType === item.mediaType && i.id === item.id));
    list.unshift({ ...item, viewedAt: Date.now() });
    save(list.slice(0, MAX));
  }

  function clear() {
    save([]);
  }

  return { all, record, clear };
})();
