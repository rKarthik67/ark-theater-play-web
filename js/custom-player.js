/* ArkPlayer: a custom-skinned control layer over a plain <video>, used only
   for native (scraper-resolved) playback - iframe embeds can't be
   controlled this way, so they keep using their own player's UI. Visually
   distinct from a stock browser player: a glassy pill control bar, a glowing
   gold scrubber, a center pulse icon on play/pause, and flyout menus for
   subtitles/quality instead of native <video> controls. */
const ArkPlayer = (() => {
  const icon = {
    play: '<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',
    pause: '<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zm6 0h4v14h-4z"/></svg>',
    volumeHigh: '<svg viewBox="0 0 24 24"><path d="M4 9v6h4l5 5V4L8 9H4zm11.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM13 3.2v2.1c3 .9 5 3.6 5 6.7s-2 5.8-5 6.7v2.1c4.1-1 7-4.7 7-8.8s-2.9-7.8-7-8.8z"/></svg>',
    volumeMute: '<svg viewBox="0 0 24 24"><path d="M16.5 12 19 9.5 17.5 8 15 10.5 12.5 8 11 9.5l2.5 2.5-2.5 2.5 1.5 1.5 2.5-2.5 2.5 2.5L19 14.5zM4 9v6h4l5 5V4L8 9H4z"/></svg>',
    cc: '<svg viewBox="0 0 24 24"><path d="M19 4H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8.5 10.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5c.86 0 1.57.31 2.14.82l-.87 1.02a1.97 1.97 0 0 0-1.27-.47c-1.1 0-2 .9-2 2.13s.9 2.13 2 2.13c.53 0 .98-.19 1.33-.52l.87 1.03c-.6.56-1.35.86-2.2.86zm7 0c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5c.86 0 1.57.31 2.14.82l-.87 1.02a1.97 1.97 0 0 0-1.27-.47c-1.1 0-2 .9-2 2.13s.9 2.13 2 2.13c.53 0 .98-.19 1.33-.52l.87 1.03c-.6.56-1.35.86-2.2.86z"/></svg>',
    gear: '<svg viewBox="0 0 24 24"><path d="M19.14 12.94a7.07 7.07 0 0 0 .05-.94 7.07 7.07 0 0 0-.05-.94l2.03-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.39.96a7.3 7.3 0 0 0-1.62-.94L14.4 2.6a.5.5 0 0 0-.5-.42h-3.8a.5.5 0 0 0-.5.42l-.36 2.42c-.59.24-1.13.56-1.62.94l-2.39-.96a.5.5 0 0 0-.6.22L2.71 8.84a.5.5 0 0 0 .12.64l2.03 1.58a7.07 7.07 0 0 0-.05.94c0 .32.02.63.05.94L2.83 14.5a.5.5 0 0 0-.12.64l1.92 3.32c.14.24.42.33.6.22l2.39-.96c.49.38 1.03.7 1.62.94l.36 2.42c.05.24.26.42.5.42h3.8c.24 0 .45-.18.5-.42l.36-2.42c.59-.24 1.13-.56 1.62-.94l2.39.96c.24.1.47 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64zM12 15.5A3.5 3.5 0 1 1 12 8.5a3.5 3.5 0 0 1 0 7z"/></svg>',
    fullscreenEnter: '<svg viewBox="0 0 24 24"><path d="M7 14H5v5h5v-2H7zm-2-4h2V7h3V5H5zm12 9h-3v2h5v-5h-2zM14 5v2h3v3h2V5z"/></svg>',
    fullscreenExit: '<svg viewBox="0 0 24 24"><path d="M5 16h3v3h2v-5H5zm3-8H5v2h5V5H8zm6 11h2v-3h3v-2h-5zm2-11V5h-2v5h5V8z"/></svg>',
    check: '<svg viewBox="0 0 24 24"><path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z"/></svg>',
  };

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return '0:00';
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const mm = h ? String(m).padStart(2, '0') : String(m);
    return h ? `${h}:${mm}:${String(s).padStart(2, '0')}` : `${mm}:${String(s).padStart(2, '0')}`;
  }

  function attach(video) {
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

    wrap.insertAdjacentHTML('beforeend', `
      <button type="button" class="ark-center-btn" aria-label="Play">${icon.play}</button>
      <div class="ark-bar">
        <div class="ark-scrub" tabindex="0">
          <div class="ark-scrub-track"></div>
          <div class="ark-scrub-buffered"></div>
          <div class="ark-scrub-played"></div>
          <div class="ark-scrub-thumb"></div>
        </div>
        <div class="ark-bar-row">
          <button type="button" class="ark-btn ark-play" aria-label="Play">${icon.play}</button>
          <div class="ark-volume">
            <button type="button" class="ark-btn ark-mute" aria-label="Mute">${icon.volumeHigh}</button>
            <input type="range" class="ark-volume-slider" min="0" max="1" step="0.05" value="1" aria-label="Volume">
          </div>
          <span class="ark-time"></span>
          <span class="ark-spacer"></span>
          <div class="ark-menu-host">
            <button type="button" class="ark-btn ark-cc hidden" aria-label="Subtitles">${icon.cc}</button>
            <div class="ark-flyout ark-flyout-cc hidden"></div>
          </div>
          <div class="ark-menu-host">
            <button type="button" class="ark-btn ark-gear hidden" aria-label="Quality">${icon.gear}</button>
            <div class="ark-flyout ark-flyout-gear hidden"></div>
          </div>
          <button type="button" class="ark-btn ark-fullscreen" aria-label="Fullscreen">${icon.fullscreenEnter}</button>
        </div>
      </div>
    `);

    const centerBtn = wrap.querySelector('.ark-center-btn');
    const bar = wrap.querySelector('.ark-bar');
    const playBtn = wrap.querySelector('.ark-play');
    const muteBtn = wrap.querySelector('.ark-mute');
    const volumeSlider = wrap.querySelector('.ark-volume-slider');
    const timeEl = wrap.querySelector('.ark-time');
    const scrub = wrap.querySelector('.ark-scrub');
    const scrubBuffered = wrap.querySelector('.ark-scrub-buffered');
    const scrubPlayed = wrap.querySelector('.ark-scrub-played');
    const scrubThumb = wrap.querySelector('.ark-scrub-thumb');
    const ccBtn = wrap.querySelector('.ark-cc');
    const ccFlyout = wrap.querySelector('.ark-flyout-cc');
    const gearBtn = wrap.querySelector('.ark-gear');
    const gearFlyout = wrap.querySelector('.ark-flyout-gear');
    const fullscreenBtn = wrap.querySelector('.ark-fullscreen');

    function closeFlyouts() {
      ccFlyout.classList.add('hidden');
      gearFlyout.classList.add('hidden');
    }

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
    centerBtn.addEventListener('click', togglePlay);
    playBtn.addEventListener('click', togglePlay);
    video.addEventListener('play', () => {
      playBtn.innerHTML = icon.pause;
      flashCenterIcon('play');
      wrap.classList.add('is-playing');
    });
    video.addEventListener('pause', () => {
      playBtn.innerHTML = icon.play;
      flashCenterIcon('pause');
      wrap.classList.remove('is-playing');
    });

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
      if (scrubbing) return;
      const pct = video.duration ? (video.currentTime / video.duration) * 100 : 0;
      scrubPlayed.style.width = `${pct}%`;
      scrubThumb.style.left = `${pct}%`;
      timeEl.textContent = `${formatTime(video.currentTime)} / ${formatTime(video.duration)}`;
      if (video.buffered.length) {
        const end = video.buffered.end(video.buffered.length - 1);
        scrubBuffered.style.width = `${video.duration ? (end / video.duration) * 100 : 0}%`;
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
        timeEl.textContent = `${formatTime(ratio * video.duration)} / ${formatTime(video.duration)}`;
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

    ccBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = ccFlyout.classList.contains('hidden');
      closeFlyouts();
      ccFlyout.classList.toggle('hidden', !willOpen);
    });
    gearBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      const willOpen = gearFlyout.classList.contains('hidden');
      closeFlyouts();
      gearFlyout.classList.toggle('hidden', !willOpen);
    });
    wrap.addEventListener('click', (event) => {
      if (!event.target.closest('.ark-menu-host')) closeFlyouts();
    });

    // The bar fades out after a few idle seconds while playing, same as any
    // real player - but never while a flyout menu is open or it's paused.
    let idleTimer = null;
    function showBar() {
      wrap.classList.add('show-controls');
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        if (!video.paused && ccFlyout.classList.contains('hidden') && gearFlyout.classList.contains('hidden')) {
          wrap.classList.remove('show-controls');
        }
      }, 2800);
    }
    wrap.addEventListener('pointermove', showBar);
    wrap.addEventListener('pointerdown', showBar);
    showBar();

    function setSubtitles(subtitles, onSelect) {
      ccBtn.classList.toggle('hidden', !subtitles?.length);
      ccFlyout.innerHTML = '';
      if (!subtitles?.length) return;
      const buildRow = (label, active, onClick) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'ark-flyout-item';
        row.innerHTML = `<span>${label}</span>${active ? icon.check : ''}`;
        row.addEventListener('click', () => { onClick(); closeFlyouts(); });
        return row;
      };
      ccFlyout.appendChild(buildRow('Off', subtitles.every((s) => !s.active), () => onSelect(null)));
      subtitles.forEach((subtitle) => {
        ccFlyout.appendChild(buildRow(subtitle.label || 'Unknown', Boolean(subtitle.active), () => onSelect(subtitle.file)));
      });
    }

    function setQualityLevels(levels, onSelect) {
      gearBtn.classList.toggle('hidden', !levels || levels.length <= 1);
      gearFlyout.innerHTML = '';
      if (!levels || levels.length <= 1) return;
      const buildRow = (label, active, onClick) => {
        const row = document.createElement('button');
        row.type = 'button';
        row.className = 'ark-flyout-item';
        row.innerHTML = `<span>${label}</span>${active ? icon.check : ''}`;
        row.addEventListener('click', () => { onClick(); closeFlyouts(); });
        return row;
      };
      gearFlyout.appendChild(buildRow('Auto', levels.every((l) => !l.active), () => onSelect(-1)));
      levels.forEach((level) => {
        gearFlyout.appendChild(buildRow(level.label, Boolean(level.active), () => onSelect(level.index)));
      });
    }

    function destroy() {
      wrap.parentNode.insertBefore(video, wrap);
      video.classList.remove('ark-player-video');
      video.controls = true;
      wrap.remove();
    }

    muteBtn.innerHTML = icon.volumeHigh;
    return { el: wrap, setSubtitles, setQualityLevels, destroy };
  }

  return { attach };
})();
