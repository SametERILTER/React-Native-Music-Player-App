import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import TrackPlayer from 'react-native-track-player';
import { DEMO_TRACKS, fetchDeviceAudioTracks } from '../services/musicService';
import { setupTrackPlayer } from '../services/trackPlayerService';

const PlayerContext = createContext(null);

export const PlayerProvider = ({ children }) => {
  const [tracks, setTracks] = useState(DEMO_TRACKS);
  const [currentTrack, setCurrentTrack] = useState(DEMO_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(42);
  const [duration, setDuration] = useState(218);
  const [favorites, setFavorites] = useState(['demo-1', 'demo-3', 'demo-5']);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');

  // Cihaz Müzikleri Tarama State'leri
  const [isScanningDevice, setIsScanningDevice] = useState(false);
  const [hasDevicePermission, setHasDevicePermission] = useState(null);
  const [deviceTrackCount, setDeviceTrackCount] = useState(0);

  const isTrackPlayerReady = useRef(false);
  const compactProgress = useSharedValue(0);
  const lastScrollY = useRef(0);
  const isCompactRef = useRef(false);

  // TrackPlayer Kurulumu
  useEffect(() => {
    setupTrackPlayer().then((ready) => {
      isTrackPlayerReady.current = ready;
    });
  }, []);

  const onScrollForPlayer = (event) => {
    if (!event || !event.nativeEvent || !event.nativeEvent.contentOffset) return;
    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    if (currentY > 30 && diff > 8) {
      if (!isCompactRef.current) {
        isCompactRef.current = true;
        compactProgress.value = withTiming(1, {
          duration: 220,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    } else if (diff < -8 || currentY <= 12) {
      if (isCompactRef.current) {
        isCompactRef.current = false;
        compactProgress.value = withTiming(0, {
          duration: 220,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    }
    lastScrollY.current = currentY;
  };

  // Çalma Listeleri State'i
  const [playlists, setPlaylists] = useState([
    {
      id: 'pl-1',
      name: 'Gece Dinletisi',
      trackIds: ['demo-1', 'demo-2', 'demo-5', 'demo-8'],
      createdAt: Date.now() - 100000,
    },
    {
      id: 'pl-2',
      name: 'Derin Odaklanma',
      trackIds: ['demo-3', 'demo-4', 'demo-6', 'demo-9', 'demo-12'],
      createdAt: Date.now() - 50000,
    },
  ]);

  // Çalma simülasyonu (Native player yoksa UI sayacı olarak çalışır)
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setPosition((prev) => {
          if (prev >= duration) {
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    } else if (!isPlaying && interval) {
      clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration]);

  // Yeni parça seçme (TrackPlayer & State Entegrasyonu)
  const playTrack = async (track) => {
    if (!track) return;
    setCurrentTrack(track);
    setIsPlaying(true);
    setPosition(0);
    setDuration(track.duration || 180);

    if (isTrackPlayerReady.current && TrackPlayer) {
      try {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: String(track.id),
          url: track.uri,
          title: track.title,
          artist: track.artist || 'Cihaz Sanatçısı',
          album: track.album || 'Kütüphane',
          duration: track.duration,
          artwork: track.coverArt,
        });
        await TrackPlayer.play();
      } catch (err) {
        console.warn('TrackPlayer parça çalma uyarısı:', err?.message || err);
      }
    }
  };

  // Çal / Duraklat
  const togglePlayPause = async () => {
    const nextState = !isPlaying;
    setIsPlaying(nextState);

    if (isTrackPlayerReady.current && TrackPlayer) {
      try {
        if (nextState) {
          await TrackPlayer.play();
        } else {
          await TrackPlayer.pause();
        }
      } catch (err) {
        console.warn('TrackPlayer duraklatma uyarısı:', err?.message || err);
      }
    }
  };

  // Sonraki parça
  const playNext = () => {
    if (!tracks || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    let nextIndex = 0;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentIndex + 1) % tracks.length;
    }
    const nextTrack = tracks[nextIndex];
    if (nextTrack) {
      playTrack(nextTrack);
    }
  };

  // Önceki parça
  const playPrevious = () => {
    if (!tracks || tracks.length === 0) return;
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack?.id);
    let prevIndex = currentIndex - 1;
    if (prevIndex < 0) prevIndex = tracks.length - 1;
    const prevTrack = tracks[prevIndex];
    if (prevTrack) {
      playTrack(prevTrack);
    }
  };

  // Şarkı içinde ilerleme (Seek)
  const seekTo = async (seconds) => {
    setPosition(seconds);
    if (isTrackPlayerReady.current && TrackPlayer) {
      try {
        await TrackPlayer.seekTo(seconds);
      } catch (err) {
        console.warn('TrackPlayer seek uyarısı:', err?.message || err);
      }
    }
  };

  // Favori Ekle / Çıkar
  const toggleFavorite = (trackId) => {
    setFavorites((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    );
  };

  // Shuffle toggle
  const toggleShuffle = () => {
    setIsShuffle((prev) => !prev);
  };

  // --- Çalma Listesi Fonksiyonları ---

  // Yeni Çalma Listesi Oluştur
  const createPlaylist = (name) => {
    if (!name || !name.trim()) return;
    const newPl = {
      id: `pl-${Date.now()}`,
      name: name.trim(),
      trackIds: [],
      createdAt: Date.now(),
    };
    setPlaylists((prev) => [newPl, ...prev]);
    return newPl;
  };

  // Çalma Listesini Sil
  const deletePlaylist = (playlistId) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  };

  // Şarkıyı Çalma Listesine Ekle / Çıkar
  const toggleTrackInPlaylist = (playlistId, trackId) => {
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const exists = pl.trackIds.includes(trackId);
        const updatedTrackIds = exists
          ? pl.trackIds.filter((id) => id !== trackId)
          : [...pl.trackIds, trackId];
        return {
          ...pl,
          trackIds: updatedTrackIds,
        };
      })
    );
  };

  // Cihaz Müziklerini Otomatik Tarama Fonksiyonu
  const scanDeviceTracks = async (isUserTriggered = false) => {
    setIsScanningDevice(true);
    try {
      const res = await fetchDeviceAudioTracks();
      if (res.success) {
        setHasDevicePermission(true);
        if (res.tracks && res.tracks.length > 0) {
          setDeviceTrackCount(res.tracks.length);
          setTracks((prev) => {
            const demoOnly = prev.filter((t) => !t.id.startsWith('local-'));
            return [...res.tracks, ...demoOnly];
          });
          setCurrentTrack((prev) => {
            if (!prev || prev.id.startsWith('demo-')) {
              return res.tracks[0];
            }
            return prev;
          });
        } else if (isUserTriggered) {
          const { Alert } = require('react-native');
          Alert.alert('Bilgi', 'Cihazınızda oynatılabilir ses dosyası bulunamadı.');
        }
      } else if (res.reason === 'native_module_unavailable') {
        setHasDevicePermission(false);
        if (isUserTriggered) {
          const { Alert } = require('react-native');
          Alert.alert(
            'Expo Go Kısıtlaması',
            'Expo SDK 57 ile birlikte yerel medya erişimi için (npx expo run:android) ile Development Build oluşturulması gerekmektedir.'
          );
        }
      } else if (res.reason === 'permission_denied') {
        setHasDevicePermission(false);
        if (isUserTriggered) {
          const { Alert } = require('react-native');
          Alert.alert('İzin Reddedildi', 'Cihaz müziklerine erişebilmek için medya izni vermelisiniz.');
        }
      }
    } catch (err) {
      console.warn('Cihaz müzikleri taranırken hata oluştu:', err);
    } finally {
      setIsScanningDevice(false);
    }
  };

  useEffect(() => {
    scanDeviceTracks();
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        tracks,
        currentTrack,
        isPlaying,
        position,
        duration,
        favorites,
        playlists,
        isShuffle,
        repeatMode,
        isScanningDevice,
        hasDevicePermission,
        deviceTrackCount,
        scanDeviceTracks,
        playTrack,
        togglePlayPause,
        playNext,
        playPrevious,
        seekTo,
        toggleFavorite,
        toggleShuffle,
        createPlaylist,
        deletePlaylist,
        toggleTrackInPlaylist,
        compactProgress,
        onScrollForPlayer,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
};

export const usePlayer = () => {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer, PlayerProvider içinde kullanılmalıdır.');
  }
  return context;
};

export default PlayerContext;
