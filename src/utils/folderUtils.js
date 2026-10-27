export const extractFolderInfo = (track) => {
  if (!track) {
    return { folderName: 'Müzikler', folderPath: '/storage/emulated/0/Music' };
  }

  // 1. Şarkı üzerinde daha önceden kaydedilmiş folder varsa
  if (track.folder && typeof track.folder === 'string' && track.folder.trim()) {
    return {
      folderName: track.folder.trim(),
      folderPath: track.folderPath || `/storage/emulated/0/${track.folder.trim()}`,
    };
  }

  const rawUri = track.uri || '';
  if (rawUri) {
    try {
      const decoded = decodeURIComponent(rawUri).replace(/\\/g, '/');
      const withoutQuery = decoded.split('?')[0];
      const parts = withoutQuery.split('/').filter(Boolean);

      // file:///storage/emulated/0/Download/song.mp3
      if (parts.length >= 2) {
        const parentDir = parts[parts.length - 2];
        const ignoredDirs = [
          'media',
          'audio',
          'external',
          'internal',
          'files',
          '0',
          'emulated',
          'storage',
          'sdcard',
          'root',
          'system',
          'var',
          'tmp',
        ];

        if (parentDir && !ignoredDirs.includes(parentDir.toLowerCase())) {
          const cleanParts = parts.filter((p) => p !== 'file:');
          const folderPath = '/' + cleanParts.slice(0, cleanParts.length - 1).join('/');
          return {
            folderName: parentDir,
            folderPath,
          };
        }
      }
    } catch (_) {}
  }

  // 2. Anlamlı albüm adı varsa onu klasör adı olarak kullan
  if (
    track.album &&
    typeof track.album === 'string' &&
    !['Cihaz Müzikleri', 'Library', 'Kitaplık', 'Bilinmeyen Albüm', 'Unknown Album', 'Cihaz'].includes(track.album.trim())
  ) {
    const cleanAlbum = track.album.trim();
    return {
      folderName: cleanAlbum,
      folderPath: `/storage/emulated/0/Music/${cleanAlbum}`,
    };
  }

  return {
    folderName: 'Müzikler',
    folderPath: '/storage/emulated/0/Music',
  };
};

export const groupTracksByFolder = (tracks = []) => {
  if (!Array.isArray(tracks) || tracks.length === 0) {
    return [];
  }

  const folderMap = new Map();

  for (const track of tracks) {
    if (!track) continue;
    const { folderName, folderPath } = extractFolderInfo(track);
    const key = folderName.toLowerCase();

    if (!folderMap.has(key)) {
      folderMap.set(key, {
        id: `folder-${key}`,
        name: folderName,
        path: folderPath,
        tracks: [],
        trackCount: 0,
        totalDuration: 0,
      });
    }

    const folderItem = folderMap.get(key);
    folderItem.tracks.push(track);
    folderItem.trackCount += 1;
    folderItem.totalDuration += Number(track.duration) || 0;
  }

  // En çok şarkı içeren klasör en başta olacak şekilde sırala
  return Array.from(folderMap.values()).sort((a, b) => b.trackCount - a.trackCount);
};

export const formatFolderDuration = (totalSeconds = 0) => {
  const seconds = Math.max(0, Math.round(Number(totalSeconds) || 0));
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours} sa ${minutes} dk`;
  }
  return `${minutes} dk`;
};
