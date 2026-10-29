/* Platform and studio catalogue transferred from Movie-and-tv-show-2.
   TMDB supplies the current availability and artwork for each entry. */
const Platforms = (() => {
  const providers = [
    ['Prime Video',119],['Netflix',8],['Hulu',15],['Disney+ Hotstar',122],['Disney+',337],['Paramount+',531],['Apple TV+',350],['Max',1899],['Peacock',386],['discovery+',520],['Tubi',73],['Pluto TV',300],['Rakuten TV',35],['ZEE5',232],['Sony LIV',237],['MUBI',11],['Crunchyroll',283],['Sun Nxt',309],['Viki',160],['AMC+',528],['STARZ',318],['YouTube Premium',188],['Shudder',99],['Curiosity Stream',190],['Fandor',25],['MX Player',381],['aha',1116],['Lionsgate Play',273],['BINGE',385],['Stan',356]
  ].map(([name,id]) => ({ name, id }));
  const studios = [
    ['Warner Bros.',174],['Paramount Pictures',4],['Walt Disney Pictures',2],['Universal Pictures',33],['20th Century Studios',25],['Marvel Studios',420],['DC Entertainment',9993],['Blumhouse Productions',3172],['A24',41077],['Lionsgate',1632],['Pixar',3],['DreamWorks Animation',521],['Legendary Pictures',923],['Columbia Pictures',5],['Illumination',6704],['New Line Cinema',12],['StudioCanal',694],['Focus Features',10146],['Annapurna Pictures',10342],['Bad Robot',11461],['Sony Pictures',34],['Metro-Goldwyn-Mayer',8411],['Miramax',53009],['Skydance Media',82819],['Plan B Entertainment',81],['Regency Enterprises',508],['Village Roadshow Pictures',79],['Scott Free Productions',1645],['Working Title Films',10163]
  ].map(([name,id]) => ({ name, id }));
  return { providers, studios };
})();
