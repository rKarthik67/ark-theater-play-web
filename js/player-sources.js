/* Player source configuration migrated from Movie-and-tv-show-2. */
const PlayerSources = (() => {
  const list = [
    ['vidsrc-sh', 'VidSrc', id => `https://vidsrc.sh/embed/movie/${id}`, (id,s,e) => `https://vidsrc.sh/embed/tv/${id}/${s}/${e}?autonext=1`],
    ['vidsync', 'VidSync', id => `https://vidsync.pro/embed/movie/${id}`, (id,s,e) => `https://vidsync.pro/embed/tv/${id}/${s}/${e}`],
    ['moviesnexus', 'MoviesNexus', id => `https://www.moviesnexus.fun/movie/${id}?sv=multiaudio2`, (id,s,e) => `https://www.moviesnexus.fun/tv/${id}/${s}/${e}?sv=multiaudio2`],
    ['vidsrcme', 'VidSrc.me', id => `https://vidsrcme.ru/embed/movie/${id}`, (id,s,e) => `https://vidsrcme.ru/embed/tv?tmdb=${id}&season=${s}&episode=${e}`],
    ['vidsrcpro', 'VidSrc Pro', id => `https://pro.vidsrc.sbs/embed/movie/${id}`, (id,s,e) => `https://pro.vidsrc.sbs/embed/tv/${id}/${s}/${e}`],
    ['vidcore', 'VidCore', id => `https://vidcore.org/embed/movie/${id}`, (id,s,e) => `https://vidcore.org/embed/tv/${id}/${s}/${e}`],
    ['vidlink', 'VidLink', id => `https://vidlink.pro/movie/${id}`, (id,s,e) => `https://vidlink.pro/tv/${id}/${s}/${e}`],
    ['vidrift', 'VidRift', id => `https://embed.vidrift.net/embed/movie/${id}`, (id,s,e) => `https://embed.vidrift.net/embed/tv/${id}/${s}/${e}`],
    ['vidrock', 'VidRock', id => `https://vidrock.net/movie/${id}`, (id,s,e) => `https://vidrock.net/tv/${id}/${s}/${e}`],
    ['codeera', 'Codeera', id => `https://iembed.codeera.dev/embed/movie/${id}`, (id,s,e) => `https://iembed.codeera.dev/embed/tv/${id}/${s}/${e}`],
    ['videasy', 'Videasy', id => `https://player.videasy.net/movie/${id}`, (id,s,e) => `https://player.videasy.net/tv/${id}/${s}/${e}`]
  ].map(([id, label, movie, tv]) => ({ id, label, movie, tv }));
  function url(sourceId, type, id, season = 1, episode = 1) {
    const source = list.find(item => item.id === sourceId) || list[0];
    return type === 'tv' ? source.tv(id, season, episode) : source.movie(id);
  }
  /* VidSync's anime endpoint takes an AniList ID, not a TMDB ID.
     Optional documented query values include `dubLang` and `subtitle`. */
  function anime(anilistId, episode = 1, options = {}) {
    const params = new URLSearchParams();
    if (options.dubLang) params.set('dubLang', options.dubLang);
    if (options.subtitle) params.set('subtitle', options.subtitle);
    const query = params.toString();
    return `https://vidsync.pro/embed/anime/${anilistId}/${episode}${query ? `?${query}` : ''}`;
  }
  return { list, url, anime };
})();
