export const AUDIO_WAVE_COVERS = [
  {
    id: 'cyber_waves',
    name: 'Siber Dalga',
    source: require('../../assets/covers/cyber_waves.jpg'),
  },
  {
    id: 'amber_spectrum',
    name: 'Kehribar Spektrum',
    source: require('../../assets/covers/amber_spectrum.jpg'),
  },
  {
    id: 'electric_pulse',
    name: 'Elektrik Nabız',
    source: require('../../assets/covers/electric_pulse.jpg'),
  },
];

export const PLAYLIST_COVERS = [
  ...AUDIO_WAVE_COVERS,
  {
    id: 'violet_aurora',
    name: 'Menekşe Aurora',
    source: require('../../assets/covers/violet_aurora.jpg'),
  },
  {
    id: 'solaris_amber',
    name: 'Solar Kehribar',
    source: require('../../assets/covers/solaris_amber.jpg'),
  },
  {
    id: 'ocean_resonance',
    name: 'Okyanus Yankısı',
    source: require('../../assets/covers/ocean_resonance.jpg'),
  },
  {
    id: 'crimson_nebula',
    name: 'Kızıl Nebula',
    source: require('../../assets/covers/crimson_nebula.jpg'),
  },
  {
    id: 'quantum_prism',
    name: 'Kuantum Prizma',
    source: require('../../assets/covers/quantum_prism.jpg'),
  },
  {
    id: 'neon_flow',
    name: 'Neon Akış',
    source: require('../../assets/covers/neon_flow.jpg'),
  },
  {
    id: 'amber_geometry',
    name: 'Kehribar Geometri',
    source: require('../../assets/covers/amber_geometry.jpg'),
  },
  {
    id: 'liquid_prism',
    name: 'Prizma Akışkan',
    source: require('../../assets/covers/liquid_prism.jpg'),
  },
  {
    id: 'cosmic_aura',
    name: 'Kozmik Aura',
    source: require('../../assets/covers/cosmic_aura.jpg'),
  },
  {
    id: 'emerald_flow',
    name: 'Zümrüt Akış',
    source: require('../../assets/covers/emerald_flow.jpg'),
  },
  {
    id: 'midnight_echo',
    name: 'Gece Yankısı',
    source: require('../../assets/covers/midnight_echo.jpg'),
  },
  {
    id: 'ceramic_flow',
    name: 'Seramik Akış',
    source: require('../../assets/covers/ceramic_flow.jpg'),
  },
  {
    id: 'warm_geometry',
    name: 'Sıcak Geometri',
    source: require('../../assets/covers/warm_geometry.jpg'),
  },
  {
    id: 'liquid_chrome',
    name: 'Akışkan Krom',
    source: require('../../assets/covers/liquid_chrome.jpg'),
  },
];

export const ALL_COVERS = PLAYLIST_COVERS;

export const getPlaylistCoverSource = (coverId) => {
  if (!coverId) return null;
  const found = ALL_COVERS.find((c) => c.id === coverId);
  if (found) return found.source;
  if (typeof coverId === 'string' && (coverId.startsWith('http') || coverId.startsWith('file:') || coverId.startsWith('content:'))) {
    return { uri: coverId };
  }
  return null;
};

export const getTrackCoverSource = getPlaylistCoverSource;

export const COVER_COLORS = {
  cyber_waves: '#0A7567',
  amber_spectrum: '#D4621A',
  electric_pulse: '#0E5F72',
  violet_aurora: '#6B1196',
  solaris_amber: '#C05915',
  ocean_resonance: '#024D5C',
  crimson_nebula: '#8B0A25',
  quantum_prism: '#5A4A7A',
  neon_flow: '#6A0B85',
  amber_geometry: '#BB4B26',
  liquid_prism: '#45558E',
  cosmic_aura: '#2D1B69',
  emerald_flow: '#0E5A45',
  midnight_echo: '#1E2C3D',
  ceramic_flow: '#8E7E6D',
  warm_geometry: '#B57C4F',
  liquid_chrome: '#3C454B',
};

export const FALLBACK_COVER_COLORS = [
  '#0A7567',
  '#C05915',
  '#6B1196',
  '#024D5C',
  '#8B0A25',
];

export const hexToRgba = (hex, alpha = 1) => {
  if (!hex || typeof hex !== 'string') return `rgba(200, 200, 200, ${alpha})`;
  let clean = hex.replace('#', '').trim();
  if (clean.length === 8) {
    clean = clean.substring(0, 6);
  }
  if (clean.length === 3) {
    clean = clean.split('').map((c) => c + c).join('');
  }
  if (clean.length !== 6) return `rgba(200, 200, 200, ${alpha})`;
  const r = parseInt(clean.substring(0, 2), 16) || 0;
  const g = parseInt(clean.substring(2, 4), 16) || 0;
  const b = parseInt(clean.substring(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getCoverDominantColor = (coverId, trackOrIndex = 0) => {
  if (coverId && COVER_COLORS[coverId]) {
    return COVER_COLORS[coverId];
  }
  if (typeof trackOrIndex === 'string') {
    let hash = 0;
    for (let i = 0; i < trackOrIndex.length; i++) {
      hash = trackOrIndex.charCodeAt(i) + ((hash << 5) - hash);
    }
    const idx = Math.abs(hash) % FALLBACK_COVER_COLORS.length;
    return FALLBACK_COVER_COLORS[idx];
  }
  const fallbackList = FALLBACK_COVER_COLORS;
  const num = typeof trackOrIndex === 'number' ? trackOrIndex : 0;
  return fallbackList[Math.abs(num) % fallbackList.length];
};

export const getCoverGradientColors = (coverId, trackOrIndex = 0, bg = '#F3F3F4') => {
  const baseColor = getCoverDominantColor(coverId, trackOrIndex);
  return [
    hexToRgba(baseColor, 0.85),
    hexToRgba(baseColor, 0.45),
    hexToRgba(baseColor, 0.16),
    bg,
  ];
};

export const getPlaylistScreenGradientColors = (coverId, nameOrId = 1) => {
  const baseColor = getCoverDominantColor(coverId, nameOrId);
  return [
    hexToRgba(baseColor, 0.88),
    hexToRgba(baseColor, 0.70),
    hexToRgba(baseColor, 0.42),
    hexToRgba(baseColor, 0.16),
    hexToRgba(baseColor, 0),
  ];
};


