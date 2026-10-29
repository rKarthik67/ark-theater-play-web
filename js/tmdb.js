/* ARK Theatre tribute site — TMDB API wrapper.
   Falls back to the same TMDB v3 key ARK Theater itself ships client-side
   (and that the sibling Ark Play React build also embeds publicly) so the
   site works without prompting; Settings still lets a visitor override it
   with their own key. No video sources, scrapers, or streaming backends are
   implemented here. */

const TMDB = (() => {
  const BASE = 'https://api.themoviedb.org/3';
  const IMG = 'https://image.tmdb.org/t/p';
  const DEFAULT_KEY = '5a917d25f7c40ac92b4317c99a46600d';

  function key() {
    return localStorage.getItem('ark_tmdb_key') || DEFAULT_KEY;
  }

  async function call(path, params = {}) {
    const url = new URL(BASE + path);
    url.searchParams.set('api_key', key());
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
    const res = await fetch(url.toString());
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.status_message || `TMDB request failed (${res.status})`);
    }
    return res.json();
  }

  const poster = (path, size = 'w342') => path ? `${IMG}/${size}${path}` : null;
  const backdrop = (path, size = 'w1280') => path ? `${IMG}/${size}${path}` : null;
  const profile = (path, size = 'w185') => path ? `${IMG}/${size}${path}` : null;
  const providerLogo = (path, size = 'w92') => path ? `${IMG}/${size}${path}` : null;

  return {
    hasKey: () => !!key(),
    setKey: (k) => localStorage.setItem('ark_tmdb_key', k.trim()),
    poster, backdrop, profile, providerLogo,

    trending: (mediaType = 'all', window = 'week') => call(`/trending/${mediaType}/${window}`),
    popular: (mediaType = 'movie', page = 1) => call(`/${mediaType}/popular`, { page }),
    topRated: (mediaType = 'movie', page = 1) => call(`/${mediaType}/top_rated`, { page }),
    nowPlaying: (page = 1) => call('/movie/now_playing', { page }),
    onTheAir: (page = 1) => call('/tv/on_the_air', { page }),

    discover: (mediaType, opts = {}) => call(`/discover/${mediaType}`, opts),
    genres: (mediaType) => call(`/genre/${mediaType}/list`),

    details: (mediaType, id) => call(`/${mediaType}/${id}`, {
      append_to_response: 'credits,videos,similar,recommendations'
    }),
    basic: (mediaType, id) => call(`/${mediaType}/${id}`),
    watchProviders: (mediaType, id) => call(`/${mediaType}/${id}/watch/providers`),
    providerCatalog: () => call('/watch/providers/movie'),
    season: (id, season) => call(`/tv/${id}/season/${season}`),
    person: (id) => call(`/person/${id}`, { append_to_response: 'combined_credits' }),
    popularPeople: (page = 1, includeAdult = false) => call('/person/popular', { page, include_adult: includeAdult }),
    searchPeople: (query, page = 1, includeAdult = false) => call('/search/person', { query, page, include_adult: includeAdult }),
    company: (id) => call(`/company/${id}`),

    search: (query, page = 1) => call('/search/multi', { query, page, include_adult: false }),
  };
})();
