import { safeStorage } from './storageService';

const inMemoryLyricsCache = new Map();

export const clearLyricsCache = () => {
  inMemoryLyricsCache.clear();
};

export const cleanTrackInfo = (rawTitle = '', rawArtist = '') => {
  let title = (rawTitle || '').trim();
  let artist = (rawArtist || '').trim();

  title = title.replace(/\.(mp3|m4a|flac|wav|aac|ogg)$/i, '');
  title = title.replace(/\b(64|128|192|256|320)\s*kbps\b/gi, '');
  title = title.replace(/\[.*?\]|\(.*?\)/g, ' ');
  title = title.replace(/[-_]\s*\d+\s*$/, '');
  title = title.replace(/\s+\d+$/, '');

  const isArtistUnknown =
    !artist ||
    artist.toLowerCase().includes('bilinmeyen') ||
    artist.toLowerCase().includes('unknown') ||
    artist.toLowerCase().includes('yerel') ||
    artist.toLowerCase().includes('local') ||
    artist.toLowerCase().includes('various') ||
    artist.toLowerCase().trim() === 'audio' ||
    artist.toLowerCase().trim() === 'music';

  if (isArtistUnknown && title.includes(' - ')) {
    const parts = title.split(' - ');
    artist = parts[0].trim();
    title = parts.slice(1).join(' - ').trim();
  }

  const normalizedTitle = title.replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim();
  const normalizedArtist = (isArtistUnknown ? '' : artist).replace(/[-_.]+/g, ' ').replace(/\s+/g, ' ').trim();

  let searchQuery = normalizedTitle;
  if (normalizedArtist) {
    if (!normalizedTitle.toLowerCase().includes(normalizedArtist.toLowerCase())) {
      searchQuery = `${normalizedArtist} ${normalizedTitle}`;
    }
  }

  return {
    cleanTitle: normalizedTitle,
    cleanArtist: normalizedArtist,
    searchQuery: searchQuery.trim(),
  };
};

export const parseLrc = (lrcString) => {
  if (!lrcString || typeof lrcString !== 'string') return [];

  const lines = lrcString.split('\n');
  const parsedLines = [];
  const timeRegex = /\[(\d{1,2}):(\d{2})(?:\.(\d{2,3}))?\]/g;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    const matches = [...trimmed.matchAll(timeRegex)];
    if (matches.length > 0) {
      const text = trimmed.replace(timeRegex, '').trim();

      matches.forEach((match) => {
        const minutes = parseInt(match[1], 10);
        const seconds = parseInt(match[2], 10);
        let ms = 0;
        if (match[3]) {
          ms = match[3].length === 2 ? parseInt(match[3], 10) * 10 : parseInt(match[3], 10);
        }
        const totalSeconds = minutes * 60 + seconds + ms / 1000;

        parsedLines.push({
          time: totalSeconds,
          text: text || '♪',
        });
      });
    }
  });

  parsedLines.sort((a, b) => a.time - b.time);
  return parsedLines.map((item, index) => ({
    ...item,
    id: `lrc-${index}-${Math.round(item.time * 100)}`,
  }));
};

export const fetchLyrics = async (track, skipCache = false) => {
  if (!track) return null;

  const trackKey = `lyrics_${track.id || track.uri || track.title}`;

  if (!skipCache) {
    if (inMemoryLyricsCache.has(trackKey)) {
      return inMemoryLyricsCache.get(trackKey);
    }

    try {
      const stored = await safeStorage.getItem(trackKey);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed) {
          inMemoryLyricsCache.set(trackKey, parsed);
          return parsed;
        }
      }
    } catch (_) {}
  }

  const { cleanTitle, cleanArtist, searchQuery } = cleanTrackInfo(track.title, track.artist);

  if (!searchQuery && !cleanTitle) {
    return null;
  }

  let resultData = null;

  try {
    const searchUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(searchQuery || cleanTitle)}`;

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'MusicPlayerApp/1.0 (https://github.com/SametERILTER/React-Native-Music-Player-App)',
      },
    });

    if (response.ok) {
      const list = await response.json();
      if (Array.isArray(list) && list.length > 0) {
        const withSync = list.find((item) => !!item.syncedLyrics);
        resultData = withSync || list[0];
      }
    }
  } catch (_) {}

  if (!resultData && cleanArtist && cleanTitle) {
    try {
      const durationSec = Math.round(track.duration || 0);
      let getUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
      if (durationSec > 0) {
        getUrl += `&duration=${durationSec}`;
      }

      const response = await fetch(getUrl, {
        headers: {
          'User-Agent': 'MusicPlayerApp/1.0 (https://github.com/SametERILTER/React-Native-Music-Player-App)',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && (data.syncedLyrics || data.plainLyrics)) {
          resultData = data;
        }
      }
    } catch (_) {}
  }

  let finalResult = null;
  if (resultData) {
    if (resultData.syncedLyrics) {
      const parsedLines = parseLrc(resultData.syncedLyrics);
      finalResult = {
        isSynced: true,
        lines: parsedLines,
        plainLyrics: resultData.plainLyrics || '',
        trackName: resultData.trackName || cleanTitle,
        artistName: resultData.artistName || cleanArtist,
        source: 'LRCLIB',
      };
    } else if (resultData.plainLyrics) {
      const plainLines = resultData.plainLyrics
        .split('\n')
        .map((text, idx) => ({ id: `plain-${idx}`, text: text.trim(), time: null }))
        .filter((l) => l.text.length > 0);

      finalResult = {
        isSynced: false,
        lines: plainLines,
        plainLyrics: resultData.plainLyrics,
        trackName: resultData.trackName || cleanTitle,
        artistName: resultData.artistName || cleanArtist,
        source: 'LRCLIB',
      };
    }
  }

  if (finalResult) {
    inMemoryLyricsCache.set(trackKey, finalResult);
    try {
      await safeStorage.setItem(trackKey, JSON.stringify(finalResult));
    } catch (_) {}
  }

  return finalResult;
};
