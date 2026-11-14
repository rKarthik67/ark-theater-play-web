/* ArkPlayer: a custom-skinned control layer over a plain <video>, used only
   for native (scraper-resolved) playback - iframe embeds can't be
   controlled this way, so they keep using their own player's UI. Modeled
   closely on watched.cx's player chrome: a TMDB title-logo pause/loading
   card, a thin red scrub bar, a rewind/play/forward transport cluster with
   a rolling-digit ("odometer") time readout, and a top bar with back/cast/
   picture-in-picture controls - laid over a plain <video> instead of native
   browser or Plyr controls. */
const ArkPlayer = (() => {
  const icon = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>',
    rewind: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 4v4h4"/></svg>',
    forward: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3-6.7L21 8"/><path d="M21 4v4h-4"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>',
    cast: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-6"/><path d="M2 12a9 9 0 0 1 8 8"/><path d="M2 16a5 5 0 0 1 4 4"/><circle cx="2" cy="20" r="1" fill="currentColor"/></svg>',
    pip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><rect x="12" y="12" width="8" height="6" rx="1" fill="currentColor" stroke="none"/></svg>',
    volumeHigh: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 5V4L8 9H4zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM13 3.2v2.1c3 .9 5 3.6 5 6.7s-2 5.8-5 6.7v2.1c4.1-1 7-4.7 7-8.8s-2.9-7.8-7-8.8z"/></svg>',
    volumeMute: '<svg viewBox="0 0 24 24"><path d="M16.5 12 19 9.5 17.5 8 15 10.5 12.5 8 11 9.5l2.5 2.5-2.5 2.5 1.5 1.5 2.5-2.5 2.5 2.5L19 14.5zM4 9v6h4l5 5V4L8 9H4z"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><path d="M19.14 12.94a7.07 7.07 0 0 0 .05-.94 7.07 7.07 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.3 7.3 0 0 0-1.62-.94L14.4 2.6a.5.5 0 0 0-.5-.42h-3.8a.5.5 0 0 0-.5.42l-.36 2.42c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0-.05.94c0 .32.02.63.05.94L2.83 14.5a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.33.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.42c.05.24.26.42.5.42h3.8c.24 0 .45-.18.5-.42l.36-2.42c.59-.24 1.13-.56 1.62-.94l2.39.96c.24.1.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>',
    fullscreenEnter: '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 9h-3v2h5v-5h-2zM14 5v2h3v3h2V5z"/></svg>',
    fullscreenExit: '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
    hd: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="6" width="20" height="12" rx="2"/><path d="M7 9v6M7 12h2M9 9v6"/><path d="M13 9v6h1a2 2 0 0 0 2-2v-2a2 2 0 0 0-2-2z"/></svg>',
    layers: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 13 9 5 9-5"/></svg>',
    captions: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M7 13.5a1.8 1.8 0 1 1 0-3 1.6 1.6 0 0 1 1.3.6M14 13.5a1.8 1.8 0 1 1 0-3 1.6 1.6 0 0 1 1.3.6"/></svg>',
    music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg>',
    moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.4 14.7A8.5 8.5 0 1 1 9.3 3.6a7 7 0 0 0 11.1 11.1Z"/></svg>',
    speedo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4.6 19a9 9 0 1 1 14.8 0"/><path d="M12 13 16 8"/><circle cx="12" cy="13" r="1" fill="currentColor" stroke="none"/></svg>',
    textSize: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7V5h12v2M10 5v14M8 19h4"/><path d="M15 13h5M17.5 13v6"/></svg>',
    chevronRight: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
  };

  const SEEK_SECONDS = 10;

  function pad2(n) { return String(n).padStart(2, '0'); }
  function formatClock(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h ? `${h}:${pad2(m)}:${pad2(s)}` : `${m}:${pad2(s)}`;
  }
  function formatEndsAt(date) {
    let h = date.getHours();
    const m = pad2(date.getMinutes());
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    return `${h}:${m} ${suffix}`;
  }

  // A per-digit "odometer" readout: each digit character gets its own
  // 0-9 strip that slides vertically to the current value, the rest are
  // static ':' separators - mirrors the rolling time counter watched.cx
  // uses instead of a plain text node. Rebuilt only when the digit *count*
  // changes (e.g. crossing the 1-hour mark), otherwise just re-transformed.
  function buildDigitSlot() {
    const strip = Array.from({ length: 10 }, (_, n) => `<span>${n}</span>`).join('');
    return `<span class="ark-digit"><span class="ark-digit-strip">${strip}</span></span>`;
  }
  function syncRollingTime(container, text) {
    const shape = text.replace(/\d/g, '0');
    if (container.dataset.shape !== shape) {
      container.dataset.shape = shape;
      container.innerHTML = [...text].map((ch) => (ch === ':' ? '<span class="ark-digit-sep">:</span>' : buildDigitSlot())).join('');
    }
    const digitEls = container.querySelectorAll('.ark-digit-strip');
    let di = 0;
    for (const ch of text) {
      if (ch === ':') continue;
      digitEls[di++].style.transform = `translateY(-${Number(ch) * 10}%)`;
    }
  }

  function attach(video, meta = {}) {
    const wrap = document.createElement('div');
    wrap.className = 'ark-player';
    video.parentNode.insertBefore(wrap, video);
    video.controls = false;
    video.classList.add('ark-player-video');
    // The <video> was created with class="hidden" (display:none !important)
    // so the iframe shows by default before any scraper source is picked.
    // Once wrapped, visibility is the wrapper's job - a stale 'hidden' left
    // on the video itself would hide it forever regardless of the wrapper.
    video.classList.remove('hidden');
    wrap.appendChild(video);

    const factsLine = [meta.year, meta.runtimeLabel, meta.rating ? `★ ${meta.rating}` : null, meta.genresLabel]
      .filter(Boolean).join(' <span class="ark-dot">·</span> ');

    wrap.insertAdjacentHTML('beforeend', `
      <div class="ark-loading">
        <span class="ark-loading-eyebrow">${meta.eyebrow || 'Movie'}${meta.year ? ` · ${meta.year}` : ''}</span>
        ${meta.logoUrl ? `<img class="ark-loading-logo" src="${meta.logoUrl}" alt="${meta.title || ''}">` : `<span class="ark-loading-title">${meta.title || ''}</span>`}
        <div class="ark-loading-track"><div class="ark-loading-shimmer"></div></div>
        <span class="ark-loading-message">Loading video…</span>
        <span class="ark-loading-detail">${meta.detail || ''}</span>
      </div>

      <div class="ark-pause-layer">
        <div class="ark-pause-scrim"></div>
        <div class="ark-pause-card">
          ${meta.logoUrl ? `<img class="ark-pause-logo" src="${meta.logoUrl}" alt="${meta.title || ''}">` : `<h2 class="ark-pause-title">${meta.title || ''}</h2>`}
          ${factsLine ? `<p class="ark-pause-facts">${factsLine}</p>` : ''}
          ${meta.overview ? `<p class="ark-pause-overview">${meta.overview}</p>` : ''}
          <p class="ark-pause-remaining"></p>
        </div>
      </div>

      <div class="ark-chrome">
        <div class="ark-top">
          <button type="button" class="ark-icon-btn ark-back" aria-label="Back">${icon.back}</button>
          <h1 class="ark-player-title">${meta.title || ''}</h1>
          <div class="ark-top-right">
            <button type="button" class="ark-icon-btn ark-cast hidden" aria-label="Cast">${icon.cast}</button>
            <button type="button" class="ark-icon-btn ark-pip hidden" aria-label="Picture-in-picture">${icon.pip}</button>
          </div>
        </div>
        <button type="button" class="ark-center-btn" aria-label="Play">${icon.play}</button>
        <div class="ark-bottom">
          <div class="ark-scrub" tabindex="0">
            <div class="ark-scrub-track"></div>
            <div class="ark-scrub-buffered"></div>
            <div class="ark-scrub-played"></div>
            <div class="ark-scrub-thumb"></div>
          </div>
          <div class="ark-controls">
            <button type="button" class="ark-icon-btn ark-rewind" aria-label="Back 10 seconds">${icon.rewind}</button>
            <button type="button" class="ark-icon-btn ark-transport-play" aria-label="Play">${icon.play}</button>
            <button type="button" class="ark-icon-btn ark-forward" aria-label="Forward 10 seconds">${icon.forward}</button>
            <span class="ark-time"><span class="ark-time-current"></span><span class="ark-time-sep">/</span><span class="ark-time-duration"></span></span>
            <span class="ark-ends-at"><span class="ark-ends-at-label">Ends at</span><span class="ark-ends-at-value"></span></span>
            <span class="ark-spacer"></span>
            <div class="ark-volume">
              <button type="button" class="ark-icon-btn ark-mute" aria-label="Mute">${icon.volumeHigh}</button>
              <input type="range" class="ark-volume-slider" min="0" max="1" step="0.05" value="1" aria-label="Volume">
            </div>
            <div class="ark-menu-host">
              <button type="button" class="ark-icon-btn ark-settings" aria-label="Settings">${icon.gear}</button>
              <div class="ark-sheet hidden">
                <div class="ark-sheet-main">
                  <div class="ark-sheet-grid">
                    <button type="button" class="ark-sheet-card hidden" data-cat="quality">${icon.hd}<span class="ark-sheet-card-label">Quality</span><span class="ark-sheet-card-value">Auto</span></button>
                    <button type="button" class="ark-sheet-card hidden" data-cat="server">${icon.layers}<span class="ark-sheet-card-label">Server</span><span class="ark-sheet-card-value">—</span></button>
                    <button type="button" class="ark-sheet-card hidden" data-cat="subtitles">${icon.captions}<span class="ark-sheet-card-label">Subtitles</span><span class="ark-sheet-card-value">Off</span></button>
                    <button type="button" class="ark-sheet-card hidden" data-cat="audio">${icon.music}<span class="ark-sheet-card-label">Audio</span><span class="ark-sheet-card-value">—</span></button>
                  </div>
                  <div class="ark-sheet-rows">
                    <button type="button" class="ark-sheet-row" data-cat="sleep">${icon.moon}<span>Sleep Timer</span><span class="ark-sheet-row-value"></span>${icon.chevronRight}</button>
                    <div class="ark-sheet-divider hidden"></div>
                    <div class="ark-sheet-row ark-sheet-row-toggle hidden">${icon.captions}<span>Enable Subtitles</span><label class="ark-toggle"><input type="checkbox" class="ark-subtitle-toggle" checked><span class="ark-toggle-track"><span class="ark-toggle-thumb"></span></span></label></div>
                    <button type="button" class="ark-sheet-row" data-cat="playback">${icon.speedo}<span>Playback Speed</span><span class="ark-sheet-row-value">Normal</span>${icon.chevronRight}</button>
                    <button type="button" class="ark-sheet-row hidden" data-cat="subtitleStyle">${icon.textSize}<span>Subtitle Settings</span>${icon.chevronRight}</button>
                  </div>
                </div>
                <div class="ark-sheet-sub hidden">
                  <div class="ark-sheet-subhead"><button type="button" class="ark-sheet-back">${icon.back}</button><span class="ark-sheet-subtitle"></span></div>
                  <div class="ark-sheet-sublist"></div>
                </div>
              </div>
            </div>
            <button type="button" class="ark-icon-btn ark-fullscreen" aria-label="Fullscreen">${icon.fullscreenEnter}</button>
          </div>
        </div>
      </div>
    `);

    const chrome = wrap.querySelector('.ark-chrome');
    const loadingLayer = wrap.querySelector('.ark-loading');
    const pauseLayer = wrap.querySelector('.ark-pause-layer');
    const pauseRemaining = wrap.querySelector('.ark-pause-remaining');
    const centerBtn = wrap.querySelector('.ark-center-btn');
    const backBtn = wrap.querySelector('.ark-back');
    const castBtn = wrap.querySelector('.ark-cast');
    const pipBtn = wrap.querySelector('.ark-pip');
    const rewindBtn = wrap.querySelector('.ark-rewind');
    const forwardBtn = wrap.querySelector('.ark-forward');
    const playBtn = wrap.querySelector('.ark-transport-play');
    const muteBtn = wrap.querySelector('.ark-mute');
    const volumeSlider = wrap.querySelector('.ark-volume-slider');
    const timeCurrent = wrap.querySelector('.ark-time-current');
    const timeDuration = wrap.querySelector('.ark-time-duration');
    const endsAtValue = wrap.querySelector('.ark-ends-at-value');
    const scrub = wrap.querySelector('.ark-scrub');
    const scrubBuffered = wrap.querySelector('.ark-scrub-buffered');
    const scrubPlayed = wrap.querySelector('.ark-scrub-played');
    const scrubThumb = wrap.querySelector('.ark-scrub-thumb');
    const settingsBtn = wrap.querySelector('.ark-settings');
    const sheet = wrap.querySelector('.ark-sheet');
    const sheetMain = wrap.querySelector('.ark-sheet-main');
    const sheetSub = wrap.querySelector('.ark-sheet-sub');
    const sheetSubtitle = wrap.querySelector('.ark-sheet-subtitle');
    const sheetSublist = wrap.querySelector('.ark-sheet-sublist');
    const sheetBack = wrap.querySelector('.ark-sheet-back');
    const qualityCard = wrap.querySelector('.ark-sheet-card[data-cat="quality"]');
    const serverCard = wrap.querySelector('.ark-sheet-card[data-cat="server"]');
    const subtitlesCard = wrap.querySelector('.ark-sheet-card[data-cat="subtitles"]');
    const audioCard = wrap.querySelector('.ark-sheet-card[data-cat="audio"]');
    const sleepRow = wrap.querySelector('.ark-sheet-row[data-cat="sleep"]');
    const playbackRow = wrap.querySelector('.ark-sheet-row[data-cat="playback"]');
    const subtitleStyleRow = wrap.querySelector('.ark-sheet-row[data-cat="subtitleStyle"]');
    const subtitleToggleRow = wrap.querySelector('.ark-sheet-row-toggle');
    const subtitleToggleInput = wrap.querySelector('.ark-subtitle-toggle');
    const sheetDivider = wrap.querySelector('.ark-sheet-divider');
    const fullscreenBtn = wrap.querySelector('.ark-fullscreen');

    if (backBtn) {
      if (typeof meta.onBack === 'function') backBtn.addEventListener('click', meta.onBack);
      else backBtn.classList.add('hidden');
    }

    // Remote Playback API (Chromium) or AirPlay (Safari) - whichever the
    // browser actually supports; hidden entirely rather than faking a
    // control that can't do anything.
    if (video.remote && typeof video.remote.watchAvailability === 'function') {
      video.remote.watchAvailability((available) => castBtn.classList.toggle('hidden', !available)).catch(() => castBtn.classList.add('hidden'));
      castBtn.addEventListener('click', () => video.remote.prompt().catch(() => {}));
    } else if (window.WebKitPlaybackTargetAvailabilityEvent && typeof video.webkitShowPlaybackTargetPicker === 'function') {
      castBtn.classList.remove('hidden');
      castBtn.addEventListener('click', () => video.webkitShowPlaybackTargetPicker());
    }
    if (document.pictureInPictureEnabled && !video.disablePictureInPicture) {
      pipBtn.classList.remove('hidden');
      pipBtn.addEventListener('click', () => {
        if (document.pictureInPictureElement) document.exitPictureInPicture().catch(() => {});
        else video.requestPictureInPicture().catch(() => {});
      });
    }

    function closeSheet() { sheet.classList.add('hidden'); }

    function flashCenterIcon(name) {
      centerBtn.innerHTML = icon[name];
      centerBtn.classList.remove('ark-pulse');
      // eslint-disable-next-line no-void
      void centerBtn.offsetWidth; // restart the CSS animation
      centerBtn.classList.add('ark-pulse');
    }

    function togglePlay() {
      if (video.paused) video.play().catch(() => {});
      else video.pause();
    }
    function seekBy(delta) {
      const next = video.currentTime + delta;
      video.currentTime = Number.isFinite(video.duration) ? Math.min(Math.max(0, next), video.duration) : Math.max(0, next);
    }
    centerBtn.addEventListener('click', togglePlay);
    playBtn.addEventListener('click', togglePlay);
    rewindBtn.addEventListener('click', () => seekBy(-SEEK_SECONDS));
    forwardBtn.addEventListener('click', () => seekBy(SEEK_SECONDS));
    // .ark-chrome sits as a full-size layer over the whole video (so its
    // bars can be positioned anywhere within it) with no background of its
    // own - clicking its empty middle previously did nothing, since only
    // the individual buttons inside it had listeners. Checking that the
    // click target *is* the chrome layer itself (not a bubbled descendant)
    // gives a tap-anywhere-on-the-video toggle without stealing clicks
    // meant for the scrub bar, buttons, or settings sheet.
    chrome.addEventListener('click', (event) => { if (event.target === chrome) togglePlay(); });

    // Keyboard shortcuts match the transport buttons exactly - Space mirrors
    // the big play/pause control, the arrows mirror the +/-10s rewind and
    // forward buttons. Skipped while the viewer is typing anywhere (e.g. the
    // subtitle search box) so a space or arrow keystroke there isn't hijacked.
    function isTypingTarget(target) {
      return Boolean(target) && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);
    }
    function handleKeydown(event) {
      if (isTypingTarget(event.target)) return;
      if (event.code === 'Space') { event.preventDefault(); togglePlay(); showBar(); }
      else if (event.code === 'ArrowLeft') { event.preventDefault(); seekBy(-SEEK_SECONDS); showBar(); }
      else if (event.code === 'ArrowRight') { event.preventDefault(); seekBy(SEEK_SECONDS); showBar(); }
    }
    document.addEventListener('keydown', handleKeydown);

    let hasPlayedOnce = false;
    function updatePauseVisibility() {
      pauseLayer.classList.toggle('show', video.paused && hasPlayedOnce);
    }
    video.addEventListener('loadedmetadata', () => { loadingLayer.classList.add('hidden'); updatePauseVisibility(); });
    video.addEventListener('canplay', () => loadingLayer.classList.add('hidden'));
    video.addEventListener('playing', () => { hasPlayedOnce = true; loadingLayer.classList.add('hidden'); updatePauseVisibility(); });
    video.addEventListener('play', () => {
      playBtn.innerHTML = icon.pause;
      flashCenterIcon('play');
      wrap.classList.add('is-playing');
      updatePauseVisibility();
    });
    video.addEventListener('pause', () => {
      playBtn.innerHTML = icon.play;
      flashCenterIcon('pause');
      wrap.classList.remove('is-playing');
      updatePauseVisibility();
    });
    // Treat the very first pause/idle frame (before anything has ever
    // played) as "paused" too, once we actually know how long the title
    // runs for - otherwise the pause card would never appear pre-playback.
    video.addEventListener('durationchange', () => { hasPlayedOnce = hasPlayedOnce || Number.isFinite(video.duration); updatePauseVisibility(); });

    muteBtn.addEventListener('click', () => {
      video.muted = !video.muted;
      muteBtn.innerHTML = video.muted || video.volume === 0 ? icon.volumeMute : icon.volumeHigh;
    });
    volumeSlider.addEventListener('input', () => {
      video.volume = Number(volumeSlider.value);
      video.muted = video.volume === 0;
      muteBtn.innerHTML = video.muted ? icon.volumeMute : icon.volumeHigh;
    });

    let scrubbing = false;

    function updateProgress() {
      // While dragging, the thumb follows the pointer (see seekFromEvent)
      // instead of the video's actual currentTime - overwriting it here
      // would fight the drag and make the thumb visibly jump around.
      if (!scrubbing) {
        const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
        scrubPlayed.style.width = `${pct}%`;
        scrubThumb.style.left = `${pct}%`;
        syncRollingTime(timeCurrent, formatClock(video.currentTime));
        timeDuration.textContent = formatClock(video.duration);
        if (video.buffered.length) {
          const end = video.buffered.end(video.buffered.length - 1);
          scrubBuffered.style.width = `${video.duration ? (end / video.duration) * 100 : 0}%`;
        }
      }
      if (Number.isFinite(video.duration)) {
        const remaining = Math.max(0, video.duration - video.currentTime);
        endsAtValue.textContent = formatEndsAt(new Date(Date.now() + remaining * 1000));
        const h = Math.floor(remaining / 3600); const m = Math.round((remaining % 3600) / 60);
        pauseRemaining.innerHTML = `${h ? `${h} hr ${m} min` : `${m} min`} left <span class="ark-dot">·</span> Ends at ${formatEndsAt(new Date(Date.now() + remaining * 1000))}`;
      }
    }
    video.addEventListener('timeupdate', updateProgress);
    video.addEventListener('loadedmetadata', updateProgress);
    video.addEventListener('progress', updateProgress);

    function ratioFromEvent(event) {
      const rect = scrub.getBoundingClientRect();
      const clientX = event.touches ? event.touches[0].clientX : event.clientX;
      return Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    }
    // Hls.js treats every currentTime write as a real seek (aborting and
    // re-buffering), so setting it on every pointermove - dozens of times a
    // second while dragging - was why forwarding felt slow: each tiny move
    // threw away the last seek's progress and started a new one. Now only
    // the visual thumb follows the pointer during the drag, and the actual
    // seek happens once, on release.
    let pendingRatio = null;
    function seekFromEvent(event) {
      const ratio = ratioFromEvent(event);
      pendingRatio = ratio;
      scrubPlayed.style.width = `${ratio * 100}%`;
      scrubThumb.style.left = `${ratio * 100}%`;
      if (Number.isFinite(video.duration)) {
        syncRollingTime(timeCurrent, formatClock(ratio * video.duration));
      }
    }
    scrub.addEventListener('pointerdown', (event) => { scrubbing = true; seekFromEvent(event); });
    window.addEventListener('pointermove', (event) => { if (scrubbing) seekFromEvent(event); });
    window.addEventListener('pointerup', () => {
      if (!scrubbing) return;
      scrubbing = false;
      if (pendingRatio !== null && Number.isFinite(video.duration)) video.currentTime = pendingRatio * video.duration;
      pendingRatio = null;
    });
    fullscreenBtn.addEventListener('click', () => {
      if (document.fullscreenElement) document.exitFullscreen();
      else wrap.requestFullscreen?.();
    });
    document.addEventListener('fullscreenchange', () => {
      fullscreenBtn.innerHTML = document.fullscreenElement ? icon.fullscreenExit : icon.fullscreenEnter;
    });

    function openSheet() {
      sheet.classList.remove('hidden');
      sheetSub.classList.add('hidden');
      sheetMain.classList.remove('hidden');
    }
    settingsBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = sheet.classList.contains('hidden');
      closeSheet();
      if (willOpen) openSheet();
    });
    wrap.addEventListener('click', (event) => {
      if (!event.target.closest('.ark-menu-host')) closeSheet();
    });

    // The bar fades out after a few idle seconds while playing, same as any
    // real player - but never while the settings sheet is open or it's paused.
    let idleTimer = null;
    function showBar() {
      wrap.classList.add('show-controls');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!video.paused && sheet.classList.contains('hidden')) {
          wrap.classList.remove('show-controls');
        }
      }, 2800);
    }
    wrap.addEventListener('pointermove', showBar);
    wrap.addEventListener('pointerdown', showBar);
    showBar();

    let currentSubtitles = null; let currentSubtitleSelect = null;
    let currentLevels = null; let currentLevelSelect = null;
    let currentServers = null; let currentServerSelect = null;
    let currentAudioTracks = null; let currentAudioSelect = null;
    let lastSubtitleFile = null;
    let sleepKey = 'off'; let sleepTimeoutId = null;
    let playbackRate = 1;
    let cueSize = 'medium'; let cueColor = 'white'; let cueStyleEl = null;

    function el(html) { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstChild; }

    function buildRow(label, active, onClick) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'ark-flyout-item';
      row.innerHTML = `<span>${label}</span>${active ? icon.check : ''}`;
      row.addEventListener('click', () => { onClick(); closeSheet(); });
      return row;
    }
    // Same row shell as buildRow, but with a colored swatch standing in for
    // the usual label-only text - lets the Color section show the actual
    // color being picked rather than just its name.
    function buildColorRow(label, hex, active, onClick) {
      const row = document.createElement('button');
      row.type = 'button';
      row.className = 'ark-flyout-item';
      row.innerHTML = `<span class="ark-swatch-label"><span class="ark-swatch" style="background:${hex}"></span>${label}</span>${active ? icon.check : ''}`;
      row.addEventListener('click', () => { onClick(); closeSheet(); });
      return row;
    }

    // Drills from the 2x2 card grid / row list down into a single-purpose
    // subpanel (mirrors watched.cx's own settings sheet navigation), rather
    // than a flat flyout - the back chevron returns to the grid.
    function showSub(title, builder) {
      sheetSubtitle.textContent = title;
      sheetSublist.innerHTML = '';
      builder(sheetSublist);
      sheetMain.classList.add('hidden');
      sheetSub.classList.remove('hidden');
    }
    function backToMain() {
      sheetSub.classList.add('hidden');
      sheetMain.classList.remove('hidden');
    }
    sheetBack.addEventListener('click', backToMain);

    // Filters the Subtitles rows in place as the viewer types, rather than
    // rebuilding the whole list - some providers return 20+ languages, so
    // a plain scrolling list is the slow way to find e.g. "French".
    function renderSubtitleRows(container, query) {
      container.innerHTML = '';
      const q = query.trim().toLowerCase();
      if (!q || 'off'.includes(q)) {
        container.appendChild(buildRow('Off', currentSubtitles.every((s) => !s.active), () => currentSubtitleSelect(null)));
      }
      const matches = currentSubtitles.filter((s) => !q || (s.label || 'unknown').toLowerCase().includes(q));
      matches.forEach((subtitle) => container.appendChild(buildRow(subtitle.label || 'Unknown', Boolean(subtitle.active), () => currentSubtitleSelect(subtitle.file))));
      if (!container.children.length) container.appendChild(el('<div class="ark-flyout-empty">No matching language</div>'));
    }
    function openSubtitlesSub() {
      showSub('Subtitles', (container) => {
        if (currentSubtitles.length > 5) {
          const searchWrap = el('<div class="ark-flyout-search"><input type="text" placeholder="Search language…"></div>');
          container.appendChild(searchWrap);
          const rows = el('<div class="ark-flyout-rows"></div>');
          container.appendChild(rows);
          searchWrap.querySelector('input').addEventListener('input', (event) => renderSubtitleRows(rows, event.target.value));
          searchWrap.querySelector('input').addEventListener('click', (event) => event.stopPropagation());
          renderSubtitleRows(rows, '');
        } else {
          renderSubtitleRows(container, '');
        }
      });
    }
    function openQualitySub() {
      showSub('Quality', (container) => {
        container.appendChild(buildRow('Auto', currentLevels.every((l) => !l.active), () => currentLevelSelect(-1)));
        currentLevels.forEach((level) => container.appendChild(buildRow(level.label, Boolean(level.active), () => currentLevelSelect(level.index))));
      });
    }
    function openServerSub() {
      showSub('Server', (container) => {
        currentServers.forEach((server) => container.appendChild(buildRow(server.label, Boolean(server.active), () => currentServerSelect(server.id))));
      });
    }
    function openAudioSub() {
      showSub('Audio', (container) => {
        currentAudioTracks.forEach((track) => container.appendChild(buildRow(track.label, Boolean(track.active), () => currentAudioSelect(track.index))));
      });
    }

    const SLEEP_OPTIONS = [['off', 'Off', null], ['15', '15 min', 15], ['30', '30 min', 30], ['45', '45 min', 45], ['60', '60 min', 60]];
    function setSleepTimer(key, minutes) {
      sleepKey = key;
      clearTimeout(sleepTimeoutId);
      sleepTimeoutId = minutes ? setTimeout(() => video.pause(), minutes * 60 * 1000) : null;
      const opt = SLEEP_OPTIONS.find(([k]) => k === key);
      sleepRow.querySelector('.ark-sheet-row-value').textContent = key === 'off' ? '' : opt[1];
    }
    function openSleepSub() {
      showSub('Sleep Timer', (container) => {
        SLEEP_OPTIONS.forEach(([key, label, minutes]) => container.appendChild(buildRow(label, sleepKey === key, () => setSleepTimer(key, minutes))));
      });
    }
    sleepRow.addEventListener('click', openSleepSub);

    const SPEED_OPTIONS = [0.5, 0.75, 1, 1.25, 1.5, 2];
    const speedLabel = (rate) => (rate === 1 ? 'Normal' : `${rate}×`);
    function setPlaybackRate(rate) {
      playbackRate = rate;
      video.playbackRate = rate;
      playbackRow.querySelector('.ark-sheet-row-value').textContent = speedLabel(rate);
    }
    function openPlaybackSub() {
      showSub('Playback Speed', (container) => {
        SPEED_OPTIONS.forEach((rate) => container.appendChild(buildRow(speedLabel(rate), rate === playbackRate, () => setPlaybackRate(rate))));
      });
    }
    playbackRow.addEventListener('click', openPlaybackSub);

    // Size and color are both applied via one dynamically injected <style>
    // targeting the video's own ::cue pseudo-element - a real,
    // standards-based way to restyle WebVTT captions, not a faked control.
    const CUE_SIZE_OPTIONS = [['small', 'Small', '1.6vw'], ['medium', 'Medium', '2.4vw'], ['large', 'Large', '3.2vw']];
    const CUE_COLOR_OPTIONS = [
      ['white', 'White', '#ffffff'], ['yellow', 'Yellow', '#ffe564'],
      ['cyan', 'Cyan', '#67e8f9'], ['green', 'Green', '#4ade80'], ['pink', 'Pink', '#f9a8d4'],
    ];
    function applyCueStyle() {
      const size = CUE_SIZE_OPTIONS.find(([k]) => k === cueSize)[2];
      const color = CUE_COLOR_OPTIONS.find(([k]) => k === cueColor)[2];
      if (!cueStyleEl) { cueStyleEl = document.createElement('style'); wrap.appendChild(cueStyleEl); }
      cueStyleEl.textContent = `.ark-player-video::cue { font-size: ${size}; color: ${color}; }`;
    }
    function setCueSize(key) { cueSize = key; applyCueStyle(); }
    function setCueColor(key) { cueColor = key; applyCueStyle(); }
    function openSubtitleStyleSub() {
      showSub('Subtitle Settings', (container) => {
        container.appendChild(el('<div class="ark-flyout-heading">Size</div>'));
        CUE_SIZE_OPTIONS.forEach(([key, label]) => container.appendChild(buildRow(label, cueSize === key, () => setCueSize(key))));
        container.appendChild(el('<div class="ark-flyout-heading">Color</div>'));
        CUE_COLOR_OPTIONS.forEach(([key, label, hex]) => container.appendChild(buildColorRow(label, hex, cueColor === key, () => setCueColor(key))));
      });
    }
    if (subtitleStyleRow) subtitleStyleRow.addEventListener('click', openSubtitleStyleSub);

    if (qualityCard) qualityCard.addEventListener('click', openQualitySub);
    if (serverCard) serverCard.addEventListener('click', openServerSub);
    if (subtitlesCard) subtitlesCard.addEventListener('click', openSubtitlesSub);
    if (audioCard) audioCard.addEventListener('click', openAudioSub);

    subtitleToggleInput.addEventListener('change', () => {
      if (!currentSubtitleSelect) return;
      if (subtitleToggleInput.checked) {
        currentSubtitleSelect(lastSubtitleFile);
      } else {
        const active = currentSubtitles?.find((s) => s.active);
        if (active) lastSubtitleFile = active.file;
        currentSubtitleSelect(null);
      }
    });

    function syncSubtitleUI() {
      const has = Boolean(currentSubtitles && currentSubtitles.length);
      subtitlesCard.classList.toggle('hidden', !has);
      subtitleToggleRow.classList.toggle('hidden', !has);
      sheetDivider.classList.toggle('hidden', !has);
      if (subtitleStyleRow) subtitleStyleRow.classList.toggle('hidden', !has);
      if (!has) return;
      const active = currentSubtitles.find((s) => s.active);
      subtitlesCard.querySelector('.ark-sheet-card-value').textContent = active ? (active.label || 'On') : 'Off';
      subtitleToggleInput.checked = Boolean(active);
      if (active) lastSubtitleFile = active.file;
    }

    function setSubtitles(subtitles, onSelect) {
      currentSubtitles = subtitles?.length ? subtitles : null;
      currentSubtitleSelect = onSelect;
      syncSubtitleUI();
    }

    function setQualityLevels(levels, onSelect) {
      currentLevels = (levels && levels.length > 1) ? levels : null;
      currentLevelSelect = onSelect;
      qualityCard.classList.toggle('hidden', !currentLevels);
      if (currentLevels) {
        const active = currentLevels.find((l) => l.active);
        qualityCard.querySelector('.ark-sheet-card-value').textContent = active ? active.label : 'Auto';
      }
    }

    // Server list mirrors the external scraper-source chips - picking one
    // here runs the exact same callback as clicking that chip would.
    function setServers(servers, onSelect) {
      currentServers = servers?.length ? servers : null;
      currentServerSelect = onSelect;
      serverCard.classList.toggle('hidden', !currentServers);
      if (currentServers) {
        const active = currentServers.find((s) => s.active);
        serverCard.querySelector('.ark-sheet-card-value').textContent = active ? active.label : currentServers[0].label;
      }
    }

    // Only wired from hls.js's real in-stream audio track list - never from
    // our separate per-language scraper links, which are discrete URLs and
    // would misrepresent "Audio" as something it isn't.
    function setAudioTracks(tracks, onSelect) {
      currentAudioTracks = (tracks && tracks.length > 1) ? tracks : null;
      currentAudioSelect = onSelect;
      audioCard.classList.toggle('hidden', !currentAudioTracks);
      if (currentAudioTracks) {
        const active = currentAudioTracks.find((t) => t.active);
        audioCard.querySelector('.ark-sheet-card-value').textContent = active ? active.label : currentAudioTracks[0].label;
      }
    }

    function destroy() {
      clearTimeout(sleepTimeoutId);
      document.removeEventListener('keydown', handleKeydown);
      wrap.parentNode.insertBefore(video, wrap);
      video.classList.remove('ark-player-video');
      video.controls = true;
      wrap.remove();
    }

    muteBtn.innerHTML = icon.volumeHigh;
    return { el: wrap, setSubtitles, setQualityLevels, setServers, setAudioTracks, destroy };
  }

  return { attach };
})();
