import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { safeStorage } from '../services/storageService';
import { DEMO_TRACKS, fetchDeviceAudioTracks } from '../services/musicService';
import { setupTrackPlayer, getTrackPlayer } from '../services/trackPlayerService';
import { ALL_COVERS } from '../constants/playlistCovers';

const PlayerContext = createContext(null);
const PlayerProgressContext = createContext({
  position: 0,
  duration: 180,
  seekTo: () => {},
});

export const PlayerProgressProvider = ({ isPlaying, currentTrack, onTrackEnded, children }) => {
  const [prevTrackId, setPrevTrackId] = useState(currentTrack?.id);
  const [position, setPosition] = useState(0);
  const duration = currentTrack?.duration || 180;

  if (currentTrack?.id !== prevTrackId) {
    setPrevTrackId(currentTrack?.id);
    setPosition(0);
  }

  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(async () => {
        const TrackPlayer = getTrackPlayer();
        if (TrackPlayer && typeof TrackPlayer.getProgress === 'function') {
          try {
            const prog = await TrackPlayer.getProgress();
            if (prog && typeof prog.position === 'number') {
              setPosition(Math.round(prog.position));
              return;
            }
          } catch {
          }
        }
        setPosition((prev) => {
          if (prev >= duration) {
            onTrackEnded?.();
            return 0;
          }
          return prev + 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isPlaying, duration, onTrackEnded]);

  const seekTo = useCallback(async (seconds) => {
    setPosition(seconds);
    const TrackPlayer = getTrackPlayer();
    if (TrackPlayer && typeof TrackPlayer.seekTo === 'function') {
      try {
        await TrackPlayer.seekTo(seconds);
      } catch (err) {
        console.warn('TrackPlayer seek uyarısı:', err?.message || err);
      }
    }
  }, []);

  const progressValue = useMemo(() => ({
    position,
    duration,
    seekTo,
  }), [position, duration, seekTo]);

  return (
    <PlayerProgressContext.Provider value={progressValue}>
      {children}
    </PlayerProgressContext.Provider>
  );
};

export const PlayerProvider = ({ children }) => {
  const [tracks, setTracks] = useState(DEMO_TRACKS);
  const [currentTrack, setCurrentTrack] = useState(DEMO_TRACKS[0]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState(['demo-1', 'demo-3', 'demo-5']);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [autoPlayNext, setAutoPlayNextState] = useState(true);

  const [trackCovers, setTrackCovers] = useState({});
  const trackCoversRef = useRef({});

  const [isArtworkGradientEnabled, setIsArtworkGradientEnabledState] = useState(true);

  useEffect(() => {
    safeStorage.getItem('@settings_auto_play_next').then((val) => {
      if (val !== null) setAutoPlayNextState(val === 'true');
    });
    safeStorage.getItem('@settings_artwork_gradient').then((val) => {
      if (val !== null) setIsArtworkGradientEnabledState(val === 'true');
    });
  }, []);

  const setAutoPlayNext = useCallback((val) => {
    setAutoPlayNextState(val);
    safeStorage.setItem('@settings_auto_play_next', String(val)).catch(() => {});
  }, []);

  const toggleArtworkGradient = useCallback(() => {
    setIsArtworkGradientEnabledState((prev) => {
      const next = !prev;
      safeStorage.setItem('@settings_artwork_gradient', String(next)).catch(() => {});
      return next;
    });
  }, []);

  useEffect(() => {
    safeStorage.getItem('@musicplayer_track_covers')
      .then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            setTrackCovers(parsed);
            trackCoversRef.current = parsed;
            setTracks((prev) =>
              prev.map((t) => (parsed[t.id] ? { ...t, coverId: parsed[t.id] } : t))
            );
            setCurrentTrack((curr) => {
              if (curr && parsed[curr.id]) {
                return { ...curr, coverId: parsed[curr.id] };
              }
              return curr;
            });
          } catch (e) {
            console.warn('Cover parse hatası:', e);
          }
        }
      })
      .catch((e) => console.warn('Kayıtlı kapaklar yüklenirken hata:', e));
  }, []);

  const updateTrackCover = useCallback((trackId, coverId) => {
    if (!trackId) return;
    setTrackCovers((prev) => {
      const next = { ...prev };
      if (coverId) {
        next[trackId] = coverId;
      } else {
        delete next[trackId];
      }
      trackCoversRef.current = next;
      safeStorage.setItem('@musicplayer_track_covers', JSON.stringify(next)).catch((e) =>
        console.warn('Kapak kaydedilirken hata:', e)
      );
      return next;
    });

    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, coverId: coverId || null } : t))
    );

    setCurrentTrack((curr) => {
      if (curr && curr.id === trackId) {
        return { ...curr, coverId: coverId || null };
      }
      return curr;
    });
  }, []);

  const assignRandomCoversToAll = useCallback(() => {
    if (!tracks || tracks.length === 0) return 0;
    const coverIds = ALL_COVERS.map((c) => c.id);
    if (coverIds.length === 0) return 0;

    const shuffled = [...coverIds].sort(() => Math.random() - 0.5);
    const newMap = {};
    tracks.forEach((track, index) => {
      newMap[track.id] = shuffled[index % shuffled.length];
    });

    setTrackCovers(newMap);
    trackCoversRef.current = newMap;
    safeStorage.setItem('@musicplayer_track_covers', JSON.stringify(newMap)).catch((e) =>
      console.warn('Toplu rastgele kapak kaydedilirken hata:', e)
    );

    setTracks((prev) =>
      prev.map((t) => ({ ...t, coverId: newMap[t.id] || null }))
    );

    setCurrentTrack((curr) => {
      if (curr && newMap[curr.id]) {
        return { ...curr, coverId: newMap[curr.id] };
      }
      return curr;
    });

    return tracks.length;
  }, [tracks]);

  const resetAllCovers = useCallback(() => {
    setTrackCovers({});
    trackCoversRef.current = {};
    safeStorage.removeItem('@musicplayer_track_covers').catch((e) =>
      console.warn('Kapaklar sıfırlanırken hata:', e)
    );
    setTracks((prev) =>
      prev.map((t) => ({ ...t, coverId: null }))
    );
    setCurrentTrack((curr) => {
      if (curr) {
        return { ...curr, coverId: null };
      }
      return curr;
    });
  }, []);

  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);
  const [songOptionsTrack, setSongOptionsTrack] = useState(null);

  const openFullPlayer = useCallback(() => setIsFullPlayerOpen(true), []);
  const closeFullPlayer = useCallback(() => setIsFullPlayerOpen(false), []);
  const openSongOptions = useCallback((track) => setSongOptionsTrack(track), []);
  const closeSongOptions = useCallback(() => setSongOptionsTrack(null), []);

  const openAddToPlaylist = openSongOptions;
  const closeAddToPlaylist = closeSongOptions;
  const playlistModalTrack = songOptionsTrack;

  const [isScanningDevice, setIsScanningDevice] = useState(false);
  const [hasDevicePermission, setHasDevicePermission] = useState(null);
  const [deviceTrackCount, setDeviceTrackCount] = useState(0);

  const isTrackPlayerReady = useRef(false);
  const compactProgress = useSharedValue(0);
  const lastScrollY = useRef(0);
  const lastScrollTime = useRef(0);
  const isCompactRef = useRef(false);

  useEffect(() => {
    setupTrackPlayer().then((ready) => {
      isTrackPlayerReady.current = ready;
    });
  }, []);

  const onScrollForPlayer = useCallback((event) => {
    if (!event || !event.nativeEvent || !event.nativeEvent.contentOffset) return;
    const now = Date.now();
    if (now - lastScrollTime.current < 60) return;
    lastScrollTime.current = now;

    const currentY = event.nativeEvent.contentOffset.y;
    const diff = currentY - lastScrollY.current;

    if (currentY > 30 && diff > 10) {
      if (!isCompactRef.current) {
        isCompactRef.current = true;
        // eslint-disable-next-line react-hooks/immutability
        compactProgress.value = withTiming(1, {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    } else if (diff < -10 || currentY <= 15) {
      if (isCompactRef.current) {
        isCompactRef.current = false;
        compactProgress.value = withTiming(0, {
          duration: 200,
          easing: Easing.bezier(0.25, 0.1, 0.25, 1),
        });
      }
    }
    lastScrollY.current = currentY;
  }, [compactProgress]);

  const [playlists, setPlaylists] = useState([
    {
      id: 'pl-1',
      name: 'Gece Dinletisi',
      coverId: 'ceramic_flow',
      coverPosition: 'left',
      trackIds: ['demo-1', 'demo-2', 'demo-5', 'demo-8'],
      createdAt: 1710000000000,
    },
    {
      id: 'pl-2',
      name: 'Derin Odaklanma',
      coverId: 'warm_geometry',
      coverPosition: 'left',
      trackIds: ['demo-3', 'demo-4', 'demo-6', 'demo-9', 'demo-12'],
      createdAt: 1710000050000,
    },
  ]);

  const playTrack = useCallback(async (track) => {
    if (!track) return;
    const activeCover = trackCoversRef.current[track.id] || track.coverId || null;
    const trackWithCover = { ...track, coverId: activeCover };
    setCurrentTrack(trackWithCover);
    setIsPlaying(true);

    const TrackPlayer = getTrackPlayer();
    if (isTrackPlayerReady.current && TrackPlayer) {
      try {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: String(track.id),
          url: track.uri,
          title: track.title,
          artist: track.artist || 'Yerel',
          album: track.album || 'Kütüphane',
          duration: track.duration,
          artwork: track.coverArt,
        });
        await TrackPlayer.play();
      } catch (err) {
        console.warn('TrackPlayer parça çalma uyarısı:', err?.message || err);
      }
    }
  }, []);

  const togglePlayPause = useCallback(async () => {
    setIsPlaying((prev) => {
      const nextState = !prev;
      const TrackPlayer = getTrackPlayer();
      if (isTrackPlayerReady.current && TrackPlayer) {
        try {
          if (nextState) {
            TrackPlayer.play();
          } else {
            TrackPlayer.pause();
          }
        } catch (err) {
          console.warn('TrackPlayer duraklatma uyarısı:', err?.message || err);
        }
      }
      return nextState;
    });
  }, []);

  const playNext = useCallback(() => {
    setTracks((currentTracks) => {
      if (!currentTracks || currentTracks.length === 0) return currentTracks;
      setCurrentTrack((curr) => {
        const currentIndex = currentTracks.findIndex((t) => t.id === curr?.id);
        let nextIndex = 0;
        if (isShuffle) {
          nextIndex = Math.floor(Math.random() * currentTracks.length);
        } else {
          nextIndex = (currentIndex + 1) % currentTracks.length;
        }
        const nextTrack = currentTracks[nextIndex];
        if (nextTrack) {
          playTrack(nextTrack);
        }
        return nextTrack || curr;
      });
      return currentTracks;
    });
  }, [isShuffle, playTrack]);

  const playPrevious = useCallback(() => {
    setTracks((currentTracks) => {
      if (!currentTracks || currentTracks.length === 0) return currentTracks;
      setCurrentTrack((curr) => {
        const currentIndex = currentTracks.findIndex((t) => t.id === curr?.id);
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) prevIndex = currentTracks.length - 1;
        const prevTrack = currentTracks[prevIndex];
        if (prevTrack) {
          playTrack(prevTrack);
        }
        return prevTrack || curr;
      });
      return currentTracks;
    });
  }, [playTrack]);

  const handleTrackEnded = useCallback(() => {
    if (repeatMode === 'one') {
      const TrackPlayer = getTrackPlayer();
      if (isTrackPlayerReady.current && TrackPlayer) {
        try {
          TrackPlayer.seekTo(0);
          TrackPlayer.play();
        } catch (_) {}
      }
      return;
    }
    if (autoPlayNext) {
      playNext();
    } else {
      setIsPlaying(false);
    }
  }, [repeatMode, autoPlayNext, playNext]);

  const toggleFavorite = useCallback((trackId) => {
    setFavorites((prev) =>
      prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId]
    );
  }, []);

  const toggleShuffle = useCallback(() => {
    setIsShuffle((prev) => !prev);
  }, []);

  const createPlaylist = useCallback((name, coverId = null, coverPosition = 'left') => {
    if (!name || !name.trim()) return;
    const newPl = {
      id: `pl-${Date.now()}`,
      name: name.trim(),
      coverId: coverId || null,
      coverPosition: coverPosition || 'left',
      trackIds: [],
      createdAt: Date.now(),
    };
    setPlaylists((prev) => [newPl, ...prev]);
    return newPl;
  }, []);

  const updatePlaylist = useCallback((playlistId, updates) => {
    if (!playlistId || !updates) return;
    setPlaylists((prev) =>
      prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        return {
          ...pl,
          ...(updates.name !== undefined && { name: updates.name.trim() || pl.name }),
          ...(updates.coverId !== undefined && { coverId: updates.coverId }),
          ...(updates.coverPosition !== undefined && { coverPosition: updates.coverPosition }),
        };
      })
    );
  }, []);

  const deletePlaylist = useCallback((playlistId) => {
    setPlaylists((prev) => prev.filter((p) => p.id !== playlistId));
  }, []);

  const toggleTrackInPlaylist = useCallback((playlistId, trackId) => {
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
  }, []);

  const deleteTrack = useCallback(async (trackId) => {
    if (!trackId) return;

    setTracks((prev) => prev.filter((t) => t.id !== trackId));

    setFavorites((prev) => prev.filter((id) => id !== trackId));

    setPlaylists((prev) =>
      prev.map((pl) => ({
        ...pl,
        trackIds: pl.trackIds.filter((id) => id !== trackId),
      }))
    );

    setCurrentTrack((curr) => {
      if (curr && curr.id === trackId) {
        const TrackPlayer = getTrackPlayer();
        if (isTrackPlayerReady.current && TrackPlayer) {
          try {
            TrackPlayer.reset();
          } catch (_) {}
        }
        setIsPlaying(false);
        return null;
      }
      return curr;
    });

    if (trackId.startsWith('local-')) {
      const assetId = trackId.replace('local-', '');
      try {
        const MediaLibrary = require('expo-media-library/legacy');
        if (MediaLibrary && typeof MediaLibrary.deleteAssetsAsync === 'function') {
          await MediaLibrary.deleteAssetsAsync([assetId]);
        }
      } catch (err) {
        console.warn('Dosya cihazdan silinirken uyarı:', err);
      }
    }
  }, []);

  const scanDeviceTracks = useCallback(async (isUserTriggered = false) => {
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
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      scanDeviceTracks();
    }, 0);
    return () => clearTimeout(timer);
  }, [scanDeviceTracks]);

  const playerValue = useMemo(() => ({
    tracks,
    currentTrack,
    isPlaying,
    favorites,
    playlists,
    isShuffle,
    repeatMode,
    setRepeatMode,
    isScanningDevice,
    hasDevicePermission,
    deviceTrackCount,
    scanDeviceTracks,
    playTrack,
    togglePlayPause,
    playNext,
    playPrevious,
    toggleFavorite,
    toggleShuffle,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    deleteTrack,
    toggleTrackInPlaylist,
    compactProgress,
    onScrollForPlayer,
    trackCovers,
    updateTrackCover,
    assignRandomCoversToAll,
    resetAllCovers,
    autoPlayNext,
    setAutoPlayNext,
    isArtworkGradientEnabled,
    toggleArtworkGradient,
    isFullPlayerOpen,
    openFullPlayer,
    closeFullPlayer,
    playlistModalTrack,
    songOptionsTrack,
    openSongOptions,
    closeSongOptions,
    openAddToPlaylist,
    closeAddToPlaylist,
  }), [
    tracks,
    currentTrack,
    isPlaying,
    favorites,
    playlists,
    trackCovers,
    updateTrackCover,
    assignRandomCoversToAll,
    resetAllCovers,
    autoPlayNext,
    setAutoPlayNext,
    isArtworkGradientEnabled,
    toggleArtworkGradient,
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
    toggleFavorite,
    toggleShuffle,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    deleteTrack,
    toggleTrackInPlaylist,
    compactProgress,
    onScrollForPlayer,
    isFullPlayerOpen,
    openFullPlayer,
    closeFullPlayer,
    playlistModalTrack,
    songOptionsTrack,
    openSongOptions,
    closeSongOptions,
    openAddToPlaylist,
    closeAddToPlaylist,
  ]);

  return (
    <PlayerContext.Provider value={playerValue}>
      <PlayerProgressProvider
        isPlaying={isPlaying}
        currentTrack={currentTrack}
        onTrackEnded={handleTrackEnded}
      >
        {children}
      </PlayerProgressProvider>
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

export const usePlayerProgress = () => {
  const context = useContext(PlayerProgressContext);
  return context;
};

export default PlayerContext;
