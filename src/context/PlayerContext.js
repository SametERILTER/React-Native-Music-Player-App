import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useSharedValue, withTiming, Easing } from 'react-native-reanimated';
import { safeStorage } from '../services/storageService';
import { DEMO_TRACKS, fetchDeviceAudioTracks, extractTrackMetadata } from '../services/musicService';
import { setupTrackPlayer, getTrackPlayer } from '../services/trackPlayerService';
import { ALL_COVERS } from '../constants/playlistCovers';
import { colors } from '../theme';

const PlayerContext = createContext(null);
const PlayerProgressContext = createContext({
  position: 0,
  duration: 180,
  seekTo: () => {},
});

const DEFAULT_PLAYLISTS = [
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
];

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
  const [tracks, setTracks] = useState([]);
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [playlists, setPlaylists] = useState(DEFAULT_PLAYLISTS);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off');
  const [autoPlayNext, setAutoPlayNextState] = useState(true);
  const [queue, setQueue] = useState([]);
  const [playbackContext, setPlaybackContext] = useState(null);

  const toggleRepeatMode = useCallback(() => {
    setRepeatMode((prev) => {
      if (prev === 'off') return 'all';
      if (prev === 'all') return 'one';
      return 'off';
    });
  }, []);

  const [isScanningDevice, setIsScanningDevice] = useState(false);
  const [hasDevicePermission, setHasDevicePermission] = useState(null);
  const [deviceTrackCount, setDeviceTrackCount] = useState(0);
  const [isLibraryLoaded, setIsLibraryLoaded] = useState(false);

  const [trackCovers, setTrackCovers] = useState({});
  const trackCoversRef = useRef({});
  const [customTrackMeta, setCustomTrackMeta] = useState({});
  const customTrackMetaRef = useRef({});

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

  const CACHED_TRACKS_KEY = '@musicplayer_cached_device_tracks';

  useEffect(() => {
    let isMounted = true;
    const initializeLibrary = async () => {
      try {
        const [storedCovers, storedTracks, storedFavorites, storedPlaylists, storedCustomMeta] = await Promise.all([
          safeStorage.getItem('@musicplayer_track_covers'),
          safeStorage.getItem(CACHED_TRACKS_KEY),
          safeStorage.getItem('@musicplayer_favorites'),
          safeStorage.getItem('@musicplayer_playlists'),
          safeStorage.getItem('@musicplayer_custom_track_meta'),
        ]);

        if (!isMounted) return;

        if (storedPlaylists) {
          try {
            const parsedPl = JSON.parse(storedPlaylists);
            if (Array.isArray(parsedPl)) setPlaylists(parsedPl);
          } catch (_) {}
        }

        if (storedFavorites) {
          try {
            const parsedFavs = JSON.parse(storedFavorites);
            if (Array.isArray(parsedFavs)) setFavorites(parsedFavs);
          } catch (_) {}
        }

        let parsedCovers = {};
        if (storedCovers) {
          try {
            parsedCovers = JSON.parse(storedCovers) || {};
            setTrackCovers(parsedCovers);
            trackCoversRef.current = parsedCovers;
          } catch (e) {
            console.warn('Cover parse hatası:', e);
          }
        }

        let parsedCustomMeta = {};
        if (storedCustomMeta) {
          try {
            parsedCustomMeta = JSON.parse(storedCustomMeta) || {};
            setCustomTrackMeta(parsedCustomMeta);
            customTrackMetaRef.current = parsedCustomMeta;
          } catch (e) {
            console.warn('Custom meta parse hatası:', e);
          }
        }

        let deviceTracks = [];
        if (storedTracks) {
          try {
            const parsed = JSON.parse(storedTracks);
            if (Array.isArray(parsed) && parsed.length > 0) {
              deviceTracks = parsed.map((t) => {
                if (!t.artist || t.artist === 'Yerel' || t.artist === 'Bilinmeyen Sanatçı' || t.title?.includes(' - ')) {
                  const meta = extractTrackMetadata(t.title, t.artist === 'Yerel' ? null : t.artist, t.author);
                  return {
                    ...t,
                    title: meta.title,
                    artist: meta.artist,
                  };
                }
                return t;
              });
              safeStorage.setItem(CACHED_TRACKS_KEY, JSON.stringify(deviceTracks)).catch(() => {});
            }
          } catch (_) {}
        }

        // Açılışta cihaz şarkılarını bekleterek tara (böylece ekran açıldığında sayı zaten 31 olur)
        try {
          const scanRes = await fetchDeviceAudioTracks();
          if (scanRes && scanRes.success && Array.isArray(scanRes.tracks)) {
            setHasDevicePermission(true);
            if (scanRes.tracks.length > 0) {
              deviceTracks = scanRes.tracks;
              safeStorage
                .setItem(CACHED_TRACKS_KEY, JSON.stringify(scanRes.tracks))
                .catch(() => {});
            }
          }
        } catch (scanErr) {
          console.warn('Açılış cihaz tarama uyarısı:', scanErr);
        }

        if (!isMounted) return;

        const covers = trackCoversRef.current || parsedCovers;
        const tracksWithCovers = deviceTracks.map((t) => ({
          ...t,
          coverId: covers[t.id] || t.coverId || null,
        }));

        setDeviceTrackCount(deviceTracks.length);

        const demoTracksWithCovers = DEMO_TRACKS.map((t) => ({
          ...t,
          coverId: covers[t.id] || t.coverId || null,
        }));

        const allTracks = [...tracksWithCovers, ...demoTracksWithCovers].map((t) => {
          if (parsedCustomMeta[t.id]) {
            return { ...t, ...parsedCustomMeta[t.id] };
          }
          return t;
        });
        setTracks(allTracks);
        setQueue((currQ) => (currQ && currQ.length > 0 ? currQ : allTracks));
        setPlaybackContext((currCtx) => currCtx || { type: 'library', name: 'Cihaz Müzikleri' });

        setCurrentTrack((curr) => {
          if (!curr) {
            return allTracks[0];
          }
          return curr;
        });
      } catch (err) {
        console.warn('Kütüphane başlatılırken hata:', err);
        if (isMounted) {
          setTracks(DEMO_TRACKS);
          setQueue(DEMO_TRACKS);
          setPlaybackContext({ type: 'library', name: 'Cihaz Müzikleri' });
          setCurrentTrack(DEMO_TRACKS[0]);
        }
      } finally {
        if (isMounted) {
          // Tüm parçalar tam olarak hazır olduktan sonra ekran açılır (asla 30'dan 31'e sıçramaz)
          setIsLibraryLoaded(true);
        }
      }
    };

    initializeLibrary();
    return () => {
      isMounted = false;
    };
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

    setQueue((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, coverId: coverId || null } : t))
    );

    setCurrentTrack((curr) => {
      if (curr && curr.id === trackId) {
        return { ...curr, coverId: coverId || null };
      }
      return curr;
    });
  }, []);

  const updateTrackInfo = useCallback((trackId, updates) => {
    if (!trackId || !updates) return;
    const cleanUpdates = {};
    if (updates.title !== undefined && typeof updates.title === 'string' && updates.title.trim()) {
      cleanUpdates.title = updates.title.trim();
    }
    if (updates.artist !== undefined && typeof updates.artist === 'string' && updates.artist.trim()) {
      cleanUpdates.artist = updates.artist.trim();
    }
    if (updates.album !== undefined && typeof updates.album === 'string' && updates.album.trim()) {
      cleanUpdates.album = updates.album.trim();
    }

    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...cleanUpdates } : t))
    );
    setQueue((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...cleanUpdates } : t))
    );
    setCurrentTrack((curr) => {
      if (curr && curr.id === trackId) {
        return { ...curr, ...cleanUpdates };
      }
      return curr;
    });

    setCustomTrackMeta((prev) => {
      const next = { ...prev, [trackId]: { ...(prev[trackId] || {}), ...cleanUpdates } };
      customTrackMetaRef.current = next;
      safeStorage.setItem('@musicplayer_custom_track_meta', JSON.stringify(next)).catch((e) =>
        console.warn('Custom meta kaydedilirken hata:', e)
      );
      return next;
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



  const playTrack = useCallback(async (track, newQueue = null, newContext = null) => {
    if (!track) return;
    const activeCover = trackCoversRef.current[track.id] || track.coverId || null;
    const trackWithCover = { ...track, coverId: activeCover };
    setCurrentTrack(trackWithCover);
    setIsPlaying(true);

    if (newQueue && Array.isArray(newQueue) && newQueue.length > 0) {
      setQueue(newQueue);
    } else {
      setQueue((currQueue) => {
        if (currQueue && currQueue.some((t) => t.id === track.id)) {
          return currQueue;
        }
        return tracks && tracks.length > 0 ? tracks : [trackWithCover];
      });
    }

    if (newContext) {
      setPlaybackContext(newContext);
    } else {
      setPlaybackContext((currContext) => {
        if (currContext && (!newQueue || currContext.id)) {
          return currContext;
        }
        return {
          type: 'library',
          name: track.album && track.album !== 'Kütüphane' ? track.album : 'Cihaz Müzikleri',
        };
      });
    }

    const TrackPlayer = getTrackPlayer();
    if (isTrackPlayerReady.current && TrackPlayer) {
      try {
        await TrackPlayer.reset();
        await TrackPlayer.add({
          id: String(track.id),
          url: track.uri,
          title: track.title,
          artist: track.artist || 'Bilinmeyen Sanatçı',
          album: track.album || 'Kütüphane',
          duration: track.duration,
          artwork: track.coverArt,
        });
        await TrackPlayer.play();
      } catch (err) {
        console.warn('TrackPlayer parça çalma uyarısı:', err?.message || err);
      }
    }
  }, [tracks]);

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
    setQueue((currQueue) => {
      const activeList = currQueue && currQueue.length > 0 ? currQueue : tracks;
      if (!activeList || activeList.length === 0) return currQueue;

      setCurrentTrack((curr) => {
        const currentIndex = activeList.findIndex((t) => t.id === curr?.id);
        let nextIndex = 0;
        if (isShuffle) {
          if (activeList.length > 1) {
            do {
              nextIndex = Math.floor(Math.random() * activeList.length);
            } while (nextIndex === currentIndex && activeList.length > 1);
          } else {
            nextIndex = 0;
          }
        } else {
          if (currentIndex === -1) {
            nextIndex = 0;
          } else if (currentIndex + 1 >= activeList.length) {
            if (repeatMode === 'off' && !autoPlayNext) {
              setIsPlaying(false);
              return curr;
            }
            nextIndex = 0;
          } else {
            nextIndex = currentIndex + 1;
          }
        }

        const nextTrack = activeList[nextIndex];
        if (nextTrack) {
          playTrack(nextTrack, activeList);
        }
        return nextTrack || curr;
      });

      return currQueue;
    });
  }, [tracks, isShuffle, repeatMode, autoPlayNext, playTrack]);

  const playPrevious = useCallback(() => {
    setQueue((currQueue) => {
      const activeList = currQueue && currQueue.length > 0 ? currQueue : tracks;
      if (!activeList || activeList.length === 0) return currQueue;

      setCurrentTrack((curr) => {
        const currentIndex = activeList.findIndex((t) => t.id === curr?.id);
        let prevIndex = currentIndex - 1;
        if (prevIndex < 0) {
          prevIndex = activeList.length - 1;
        }
        const prevTrack = activeList[prevIndex];
        if (prevTrack) {
          playTrack(prevTrack, activeList);
        }
        return prevTrack || curr;
      });

      return currQueue;
    });
  }, [tracks, playTrack]);

  const removeFromQueue = useCallback((trackId) => {
    if (!trackId) return;
    setQueue((prev) => prev.filter((t) => t.id !== trackId));
  }, []);

  const clearUpcomingQueue = useCallback(() => {
    setQueue((prev) => {
      if (!currentTrack) return prev;
      return prev.filter((t) => t.id === currentTrack.id);
    });
  }, [currentTrack]);

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
    setFavorites((prev) => {
      const next = prev.includes(trackId)
        ? prev.filter((id) => id !== trackId)
        : [...prev, trackId];
      safeStorage.setItem('@musicplayer_favorites', JSON.stringify(next)).catch(() => {});
      return next;
    });
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
    setPlaylists((prev) => {
      const next = [newPl, ...prev];
      safeStorage.setItem('@musicplayer_playlists', JSON.stringify(next)).catch(() => {});
      return next;
    });
    return newPl;
  }, [setPlaylists]);

  const updatePlaylist = useCallback((playlistId, updates) => {
    if (!playlistId || !updates) return;
    setPlaylists((prev) => {
      const next = prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        return {
          ...pl,
          ...(updates.name !== undefined && { name: updates.name.trim() || pl.name }),
          ...(updates.coverId !== undefined && { coverId: updates.coverId }),
          ...(updates.coverPosition !== undefined && { coverPosition: updates.coverPosition }),
          ...(updates.isGradientEnabled !== undefined && { isGradientEnabled: updates.isGradientEnabled }),
        };
      });
      safeStorage.setItem('@musicplayer_playlists', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [setPlaylists]);

  const deletePlaylist = useCallback((playlistId) => {
    setPlaylists((prev) => {
      const next = prev.filter((p) => p.id !== playlistId);
      safeStorage.setItem('@musicplayer_playlists', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [setPlaylists]);

  const toggleTrackInPlaylist = useCallback((playlistId, trackId) => {
    setPlaylists((prev) => {
      const next = prev.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const exists = pl.trackIds.includes(trackId);
        const updatedTrackIds = exists
          ? pl.trackIds.filter((id) => id !== trackId)
          : [...pl.trackIds, trackId];
        return {
          ...pl,
          trackIds: updatedTrackIds,
        };
      });
      safeStorage.setItem('@musicplayer_playlists', JSON.stringify(next)).catch(() => {});
      return next;
    });
  }, [setPlaylists]);

  const deleteTrack = useCallback(async (trackId) => {
    if (!trackId) return;

    setTracks((prev) => {
      const next = prev.filter((t) => t.id !== trackId);
      if (trackId.startsWith('local-')) {
        const remainingLocals = next.filter((t) => t.id.startsWith('local-'));
        setDeviceTrackCount(remainingLocals.length);
        safeStorage.setItem(CACHED_TRACKS_KEY, JSON.stringify(remainingLocals)).catch(() => {});
      }
      return next;
    });

    setFavorites((prev) => prev.filter((id) => id !== trackId));
    setQueue((prev) => prev.filter((t) => t.id !== trackId));

    setPlaylists((prev) => {
      const next = prev.map((pl) => ({
        ...pl,
        trackIds: pl.trackIds.filter((id) => id !== trackId),
      }));
      safeStorage.setItem('@musicplayer_playlists', JSON.stringify(next)).catch(() => {});
      return next;
    });

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
  }, [setDeviceTrackCount, setPlaylists]);

  const scanDeviceTracks = useCallback(async (isUserTriggered = false) => {
    if (isUserTriggered) {
      setIsScanningDevice(true);
    }
    try {
      const res = await fetchDeviceAudioTracks();
      if (res.success) {
        setHasDevicePermission(true);
        if (res.tracks && res.tracks.length > 0) {
          const covers = trackCoversRef.current || {};
          const tracksWithCovers = res.tracks.map((t) => ({
            ...t,
            coverId: covers[t.id] || t.coverId || null,
          }));

          const demoTracksWithCovers = DEMO_TRACKS.map((t) => ({
            ...t,
            coverId: covers[t.id] || t.coverId || null,
          }));

          setDeviceTrackCount(res.tracks.length);

          let hasChanges = false;
          setTracks((prev) => {
            const currentLocals = prev.filter((t) => t.id.startsWith('local-'));
            const isSameCount = currentLocals.length === tracksWithCovers.length;
            const isSameList =
              isSameCount && currentLocals.every((t, i) => t.id === tracksWithCovers[i]?.id);

            if (isSameList) {
              hasChanges = false;
              return prev;
            }

            hasChanges = true;
            const updatedAll = [...tracksWithCovers, ...demoTracksWithCovers];
            setQueue((prevQ) => (prevQ && prevQ.length > 0 ? prevQ : updatedAll));
            return updatedAll;
          });

          // Önbelleğe kaydet
          safeStorage
            .setItem(CACHED_TRACKS_KEY, JSON.stringify(res.tracks))
            .catch((err) => console.warn('Önbellek kayıt hatası:', err));

          setCurrentTrack((prev) => {
            if (!prev) {
              return tracksWithCovers[0];
            }
            return prev;
          });

          if (isUserTriggered) {
            const { Alert } = require('react-native');
            if (hasChanges) {
              Alert.alert('Tarama Tamamlandı', `${res.tracks.length} adet müzik kütüphanenize yüklendi.`);
            } else {
              Alert.alert('Kütüphane Güncel', `Tüm müzikleriniz (${res.tracks.length} parça) zaten güncel.`);
            }
          }
        } else {
          setDeviceTrackCount(0);
          setTracks((prev) => (prev.length === 0 ? DEMO_TRACKS : prev));
          if (isUserTriggered) {
            const { Alert } = require('react-native');
            Alert.alert('Bilgi', 'Cihazınızda oynatılabilir ses dosyası bulunamadı.');
          }
        }
      } else if (res.reason === 'native_module_unavailable') {
        setHasDevicePermission(false);
        setTracks((prev) => (prev.length === 0 ? DEMO_TRACKS : prev));
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
      if (isUserTriggered) {
        setIsScanningDevice(false);
      }
    }
  }, [setDeviceTrackCount]);



  const playerValue = useMemo(() => ({
    tracks,
    currentTrack,
    isPlaying,
    favorites,
    playlists,
    queue,
    setQueue,
    playbackContext,
    setPlaybackContext,
    removeFromQueue,
    clearUpcomingQueue,
    toggleRepeatMode,
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
    customTrackMeta,
    updateTrackInfo,
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
    queue,
    playbackContext,
    removeFromQueue,
    clearUpcomingQueue,
    toggleRepeatMode,
    trackCovers,
    updateTrackCover,
    customTrackMeta,
    updateTrackInfo,
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

  if (!isLibraryLoaded) {
    return (
      <View style={loadingStyles.container}>
        <ActivityIndicator size="small" color={colors.textPrimary} />
      </View>
    );
  }

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

const loadingStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

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
