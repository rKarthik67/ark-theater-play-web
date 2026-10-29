/* Router + page controllers for the ARK Theatre tribute site. */

const root = document.getElementById('app-root');

function setActiveNav(route) {
  document.querySelectorAll('.main-nav a, .bottom-nav a, .bottom-more-menu a').forEach(a => {
    a.classList.toggle('active', a.dataset.route === route);
  });
}

let activeCleanups = [];
function registerCleanup(fn) { activeCleanups.push(fn); }
function clearRoot() {
  activeCleanups.forEach(fn => { try { fn(); } catch { /* ignore */ } });
  activeCleanups = [];
  root.innerHTML = '';
}

/* Original-language browsing, modeled on the app's Platforms-screen language
   picker (Hindi/Telugu/Tamil/Korean/Japanese/Spanish, "All Languages"), expanded
   to TMDB's broader language set for the Movies/TV/Search filters. */
const ARK_LANGUAGES = [
  { code: '', label: 'All Languages' },
  { code: 'en', label: 'English' },
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'kn', label: 'Kannada' },
  { code: 'bn', label: 'Bengali' },
  { code: 'mr', label: 'Marathi' },
  { code: 'pa', label: 'Punjabi' },
  { code: 'gu', label: 'Gujarati' },
  { code: 'ur', label: 'Urdu' },
  { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ru', label: 'Russian' },
  { code: 'tl', label: 'Tagalog' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'th', label: 'Thai' },
  { code: 'id', label: 'Indonesian' },
  { code: 'ms', label: 'Malay' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'it', label: 'Italian' },
  { code: 'pt', label: 'Portuguese' },
  { code: 'nl', label: 'Dutch' },
  { code: 'sv', label: 'Swedish' },
  { code: 'no', label: 'Norwegian' },
  { code: 'da', label: 'Danish' },
  { code: 'fi', label: 'Finnish' },
  { code: 'pl', label: 'Polish' },
  { code: 'cs', label: 'Czech' },
  { code: 'hu', label: 'Hungarian' },
  { code: 'ro', label: 'Romanian' },
  { code: 'uk', label: 'Ukrainian' },
  { code: 'el', label: 'Greek' },
  { code: 'tr', label: 'Turkish' },
  { code: 'ar', label: 'Arabic' },
  { code: 'he', label: 'Hebrew' },
  { code: 'fa', label: 'Persian' },
];

/* Order mirrors the user's priority: Tamil first, then other Indian regional
   languages, then Korean/Japanese/Chinese/Russian/Tagalog, then others.
   movieRow:false means Home shows that language's TV row only (not Movies). */
const HOME_LANGUAGE_ROWS = [
  { code: 'ta', label: 'Tamil' },
  { code: 'te', label: 'Telugu' },
  { code: 'hi', label: 'Hindi' },
  { code: 'ml', label: 'Malayalam' },
  { code: 'kn', label: 'Kannada' },
  { code: 'bn', label: 'Bengali' },
  { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ru', label: 'Russian' },
  { code: 'tl', label: 'Tagalog', movieRow: false },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
];

/* ---------------- Home ---------------- */
async function renderHome() {
  setActiveNav('home');
  clearRoot();
  root.appendChild(loader());
  try {
    const [trending, popularMovies, popularTv, topMovies, topTv, nowPlaying, onAir, languageRows] = await Promise.all([
      TMDB.trending('all', 'week'),
      TMDB.popular('movie'),
      TMDB.popular('tv'),
      TMDB.topRated('movie'),
      TMDB.topRated('tv'),
      TMDB.nowPlaying(),
      TMDB.onTheAir(),
      Promise.all(HOME_LANGUAGE_ROWS.map(async (l) => {
        const [m, t] = await Promise.all([
          l.movieRow === false ? Promise.resolve({ results: [] }) : TMDB.discover('movie', { with_original_language: l.code, sort_by: 'popularity.desc' }),
          TMDB.discover('tv', { with_original_language: l.code, sort_by: 'popularity.desc' }),
        ]);
        return { label: l.label, movies: m.results, tv: t.results };
      })),
    ]);
    clearRoot();
    const heroCandidates = trending.results.filter(i => i.backdrop_path).slice(0, 6);
    if (heroCandidates.length) root.appendChild(heroSlider(heroCandidates));

    const recentlyWatched = RecentlyWatched.all().map(i => ({
      id: i.id, media_type: i.mediaType, title: i.title, poster_path: i.posterPath, vote_average: i.voteAverage,
    }));
    const continueSection = mediaRowSection('Continue Watching', recentlyWatched, null, {
      onClear: () => {
        if (confirm('Remove every title from Recently Watched? Your watchlist is untouched.')) {
          RecentlyWatched.clear();
          continueSection.remove();
        }
      },
    });
    if (continueSection) root.appendChild(continueSection);

    const sections = [
      ['Trending Now', trending.results, null, true],
      ['Top 10 Movies', topMovies.results.slice(0, 10), 'movie', true],
      ['Top 10 TV Shows', topTv.results.slice(0, 10), 'tv', true],
      ['Popular Movies', popularMovies.results, 'movie', false],
      ['Popular TV Shows', popularTv.results, 'tv', false],
      ['Now Playing', nowPlaying.results, 'movie', false],
      ['On The Air', onAir.results, 'tv', false],
      ['Top Rated Movies', topMovies.results, 'movie', false],
      ['Top Rated TV Shows', topTv.results, 'tv', false],
    ];
    sections.forEach(([title, items, type, ranked]) => {
      const sec = mediaRowSection(title, items, type, { ranked });
      if (sec) root.appendChild(sec);
    });
    languageRows.forEach(({ label, movies, tv }) => {
      const movieSec = mediaRowSection(`${label} Movies`, movies, 'movie', {});
      if (movieSec) root.appendChild(movieSec);
      const tvSec = mediaRowSection(`${label} TV Shows`, tv, 'tv', {});
      if (tvSec) root.appendChild(tvSec);
    });
  } catch (err) {
    clearRoot();
    root.appendChild(errorView(err));
  }
}

/* ---------------- Movies / TV browse ---------------- */
async function renderBrowse(mediaType) {
  setActiveNav(mediaType === 'movie' ? 'movies' : 'tv');
  clearRoot();
  const titleRow = el(`
    <div class="page-title-row">
      <h2 class="page-title">${mediaType === 'movie' ? 'Movies' : 'TV Shows'}</h2>
      <select id="lang-select" class="toolbar-btn"></select>
    </div>
  `);
  root.appendChild(titleRow);
  const langSelect = titleRow.querySelector('#lang-select');
  ARK_LANGUAGES.forEach(l => langSelect.appendChild(el(`<option value="${l.code}">${escapeHtml(l.label)}</option>`)));

  const filtersBar = el(`<div class="filters-bar"></div>`);
  root.appendChild(filtersBar);
  const grid = el(`<div class="media-grid"></div>`);
  root.appendChild(grid);
  const loadMoreWrap = el(`<div class="load-more-wrap"><button class="toolbar-btn">Load more</button></div>`);
  root.appendChild(loadMoreWrap);

  let activeGenre = null;
  let activeLanguage = '';
  let page = 1;
  let totalPages = 1;

  const genreData = await TMDB.genres(mediaType);
  filtersBar.appendChild(el(`<button class="chip active" data-genre="">All</button>`));
  genreData.genres.forEach(g => {
    filtersBar.appendChild(el(`<button class="chip" data-genre="${g.id}">${escapeHtml(g.name)}</button>`));
  });
  filtersBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    filtersBar.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeGenre = chip.dataset.genre || null;
    page = 1;
    loadPage(true);
  });
  langSelect.addEventListener('change', () => {
    activeLanguage = langSelect.value;
    page = 1;
    loadPage(true);
  });

  async function loadPage(reset = false) {
    if (reset) grid.innerHTML = '';
    const data = await TMDB.discover(mediaType, {
      with_genres: activeGenre || undefined,
      with_original_language: activeLanguage || undefined,
      sort_by: 'popularity.desc',
      page,
    });
    totalPages = data.total_pages;
    data.results.forEach(item => {
      const card = mediaCard(item, mediaType);
      if (card) grid.appendChild(card);
    });
    loadMoreWrap.classList.toggle('hidden', page >= totalPages);
  }

  loadMoreWrap.querySelector('button').addEventListener('click', () => {
    page += 1;
    loadPage(false);
  });

  await loadPage(true);
}

/* ---------------- Search ---------------- */
async function performSearch(query) {
  clearRoot();
  const titleRow = el(`
    <div class="page-title-row">
      <h2 class="page-title">Results for "${escapeHtml(query)}"</h2>
      <select id="search-lang-select" class="toolbar-btn"></select>
    </div>
  `);
  root.appendChild(titleRow);
  const langSelect = titleRow.querySelector('#search-lang-select');
  ARK_LANGUAGES.forEach(l => langSelect.appendChild(el(`<option value="${l.code}">${escapeHtml(l.label)}</option>`)));

  const grid = el(`<div class="media-grid"></div>`);
  root.appendChild(grid);
  root.appendChild(loader());
  try {
    const data = await TMDB.search(query);
    root.querySelector('.loader')?.remove();
    const allResults = data.results.filter(r => r.media_type === 'movie' || r.media_type === 'tv');

    function draw() {
      grid.innerHTML = '';
      const lang = langSelect.value;
      const results = lang ? allResults.filter(r => r.original_language === lang) : allResults;
      if (!results.length) {
        grid.appendChild(emptyState('No results found', 'Try a different title or language filter.'));
        return;
      }
      results.forEach(item => {
        const card = mediaCard(item, item.media_type);
        if (card) grid.appendChild(card);
      });
    }
    langSelect.addEventListener('change', draw);
    draw();
  } catch (err) {
    root.querySelector('.loader')?.remove();
    root.appendChild(errorView(err));
  }
}

function setupSearchUi() {
  const toggle = document.getElementById('search-toggle');
  const bar = document.getElementById('search-bar');
  const input = document.getElementById('search-input');
  const suggestions = document.getElementById('search-suggestions');

  function toggleSearchBar() {
    bar.classList.toggle('hidden');
    if (!bar.classList.contains('hidden')) input.focus();
  }
  toggle.addEventListener('click', toggleSearchBar);
  document.getElementById('bottom-search-toggle').addEventListener('click', toggleSearchBar);

  let debounceTimer;
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    const q = input.value.trim();
    if (q.length < 2) { suggestions.innerHTML = ''; return; }
    debounceTimer = setTimeout(async () => {
      try {
        const data = await TMDB.search(q);
        suggestions.innerHTML = '';
        data.results
          .filter(r => r.media_type === 'movie' || r.media_type === 'tv')
          .slice(0, 8)
          .forEach(item => {
            const row = el(`
              <div class="sugg-row">
                <img src="${item.poster_path ? TMDB.poster(item.poster_path, 'w92') : ''}" alt="">
                <div>
                  <div class="sugg-title">${escapeHtml(titleOf(item))}</div>
                  <div class="sugg-meta">${item.media_type === 'movie' ? 'Movie' : 'TV'} ${yearOf(item)}</div>
                </div>
              </div>
            `);
            row.addEventListener('click', () => {
              saveRecentSearch(q);
              bar.classList.add('hidden');
              suggestions.innerHTML = '';
              input.value = '';
              location.hash = `#/detail/${item.media_type}/${item.id}`;
            });
            suggestions.appendChild(row);
          });
      } catch { /* ignore transient search errors */ }
    }, 300);
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && input.value.trim()) {
      saveRecentSearch(input.value.trim());
      bar.classList.add('hidden');
      const q = input.value.trim();
      suggestions.innerHTML = '';
      input.value = '';
      location.hash = `#/search/${encodeURIComponent(q)}`;
    }
  });
}

function setupBottomMoreMenu() {
  const toggle = document.getElementById('bottom-more-toggle');
  const menu = document.getElementById('bottom-more-menu');
  const backdrop = document.getElementById('bottom-more-backdrop');

  function close() {
    menu.classList.add('hidden');
    backdrop.classList.add('hidden');
    toggle.classList.remove('active');
  }
  function open() {
    menu.classList.remove('hidden');
    backdrop.classList.remove('hidden');
    toggle.classList.add('active');
  }

  toggle.addEventListener('click', () => {
    menu.classList.contains('hidden') ? open() : close();
  });
  backdrop.addEventListener('click', close);
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', close));
  window.addEventListener('hashchange', close);
}

function saveRecentSearch(q) {
  const KEY = 'ark_recent_searches';
  const list = JSON.parse(localStorage.getItem(KEY) || '[]');
  const next = [q, ...list.filter(x => x.toLowerCase() !== q.toLowerCase())].slice(0, 10);
  localStorage.setItem(KEY, JSON.stringify(next));
}

/* ---------------- Detail ---------------- */
async function renderDetail(mediaType, id) {
  clearRoot();
  root.appendChild(loader());
  try {
    const [d, providersData] = await Promise.all([
      TMDB.details(mediaType, id),
      TMDB.watchProviders(mediaType, id).catch(() => null),
    ]);
    clearRoot();

    RecentlyWatched.record({ mediaType, id: d.id, title: titleOf(d), posterPath: d.poster_path, voteAverage: d.vote_average });

    const hero = el(`
      <div class="detail-hero">
        <div class="detail-hero-bg" style="background-image:url('${TMDB.backdrop(d.backdrop_path, 'original')}')"></div>
        <div class="detail-body">
          <div class="detail-poster">
            ${d.poster_path ? `<img src="${TMDB.poster(d.poster_path, 'w500')}" alt="">` : ''}
          </div>
          <div class="detail-info">
            <h1 class="detail-title">${escapeHtml(titleOf(d))}</h1>
            <div class="external-ids" id="detail-external-ids"></div>
            ${d.tagline ? `<p class="detail-tagline">${escapeHtml(d.tagline)}</p>` : ''}
            <div class="detail-meta">
              <span>★ ${(d.vote_average || 0).toFixed(1)}</span>
              <span>${yearOf(d)}</span>
              ${d.runtime ? `<span>${d.runtime} min</span>` : ''}
              ${d.number_of_seasons ? `<span>${d.number_of_seasons} season${d.number_of_seasons > 1 ? 's' : ''}</span>` : ''}
              ${d.original_language ? `<span>${escapeHtml(languageName(d.original_language))}</span>` : ''}
            </div>
            <div class="detail-genres">
              ${(d.genres || []).map(g => `<span>${escapeHtml(g.name)}</span>`).join('')}
            </div>
            <p class="detail-overview">${escapeHtml(d.overview || '')}</p>
            <div class="detail-actions">
              <button class="btn btn-gold" id="detail-watch-now-btn">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Watch Now
              </button>
              <button class="btn btn-gold" id="detail-trailer-btn">
                <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Watch Trailer
              </button>
              <button class="btn" id="detail-watchlist-btn"></button>
            </div>
          </div>
        </div>
      </div>
    `);
    root.appendChild(hero);
    populateExternalIds(hero.querySelector('#detail-external-ids'), mediaType, d);

    const wlItem = {
      mediaType, id: d.id, title: titleOf(d), posterPath: d.poster_path,
      voteAverage: d.vote_average,
      releaseDate: d.release_date || d.first_air_date || null,
      genreIds: (d.genres || []).map(g => g.id),
      originalLanguage: d.original_language,
    };
    const wlBtn = hero.querySelector('#detail-watchlist-btn');
    function refreshWlBtn() {
      const on = Watchlist.has(mediaType, d.id);
      wlBtn.classList.toggle('btn-gold', on);
      wlBtn.classList.toggle('btn-ghost', !on);
      wlBtn.innerHTML = `<svg viewBox="0 0 24 24"><path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4.5L5 21V3a1 1 0 0 1 1-1z"/></svg> ${on ? 'In Watchlist' : 'Add to Watchlist'}`;
    }
    refreshWlBtn();
    wlBtn.addEventListener('click', () => { Watchlist.toggle(wlItem); refreshWlBtn(); });
    hero.querySelector('#detail-trailer-btn').addEventListener('click', () => openTrailerFor(d));
    hero.querySelector('#detail-watch-now-btn').addEventListener('click', () => {
      location.hash = `#/player/${mediaType}/${d.id}`;
    });

    const providers = watchProvidersSection(providersData);
    if (providers) root.appendChild(providers);

    const cast = castRow(d.credits);
    if (cast) root.appendChild(cast);

    const similar = mediaRowSection('More Like This', (d.recommendations?.results || d.similar?.results || []), mediaType);
    if (similar) root.appendChild(similar);
  } catch (err) {
    clearRoot();
    root.appendChild(errorView(err));
  }
}

/* ---------------- Player ---------------- */
/* TMDB has no native anime-specific id, so AniList/MAL ids are only looked up
   for titles that are actually anime (Animation genre + Japanese original
   language — same heuristic used for the Watchlist's Anime tabs). */
function isAnimeDetails(d) {
  return (d.genres || []).some(g => g.id === 16) && d.original_language === 'ja';
}

function populateExternalIds(container, mediaType, d) {
  if (!container) return;
  container.appendChild(el(`<span class="id-badge">TMDB ${d.id}</span>`));
  if (!isAnimeDetails(d)) return;
  AnimeIds.lookup(mediaType, d.id).then(ids => {
    if (!ids) return;
    if (ids.anilistId) container.appendChild(el(`<a class="id-badge" href="https://anilist.co/anime/${ids.anilistId}" target="_blank" rel="noopener">AniList ${ids.anilistId}</a>`));
    if (ids.malId) container.appendChild(el(`<a class="id-badge" href="https://myanimelist.net/anime/${ids.malId}" target="_blank" rel="noopener">MAL ${ids.malId}</a>`));
  }).catch(() => { /* mapping unavailable — TMDB id alone still shows */ });
}

function providerEntry(data) {
  const results = data?.results || {};
  const locale = (navigator.language || 'en-US').split('-')[1];
  return results[locale] || results.IN || results.US || results[Object.keys(results)[0]] || null;
}

/* TMDB's watch/providers API only returns one generic region "where to watch"
   page (JustWatch), not a link to each specific service — so every provider
   button was opening the exact same TMDB page. These are each provider's own
   site, deep-linked to a search for the title; providers not listed here fall
   back to the TMDB/JustWatch page. */
const PROVIDER_SEARCH_LINKS = {
  8: (q) => `https://www.netflix.com/search?q=${q}`,
  1796: (q) => `https://www.netflix.com/search?q=${q}`,
  9: (q) => `https://www.amazon.com/s?k=${q}&i=instant-video`,
  10: (q) => `https://www.amazon.com/s?k=${q}&i=instant-video`,
  119: (q) => `https://www.amazon.com/s?k=${q}&i=instant-video`,
  337: (q) => `https://www.disneyplus.com/search?q=${q}`,
  2: (q) => `https://tv.apple.com/search?term=${q}`,
  3: (q) => `https://play.google.com/store/search?q=${q}&c=movies`,
  15: (q) => `https://www.hulu.com/search?q=${q}`,
  384: (q) => `https://www.max.com/search?q=${q}`,
  1899: (q) => `https://www.max.com/search?q=${q}`,
  531: (q) => `https://www.paramountplus.com/search/?query=${q}`,
  386: (q) => `https://www.peacocktv.com/search?q=${q}`,
  192: (q) => `https://www.youtube.com/results?search_query=${q}`,
  7: (q) => `https://www.vudu.com/content/movies/search?searchString=${q}`,
  350: (q) => `https://tv.apple.com/search?term=${q}`,
};
function providerOpenLink(providerId, title, fallbackLink) {
  const build = PROVIDER_SEARCH_LINKS[providerId];
  return build ? build(encodeURIComponent(title)) : fallbackLink;
}

async function renderPlayer(mediaType, id) {
  clearRoot(); root.appendChild(loader());
  try {
    const [d, providerData] = await Promise.all([
      TMDB.details(mediaType, id), TMDB.watchProviders(mediaType, id).catch(() => null)
    ]);
    clearRoot();
    const title = titleOf(d);
    const trailer = (d.videos?.results || []).find(v => v.site === 'YouTube' && v.type === 'Trailer')
      || (d.videos?.results || []).find(v => v.site === 'YouTube');
    const entry = providerEntry(providerData);
    const player = el(`
      <div class="player-page">
        <div class="player-head">
          <button class="player-back-btn" id="player-back" aria-label="Back to details">
            <svg viewBox="0 0 24 24"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"/></svg>
            <span>Back</span>
          </button>
          <div><div class="player-kicker">Now viewing</div><h1>${escapeHtml(title)}</h1><div class="external-ids" id="player-external-ids"></div></div>
        </div>
        <div class="player-layout ${mediaType === 'tv' ? 'player-layout-tv' : ''}"><div class="player-stage">
          <iframe id="player-frame" src="${PlayerSources.url('vidsrc-sh', mediaType, id)}" title="${escapeHtml(title)} player" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
        </div>
        ${mediaType === 'tv' ? `<aside class="episode-rail"><div class="episode-picker"><label>Season <select id="player-season"></select></label><label>Episode <select id="player-episode"></select></label></div><section class="episode-list-wrap"><h3>Episodes</h3><div class="episode-list" id="player-episodes"></div></section></aside>` : ''}</div>
        <div class="player-servers"><span>Player servers</span><div id="player-source-list"></div></div>
        <div class="player-info"><img src="${TMDB.poster(d.poster_path, 'w342') || ''}" alt=""><div><h2>${escapeHtml(title)}</h2><p>${escapeHtml(d.overview || 'Find this title on an available streaming service.')}</p></div></div>
        <section class="player-providers"><h3>Where to watch</h3><p>Availability is based on your region and provided by TMDB/JustWatch.</p><div class="player-provider-list"></div></section>
      </div>`);
    player.querySelector('#player-back').addEventListener('click', () => { location.hash = `#/detail/${mediaType}/${id}`; });
    const frame = player.querySelector('#player-frame'); let selectedSource = 'vidsrc-sh'; let season = 1; let episode = 1; let animeAnilistId = null;
    const refreshFrame = () => {
      frame.src = selectedSource === 'vidsync-anime' && animeAnilistId
        ? PlayerSources.anime(animeAnilistId, episode)
        : PlayerSources.url(selectedSource, mediaType, id, season, episode);
    };
    const sourceList = player.querySelector('#player-source-list');
    PlayerSources.list.forEach((source, index) => {
      const button = el(`<button class="chip ${index === 0 ? 'active' : ''}">${escapeHtml(source.label)}</button>`);
      button.addEventListener('click', () => {
        selectedSource = source.id; refreshFrame();
        sourceList.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === button));
      });
      sourceList.appendChild(button);
    });
    /* Anime titles use the documented VidSync AniList route rather than a
       TMDB movie/TV route. The mapping stays asynchronous so normal titles
       remain fast and unaffected. */
    if (isAnimeDetails(d)) {
      AnimeIds.lookup(mediaType, d.id).then(ids => {
        if (!ids?.anilistId) return;
        animeAnilistId = ids.anilistId;
        const animeButton = el(`<button class="chip">VidSync Anime</button>`);
        animeButton.addEventListener('click', () => {
          selectedSource = 'vidsync-anime'; refreshFrame();
          sourceList.querySelectorAll('button').forEach(b => b.classList.toggle('active', b === animeButton));
        });
        sourceList.prepend(animeButton);
        animeButton.click();
      }).catch(() => { /* Fall back to the selected TMDB source when unmapped. */ });
    }
    if (mediaType === 'tv') {
      const seasonSelect = player.querySelector('#player-season'); const episodeSelect = player.querySelector('#player-episode');
      const rail = player.querySelector('.episode-rail');
      /* Pointer capture is only taken once real vertical movement is seen —
         capturing immediately on pointerdown (the previous behavior) could
         make a plain click's pointerup resolve against the rail instead of
         the episode-row button underneath, so taps silently did nothing. */
      let dragStartY = 0; let dragStartScroll = 0; let railDragging = false; let railPointerId = null; let railCaptured = false;
      rail.addEventListener('pointerdown', event => {
        if (event.target.closest('select, option')) return;
        railDragging = false; railCaptured = false;
        dragStartY = event.clientY; dragStartScroll = rail.scrollTop; railPointerId = event.pointerId;
      });
      rail.addEventListener('pointermove', event => {
        if (event.pointerId !== railPointerId) return;
        const distance = event.clientY - dragStartY;
        if (!railCaptured && Math.abs(distance) > 10) {
          railCaptured = true; railDragging = true;
          rail.setPointerCapture(event.pointerId);
          rail.classList.add('drag-ready', 'dragging');
        }
        if (railCaptured) { rail.scrollTop = dragStartScroll - distance; event.preventDefault(); }
      });
      const endRailDrag = event => {
        if (railCaptured && rail.hasPointerCapture(event.pointerId)) rail.releasePointerCapture(event.pointerId);
        rail.classList.remove('drag-ready', 'dragging');
      };
      rail.addEventListener('pointerup', endRailDrag); rail.addEventListener('pointercancel', endRailDrag);
      rail.addEventListener('click', event => {
        if (!railDragging) return;
        event.preventDefault(); event.stopPropagation(); railDragging = false;
      }, true);
      const seasons = (d.seasons || []).filter(s => s.season_number > 0 && s.episode_count > 0);
      seasons.forEach(s => seasonSelect.appendChild(el(`<option value="${s.season_number}">${escapeHtml(s.name || `Season ${s.season_number}`)}</option>`)));
      function drawEpisodes(episodes) {
        const list = player.querySelector('#player-episodes'); list.innerHTML = '';
        episodes.forEach(item => {
          const row = el(`<button class="episode-row ${item.episode_number === episode ? 'active' : ''}">${item.still_path ? `<img src="${TMDB.backdrop(item.still_path, 'w342')}" alt="">` : '<div class="episode-still-placeholder">No image</div>'}<span class="episode-row-copy"><b>${item.episode_number}. ${escapeHtml(item.name || `Episode ${item.episode_number}`)}</b><small>${item.runtime ? `${item.runtime} min` : item.air_date || ''}</small><em>${escapeHtml(item.overview || '')}</em></span></button>`);
          row.addEventListener('click', () => { episode = item.episode_number; episodeSelect.value = String(episode); refreshFrame(); drawEpisodes(episodes); });
          list.appendChild(row);
        });
      }
      async function loadEpisodes() {
        season = Number(seasonSelect.value) || 1; episode = 1; episodeSelect.innerHTML = '<option>Loading…</option>'; episodeSelect.disabled = true;
        try { const data = await TMDB.season(id, season); const episodes = data.episodes || []; episodeSelect.innerHTML = ''; episodes.forEach(e => episodeSelect.appendChild(el(`<option value="${e.episode_number}">${e.episode_number}. ${escapeHtml(e.name || `Episode ${e.episode_number}`)}</option>`))); drawEpisodes(episodes); }
        catch { episodeSelect.innerHTML = '<option value="1">Episode 1</option>'; player.querySelector('#player-episodes').innerHTML = '<div class="player-empty">Episodes unavailable.</div>'; }
        episodeSelect.disabled = false; refreshFrame();
      }
      seasonSelect.addEventListener('change', loadEpisodes);
      episodeSelect.addEventListener('change', () => { episode = Number(episodeSelect.value) || 1; refreshFrame(); loadEpisodesForSelection(); });
      function loadEpisodesForSelection() { player.querySelectorAll('.episode-row').forEach(row => row.classList.toggle('active', row.textContent.trim().startsWith(`${episode}.`))); }
      if (seasons.length) loadEpisodes();
    }
    const list = player.querySelector('.player-provider-list');
    const choices = [['Stream', entry?.flatrate], ['Rent', entry?.rent], ['Buy', entry?.buy]].filter(([, v]) => v?.length);
    if (choices.length) {
      choices.forEach(([kind, services]) => services.forEach(service => {
        const href = providerOpenLink(service.provider_id, title, entry.link);
        const button = el(`<a class="player-provider" href="${href}" target="_blank" rel="noopener"><img src="${TMDB.providerLogo(service.logo_path)}" alt=""><span><small>${kind}</small>${escapeHtml(service.provider_name)}</span><b>Open</b></a>`);
        list.appendChild(button);
      }));
    } else if (entry?.link) {
      list.appendChild(el(`<a class="btn btn-gold" href="${entry.link}" target="_blank" rel="noopener">Check availability on JustWatch</a>`));
    } else {
      list.appendChild(el(`<div class="player-empty">No verified streaming availability is listed for your region.</div>`));
    }
    root.appendChild(player);
    populateExternalIds(player.querySelector('#player-external-ids'), mediaType, d);
  } catch (err) { clearRoot(); root.appendChild(errorView(err)); }
}

/* ---------------- Platforms ---------------- */
async function renderPlatforms() {
  setActiveNav('platforms'); clearRoot();
  const regions = [['IN', 'India'], ['US', 'United States'], ['GB', 'United Kingdom'], ['CA', 'Canada'], ['AU', 'Australia']];
  let region = localStorage.getItem('ark_watch_region') || 'IN';
  const page = el(`<div class="catalog-page"><div class="page-title-row"><div><h2 class="page-title">Platforms</h2><p class="page-subtitle">Browse streaming services, production houses, and free live channels.</p></div><label class="region-picker">Streaming region<select id="platform-region">${regions.map(([code, name]) => `<option value="${code}" ${region === code ? 'selected' : ''}>${name}</option>`).join('')}</select></label></div><div class="platform-tabs"><button class="chip active" data-tab="providers">OTT Platforms</button><button class="chip" data-tab="studios">Production Houses</button><button class="chip" data-tab="live">Live TV</button></div><div class="platform-grid" id="platform-grid"></div></div>`);
  root.appendChild(page);
  page.querySelector('#platform-region').addEventListener('change', event => { region = event.target.value; localStorage.setItem('ark_watch_region', region); });
  let logos = {};
  let studioLogos = {};
  TMDB.providerCatalog().then(data => { logos = Object.fromEntries((data.results || []).map(p => [p.provider_id, p.logo_path])); draw('providers'); }).catch(() => draw('providers'));
  Promise.allSettled(Platforms.studios.map(studio => TMDB.company(studio.id).then(data => [studio.id, data.logo_path]))).then(results => {
    studioLogos = Object.fromEntries(results.filter(r => r.status === 'fulfilled' && r.value[1]).map(r => r.value));
    if (page.querySelector('[data-tab].active')?.dataset.tab === 'studios') draw('studios');
  });
  function draw(tab) {
    page.querySelectorAll('[data-tab]').forEach(b => b.classList.toggle('active', b.dataset.tab === tab));
    if (tab === 'live') { renderLiveTv(page); return; }
    const items = tab === 'providers' ? Platforms.providers : Platforms.studios;
    const grid = page.querySelector('#platform-grid'); grid.innerHTML = '';
    items.forEach(item => {
      const logo = tab === 'providers' ? logos[item.id] : studioLogos[item.id];
      const card = el(`<button class="platform-card"><div>${logo ? `<img src="${tab === 'providers' ? TMDB.providerLogo(logo) : TMDB.providerLogo(logo, 'w342')}" alt="">` : `<span>${escapeHtml(item.name.slice(0, 1))}</span>`}</div><strong>${escapeHtml(item.name)}</strong></button>`);
      card.addEventListener('click', () => { location.hash = `#/platform/${tab === 'providers' ? 'provider' : 'studio'}/${item.id}`; }); grid.appendChild(card);
    });
  }
  page.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => draw(b.dataset.tab)));
}

function renderLiveTv(page) {
  const grid = page.querySelector('#platform-grid');
  grid.className = 'live-tv-page';
  grid.innerHTML = `<div class="live-tv-intro"><div><p class="live-eyebrow">LIVE TV</p><h3>Free channels from around the world</h3><p>Free-to-view sources; availability may vary by country.</p></div><span id="live-count"></span></div><div class="live-tv-filters"><input id="live-search" placeholder="Search channels or countries"><select id="live-language"><option value="">All languages</option></select><select id="live-category"><option value="">All categories</option></select></div><div id="live-player"></div><div class="live-tv-grid" id="live-grid"><div class="player-empty">Loading channels…</div></div>`;
  const channelApi = 'https://arkscraper.duckdns.org/api/v2/live-tv/channels';
  fetch(channelApi).then(async response => { const body = await response.json(); if (!response.ok || body.success !== true) throw new Error(body.error || 'Could not load channels.'); return body.channels || []; }).then(channels => {
    const language = grid.querySelector('#live-language'); const category = grid.querySelector('#live-category');
    [...new Set(channels.map(x => x.language).filter(Boolean))].sort().forEach(x => language.appendChild(el(`<option>${escapeHtml(x)}</option>`)));
    [...new Set(channels.map(x => x.category).filter(Boolean))].sort().forEach(x => category.appendChild(el(`<option>${escapeHtml(x)}</option>`)));
    const draw = () => { const term = grid.querySelector('#live-search').value.toLowerCase(); const shown = channels.filter(x => (!term || `${x.name} ${x.country || ''}`.toLowerCase().includes(term)) && (!language.value || x.language === language.value) && (!category.value || x.category === category.value)); const list = grid.querySelector('#live-grid'); list.innerHTML = ''; grid.querySelector('#live-count').textContent = `${shown.length} channels`; shown.forEach(channel => { const card = el(`<button class="live-tv-card">${channel.logo ? `<img src="${channel.logo}" alt="">` : '<div class="live-tv-logo">TV</div>'}<strong>${escapeHtml(channel.name)}</strong><span>${escapeHtml(channel.country || '')} · ${escapeHtml(channel.language || '')}</span><small>${escapeHtml(channel.category || '')}</small></button>`); card.addEventListener('click', () => { grid.querySelector('#live-player').innerHTML = `<div class="live-tv-player"><div><strong>${escapeHtml(channel.name)}</strong><span>${escapeHtml(channel.country || '')} · ${escapeHtml(channel.language || '')} · ${escapeHtml(channel.category || '')}</span></div><video controls autoplay playsinline src="${channel.url}">Your browser cannot play this channel.</video></div>`; }); list.appendChild(card); }); };
    grid.querySelectorAll('input,select').forEach(control => control.addEventListener('input', draw)); draw();
  }).catch(err => { grid.querySelector('#live-grid').innerHTML = `<div class="player-empty">${escapeHtml(err.message || 'Could not load channels.')}</div>`; });
}

async function renderPlatformResults(kind, id) {
  setActiveNav('platforms'); clearRoot(); root.appendChild(loader());
  const item = (kind === 'provider' ? Platforms.providers : Platforms.studios).find(x => String(x.id) === String(id));
  if (!item) { clearRoot(); root.appendChild(emptyState('Platform not found', 'Return to Platforms and choose a service.')); return; }
  let type = 'movie'; let pageNo = 1;
  const region = localStorage.getItem('ark_watch_region') || 'IN';
  const page = el(`<div class="catalog-page"><div class="page-title-row"><div><button class="back-link" id="platform-back">&larr; Platforms</button><h2 class="page-title">${escapeHtml(item.name)}</h2>${kind === 'provider' ? `<p class="page-subtitle">Availability in ${escapeHtml(region)}</p>` : ''}</div><div class="platform-tabs"><button class="chip active" data-type="movie">Movies</button><button class="chip" data-type="tv">TV Shows</button></div></div><div class="media-grid" id="platform-results"></div><div class="load-more-wrap"><button class="btn" id="platform-more">Load more</button></div></div>`);
  clearRoot(); root.appendChild(page);
  page.querySelector('#platform-back').addEventListener('click', () => { location.hash = '#/platforms'; });
  page.querySelectorAll('[data-type]').forEach(b => b.addEventListener('click', () => { type = b.dataset.type; pageNo = 1; page.querySelector('#platform-results').innerHTML = ''; page.querySelectorAll('[data-type]').forEach(x => x.classList.toggle('active', x === b)); load(); }));
  page.querySelector('#platform-more').addEventListener('click', () => { pageNo++; load(); });
  async function load() {
    const opts = kind === 'provider' ? { with_watch_providers: id, watch_region: region, with_watch_monetization_types: 'flatrate', sort_by: 'popularity.desc', page: pageNo } : { with_companies: id, sort_by: 'popularity.desc', page: pageNo };
    try { const data = await TMDB.discover(type, opts); data.results.forEach(x => page.querySelector('#platform-results').appendChild(mediaCard(x, type))); } catch (err) { page.querySelector('#platform-results').appendChild(errorView(err)); }
  }
  load();
}

/* ---------------- Credits ---------------- */
async function renderCredits() {
  setActiveNav('credits'); clearRoot();
  const page = el(`<div class="credits-page"><div class="credits-heading"><p>Behind every great story</p><h2 class="page-title">Credits</h2><p>Discover actors, actresses, writers, and directors.</p></div><form class="credits-search"><input placeholder="Search people" aria-label="Search people"><button class="btn btn-gold">Search</button></form><div class="credits-filters"><button class="chip active" data-filter="all">All people</button><button class="chip" data-filter="actor">Actors</button><button class="chip" data-filter="actress">Actresses</button><button class="chip" data-filter="Writing">Writers</button><button class="chip" data-filter="Directing">Directors</button></div><div class="credits-grid" id="credits-grid"></div><div class="load-more-wrap"><button class="btn" id="credits-more">Show more</button></div></div>`);
  root.appendChild(page); let people = [], active = 'all', pageNo = 1, includeAdult = false;
  const grid = page.querySelector('#credits-grid');
  const matchesFilter = person => active === 'all'
    || (active === 'actor' && person.known_for_department === 'Acting' && person.gender === 2)
    || (active === 'actress' && person.known_for_department === 'Acting' && person.gender === 1)
    || person.known_for_department === active;
  const draw = () => { grid.innerHTML = ''; people.filter(matchesFilter).forEach(p => { const card = el(`<button class="credit-card">${p.profile_path ? `<img src="${TMDB.profile(p.profile_path, 'w342')}" alt="">` : '<div class="credit-placeholder">No photo</div>'}<strong>${escapeHtml(p.name)}</strong><span>${escapeHtml(p.known_for_department || 'Film & TV')}</span></button>`); card.addEventListener('click', () => { location.hash = `#/person/${p.id}`; }); grid.appendChild(card); }); };
  async function fetchPeople(query) {
    let results;
    if (query) {
      results = (await TMDB.searchPeople(query, pageNo, includeAdult)).results;
    } else {
      const randomPages = [...new Set(Array.from({ length: 5 }, () => Math.floor(Math.random() * 500) + 1))];
      const responses = await Promise.all(randomPages.map(randomPage => TMDB.popularPeople(randomPage, includeAdult)));
      results = responses.flatMap(response => response.results || []);
    }
    people = pageNo === 1 ? results : [...new Map([...people, ...results].map(person => [person.id, person])).values()];
    draw();
  }
  page.querySelector('.credits-search').addEventListener('submit', async e => { e.preventDefault(); pageNo = 1; await fetchPeople(e.currentTarget.querySelector('input').value.trim()); });
  page.querySelectorAll('[data-filter]').forEach(b => b.addEventListener('click', async () => { active = b.dataset.filter; page.querySelectorAll('[data-filter]').forEach(x => x.classList.toggle('active', x === b)); if (active === 'all' && !page.querySelector('input').value.trim()) { pageNo = 1; await fetchPeople(''); } else draw(); }));
  async function setAdultResults(enabled) {
    includeAdult = enabled; pageNo = 1;
    await fetchPeople(page.querySelector('input').value.trim());
  }
  const shortcut = event => {
    if ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key.toLowerCase() === 'a') {
      event.preventDefault(); setAdultResults(!includeAdult);
    }
  };
  document.addEventListener('keydown', shortcut);
  registerCleanup(() => document.removeEventListener('keydown', shortcut));
  let headingTapCount = 0; let headingTapTimer = null;
  const creditsHeading = page.querySelector('.credits-heading');
  creditsHeading.addEventListener('pointerup', () => {
    headingTapCount++;
    clearTimeout(headingTapTimer);
    if (headingTapCount === 3) {
      headingTapCount = 0; setAdultResults(!includeAdult); return;
    }
    headingTapTimer = setTimeout(() => { headingTapCount = 0; }, 800);
  });
  registerCleanup(() => clearTimeout(headingTapTimer));
  page.querySelector('#credits-more').addEventListener('click', () => { pageNo++; fetchPeople(page.querySelector('input').value.trim()); });
  try { await fetchPeople(''); } catch (err) { grid.appendChild(errorView(err)); }
}

/* ---------------- Person ---------------- */
async function renderPerson(id) {
  clearRoot();
  root.appendChild(loader());
  try {
    const p = await TMDB.person(id);
    clearRoot();

    const credits = (p.combined_credits?.cast || [])
      .filter(c => c.poster_path && (c.media_type === 'movie' || c.media_type === 'tv'))
      .sort((a, b) => {
        const da = a.release_date || a.first_air_date || '';
        const db = b.release_date || b.first_air_date || '';
        return db.localeCompare(da);
      });
    const movieCredits = credits.filter(c => c.media_type === 'movie');
    const tvCredits = credits.filter(c => c.media_type === 'tv');

    const header = el(`
      <div class="page-title-row" style="align-items:flex-start;justify-content:flex-start;gap:28px;">
        <div class="detail-poster" style="width:180px;flex-shrink:0;">
          ${p.profile_path
            ? `<img src="${TMDB.profile(p.profile_path, 'w342')}" alt="${escapeHtml(p.name)}">`
            : `<div style="aspect-ratio:2/3;display:flex;align-items:center;justify-content:center;background:var(--surface-2);color:var(--text-faint);font-size:40px;">${escapeHtml(p.name[0] || '?')}</div>`}
        </div>
        <div style="flex:1;min-width:0;">
          <h2 class="page-title" style="margin-bottom:10px;">${escapeHtml(p.name)}</h2>
          <div class="detail-meta" style="margin-bottom:14px;">
            ${p.known_for_department ? `<span>${escapeHtml(p.known_for_department)}</span>` : ''}
            ${p.birthday ? `<span>Born ${escapeHtml(p.birthday)}</span>` : ''}
            ${p.place_of_birth ? `<span>${escapeHtml(p.place_of_birth)}</span>` : ''}
          </div>
          <p class="detail-overview" style="max-width:640px;">${escapeHtml(p.biography || 'No biography available.')}</p>
        </div>
      </div>
    `);
    root.appendChild(header);

    const tabsWrap = el(`
      <div class="filters-bar">
        <button class="chip active" data-tab="movie">Movies (${movieCredits.length})</button>
        <button class="chip" data-tab="tv">TV Shows (${tvCredits.length})</button>
      </div>
    `);
    const grid = el(`<div class="media-grid"></div>`);
    root.appendChild(tabsWrap);
    root.appendChild(grid);

    function drawTab(tab) {
      grid.innerHTML = '';
      const list = tab === 'tv' ? tvCredits : movieCredits;
      if (!list.length) {
        grid.appendChild(emptyState(`No ${tab === 'tv' ? 'TV Shows' : 'Movies'} found`, ''));
        return;
      }
      list.forEach(item => {
        const card = mediaCard(item, tab);
        if (card) grid.appendChild(card);
      });
    }
    tabsWrap.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      tabsWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      drawTab(chip.dataset.tab);
    });
    drawTab(movieCredits.length >= tvCredits.length ? 'movie' : 'tv');
    if (movieCredits.length < tvCredits.length) {
      tabsWrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      tabsWrap.querySelector('[data-tab="tv"]').classList.add('active');
    }
  } catch (err) {
    clearRoot();
    root.appendChild(errorView(err));
  }
}

/* ---------------- Watchlist ---------------- */
function isAnimeItem(item) {
  return (item.genreIds || []).includes(16) && item.originalLanguage === 'ja';
}

/* Items pulled from the shared-watchlist server carry no genre/language data,
   so they can't be classified as anime until backfilled. This fetches each
   unclassified item's TMDB basics in the background (bounded concurrency) and
   patches it in place, refreshing the tab counts as it goes. */
let enrichInFlight = false;
async function enrichWatchlistMetadata() {
  if (enrichInFlight) return;
  const pending = Watchlist.all().filter(i => i.genreIds === undefined);
  if (!pending.length) return;
  enrichInFlight = true;
  let idx = 0;
  let sinceDispatch = 0;
  async function worker() {
    while (idx < pending.length) {
      const item = pending[idx++];
      try {
        const d = await TMDB.basic(item.mediaType, item.id);
        Watchlist.updateMeta(item.mediaType, item.id, {
          genreIds: (d.genres || []).map(g => g.id),
          originalLanguage: d.original_language,
        }, { silent: true });
      } catch {
        Watchlist.updateMeta(item.mediaType, item.id, { genreIds: [], originalLanguage: null }, { silent: true });
      }
      if (++sinceDispatch >= 20) {
        sinceDispatch = 0;
        document.dispatchEvent(new CustomEvent('ark:watchlist-changed'));
      }
    }
  }
  await Promise.all(Array.from({ length: 6 }, worker));
  document.dispatchEvent(new CustomEvent('ark:watchlist-changed'));
  enrichInFlight = false;
}
const WATCHLIST_TABS = [
  { key: 'movie', label: 'Movies', match: i => i.mediaType === 'movie' && !isAnimeItem(i) },
  { key: 'tv', label: 'TV Shows', match: i => i.mediaType === 'tv' && !isAnimeItem(i) },
  { key: 'animeMovie', label: 'Anime Movies', match: i => i.mediaType === 'movie' && isAnimeItem(i) },
  { key: 'animeTv', label: 'Anime Series', match: i => i.mediaType === 'tv' && isAnimeItem(i) },
];

function renderWatchlist() {
  setActiveNav('watchlist');
  clearRoot();
  root.appendChild(el(`<div class="page-title-row"><h2 class="page-title">Watchlist</h2></div>`));

  let activeTab = 'movie';
  const tabsBar = el(`<div class="filters-bar"></div>`);
  WATCHLIST_TABS.forEach((t, i) => {
    tabsBar.appendChild(el(`<button class="chip ${i === 0 ? 'active' : ''}" data-tab="${t.key}">${escapeHtml(t.label)}</button>`));
  });
  root.appendChild(tabsBar);

  const toolbar = el(`
    <div class="watchlist-toolbar">
      <input id="wl-search" class="toolbar-btn" type="text" placeholder="Search your watchlist…" style="cursor:text;min-width:180px;">
      <select id="wl-sort" class="toolbar-btn">
        <option value="addedAt">Recently Added</option>
        <option value="title">Title (A–Z)</option>
        <option value="titleDesc">Title (Z–A)</option>
        <option value="rating">Rating</option>
        <option value="releaseDate">Release Date</option>
      </select>
      <button class="toolbar-btn" id="wl-export">Export Watchlist</button>
      <label class="toolbar-btn" style="cursor:pointer;">Import Watchlist<input id="wl-import" type="file" accept="application/json" style="display:none"></label>
      <button class="toolbar-btn danger" id="wl-clear">Clear Watchlist</button>
    </div>
  `);
  root.appendChild(toolbar);
  const grid = el(`<div class="media-grid"></div>`);
  root.appendChild(grid);

  tabsBar.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    tabsBar.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    activeTab = chip.dataset.tab;
    draw();
  });

  function draw() {
    const sortBy = toolbar.querySelector('#wl-sort').value;
    const query = toolbar.querySelector('#wl-search').value.trim().toLowerCase();
    const all = Watchlist.sorted(sortBy);

    tabsBar.querySelectorAll('.chip').forEach(chip => {
      const tab = WATCHLIST_TABS.find(t => t.key === chip.dataset.tab);
      chip.textContent = `${tab.label} (${all.filter(tab.match).length})`;
    });

    const activeMatch = WATCHLIST_TABS.find(t => t.key === activeTab).match;
    let items = all.filter(activeMatch);
    if (query) items = items.filter(i => i.title.toLowerCase().includes(query));
    grid.innerHTML = '';
    if (!items.length) {
      grid.appendChild(emptyState(
        query ? 'No matches in your watchlist' : 'Nothing here yet',
        query ? 'Try a different search term.' : 'Add movies and shows from any detail page.'
      ));
      return;
    }
    items.forEach(item => {
      const pseudo = {
        id: item.id, title: item.title, poster_path: item.posterPath, vote_average: item.voteAverage, media_type: item.mediaType,
        release_date: item.mediaType === 'movie' ? item.releaseDate : undefined,
        first_air_date: item.mediaType === 'tv' ? item.releaseDate : undefined,
      };
      const card = mediaCard(pseudo, item.mediaType);
      if (card) grid.appendChild(card);
    });
  }

  toolbar.querySelector('#wl-sort').addEventListener('change', draw);
  toolbar.querySelector('#wl-search').addEventListener('input', draw);
  toolbar.querySelector('#wl-export').addEventListener('click', () => Watchlist.exportJson());
  toolbar.querySelector('#wl-import').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (file) { await Watchlist.importJson(file); draw(); }
    e.target.value = '';
  });
  toolbar.querySelector('#wl-clear').addEventListener('click', () => {
    if (confirm('Empty your entire watchlist?')) { Watchlist.clear(); draw(); }
  });
  document.addEventListener('ark:watchlist-changed', draw);
  registerCleanup(() => document.removeEventListener('ark:watchlist-changed', draw));
  draw();
  enrichWatchlistMetadata();
}

function sharedWatchlistSection() {
  const section = el(`
    <div class="settings-section" style="max-width:none;padding:0 28px;">
      <div class="settings-row"><div>
        <div class="label">Share Across Devices</div>
        <div class="sub">Uses ARK Theater's own shared-watchlist server. Experimental: pairing works, but item sync may not fully persist since the exact protocol isn't public.</div>
      </div></div>
      <div id="sw-body" class="watchlist-toolbar" style="padding:14px 0 0;"></div>
      <div id="sw-status" style="margin-top:10px;font-size:12.5px;color:var(--text-faint);"></div>
    </div>
  `);
  const body = section.querySelector('#sw-body');
  const status = section.querySelector('#sw-status');

  function setStatus(msg, isError) {
    status.textContent = msg;
    status.style.color = isError ? 'var(--danger)' : 'var(--text-faint)';
  }

  function drawLinked() {
    body.innerHTML = '';
    body.appendChild(el(`<button class="toolbar-btn" id="sw-sync">Sync Now</button>`));
    body.appendChild(el(`<button class="toolbar-btn danger" id="sw-unlink">Unlink Device</button>`));
    body.querySelector('#sw-sync').addEventListener('click', async () => {
      setStatus('Syncing…');
      try {
        const res = await SharedWatchlist.pullSync();
        setStatus(`Server responded: ${res.items.length} item(s) on the shared library (revision ${res.revision}).`);
      } catch (err) {
        setStatus(err.message, true);
      }
    });
    body.querySelector('#sw-unlink').addEventListener('click', () => {
      SharedWatchlist.unlink();
      setStatus('Unlinked from shared library.');
      drawUnlinked();
    });
  }

  function drawUnlinked() {
    body.innerHTML = '';
    body.appendChild(el(`<button class="toolbar-btn" id="sw-create">Create Pairing Code</button>`));
    body.appendChild(el(`<input id="sw-code-input" class="toolbar-btn" style="cursor:text;" placeholder="Enter code" maxlength="4">`));
    body.appendChild(el(`<button class="toolbar-btn" id="sw-join">Join with Code</button>`));

    body.querySelector('#sw-create').addEventListener('click', async () => {
      setStatus('Creating pairing code…');
      try {
        const { code, expiresAt } = await SharedWatchlist.createPairingCode();
        const mins = Math.max(1, Math.round((new Date(expiresAt) - Date.now()) / 60000));
        setStatus(`Pairing code: ${code} — enter this on your other device within ~${mins} min.`);
      } catch (err) {
        setStatus(err.message, true);
      }
    });
    body.querySelector('#sw-join').addEventListener('click', async () => {
      const code = body.querySelector('#sw-code-input').value.trim();
      if (!code) return;
      setStatus('Joining…');
      try {
        await SharedWatchlist.joinPairingCode(code);
        setStatus('Linked! This device now shares the same library.');
        drawLinked();
      } catch (err) {
        setStatus(err.message, true);
      }
    });
  }

  SharedWatchlist.isLinked() ? drawLinked() : drawUnlinked();
  return section;
}

/* ---------------- Settings ---------------- */
function renderSettings() {
  clearRoot();
  root.appendChild(el(`<div class="page-title-row"><h2 class="page-title">Settings</h2></div>`));

  const apiSection = el(`
    <div class="settings-section">
      <div class="settings-row">
        <div>
          <div class="label">TMDB API Key</div>
          <div class="sub">Used to fetch movie &amp; TV metadata. Stored only in this browser.</div>
        </div>
      </div>
      <input id="settings-api-key" type="text" placeholder="TMDB API Key (v3)" style="width:100%;padding:11px 14px;border-radius:8px;background:var(--surface-2);border:1px solid var(--border);color:var(--text);margin-top:8px;">
      <button class="btn btn-gold" id="settings-api-save" style="margin-top:10px;">Save Key</button>
    </div>
  `);
  apiSection.querySelector('#settings-api-key').value = localStorage.getItem('ark_tmdb_key') || '';
  apiSection.querySelector('#settings-api-save').addEventListener('click', () => {
    const v = apiSection.querySelector('#settings-api-key').value.trim();
    if (v) { TMDB.setKey(v); alert('API key saved.'); }
  });
  root.appendChild(apiSection);

  const fontSection = el(`
    <div class="settings-section">
      <div class="settings-row"><div class="label">App Font</div></div>
      <div class="font-grid" id="font-grid"></div>
    </div>
  `);
  const grid = fontSection.querySelector('#font-grid');
  const current = localStorage.getItem('ark_font') || 'Manrope';
  ARK_FONTS.forEach(f => {
    const opt = el(`
      <div class="font-option ${f.family === current ? 'active' : ''}" style="font-family:'${f.family}',sans-serif;">
        <div class="fname">${escapeHtml(f.label)}</div>
        <div class="fdesc">${escapeHtml(f.desc)}</div>
      </div>
    `);
    opt.addEventListener('click', () => {
      applyArkFont(f.family);
      grid.querySelectorAll('.font-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
    });
    grid.appendChild(opt);
  });
  root.appendChild(fontSection);

  const accentSection = el(`
    <div class="settings-section">
      <div class="settings-row"><div class="label">Accent Color</div></div>
      <div class="accent-grid" id="accent-grid"></div>
    </div>
  `);
  const accentGrid = accentSection.querySelector('#accent-grid');
  const currentAccent = localStorage.getItem('ark_accent') || 'gold';
  ARK_ACCENTS.forEach(a => {
    const swatch = el(`
      <button class="accent-swatch ${a.id === currentAccent ? 'active' : ''}" aria-label="${escapeHtml(a.name)}"
        style="background:linear-gradient(135deg, ${a.c1}, ${a.c2} 45%, ${a.c3} 75%, ${a.c4});">
      </button>
    `);
    swatch.addEventListener('click', () => {
      applyArkAccent(a.id);
      accentGrid.querySelectorAll('.accent-swatch').forEach(s => s.classList.remove('active'));
      swatch.classList.add('active');
    });
    accentGrid.appendChild(swatch);
  });
  root.appendChild(accentSection);
  root.appendChild(sharedWatchlistSection());

  root.appendChild(el(`
    <div class="notice-box" style="margin:0 28px;">
      <strong>About this tribute —</strong> ARK Theatre's original app streams video via a third-party scraper
      backend. That part is intentionally not reproduced here; this site only mirrors the browsing UI using TMDB's
      official metadata API.
    </div>
  `));
}

/* ---------------- Shared helpers ---------------- */
function emptyState(title, sub) {
  return el(`
    <div class="empty-state">
      <img src="assets/logo_mark_icon.png" alt="">
      <h3 style="font-family:var(--font-display);color:var(--text);">${escapeHtml(title)}</h3>
      <p>${escapeHtml(sub)}</p>
    </div>
  `);
}

function errorView(err) {
  return el(`
    <div class="empty-state">
      <h3 style="font-family:var(--font-display);color:var(--danger);">Something went wrong</h3>
      <p>${escapeHtml(err.message || String(err))}</p>
    </div>
  `);
}

/* ---------------- Router ---------------- */
async function router() {
  const hash = location.hash || '#/home';
  const parts = hash.replace(/^#\//, '').split('/');

  if (parts[0] === 'detail' && parts[1] && parts[2]) {
    setActiveNav(null);
    await renderDetail(parts[1], parts[2]);
  } else if (parts[0] === 'player' && parts[1] && parts[2]) {
    setActiveNav(null);
    await renderPlayer(parts[1], parts[2]);
  } else if (parts[0] === 'person' && parts[1]) {
    setActiveNav(null);
    await renderPerson(parts[1]);
  } else if (parts[0] === 'movies') {
    await renderBrowse('movie');
  } else if (parts[0] === 'tv') {
    await renderBrowse('tv');
  } else if (parts[0] === 'search' && parts[1]) {
    setActiveNav(null);
    await performSearch(decodeURIComponent(parts[1]));
  } else if (parts[0] === 'watchlist') {
    renderWatchlist();
  } else if (parts[0] === 'platforms') {
    await renderPlatforms();
  } else if (parts[0] === 'platform' && parts[1] && parts[2]) {
    await renderPlatformResults(parts[1], parts[2]);
  } else if (parts[0] === 'credits') {
    await renderCredits();
  } else if (parts[0] === 'settings') {
    setActiveNav(null);
    renderSettings();
  } else {
    await renderHome();
  }
  window.scrollTo(0, 0);
}

/* ---------------- Bootstrap ---------------- */
function boot() {
  initArkFont();
  initArkAccent();
  startApp();
}

function startApp() {
  const header = document.getElementById('app-header');
  header.classList.remove('hidden');
  document.getElementById('app-root').classList.remove('hidden');
  document.getElementById('bottom-nav').classList.remove('hidden');
  setupSearchUi();
  setupBottomMoreMenu();

  /* Header is position:fixed so it stays pinned on every page; this keeps
     --header-h in sync with its real height (it grows when the search bar
     opens) so .app-root's top padding never overlaps or gaps. */
  const syncHeaderHeight = () => document.documentElement.style.setProperty('--header-h', `${header.offsetHeight}px`);
  new ResizeObserver(syncHeaderHeight).observe(header);
  syncHeaderHeight();

  window.addEventListener('hashchange', router);
  router();

  /* Individual adds/removes already push themselves immediately (see
     Watchlist.add/remove). This poll only catches changes made on OTHER
     linked devices, which have no other way to reach this one — run one
     immediately on load rather than waiting for the first tick. */
  if (SharedWatchlist.isLinked()) SharedWatchlist.pullSync().catch(() => { /* retried next tick */ });
  setInterval(() => {
    if (!SharedWatchlist.isLinked()) return;
    SharedWatchlist.pullSync().catch(() => { /* retried next tick */ });
  }, 15000);
}

document.addEventListener('DOMContentLoaded', boot);
