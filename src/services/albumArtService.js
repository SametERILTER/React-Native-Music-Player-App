export const fetchOnlineAlbumArt = async (track) => {
  if (!track || (!track.title && !track.artist)) {
    return { success: false, reason: 'no_metadata' };
  }

  let rawTitle = (track.title || '').trim();
  let rawArtist = (track.artist || '').trim();

  rawTitle = rawTitle.replace(/\.(mp3|m4a|flac|wav|aac|ogg)$/i, '');
  rawTitle = rawTitle.replace(/\[(?:320\s*kbps|128\s*kbps|256\s*kbps|flac|mp3|official|lyrics?|audio|hq)\]/gi, '');
  rawTitle = rawTitle.replace(/\((?:official\s*(?:video|audio|music\s*video)|lyric\s*video|audio|lyrics?|remastered|hd|4k)\)/gi, '');
  rawTitle = rawTitle.replace(/[-_]\s*\d+\s*$/, '');
  rawTitle = rawTitle.trim();

  const isArtistUnknown =
    !rawArtist ||
    rawArtist.toLowerCase() === 'bilinmeyen sanatçı' ||
    rawArtist.toLowerCase() === 'unknown artist' ||
    rawArtist.toLowerCase() === '<unknown>' ||
    rawArtist.toLowerCase() === 'yerel' ||
    rawArtist.toLowerCase() === 'local';

  if (isArtistUnknown && rawTitle.includes(' - ')) {
    const parts = rawTitle.split(' - ');
    rawArtist = parts[0].trim();
    rawTitle = parts.slice(1).join(' - ').trim();
  }

  const queries = [];
  if (!isArtistUnknown && rawArtist) {
    queries.push(`${rawArtist} ${rawTitle}`);
  }
  queries.push(rawTitle);

  for (const q of queries) {
    try {
      const url = `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&entity=song&limit=5`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.results && data.results.length > 0) {
          const first = data.results[0];
          if (first.artworkUrl100) {
            const hdArtwork = first.artworkUrl100.replace('100x100bb', '600x600bb');
            return {
              success: true,
              artworkUrl: hdArtwork,
              artist: first.artistName,
              album: first.collectionName,
              title: first.trackName,
            };
          }
        }
      }
    } catch (_) {}
  }

  for (const q of queries) {
    try {
      const url = `https://api.deezer.com/search?q=${encodeURIComponent(q)}&limit=3`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && data.data && data.data.length > 0) {
          const first = data.data[0];
          const cover =
            first.album?.cover_xl ||
            first.album?.cover_big ||
            first.album?.cover_medium;
          if (cover) {
            return {
              success: true,
              artworkUrl: cover,
              artist: first.artist?.name,
              album: first.album?.title,
              title: first.title,
            };
          }
        }
      }
    } catch (_) {}
  }

  return { success: false, reason: 'not_found' };
};

export default fetchOnlineAlbumArt;
