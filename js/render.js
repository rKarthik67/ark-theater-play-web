/* UI builder helpers — hero banner, media rows/cards, cast rows. */

function el(html) {
  const t = document.createElement('template');
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function escapeHtml(str = '') {
  return str.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function titleOf(item) { return item.title || item.name || 'Untitled'; }
function yearOf(item) {
  const d = item.release_date || item.first_air_date;
  return d ? d.slice(0, 4) : '';
}
function mediaTypeOf(item, fallback) { return item.media_type || fallback; }

const languageDisplay = (() => {
  try { return new Intl.DisplayNames(['en'], { type: 'language' }); }
  catch { return null; }
})();
function languageName(code) {
  if (!code) return '';
  try { return languageDisplay?.of(code) || code.toUpperCase(); }
  catch { return code.toUpperCase(); }
}

function mediaCard(item, mediaType, rank) {
  const type = mediaTypeOf(item, mediaType);
  if (type !== 'movie' && type !== 'tv') return null;
  const inWatchlist = Watchlist.has(type, item.id);
  const card = el(`
    <div class="media-card" data-media-type="${type}" data-id="${item.id}">
      <div class="poster-wrap">
        ${item.vote_average ? `<span class="rating-badge">★ ${item.vote_average.toFixed(1)}</span>` : ''}
        <button class="watchlist-toggle ${inWatchlist ? 'active' : ''}" aria-label="${inWatchlist ? 'Remove from watchlist' : 'Add to watchlist'}">
          <svg viewBox="0 0 24 24"><path d="M6 2h12a1 1 0 0 1 1 1v18l-7-4.5L5 21V3a1 1 0 0 1 1-1z"/></svg>
        </button>
        ${item.poster_path
          ? `<img loading="lazy" src="${TMDB.poster(item.poster_path)}" alt="${escapeHtml(titleOf(item))}">`
          : `<div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--text-faint);font-size:12px;text-align:center;padding:10px;">${escapeHtml(titleOf(item))}</div>`}
        ${rank ? `<span class="rank">${rank}</span>` : ''}
      </div>
      <div class="title">${escapeHtml(titleOf(item))}</div>
      <div class="meta-line">${type === 'movie' ? 'Movie' : 'TV Show'}${yearOf(item) ? ' · ' + yearOf(item) : ''}</div>
    </div>
  `);
  card.querySelector('.watchlist-toggle').addEventListener('click', (e) => {
    e.stopPropagation();
    e.preventDefault();
    Watchlist.toggle({
      mediaType: type, id: item.id, title: titleOf(item), posterPath: item.poster_path, voteAverage: item.vote_average,
      releaseDate: item.release_date || item.first_air_date || null,
      genreIds: item.genre_ids,
      originalLanguage: item.original_language,
    });
    const btn = e.currentTarget;
    const nowIn = Watchlist.has(type, item.id);
    btn.classList.toggle('active', nowIn);
    btn.setAttribute('aria-label', nowIn ? 'Remove from watchlist' : 'Add to watchlist');
  });
  card.addEventListener('click', () => { location.hash = `#/detail/${type}/${item.id}`; });
  return card;
}

function mediaRowSection(title, items, mediaType, { ranked = false, seeAllHash = null, onClear = null } = {}) {
  const filtered = items.filter(i => mediaTypeOf(i, mediaType) === 'movie' || mediaTypeOf(i, mediaType) === 'tv');
  if (!filtered.length) return null;
  const section = el(`
    <div class="row-section">
      <div class="row-head">
        <h3 class="row-title">${escapeHtml(title)}</h3>
        ${seeAllHash ? `<a class="row-see-all" href="${seeAllHash}">See all</a>` : ''}
        ${onClear ? `<button class="row-see-all" style="background:none;border:none;cursor:pointer;">Clear</button>` : ''}
      </div>
    </div>
  `);
  if (onClear) section.querySelector('.row-head button').addEventListener('click', onClear);
  const row = el(`<div class="media-row"></div>`);
  filtered.forEach((item, i) => {
    const card = mediaCard(item, mediaType, ranked ? i + 1 : null);
    if (card) row.appendChild(card);
  });
  section.appendChild(wrapAsSlider(row));
  return section;
}

/* Wraps any horizontally-scrolling row in prev/next arrows + drag-to-scroll,
   used for media rows and the cast row alike. */
function wrapAsSlider(row) {
  const wrap = el(`
    <div class="row-slider">
      <button class="slider-arrow left" aria-label="Scroll left">
        <svg viewBox="0 0 24 24"><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z"/></svg>
      </button>
      <button class="slider-arrow right" aria-label="Scroll right">
        <svg viewBox="0 0 24 24"><path d="M8.6 16.6 10 18l6-6-6-6-1.4 1.4L13.2 12z"/></svg>
      </button>
    </div>
  `);
  wrap.insertBefore(row, wrap.querySelector('.slider-arrow.right'));
  initRowSlider(wrap, row);
  return wrap;
}

function initRowSlider(wrap, row) {
  const leftBtn = wrap.querySelector('.slider-arrow.left');
  const rightBtn = wrap.querySelector('.slider-arrow.right');

  function page() { return row.clientWidth * 0.85; }
  function updateArrows() {
    const maxScroll = row.scrollWidth - row.clientWidth - 2;
    leftBtn.classList.toggle('is-hidden', row.scrollLeft <= 2);
    rightBtn.classList.toggle('is-hidden', row.scrollLeft >= maxScroll);
  }

  leftBtn.addEventListener('click', () => row.scrollBy({ left: -page(), behavior: 'smooth' }));
  rightBtn.addEventListener('click', () => row.scrollBy({ left: page(), behavior: 'smooth' }));
  row.addEventListener('scroll', updateArrows, { passive: true });
  window.addEventListener('resize', updateArrows);
  registerCleanup(() => window.removeEventListener('resize', updateArrows));
  requestAnimationFrame(updateArrows);

  enableDragScroll(row);
}

/* Mouse/pen click-drag-to-scroll for media rows. Touch devices already get
   native momentum scrolling, so only pointerType "mouse"/"pen" is handled here.
   Pointer capture is only engaged once real movement is detected — capturing
   immediately on pointerdown would redirect the eventual "click" to the row
   itself instead of the card underneath, silently breaking navigation. */
function enableDragScroll(row) {
  let isDown = false, captured = false, pointerId = null, startX = 0, startScroll = 0, moved = 0;

  function killClick(e) { e.stopPropagation(); }

  row.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'touch') return;
    isDown = true; captured = false; moved = 0;
    startX = e.clientX; startScroll = row.scrollLeft; pointerId = e.pointerId;
  });
  row.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    moved = Math.max(moved, Math.abs(dx));
    if (!captured && moved > 4) {
      captured = true;
      row.classList.add('dragging');
      try { row.setPointerCapture(pointerId); } catch { /* ignore */ }
    }
    if (captured) row.scrollLeft = startScroll - dx;
  });
  function endDrag() {
    if (!isDown) return;
    isDown = false;
    row.classList.remove('dragging');
    if (captured) {
      try { row.releasePointerCapture(pointerId); } catch { /* ignore */ }
      row.addEventListener('click', killClick, { capture: true, once: true });
    }
  }
  row.addEventListener('pointerup', endDrag);
  row.addEventListener('pointercancel', endDrag);
  row.addEventListener('pointerleave', () => { if (isDown && !captured) endDrag(); });
}

const HERO_AUTOPLAY_MS = 6500;

function heroSlider(items, fallbackMediaType) {
  const slides = items.slice(0, 6);
  const hero = el(`
    <div class="hero">
      <div class="hero-track"></div>
      <div class="hero-dots"></div>
    </div>
  `);
  const track = hero.querySelector('.hero-track');
  const dotsWrap = hero.querySelector('.hero-dots');

  slides.forEach((item, i) => {
    const type = mediaTypeOf(item, fallbackMediaType);
    const slide = el(`
      <div class="hero-slide">
        <div class="hero-bg" style="background-image:url('${TMDB.backdrop(item.backdrop_path, 'original')}')"></div>
        <div class="hero-content">
          <p class="hero-eyebrow">Featured ${type === 'tv' ? 'Series' : 'Film'}</p>
          <h1 class="hero-title">${escapeHtml(titleOf(item))}</h1>
          <p class="hero-overview">${escapeHtml(item.overview || '')}</p>
          <div class="hero-actions">
            <button class="btn btn-gold" data-action="trailer">
              <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg> Watch Trailer
            </button>
            <button class="btn btn-ghost" data-action="info">
              <svg viewBox="0 0 24 24"><path d="M11 7h2v2h-2zm0 4h2v6h-2zm1-9a10 10 0 1 0 0 20 10 10 0 0 0 0-20z"/></svg> More Info
            </button>
          </div>
        </div>
      </div>
    `);
    slide.querySelector('[data-action="info"]').addEventListener('click', () => {
      location.hash = `#/detail/${type}/${item.id}`;
    });
    slide.querySelector('[data-action="trailer"]').addEventListener('click', async () => {
      const d = await TMDB.details(type, item.id);
      openTrailerFor(d);
    });
    track.appendChild(slide);

    const dot = el(`<button class="hero-dot" aria-label="Go to slide ${i + 1}"></button>`);
    dot.addEventListener('click', () => goTo(i, true));
    dotsWrap.appendChild(dot);
  });

  let active = 0;
  let timer = null;

  function render() {
    track.style.transform = `translateX(-${active * 100}%)`;
    [...dotsWrap.children].forEach((d, i) => d.classList.toggle('active', i === active));
  }
  function goTo(index, userTriggered) {
    active = (index + slides.length) % slides.length;
    render();
    if (userTriggered) restart();
  }
  function next() { goTo(active + 1); }
  function restart() {
    clearInterval(timer);
    timer = setInterval(next, HERO_AUTOPLAY_MS);
  }

  if (slides.length > 1) {
    hero.addEventListener('mouseenter', () => clearInterval(timer));
    hero.addEventListener('mouseleave', restart);
    restart();
    registerCleanup(() => clearInterval(timer));
    enableHeroSwipe(hero, track, () => active, goTo);
  } else {
    dotsWrap.classList.add('hidden');
  }
  render();

  return hero;
}

/* Pointer-based drag/swipe for the hero slider (mouse, touch, and pen). */
function enableHeroSwipe(hero, track, getActive, goTo) {
  let down = false, dragging = false, pointerId = null, startX = 0, deltaX = 0;

  hero.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    down = true; dragging = false; startX = e.clientX; deltaX = 0; pointerId = e.pointerId;
  });
  hero.addEventListener('pointermove', (e) => {
    if (!down) return;
    deltaX = e.clientX - startX;
    if (!dragging && Math.abs(deltaX) > 4) {
      dragging = true;
      hero.classList.add('dragging');
      track.style.transition = 'none';
      try { hero.setPointerCapture(pointerId); } catch { /* ignore */ }
    }
    if (dragging) {
      const pct = (deltaX / hero.clientWidth) * 100;
      track.style.transform = `translateX(calc(-${getActive() * 100}% + ${pct}%))`;
    }
  });
  function endDrag() {
    if (!down) return;
    down = false;
    if (!dragging) return;
    dragging = false;
    hero.classList.remove('dragging');
    track.style.transition = '';
    const threshold = hero.clientWidth * 0.12;
    if (deltaX <= -threshold) goTo(getActive() + 1, true);
    else if (deltaX >= threshold) goTo(getActive() - 1, true);
    else goTo(getActive(), true);
    deltaX = 0;
  }
  hero.addEventListener('pointerup', endDrag);
  hero.addEventListener('pointercancel', endDrag);
}

function openTrailerFor(details) {
  const videos = details.videos?.results || [];
  const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer')
    || videos.find(v => v.site === 'YouTube');
  const wrap = document.getElementById('trailer-frame-wrap');
  if (!trailer) {
    wrap.innerHTML = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:var(--text-dim);">No trailer available.</div>`;
  } else {
    wrap.innerHTML = `<iframe src="https://www.youtube.com/embed/${trailer.key}?autoplay=1" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
  }
  document.getElementById('trailer-modal').classList.remove('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('trailer-close').addEventListener('click', () => {
    document.getElementById('trailer-modal').classList.add('hidden');
    document.getElementById('trailer-frame-wrap').innerHTML = '';
  });
});

function loader() {
  return el(`<div class="loader"><div class="spinner"></div></div>`);
}

function castRow(credits) {
  const cast = (credits?.cast || []).slice(0, 16);
  if (!cast.length) return null;
  const section = el(`<div class="section"><h3>Cast</h3></div>`);
  const row = el(`<div class="cast-row"></div>`);
  cast.forEach(c => {
    const card = el(`
      <div class="cast-card">
        ${c.profile_path
          ? `<img loading="lazy" src="${TMDB.profile(c.profile_path)}" alt="${escapeHtml(c.name)}">`
          : `<div style="width:100px;height:100px;border-radius:50%;background:var(--surface-2);display:flex;align-items:center;justify-content:center;color:var(--text-faint);font-size:24px;">${escapeHtml(c.name[0] || '?')}</div>`}
        <div class="cname">${escapeHtml(c.name)}</div>
        <div class="crole">${escapeHtml(c.character || '')}</div>
      </div>
    `);
    card.addEventListener('click', () => { location.hash = `#/person/${c.id}`; });
    row.appendChild(card);
  });
  section.appendChild(wrapAsSlider(row));
  return section;
}

function watchProvidersSection(providersData) {
  const results = providersData?.results || {};
  const localeRegion = (navigator.language || 'en-US').split('-')[1];
  const region = results[localeRegion] ? localeRegion : (results.US ? 'US' : Object.keys(results)[0]);
  const entry = results[region];
  if (!entry) return null;

  const groups = [
    ['Stream', entry.flatrate],
    ['Rent', entry.rent],
    ['Buy', entry.buy],
  ].filter(([, list]) => list && list.length);
  if (!groups.length) return null;

  const section = el(`<div class="section"><h3>Available On (${escapeHtml(region)})</h3></div>`);
  groups.forEach(([label, providers]) => {
    const row = el(`<div class="provider-row"><span class="provider-label">${escapeHtml(label)}</span></div>`);
    providers.slice(0, 10).forEach(p => {
      row.appendChild(el(`
        <img class="provider-logo" src="${TMDB.providerLogo(p.logo_path)}" alt="${escapeHtml(p.provider_name)}" title="${escapeHtml(p.provider_name)}" loading="lazy">
      `));
    });
    section.appendChild(row);
  });
  if (entry.link) {
    section.appendChild(el(`
      <p class="provider-attribution">Streaming availability data from <a href="${entry.link}" target="_blank" rel="noopener">JustWatch</a> via TMDB.</p>
    `));
  }
  return section;
}
