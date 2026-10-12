import { Image } from 'react-native';
import { getColors } from 'react-native-image-colors';
import { safeStorage } from './storageService';
import {
  createTwoToneGradientColors,
  getPlaylistCoverSource,
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

export const getFallbackTrackColors = (track, bg = '#F3F3F4') => {
  const primary = DEFAULT_NEUTRAL_HEX;
  const secondary = DEFAULT_NEUTRAL_SECONDARY_HEX;
  const gradient = createTwoToneGradientColors(primary, secondary, bg);

  return {
    primary,
    secondary,
    gradientColors: gradient,
    isExtracted: false,
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
    console.log('[ColorService] Attempting Palette extraction on:', uri);
    const result = await getColors(uri, {
      fallback: SENTINEL_HEX,
      cache: true,
      key: cacheKey,
    });

    console.log('[ColorService] Raw palette result:', result);

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
  } catch (err) {
    console.log('[ColorService] Extraction failed on URI:', uri, err?.message || err);
    return null;
  }
};

export const resolveTrackColors = async (track, bg = '#F3F3F4') => {
  if (!track) return getFallbackTrackColors(null, bg);

  const uris = getCandidateImageUris(track);
  console.log('[ColorService] Candidate URIs for', track.title, uris);

  const cacheKey = getCacheKey(track, uris[0] || null);

  if (memoryCache.has(cacheKey)) {
    const cached = memoryCache.get(cacheKey);
    if (cached?.primary !== '#6B1196') {
      console.log('[ColorService] Returning from RAM cache for:', track.title);
      return cached;
    }
    memoryCache.delete(cacheKey);
  }

  const storageKey = `@track_palette_v7_${cacheKey}`;
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
        console.log('[ColorService] Returning from AsyncStorage for:', track.title);
        memoryCache.set(cacheKey, parsed);
        return parsed;
      }
    }
  } catch (_) {}

  for (const uri of uris) {
    const extracted = await tryExtractColorsFromUri(uri, `${cacheKey}_${uri}`);
    if (extracted && extracted.primary) {
      const gradientColors = createTwoToneGradientColors(
        extracted.primary,
        extracted.secondary,
        bg
      );
      const finalColors = {
        primary: extracted.primary,
        secondary: extracted.secondary,
        gradientColors,
        isExtracted: true,
      };

      console.log(
        '[ColorService] SUCCESS extracting from image for:',
        track.title,
        '-> Primary:',
        finalColors.primary,
        'Secondary:',
        finalColors.secondary
      );

      memoryCache.set(cacheKey, finalColors);
      safeStorage.setItem(storageKey, JSON.stringify(finalColors)).catch(() => {});
      return finalColors;
    }
  }

  console.log('[ColorService] All URIs failed or no cover, using neutral fallback for:', track.title);
  const fallback = getFallbackTrackColors(track, bg);
  memoryCache.set(cacheKey, fallback);
  return fallback;
};
