/* Font picker, modeled on the original app's Settings > App Font list. */

const ARK_FONTS = [
  { family: 'Manrope', label: 'Manrope', desc: 'Bright Modern Sans' },
  { family: 'Inter', label: 'Inter', desc: 'Default UI Sans' },
  { family: 'DM Sans', label: 'DM Sans', desc: 'Clean Grotesk Sans' },
  { family: 'Poppins', label: 'Poppins', desc: 'Rounded Geometric Sans' },
  { family: 'Outfit', label: 'Outfit', desc: 'Geometric Sans' },
  { family: 'Nunito', label: 'Nunito', desc: 'Friendly Rounded Sans' },
  { family: 'Quicksand', label: 'Quicksand', desc: 'Soft Rounded Sans' },
  { family: 'Rubik', label: 'Rubik', desc: 'Readable Rounded Sans' },
  { family: 'Josefin Sans', label: 'Josefin Sans', desc: 'Art-Deco Sans' },
  { family: 'Raleway', label: 'Raleway', desc: 'Elegant Geometric' },
  { family: 'Montserrat', label: 'Montserrat', desc: 'Modern Geometric' },
  { family: 'Noto Sans', label: 'Noto Sans', desc: 'Universal Sans' },
  { family: 'Roboto', label: 'Roboto', desc: 'Classic UI Sans' },
  { family: 'Oswald', label: 'Oswald', desc: 'Condensed Sans' },
  { family: 'Cinzel', label: 'Cinzel', desc: 'Luxury Display Serif' },
  { family: 'Playfair Display', label: 'Playfair Display', desc: 'Editorial Display Serif' },
  { family: 'Marcellus', label: 'Marcellus', desc: 'Elegant Serif' },
  { family: 'Cormorant Garamond', label: 'Cormorant Garamond', desc: 'Refined Classic Serif' },
  { family: 'Lora', label: 'Lora', desc: 'Warm Editorial Serif' },
  { family: 'Merriweather', label: 'Merriweather', desc: 'Screen Serif' },
  { family: 'Libre Baskerville', label: 'Libre Baskerville', desc: 'Literary Serif' },
  { family: 'DM Serif Display', label: 'DM Serif Display', desc: 'Bold Display Serif' },
  { family: 'Instrument Serif', label: 'Instrument Serif', desc: 'Modern Display Serif' },
  { family: 'Great Vibes', label: 'Great Vibes', desc: 'Script Accent' },
  { family: 'Anton', label: 'Anton', desc: 'Heavy Poster Display' },
  { family: 'Bebas Neue', label: 'Bebas Neue', desc: 'Tall Poster Display' },
];

function applyArkFont(family) {
  document.documentElement.style.setProperty('--font-ui', `'${family}', sans-serif`);
  localStorage.setItem('ark_font', family);
}

function initArkFont() {
  const saved = localStorage.getItem('ark_font');
  if (saved) applyArkFont(saved);
}
