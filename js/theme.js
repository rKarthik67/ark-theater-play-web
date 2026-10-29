/* Accent-color picker, modeled on the original app's settings_accent_color
   preference (a swatch/color picker for the app's metallic accent gradient,
   separate from settings_player_accent_color which colors the video player UI). */

const ARK_ACCENTS = [
  { id: 'gold', name: 'Gold', c1: '#ffd27a', c2: '#ffb347', c3: '#e8891a', c4: '#8a4a12' },
  { id: 'crimson', name: 'Crimson', c1: '#ffc2c2', c2: '#ff7a7a', c3: '#e23b3b', c4: '#7a1212' },
  { id: 'emerald', name: 'Emerald', c1: '#c8f7da', c2: '#58e0a0', c3: '#1f9e5a', c4: '#0b5c34' },
  { id: 'sapphire', name: 'Sapphire', c1: '#cfe3ff', c2: '#6aaeff', c3: '#2567d1', c4: '#123a73' },
  { id: 'amethyst', name: 'Amethyst', c1: '#e9d6ff', c2: '#c084f5', c3: '#7d3fc2', c4: '#431f6b' },
  { id: 'silver', name: 'Silver', c1: '#ffffff', c2: '#d6d6d6', c3: '#9a9a9a', c4: '#4d4d4d' },
  { id: 'rose', name: 'Rose', c1: '#ffd6e8', c2: '#ff8fc2', c3: '#e0398f', c4: '#7a1a4d' },
  { id: 'bronze', name: 'Bronze', c1: '#f3d9b0', c2: '#d9a05c', c3: '#a8662a', c4: '#5c3414' },
  { id: 'teal', name: 'Teal', c1: '#c8fff0', c2: '#4fe0c8', c3: '#159e8a', c4: '#0b5c50' },
  { id: 'indigo', name: 'Indigo', c1: '#d6d6ff', c2: '#8f8fff', c3: '#4b3fc2', c4: '#241b6b' },
  { id: 'lime', name: 'Lime', c1: '#eaffb0', c2: '#c8ff5c', c3: '#8fae1f', c4: '#4a5c0e' },
  { id: 'steel', name: 'Steel', c1: '#e6edf5', c2: '#b8c6d6', c3: '#6e8299', c4: '#37424d' },
];

function applyArkAccent(id) {
  const accent = ARK_ACCENTS.find(a => a.id === id) || ARK_ACCENTS[0];
  const root = document.documentElement.style;
  root.setProperty('--gold-1', accent.c1);
  root.setProperty('--gold-2', accent.c2);
  root.setProperty('--gold-3', accent.c3);
  root.setProperty('--gold-4', accent.c4);
  localStorage.setItem('ark_accent', accent.id);
}

function initArkAccent() {
  const saved = localStorage.getItem('ark_accent');
  if (saved) applyArkAccent(saved);
}
