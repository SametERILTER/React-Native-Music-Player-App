import * as MediaLibrary from 'expo-media-library/legacy';

export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

export const checkMediaPermissions = async () => {
  try {
    if (!MediaLibrary || typeof MediaLibrary.getPermissionsAsync !== 'function') {
      return { granted: false, canAskAgain: false, unavailable: true };
    }
    const { status, canAskAgain } = await MediaLibrary.getPermissionsAsync();
    return { granted: status === 'granted', canAskAgain };
  } catch (error) {
    console.warn('Erişim izni kontrol edilirken hata oluştu:', error);
    return { granted: false, canAskAgain: false, unavailable: true };
  }
};

export const requestMediaPermissions = async () => {
  try {
    if (!MediaLibrary || typeof MediaLibrary.requestPermissionsAsync !== 'function') {
      return { granted: false, canAskAgain: false, unavailable: true };
    }
    const { status, canAskAgain } = await MediaLibrary.requestPermissionsAsync();
    return { granted: status === 'granted', canAskAgain };
  } catch (error) {
    console.warn('Erişim izni istenirken hata oluştu:', error);
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

export const extractTrackMetadata = (rawTitleOrFilename, rawArtist = null, rawAuthor = null, rawAlbum = null) => {
  let artist = rawArtist || rawAuthor || null;
  if (typeof artist === 'string') {
    artist = artist.trim();
    if (
      !artist ||
      artist.toLowerCase() === 'yerel' ||
      artist.toLowerCase() === 'unknown' ||
      artist.toLowerCase() === '<unknown>' ||
      artist.toLowerCase() === 'bilinmeyen'
    ) {
      artist = null;
    }
  }

  let text = (rawTitleOrFilename || '').trim();
  if (text.includes('.')) {
    text = text.substring(0, text.lastIndexOf('.')).trim();
  }

  text = text
    .replace(/\[(?:320\s*kbps|128\s*kbps|256\s*kbps|flac|mp3|official|lyrics?|audio|hq)\]/gi, '')
    .replace(/\[[^\]]*(?:download|mp3|site|web|com|net|org)[^\]]*\]/gi, '')
    .replace(/\((?:official\s*(?:video|audio|music\s*video)|lyric\s*video|audio|lyrics?|remastered|hd|4k)\)/gi, '')
    .trim();

  text = text.replace(/^\d{1,3}[\.\s_-]+\s*/, '').trim();

  let title = text;

  const separatorRegex = /\s*(?: - | – | — | ~ )\s*/;
  if (separatorRegex.test(text)) {
    const parts = text.split(separatorRegex);
    if (parts.length >= 2) {
      const candidateArtist = parts[0].trim();
      const candidateTitle = parts.slice(1).join(' - ').trim();

      if (candidateArtist && candidateTitle && !/^\d+$/.test(candidateArtist)) {
        if (!artist) {
          artist = candidateArtist;
        }
        title = candidateTitle;
      }
    }
  } else if (text.includes(' - ')) {
    const parts = text.split(' - ');
    if (parts.length >= 2) {
      const candidateArtist = parts[0].trim();
      const candidateTitle = parts.slice(1).join(' - ').trim();
      if (candidateArtist && candidateTitle) {
        if (!artist) {
          artist = candidateArtist;
        }
        title = candidateTitle;
      }
    }
  }

  title = title.replace(/^[-–—\s]+|[-–—\s]+$/g, '').trim();
  if (artist) {
    artist = artist.replace(/^[-–—\s]+|[-–—\s]+$/g, '').trim();
  }

  if (!title) {
    title = rawTitleOrFilename || 'İsimsiz Parça';
  }

  const finalArtist = artist || rawAuthor || 'Bilinmeyen Sanatçı';

  return {
    title,
    artist: finalArtist,
  };
};

export const fetchDeviceAudioTracks = async (requestPermission = true) => {
  try {
    if (!MediaLibrary) {
      return {
        success: false,
        reason: 'native_module_unavailable',
        message: 'Expo Go ortamında ExpoMediaLibrary yerel modülü desteklenmiyor.',
        tracks: [],
      };
    }

    let status = null;
    if (typeof MediaLibrary.getPermissionsAsync === 'function') {
      try {
        const check = await MediaLibrary.getPermissionsAsync();
        status = check?.status;
      } catch (_) {}
    }

    if (status !== 'granted') {
      if (!requestPermission) {
        return { success: false, reason: 'permission_not_granted', tracks: [] };
      }
      if (typeof MediaLibrary.requestPermissionsAsync !== 'function') {
        return {
          success: false,
          reason: 'native_module_unavailable',
          message: 'Expo Go ortamında ExpoMediaLibrary yerel modülü desteklenmiyor.',
          tracks: [],
        };
      }
      const req = await MediaLibrary.requestPermissionsAsync();
      status = req?.status;
    }

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
      const { title, artist } = extractTrackMetadata(
        asset.filename || `Parça ${index + 1}`,
        asset.artist,
        asset.author || asset.composer,
        asset.album
      );

      // Cihaz ses dosyasının albüm kapağı URI'si (Android MediaStore content URI)
      let coverArt = null;
      if (asset.albumId) {
        coverArt = `content://media/external/audio/albumart/${asset.albumId}`;
      } else if (asset.id) {
        coverArt = `content://media/external/audio/media/${asset.id}/albumart`;
      }

      return {
        id: `local-${asset.id}`,
        mediaId: asset.id ? String(asset.id) : null,
        albumId: asset.albumId ? String(asset.albumId) : null,
        title,
        artist,
        album: asset.album || 'Cihaz Müzikleri',
        duration: Math.round(asset.duration || 0),
        uri: asset.uri,
        coverArt,
        isLocal: true,
        trackNumber: index + 1,
        genre: asset.genre || 'Müzik',
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

export const DEMO_TRACKS = [];
