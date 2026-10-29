/* Maps a TMDB id to its AniList/MyAnimeList/AniDB ids for anime titles, using
   the public Fribb/anime-lists cross-reference dataset (CORS-enabled, static
   JSON on GitHub). TMDB has no native anime-specific id, so this is the only
   way to surface AniList/MAL ids next to a title. The full ~7.5MB dataset is
   fetched once and reduced to a small {type:tmdbId -> ids} index, which is
   what actually gets cached in localStorage (with a 7-day TTL) so repeat
   visits don't re-download it. */

const AnimeIds = (() => {
  const SOURCE_URL = 'https://raw.githubusercontent.com/Fribb/anime-lists/master/anime-list-full.json';
  const CACHE_KEY = 'ark_anime_id_index_v1';
  const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000;

  let indexPromise = null;

  function loadCachedIndex() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY));
      if (cached && Date.now() - cached.builtAt < CACHE_TTL_MS) return cached.index;
    } catch { /* ignore */ }
    return null;
  }

  async function buildIndex() {
    const cached = loadCachedIndex();
    if (cached) return cached;

    const res = await fetch(SOURCE_URL);
    if (!res.ok) throw new Error(`anime-lists fetch failed (${res.status})`);
    const list = await res.json();

    const index = {};
    list.forEach(entry => {
      const tmdb = entry.themoviedb_id;
      if (!tmdb || typeof tmdb !== 'object') return;
      ['tv', 'movie'].forEach(mediaType => {
        const id = tmdb[mediaType];
        if (!id) return;
        index[`${mediaType}:${id}`] = {
          anilistId: entry.anilist_id || null,
          malId: entry.mal_id || null,
          anidbId: entry.anidb_id || null,
        };
      });
    });

    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ builtAt: Date.now(), index })); }
    catch { /* localStorage full/unavailable — still usable for this session */ }
    return index;
  }

  function getIndex() {
    if (!indexPromise) indexPromise = buildIndex().catch(err => { indexPromise = null; throw err; });
    return indexPromise;
  }

  async function lookup(mediaType, tmdbId) {
    try {
      const index = await getIndex();
      return index[`${mediaType}:${tmdbId}`] || null;
    } catch {
      return null;
    }
  }

  return { lookup };
})();
