import { Image } from 'react-native';
import { getColors } from 'react-native-image-colors';
import { safeStorage } from './storageService';
import {
  createTwoToneGradientColors,
  getPlaylistCoverSource,
  COVER_COLORS,
  COVER_SECONDARY_COLORS,
} from '../constants/playlistCovers';

const memoryCache = new Map();
const SENTINEL_HEX = '#000001';
const DEFAULT_NEUTRAL_HEX = '#30343C';
const DEFAULT_NEUTRAL_SECONDARY_HEX = '#1E2126';

const isNotSentinel = (hex) => {
  if (!hex || typeof hex !== 'string') return false;
  const clean = hex.toLowerCase().replace('#', '').trim();
  if (clean.length !== 6) return false;
  if (clean === '000001') return false;
  return true;
};

export const getCandidateImageUris = (track) => {
  if (!track) return [];
  const uris = [];

  const finalCoverId = track.coverId || null;
  if (finalCoverId) {
    const source = getPlaylistCoverSource(finalCoverId);
    if (source) {
      if (typeof source === 'number') {
        const resolved = Image.resolveAssetSource(source);
        if (resolved?.uri) uris.push(resolved.uri);
      } else if (source.uri) {
        uris.push(source.uri);
      }
    }
    if (
      typeof finalCoverId === 'string' &&
      (finalCoverId.startsWith('file:') ||
        finalCoverId.startsWith('content:') ||
        finalCoverId.startsWith('http'))
    ) {
      uris.push(finalCoverId);
    }
  }

  const rawArtwork = track.coverArt || track.artwork || null;
  if (rawArtwork) {
    if (typeof rawArtwork === 'string') uris.push(rawArtwork);
    else if (rawArtwork.uri) uris.push(rawArtwork.uri);
    else if (typeof rawArtwork === 'number') {
      const resolved = Image.resolveAssetSource(rawArtwork);
      if (resolved?.uri) uris.push(resolved.uri);
    }
  }

  const rawId =
    track.mediaId ||
    (track.id && String(track.id).startsWith('local-')
      ? String(track.id).replace('local-', '')
      : null);

  if (rawId) {
    uris.push(`content://media/external/audio/media/${rawId}/albumart`);
  }

  if (track.albumId) {
    uris.push(`content://media/external/audio/albumart/${track.albumId}`);
  }

  return [...new Set(uris.filter(Boolean))];
};

const getCacheKey = (track, imageUri) => {
  if (!track) return 'default';
  if (track.coverId) {
    return `cover_${track.coverId}`;
  }
  if (imageUri) {
    const safe = String(imageUri).slice(-40).replace(/[^a-zA-Z0-9_-]/g, '_');
    return `uri_${track.id || 't'}_${safe}`;
  }
  return `track_${track.id || track.title || 'unknown'}`;
};

export const STATIC_LIGHT_GRAY_GRADIENT = [
  'rgba(195, 197, 202, 0.40)',
  'rgba(215, 217, 222, 0.22)',
  'rgba(235, 236, 239, 0.10)',
  '#F3F3F4',
  '#F3F3F4',
];

export const getColorLuminance = (colorStr) => {
  if (!colorStr || typeof colorStr !== 'string') return 255;
  let r = 255;
  let g = 255;
  let b = 255;
  if (colorStr.startsWith('#')) {
    let clean = colorStr.replace('#', '').trim();
    if (clean.length === 3) {
      clean = clean.split('').map((c) => c + c).join('');
    }
    if (clean.length >= 6) {
      r = parseInt(clean.substring(0, 2), 16) || 0;
      g = parseInt(clean.substring(2, 4), 16) || 0;
      b = parseInt(clean.substring(4, 6), 16) || 0;
    }
  } else if (colorStr.startsWith('rgb')) {
    const match = colorStr.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      r = parseInt(match[1], 10) || 0;
      g = parseInt(match[2], 10) || 0;
      b = parseInt(match[3], 10) || 0;
    }
  }
  return (r * 299 + g * 587 + b * 114) / 1000;
};

export const isColorDark = (colorStr, threshold = 145) => {
  return getColorLuminance(colorStr) < threshold;
};

export const isPaletteDark = (primaryHex, secondaryHex) => {
  if (!primaryHex) return false;
  const lum1 = getColorLuminance(primaryHex);
  const lum2 = getColorLuminance(secondaryHex || primaryHex);
  return lum1 * 0.5 + lum2 * 0.5 < 145;
};

export const getFallbackTrackColors = (track, bg = '#F3F3F4') => {
  const primary = DEFAULT_NEUTRAL_HEX;
  const secondary = DEFAULT_NEUTRAL_SECONDARY_HEX;

  return {
    primary,
    secondary,
    gradientColors: STATIC_LIGHT_GRAY_GRADIENT,
    isExtracted: false,
    isDark: false,
  };
};

export const getSynchronousTrackColors = (track, bg = '#F3F3F4') => {
  if (!track) return getFallbackTrackColors(null, bg);

  const uris = getCandidateImageUris(track);
  const primaryUri = uris[0] || null;
  const cacheKey = getCacheKey(track, primaryUri);

  if (memoryCache.has(cacheKey)) {
    return memoryCache.get(cacheKey);
  }

  return getFallbackTrackColors(track, bg);
};

const tryExtractColorsFromUri = async (uri, cacheKey) => {
  try {
    const result = await getColors(uri, {
      fallback: SENTINEL_HEX,
      cache: true,
      key: cacheKey,
    });

    let primary = null;
    let secondary = null;

    if (result.platform === 'android') {
      if (isNotSentinel(result.vibrant)) {
        primary = result.vibrant;
      } else if (isNotSentinel(result.dominant)) {
        primary = result.dominant;
      } else if (isNotSentinel(result.muted)) {
        primary = result.muted;
      } else if (isNotSentinel(result.darkVibrant)) {
        primary = result.darkVibrant;
      } else if (isNotSentinel(result.average)) {
        primary = result.average;
      }

      if (isNotSentinel(result.darkVibrant) && result.darkVibrant !== primary) {
        secondary = result.darkVibrant;
      } else if (isNotSentinel(result.dominant) && result.dominant !== primary) {
        secondary = result.dominant;
      } else if (isNotSentinel(result.darkMuted) && result.darkMuted !== primary) {
        secondary = result.darkMuted;
      } else if (isNotSentinel(result.average) && result.average !== primary) {
        secondary = result.average;
      } else {
        secondary = primary;
      }
    } else if (result.platform === 'ios') {
      if (isNotSentinel(result.primary)) {
        primary = result.primary;
      } else if (isNotSentinel(result.background)) {
        primary = result.background;
      }

      if (isNotSentinel(result.secondary) && result.secondary !== primary) {
        secondary = result.secondary;
      } else if (isNotSentinel(result.detail) && result.detail !== primary) {
        secondary = result.detail;
      } else {
        secondary = primary;
      }
    } else {
      if (isNotSentinel(result.vibrant)) primary = result.vibrant;
      else if (isNotSentinel(result.dominant)) primary = result.dominant;

      if (isNotSentinel(result.darkVibrant)) secondary = result.darkVibrant;
      else secondary = primary;
    }

    if (primary) {
      return { primary, secondary: secondary || primary };
    }
    return null;
  } catch (_) {
    return null;
  }
};

export const resolveTrackColors = async (track, bg = '#F3F3F4') => {
  if (!track) return getFallbackTrackColors(null, bg);

  const uris = getCandidateImageUris(track);

  const cacheKey = getCacheKey(track, uris[0] || null);

  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey);
    if (cached?.primary !== '#6B1196') {
      return cached;
    }
    memoryCache.delete(cacheKey);
  }

  const storageKey = `@track_palette_v10_${cacheKey}`;
  try {
    const stored = await safeStorage.getItem(storageKey);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (
        parsed &&
        parsed.gradientColors &&
        parsed.primary !== '#6B1196' &&
        parsed.primary !== '#3A0654'
      ) {
        memoryCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch (_) {}

  for (const uri of uris) {
    const extracted = await tryExtractColorsFromUri(uri, `${cacheKey}_${uri}`);
    if (extracted && extracted.primary) {
      const isDark = isPaletteDark(extracted.primary, extracted.secondary);
      const bottomBg = isDark ? '#121316' : bg;
      const gradientColors = createTwoToneGradientColors(
        extracted.primary,
        extracted.secondary,
        bottomBg,
        isDark
      );
      const finalColors = {
        primary: extracted.primary,
        secondary: extracted.secondary,
        gradientColors,
        isExtracted: true,
        isDark,
      };

      memoryCache.set(cacheKey, finalColors);
      safeStorage.setItem(storageKey, JSON.stringify(finalColors)).catch(() => {});
      return finalColors;
    }
  }

  if (track?.coverId && COVER_COLORS[track.coverId]) {
    const presetPrimary = COVER_COLORS[track.coverId];
    const presetSecondary = COVER_SECONDARY_COLORS[track.coverId] || presetPrimary;
    const isDark = isPaletteDark(presetPrimary, presetSecondary);
    const bottomBg = isDark ? '#121316' : bg;
    const gradientColors = createTwoToneGradientColors(
      presetPrimary,
      presetSecondary,
      bottomBg,
      isDark
    );
    const finalColors = {
      primary: presetPrimary,
      secondary: presetSecondary,
      gradientColors,
      isExtracted: true,
      isDark,
    };
    memoryCache.set(cacheKey, finalColors);
    safeStorage.setItem(storageKey, JSON.stringify(finalColors)).catch(() => {});
    return finalColors;
  }

  const fallback = getFallbackTrackColors(track, bg);
  memoryCache.set(cacheKey, fallback);
  return fallback;
};
