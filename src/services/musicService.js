import * as MediaLibrary from 'expo-media-library/legacy';

export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const requestMediaPermissions = async () => {
  try {
    if (!MediaLibrary || typeof MediaLibrary.requestPermissionsAsync !== 'function') {
      return { granted: false, canAskAgain: false, unavailable: true };
    }
    const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
    return { granted: status === 'granted', canAskAgain };
  } catch (error) {
    console.warn('Erişim izni kontrol edilirken hata oluştu:', error);
    return { granted: false, canAskAgain: false, unavailable: true };
  }
};

export const isJunkOrVoiceRecording = (asset) => {
  if (!asset) return true;

  const filename = (asset.filename || '').toLowerCase();
  const uri = (asset.uri || '').toLowerCase();
  const duration = Number(asset.duration) || 0;

  if (
    filename.endsWith('.opus') ||
    filename.endsWith('.amr') ||
    uri.endsWith('.opus') ||
    uri.endsWith('.amr')
  ) {
    return true;
  }

  const isWhatsApp =
    /^ptt-\d+/i.test(filename) ||
    /^aud-\d+.*-wa/i.test(filename) ||
    /-wa\d+/i.test(filename) ||
    filename.includes('whatsapp');

  if (isWhatsApp) return true;

  const isRecording =
    /^(rec|recording|record)[_-]/i.test(filename) ||
    /^(voice|voicerecord|soundrecord)[_-]/i.test(filename) ||
    /^(call|callrec|callrecording)[_-]/i.test(filename) ||
    /ses[_\s-]?kayd/i.test(filename);

  if (isRecording) return true;

  const junkPathKeywords = [
    'whatsapp voice notes',
    'whatsapp audio',
    'whatsapp/media',
    'com.whatsapp',
    'telegram audio',
    'voice recorder',
    'voicerecorder',
    'sound recorder',
    'soundrecorder',
    'call recording',
    'callrecordings',
    'recordings',
    '/notifications',
    '/ringtones',
    '/alarms',
    '/system/media',
  ];

  if (junkPathKeywords.some((keyword) => uri.includes(keyword) || filename.includes(keyword))) {
    return true;
  }

  if (duration > 0 && duration < 30) {
    return true;
  }

  return false;
};

export const fetchDeviceAudioTracks = async () => {
  try {
    if (!MediaLibrary || typeof MediaLibrary.requestPermissionsAsync !== 'function') {
      return {
        success: false,
        reason: 'native_module_unavailable',
        message: 'Expo Go ortamında ExpoMediaLibrary yerel modülü desteklenmiyor.',
        tracks: [],
      };
    }

    const { status } = await MediaLibrary.requestPermissionsAsync();
    if (status !== 'granted') {
      return { success: false, reason: 'permission_denied', tracks: [] };
    }

    const media = await MediaLibrary.getAssetsAsync({
      mediaType: 'audio',
      first: 1000,
      sortBy: 'creationTime',
    });

    if (!media || !media.assets || media.assets.length === 0) {
      return { success: true, tracks: [] };
    }

    const validAssets = media.assets.filter((asset) => !isJunkOrVoiceRecording(asset));

    const tracks = validAssets.map((asset, index) => {
      let title = asset.filename || `Parça ${index + 1}`;
      if (title.includes('.')) {
        title = title.substring(0, title.lastIndexOf('.'));
      }

      return {
        id: `local-${asset.id}`,
        title: title,
        artist: asset.artist || 'Yerel',
        album: asset.album || 'Cihaz Müzikleri',
        duration: Math.round(asset.duration || 0),
        uri: asset.uri,
        coverArt: null,
        isLocal: true,
        trackNumber: index + 1,
        genre: 'Yerel Müzik',
        creationTime: asset.creationTime,
      };
    });

    return { success: true, tracks };
  } catch (error) {
    const errorMsg = error?.message || String(error);
    if (
      errorMsg.includes('Native module') ||
      errorMsg.includes('expomedialibrary') ||
      errorMsg.includes('ExpoMediaLibrary')
    ) {
      console.warn('Expo Go ortamında native modül uyarısı:', errorMsg);
      return {
        success: false,
        reason: 'native_module_unavailable',
        message: 'Expo Go uygulamasında ExpoMediaLibrary desteği kaldırılmış veya yerel derleme (Development Build) gerektiriyor.',
        tracks: [],
      };
    }
    console.error('Cihaz müzikleri çekilirken hata oluştu:', error);
    return { success: false, reason: errorMsg, tracks: [] };
  }
};

const RAW_DEMO_TRACKS = [
  {
    id: 'demo-1',
    title: 'Midnight Resonance',
    artist: 'Mono Studio',
    album: 'Architectural Silence',
    duration: 218,
    uri: 'https://example.com/audio1.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 1,
    genre: 'Ambient Minimal',
  },
  {
    id: 'demo-2',
    title: 'White Noise & Shadows',
    artist: 'Kroma',
    album: 'Swiss Grid',
    duration: 264,
    uri: 'https://example.com/audio2.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 2,
    genre: 'Electronic',
  },
  {
    id: 'demo-3',
    title: 'Kinetic Flow',
    artist: 'Forma Collective',
    album: 'Modernist Wave',
    duration: 185,
    uri: 'https://example.com/audio3.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 3,
    genre: 'Deep Focus',
  },
  {
    id: 'demo-4',
    title: 'Bauhaus Frequency',
    artist: 'Dieter R.',
    album: 'Less But Better',
    duration: 312,
    uri: 'https://example.com/audio4.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 4,
    genre: 'Neo Classical',
  },
  {
    id: 'demo-5',
    title: 'Subtle Elements',
    artist: 'Echo Nine',
    album: 'Monochrome Drift',
    duration: 198,
    uri: 'https://example.com/audio5.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 5,
    genre: 'Lo-Fi Minimal',
  },
  {
    id: 'demo-6',
    title: 'Parallel Structures',
    artist: 'Vektor Sound',
    album: 'Grid Systems',
    duration: 245,
    uri: 'https://example.com/audio6.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 6,
    genre: 'Minimal House',
  },
  {
    id: 'demo-7',
    title: 'Tactile Horizon',
    artist: 'Loom',
    album: 'Objects in Space',
    duration: 172,
    uri: 'https://example.com/audio7.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 7,
    genre: 'Acoustic Minimal',
  },
  {
    id: 'demo-8',
    title: 'Analog Daylight',
    artist: 'Solis Duo',
    album: 'Warm Spectra',
    duration: 231,
    uri: 'https://example.com/audio8.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 8,
    genre: 'Warm Tape',
  },
  {
    id: 'demo-9',
    title: 'Concrete Symmetry',
    artist: 'Brutalist Ensemble',
    album: 'Heavy Grain',
    duration: 289,
    uri: 'https://example.com/audio9.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 9,
    genre: 'Modern Ambient',
  },
  {
    id: 'demo-10',
    title: 'Silent Velocity',
    artist: 'Aurae',
    album: 'Zero Gravity',
    duration: 204,
    uri: 'https://example.com/audio10.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 10,
    genre: 'Deep Space',
  },
  {
    id: 'demo-11',
    title: 'Nordic Contour',
    artist: 'Kaldur',
    album: 'Fjord Silence',
    duration: 340,
    uri: 'https://example.com/audio11.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 11,
    genre: 'Nordic Ambient',
  },
  {
    id: 'demo-12',
    title: 'Pulse Modulation',
    artist: 'Modul8',
    album: 'Synth Waves',
    duration: 215,
    uri: 'https://example.com/audio12.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 12,
    genre: 'Modular Synth',
  },
  {
    id: 'demo-13',
    title: 'Paper Architecture',
    artist: 'Origami Beats',
    album: 'Folds & Creases',
    duration: 168,
    uri: 'https://example.com/audio13.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 13,
    genre: 'Lo-Fi Chill',
  },
  {
    id: 'demo-14',
    title: 'After Hours Protocol',
    artist: 'Night Transit',
    album: 'Metro Lines',
    duration: 276,
    uri: 'https://example.com/audio14.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 14,
    genre: 'Late Night House',
  },
  {
    id: 'demo-15',
    title: 'Reflective Surface',
    artist: 'Glassworks',
    album: 'Optics',
    duration: 195,
    uri: 'https://example.com/audio15.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 15,
    genre: 'Minimalist Neo',
  },
  {
    id: 'demo-16',
    title: 'Monolith Frequency',
    artist: 'Onyx Phase',
    album: 'Dark Matter',
    duration: 254,
    uri: 'https://example.com/audio16.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 16,
    genre: 'Industrial Ambient',
  },
  {
    id: 'demo-17',
    title: 'Silver Needle',
    artist: 'Vinyl Archives',
    album: 'Dust & Grooves',
    duration: 228,
    uri: 'https://example.com/audio17.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 17,
    genre: 'Jazz Minimal',
  },
  {
    id: 'demo-18',
    title: 'Horizon Scanning',
    artist: 'Sonar',
    album: 'Deep Water',
    duration: 305,
    uri: 'https://example.com/audio18.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 18,
    genre: 'Sub Ambient',
  },
  {
    id: 'demo-19',
    title: 'Linear Progression',
    artist: 'Studio 101',
    album: 'Vector Space',
    duration: 189,
    uri: 'https://example.com/audio19.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 19,
    genre: 'Electronic Flow',
  },
  {
    id: 'demo-20',
    title: 'Subtle Tension',
    artist: 'Frame Theory',
    album: 'Composure',
    duration: 242,
    uri: 'https://example.com/audio20.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 20,
    genre: 'Post Minimal',
  },
  {
    id: 'demo-21',
    title: 'Distant Signal',
    artist: 'Telemetry',
    album: 'Deep Sky',
    duration: 261,
    uri: 'https://example.com/audio21.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 21,
    genre: 'Atmospheric',
  },
  {
    id: 'demo-22',
    title: 'Mechanical Bloom',
    artist: 'Cortex Duo',
    album: 'Synthetic Garden',
    duration: 210,
    uri: 'https://example.com/audio22.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 22,
    genre: 'IDM Minimal',
  },
  {
    id: 'demo-23',
    title: 'Static & Velvet',
    artist: 'Nocturne Lab',
    album: 'Silk Sound',
    duration: 197,
    uri: 'https://example.com/audio23.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 23,
    genre: 'Late Night Chill',
  },
  {
    id: 'demo-24',
    title: 'Minimalist Motion',
    artist: 'Chronos',
    album: 'Timepieces',
    duration: 278,
    uri: 'https://example.com/audio24.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 24,
    genre: 'Cinematic Flow',
  },
  {
    id: 'demo-25',
    title: 'Ethereal Axis',
    artist: 'Orbit 9',
    album: 'Celestial Geometry',
    duration: 315,
    uri: 'https://example.com/audio25.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 25,
    genre: 'Space Ambient',
  },
  {
    id: 'demo-26',
    title: 'Sub-Zero Resonance',
    artist: 'Polaris',
    album: 'Frost Patterns',
    duration: 234,
    uri: 'https://example.com/audio26.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 26,
    genre: 'Cold Ambient',
  },
  {
    id: 'demo-27',
    title: 'Urban Geometry',
    artist: 'Metropolis',
    album: 'Grid Lines',
    duration: 202,
    uri: 'https://example.com/audio27.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 27,
    genre: 'Urban Minimal',
  },
  {
    id: 'demo-28',
    title: 'Obsidian Waves',
    artist: 'Black Sand',
    album: 'Volcanic Shore',
    duration: 248,
    uri: 'https://example.com/audio28.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 28,
    genre: 'Dark Ambient',
  },
  {
    id: 'demo-29',
    title: 'Harmonic Pulse',
    artist: 'Sine Wave Co.',
    album: 'Pure Tones',
    duration: 180,
    uri: 'https://example.com/audio29.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 29,
    genre: 'Tone Science',
  },
  {
    id: 'demo-30',
    title: 'Zenith',
    artist: 'Aero Static',
    album: 'High Altitude',
    duration: 290,
    uri: 'https://example.com/audio30.mp3',
    coverArt: null,
    isLocal: true,
    trackNumber: 30,
    genre: 'Dream Minimal',
  }
];

const DEMO_COVER_IDS = [
  'cyber_waves',
  'solaris_amber',
  'electric_pulse',
  'crimson_nebula',
  'violet_aurora',
  'ocean_resonance',
  'amber_geometry',
  'emerald_flow',
  'neon_flow',
  'quantum_prism',
  'liquid_prism',
  'cosmic_aura',
  'amber_spectrum',
  'midnight_echo',
  'ceramic_flow',
  'warm_geometry',
  'liquid_chrome',
];

export const DEMO_TRACKS = RAW_DEMO_TRACKS.map((t, idx) => ({
  ...t,
  coverId: t.coverId || DEMO_COVER_IDS[idx % DEMO_COVER_IDS.length],
}));
