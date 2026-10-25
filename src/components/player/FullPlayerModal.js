import React, { useEffect, useCallback, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  PanResponder,
  FlatList,
  Pressable,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  ChevronDown,
  ChevronUp,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Heart,
  MoreVertical,
  Music,
  ListMusic,
  ImageDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react-native';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import { usePlayer, usePlayerProgress } from '../../context/PlayerContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatTime } from '../../services/musicService';
import { fetchLyrics } from '../../services/lyricsService';
import { fetchOnlineAlbumArt } from '../../services/albumArtService';
import { useTrackColors } from '../../hooks/useTrackColors';
import { STATIC_LIGHT_GRAY_GRADIENT, isColorDark } from '../../services/colorService';
import AlbumArtwork from '../home/AlbumArtwork';
import EditSongModal from './EditSongModal';
import SyncedLyricsView from './SyncedLyricsView';
import QueueModal from './QueueModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');
const ARTWORK_WIDTH = SCREEN_WIDTH - 56;
const ARTWORK_HEIGHT = Math.min(Math.round(ARTWORK_WIDTH * 0.94), 310);
const LYRICS_WIDTH = SCREEN_WIDTH - 16;

const OPEN_DURATION = 360;
const CLOSE_DURATION = 240;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_SPRING = Easing.bezier(0.22, 1, 0.36, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
const START_TRANSLATE_Y = 180;

export const FullPlayerModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const drawerHeight = useMemo(() => Math.max(500, SCREEN_HEIGHT - insets.top - 78), [insets.top]);
  const { t } = useLanguage();
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    playNext,
    playPrevious,
    favorites,
    toggleFavorite,
    isShuffle,
    toggleShuffle,
    isArtworkGradientEnabled,
    playbackContext,
    updateTrackCover,
    tracks,
    queue,
    playTrack,
  } = usePlayer();
  const { position, duration, seekTo } = usePlayerProgress();
  const trackColors = useTrackColors(currentTrack, '#F3F3F4');

  const [isEditSongModalVisible, setIsEditSongModalVisible] = useState(false);
  const [isQueueModalVisible, setIsQueueModalVisible] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [hasLyrics, setHasLyrics] = useState(false);
  const [prevTrackId, setPrevTrackId] = useState(currentTrack?.id);
  const [prevVisible, setPrevVisible] = useState(visible);
  const [isFetchingCover, setIsFetchingCover] = useState(false);

  // Swipe-up drawer state & quick picks
  const swipeProgress = useSharedValue(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState('quick');
  const [quickPicksNonce, setQuickPicksNonce] = useState(0);

  const activeQueue = useMemo(() => queue || [], [queue]);

  const currentIndex = useMemo(() => {
    if (!currentTrack || activeQueue.length === 0) return -1;
    return activeQueue.findIndex((tItem) => tItem.id === currentTrack.id);
  }, [currentTrack, activeQueue]);

  const upcomingTracks = useMemo(() => {
    if (currentIndex === -1) {
      return activeQueue.filter((tItem) => tItem.id !== currentTrack?.id);
    }
    return activeQueue.slice(currentIndex + 1);
  }, [currentIndex, activeQueue, currentTrack]);

  const quickPicks = useMemo(() => {
    if (!tracks || tracks.length === 0) return [];
    const candidates = tracks.filter((item) => item.id !== currentTrack?.id);
    const shuffled = [...candidates].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tracks, currentTrack?.id, quickPicksNonce]);

  const refreshQuickPicks = useCallback(() => {
    setQuickPicksNonce((n) => n + 1);
  }, []);

  const openDrawer = useCallback(() => {
    setDrawerTab('quick');
    setIsDrawerOpen(true);
    // eslint-disable-next-line react-hooks/immutability
    swipeProgress.value = withTiming(1, {
      duration: 300,
      easing: EASE_SPRING,
    });
  }, [swipeProgress]);

  const closeDrawer = useCallback(() => {
    setIsDrawerOpen(false);
    // eslint-disable-next-line react-hooks/immutability
    swipeProgress.value = withTiming(0, {
      duration: 240,
      easing: EASE_SPRING,
    });
  }, [swipeProgress]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => false,
        onMoveShouldSetPanResponder: (_, gestureState) => {
          const isVertical = Math.abs(gestureState.dy) > Math.abs(gestureState.dx) * 1.25;
          if (!isVertical) return false;
          if (swipeProgress.value > 0.5) {
            return gestureState.dy > 5;
          }
          return gestureState.dy < -6;
        },
        onPanResponderMove: (_, gestureState) => {
          const delta = -gestureState.dy / (drawerHeight * 0.82);
          const base = swipeProgress.value > 0.5 ? 1 : 0;
          const nextVal = Math.min(1, Math.max(0, base + delta));
          // eslint-disable-next-line react-hooks/immutability
          swipeProgress.value = nextVal;
        },
        onPanResponderRelease: (_, gestureState) => {
          const velocity = -gestureState.vy;
          let target = 0;
          if (swipeProgress.value > 0.5) {
            if (gestureState.dy > 35 || gestureState.vy > 0.25) {
              target = 0;
            } else {
              target = 1;
            }
          } else {
            if (gestureState.dy < -35 || velocity > 0.25) {
              target = 1;
            } else {
              target = 0;
            }
          }

          if (target === 1) {
            setDrawerTab('quick');
          }
          setIsDrawerOpen(target === 1);
          // eslint-disable-next-line react-hooks/immutability
          swipeProgress.value = withTiming(target, {
            duration: target === 1 ? 300 : 240,
            easing: EASE_SPRING,
          });
        },
      }),
    [swipeProgress, drawerHeight]
  );

  const handlePlayDrawerSong = useCallback(
    (track) => {
      if (!track) return;
      if (drawerTab === 'queue') {
        playTrack(track, activeQueue, playbackContext);
      } else {
        playTrack(track, tracks, { type: 'quick_picks', name: t('queue.quickPicks') });
      }
    },
    [drawerTab, playTrack, activeQueue, playbackContext, tracks, t]
  );

  const handleFetchOnlineCover = useCallback(async () => {
    if (!currentTrack || isFetchingCover) return;
    setIsFetchingCover(true);
    try {
      const result = await fetchOnlineAlbumArt(currentTrack);
      if (result.success && result.artworkUrl) {
        updateTrackCover(currentTrack.id, result.artworkUrl);
      }
    } catch (_) {
    } finally {
      setIsFetchingCover(false);
    }
  }, [currentTrack, isFetchingCover, updateTrackCover]);

  if (currentTrack?.id !== prevTrackId) {
    setPrevTrackId(currentTrack?.id);
    setShowLyrics(false);
    setIsDrawerOpen(false);
    setDrawerTab('quick');
  }

  if (prevVisible !== visible) {
    setPrevVisible(visible);
    if (!visible) {
      setIsDrawerOpen(false);
      setDrawerTab('quick');
    }
  }

  useEffect(() => {
    let isCancelled = false;
    const check = async () => {
      if (!currentTrack) {
        setHasLyrics(false);
        return;
      }
      try {
        const data = await fetchLyrics(currentTrack);
        if (!isCancelled) {
          setHasLyrics(Boolean(data && data.lines && data.lines.length > 0));
        }
      } catch (_) {
        if (!isCancelled) setHasLyrics(false);
      }
    };
    check();
    return () => {
      isCancelled = true;
    };
  }, [currentTrack]);

  const translateY = useSharedValue(START_TRANSLATE_Y);
  const sheetOpacity = useSharedValue(0);
  const sheetScale = useSharedValue(0.97);
  const overlayOpacity = useSharedValue(0);
  const artworkScale = useSharedValue(0.95);
  const lyricsCrossfade = useSharedValue(0);
  const lyricsButtonEntrance = useSharedValue(0);

  useEffect(() => {
    lyricsCrossfade.value = withTiming(showLyrics ? 1 : 0, {
      duration: 320,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    });
  }, [showLyrics, lyricsCrossfade]);

  useEffect(() => {
    let timeoutId = null;
    if (visible && hasLyrics) {
      timeoutId = setTimeout(() => {
        lyricsButtonEntrance.value = withTiming(1, {
          duration: 380,
          easing: Easing.bezier(0.2, 0, 0, 1),
        });
      }, 260);
    } else {
      lyricsButtonEntrance.value = 0;
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [visible, hasLyrics, lyricsButtonEntrance]);

  useEffect(() => {
    if (visible) {
      translateY.value = START_TRANSLATE_Y;
      sheetOpacity.value = 0;
      sheetScale.value = 0.97;
      overlayOpacity.value = 0;
      artworkScale.value = 0.95;
      // eslint-disable-next-line react-hooks/immutability
      swipeProgress.value = 0;

      translateY.value = withTiming(0, { duration: OPEN_DURATION, easing: EASE_OUT });
      sheetOpacity.value = withTiming(1, { duration: OPEN_DURATION - 50, easing: EASE_OUT });
      sheetScale.value = withTiming(1, { duration: OPEN_DURATION, easing: EASE_OUT });
      overlayOpacity.value = withTiming(1, { duration: OPEN_DURATION, easing: EASE_OUT });
      artworkScale.value = withTiming(1, { duration: OPEN_DURATION + 40, easing: EASE_OUT });
    }
  }, [visible, artworkScale, overlayOpacity, sheetOpacity, sheetScale, translateY, swipeProgress]);

  const handleClose = useCallback(() => {
    setShowLyrics(false);
    setIsDrawerOpen(false);
    // eslint-disable-next-line react-hooks/immutability
    swipeProgress.value = 0;
    // eslint-disable-next-line react-hooks/immutability
    lyricsButtonEntrance.value = 0;
    // eslint-disable-next-line react-hooks/immutability
    overlayOpacity.value = withTiming(0, { duration: CLOSE_DURATION, easing: EASE_IN });
    // eslint-disable-next-line react-hooks/immutability
    sheetOpacity.value = withTiming(0, { duration: CLOSE_DURATION - 40, easing: EASE_IN });
    // eslint-disable-next-line react-hooks/immutability
    sheetScale.value = withTiming(0.97, { duration: CLOSE_DURATION, easing: EASE_IN });
    // eslint-disable-next-line react-hooks/immutability
    artworkScale.value = withTiming(0.95, { duration: CLOSE_DURATION, easing: EASE_IN });
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(START_TRANSLATE_Y, { duration: CLOSE_DURATION, easing: EASE_IN }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose, artworkScale, overlayOpacity, sheetOpacity, sheetScale, translateY, lyricsButtonEntrance, swipeProgress]);

  const sheetStyle = useAnimatedStyle(() => ({
    opacity: sheetOpacity.value,
    transform: [
      { translateY: translateY.value },
      { scale: sheetScale.value },
    ],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const artworkAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: artworkScale.value },
      { translateY: lyricsButtonEntrance.value * -14 },
    ],
  }));

  const lyricsButtonAnimStyle = useAnimatedStyle(() => ({
    opacity: lyricsButtonEntrance.value,
    transform: [
      { translateY: (1 - lyricsButtonEntrance.value) * 10 },
      { scale: 0.88 + lyricsButtonEntrance.value * 0.12 },
    ],
  }));

  const artworkCrossfadeStyle = useAnimatedStyle(() => ({
    opacity: 1 - lyricsCrossfade.value,
    transform: [{ scale: 1 - lyricsCrossfade.value * 0.04 }],
  }));

  const lyricsCrossfadeStyle = useAnimatedStyle(() => ({
    opacity: lyricsCrossfade.value,
    transform: [{ scale: 0.96 + lyricsCrossfade.value * 0.04 }],
  }));

  // Drawer & Header Animated Styles
  const headerNormalAnimStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - swipeProgress.value * 2.2),
    transform: [{ translateY: swipeProgress.value * -16 }],
  }));

  const headerCompactAnimStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (swipeProgress.value - 0.25) * 1.5)),
    transform: [{ translateY: (1 - swipeProgress.value) * 14 }],
  }));

  const headerRightNormalAnimStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - swipeProgress.value * 2.2),
    transform: [{ scale: 1 - swipeProgress.value * 0.2 }],
  }));

  const headerRightCompactAnimStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, (swipeProgress.value - 0.28) * 1.6)),
    transform: [{ scale: 0.8 + Math.min(1, Math.max(0, swipeProgress.value)) * 0.2 }],
  }));

  const artworkDrawerAnimStyle = useAnimatedStyle(() => {
    const scaleFactor = 1 - swipeProgress.value * 0.28;
    const moveUp = swipeProgress.value * 80;
    return {
      transform: [
        { scale: scaleFactor },
        { translateY: -moveUp },
      ],
      opacity: Math.max(0, 1 - swipeProgress.value * 1.5),
    };
  });

  const bottomSectionAnimStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: swipeProgress.value * -30 }],
    opacity: Math.max(0, 1 - swipeProgress.value * 1.6),
  }));

  const swipeUpHandleAnimStyle = useAnimatedStyle(() => ({
    opacity: Math.max(0, 1 - swipeProgress.value * 2.5),
    transform: [{ translateY: swipeProgress.value * 16 }],
  }));

  const drawerBackdropAnimStyle = useAnimatedStyle(() => ({
    opacity: swipeProgress.value * 0.35,
  }));

  const drawerAnimStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: (1 - swipeProgress.value) * drawerHeight,
      },
    ],
  }));

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekingValue, setSeekingValue] = useState(0);

  const handleBackRequest = useCallback(() => {
    if (isEditSongModalVisible) {
      setIsEditSongModalVisible(false);
      return;
    }
    if (isQueueModalVisible) {
      setIsQueueModalVisible(false);
      return;
    }
    if (isDrawerOpen) {
      closeDrawer();
      return;
    }
    handleClose();
  }, [isEditSongModalVisible, isQueueModalVisible, isDrawerOpen, closeDrawer, handleClose]);

  const handleHeaderLeftPress = useCallback(() => {
    if (isDrawerOpen || swipeProgress.value > 0.5) {
      closeDrawer();
    } else {
      handleClose();
    }
  }, [isDrawerOpen, swipeProgress, closeDrawer, handleClose]);

  const isPlaylistPlayback = playbackContext?.type === 'playlist' && Boolean(playbackContext?.name);
  const headerSubtitleText = isPlaylistPlayback ? t('player.playlistSubtitle') : t('player.nowPlayingSubtitle');
  const headerTitleText = isPlaylistPlayback
    ? playbackContext.name
    : (currentTrack?.album && currentTrack.album !== 'Kütüphane' && currentTrack.album !== 'Library'
        ? currentTrack.album
        : t('player.deviceTracks'));

  const showGradient = isArtworkGradientEnabled !== false;
  const isExtracted = trackColors?.isExtracted === true;
  const gradientColors = isExtracted
    ? trackColors?.gradientColors
    : STATIC_LIGHT_GRAY_GRADIENT;
  const isDark = Boolean(
    showGradient && (trackColors?.isDark ?? (isExtracted && isColorDark(trackColors?.primary)))
  );

  const drawerGradientColors = useMemo(() => {
    if (showGradient && gradientColors && gradientColors.length >= 2) {
      if (isDark) {
        const baseDark = gradientColors[gradientColors.length - 1] || '#121316';
        const midTone = gradientColors[Math.min(1, gradientColors.length - 2)] || '#1D1E23';
        return [midTone, baseDark];
      } else {
        const topTone = gradientColors[0] || '#FFFFFF';
        const bottomTone = gradientColors[gradientColors.length - 1] || '#F2F3F6';
        return [topTone, bottomTone];
      }
    }
    return isDark ? ['#1D1E23', '#121316'] : ['#FFFFFF', '#F2F3F6'];
  }, [showGradient, gradientColors, isDark]);

  const currentTrackId = currentTrack?.id;
  const renderDrawerSongItem = useCallback(
    ({ item, index }) => {
      const isItemCurrent = currentTrackId === item.id;
      return (
        <TouchableOpacity
          style={[
            styles.drawerSongRow,
            isDark && styles.drawerSongRowDark,
            isItemCurrent && (isDark ? styles.drawerSongRowActiveDark : styles.drawerSongRowActive),
          ]}
          onPress={() => handlePlayDrawerSong(item)}
          activeOpacity={0.7}
        >
          <View style={styles.drawerSongLeft}>
            <AlbumArtwork
              size={44}
              borderRadius={radius.sm}
              index={item.trackNumber || index + 1}
              track={item}
              coverId={item.coverId}
              artwork={item.coverArt || item.artwork}
            />
            <View style={styles.drawerSongTexts}>
              <Text
                style={[
                  styles.drawerSongTitle,
                  isDark && styles.drawerSongTitleDark,
                  isItemCurrent && styles.drawerSongTitleActive,
                ]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.drawerSongArtist,
                  isDark && styles.drawerSongArtistDark,
                ]}
                numberOfLines={1}
              >
                {item.artist || t('common.unknownArtist')}
              </Text>
            </View>
          </View>

          <View style={styles.drawerSongRight}>
            <Text style={[styles.drawerSongDuration, isDark && styles.drawerSongDurationDark]}>
              {formatTime(item.duration || 0)}
            </Text>
            <View style={[styles.drawerPlayMiniBtn, isDark && styles.drawerPlayMiniBtnDark]}>
              <Play
                size={11}
                color={isDark ? '#000000' : colors.primaryContrast}
                fill={isDark ? '#000000' : colors.primaryContrast}
                style={{ marginLeft: 1 }}
              />
            </View>
          </View>
        </TouchableOpacity>
      );
    },
    [currentTrackId, isDark, t, handlePlayDrawerSong]
  );

  if (!currentTrack) return null;

  const isFav = favorites.includes(currentTrack.id);
  const currentPosition = isSeeking ? seekingValue : position;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleBackRequest}
    >
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.overlay, overlayStyle]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.sheet, { backgroundColor: isDark ? '#121316' : '#F3F3F4' }, sheetStyle]}>
        {showGradient && gradientColors && (
          <LinearGradient
            colors={gradientColors}
            locations={
              gradientColors.length === 5
                ? [0, 0.48, 0.72, 0.90, 1.0]
                : [0, 0.58, 0.85, 1.0]
            }
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1.0 }}
            style={styles.gradientBackground}
            pointerEvents="none"
          />
        )}

        <View style={[styles.container, { paddingTop: insets.top + spacing.xs, paddingBottom: Math.max(insets.bottom, 20) + 12 }]}>

          <View style={styles.header}>
            <TouchableOpacity
              style={[styles.closeBtn, isDark && styles.closeBtnDark]}
              onPress={handleHeaderLeftPress}
              activeOpacity={0.7}
            >
              <ChevronDown size={24} color={isDark ? '#FFFFFF' : colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleWrapper}>
              <Animated.View style={[styles.headerCenterContent, headerNormalAnimStyle]} pointerEvents="none">
                <Text style={[styles.headerSubtitle, isDark && styles.headerSubtitleDark]}>
                  {headerSubtitleText}
                </Text>
                <Text style={[styles.headerTitle, isDark && styles.headerTitleDark]} numberOfLines={1}>
                  {headerTitleText}
                </Text>
              </Animated.View>

              <Animated.View style={[styles.headerCompactContent, headerCompactAnimStyle]} pointerEvents="none">
                <Text style={[styles.headerCompactTitle, isDark && styles.headerCompactTitleDark]} numberOfLines={1}>
                  {currentTrack.title}
                </Text>
                <Text style={[styles.headerCompactArtist, isDark && styles.headerCompactArtistDark]} numberOfLines={1}>
                  {currentTrack.artist}
                </Text>
              </Animated.View>
            </View>

            <View style={styles.headerRightGroup}>
              <Animated.View style={headerRightNormalAnimStyle} pointerEvents={isDrawerOpen ? 'none' : 'auto'}>
                <TouchableOpacity
                  style={[styles.headerIconBtn, isDark && styles.headerIconBtnDark]}
                  onPress={() => setIsEditSongModalVisible(true)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MoreVertical size={20} color={isDark ? '#FFFFFF' : colors.textPrimary} />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={[StyleSheet.absoluteFillObject, styles.headerPlayBtnWrap, headerRightCompactAnimStyle]}
                pointerEvents={isDrawerOpen ? 'auto' : 'none'}
              >
                <TouchableOpacity
                  style={[styles.headerPlayBtn, isDark && styles.headerPlayBtnDark]}
                  onPress={togglePlayPause}
                  activeOpacity={0.8}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  {isPlaying ? (
                    <Pause
                      size={17}
                      color={isDark ? '#000000' : colors.primaryContrast}
                      fill={isDark ? '#000000' : colors.primaryContrast}
                    />
                  ) : (
                    <Play
                      size={17}
                      color={isDark ? '#000000' : colors.primaryContrast}
                      fill={isDark ? '#000000' : colors.primaryContrast}
                      style={{ marginLeft: 2 }}
                    />
                  )}
                </TouchableOpacity>
              </Animated.View>
            </View>
          </View>

          <Animated.View style={[styles.artworkSection, artworkAnimStyle, artworkDrawerAnimStyle]}>
            <View style={styles.artworkContainer} collapsable={false}>
              <Animated.View
                style={[styles.artworkLayer, artworkCrossfadeStyle]}
                pointerEvents={showLyrics ? 'none' : 'auto'}
              >
                <TouchableOpacity
                  style={styles.artworkCard}
                  activeOpacity={0.92}
                  onPress={() => hasLyrics && setShowLyrics(true)}
                >
                  <AlbumArtwork
                    width={ARTWORK_WIDTH}
                    height={ARTWORK_HEIGHT}
                    index={currentTrack.trackNumber || 1}
                    track={currentTrack}
                    coverId={currentTrack.coverId}
                    artwork={currentTrack.coverArt || currentTrack.artwork}
                    borderRadius={radius.xl}
                  />
                </TouchableOpacity>
              </Animated.View>

              <Animated.View
                style={[styles.lyricsLayer, lyricsCrossfadeStyle]}
                pointerEvents={showLyrics ? 'auto' : 'none'}
                collapsable={false}
              >
                <SyncedLyricsView
                  width={LYRICS_WIDTH}
                  height={ARTWORK_HEIGHT}
                  currentTrack={currentTrack}
                  position={currentPosition}
                  seekTo={seekTo}
                  onToggleView={() => setShowLyrics(false)}
                  gradientColors={showGradient ? gradientColors : null}
                  isDark={isDark}
                />
              </Animated.View>
            </View>
          </Animated.View>

          <Animated.View style={[styles.bottomSection, bottomSectionAnimStyle]} {...panResponder.panHandlers}>
            {hasLyrics && (
              <Animated.View style={[styles.lyricsButtonContainer, lyricsButtonAnimStyle]}>
                <TouchableOpacity
                  style={[
                    styles.lyricsPillButton,
                    isDark && styles.lyricsPillButtonDark,
                    showLyrics && (isDark ? styles.lyricsPillButtonActiveDark : styles.lyricsPillButtonActive),
                  ]}
                  onPress={() => setShowLyrics((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Music
                    size={12}
                    color={
                      showLyrics
                        ? (isDark ? '#000000' : colors.primaryContrast)
                        : (isDark ? '#FFFFFF' : colors.textPrimary)
                    }
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.lyricsPillText,
                      isDark && styles.lyricsPillTextDark,
                      showLyrics && (isDark ? styles.lyricsPillTextActiveDark : styles.lyricsPillTextActive),
                    ]}
                  >
                    {showLyrics ? t('player.showCover') : t('player.showLyrics')}
                  </Text>
                </TouchableOpacity>
              </Animated.View>
            )}

            <View style={styles.metaSection}>
              <View style={styles.titleRow}>
                <View style={styles.titleTextWrap}>
                  <Text style={[styles.trackTitle, isDark && styles.trackTitleDark]} numberOfLines={1}>
                    {currentTrack.title}
                  </Text>
                  <Text style={[styles.trackArtist, isDark && styles.trackArtistDark]} numberOfLines={1}>
                    {currentTrack.artist}
                  </Text>
                </View>

                <View style={styles.metaActionsCol}>
                  <TouchableOpacity
                    style={[styles.fetchCoverBtn, isDark && styles.actionBtnDark]}
                    onPress={handleFetchOnlineCover}
                    disabled={isFetchingCover}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    {isFetchingCover ? (
                      <ActivityIndicator size="small" color={isDark ? '#FFFFFF' : colors.textPrimary} />
                    ) : (
                      <ImageDown size={18} color={isDark ? '#FFFFFF' : colors.textPrimary} strokeWidth={1.8} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.heartBtn, isDark && styles.actionBtnDark]}
                    onPress={() => toggleFavorite(currentTrack.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Heart
                      size={20}
                      color={
                        isFav
                          ? (isDark ? '#FFFFFF' : colors.textPrimary)
                          : (isDark ? 'rgba(255, 255, 255, 0.55)' : colors.textTertiary)
                      }
                      fill={isFav ? (isDark ? '#FFFFFF' : colors.textPrimary) : 'transparent'}
                    />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            <View style={styles.progressSection}>
              <Slider
                style={styles.slider}
                minimumValue={0}
                maximumValue={duration > 0 ? duration : 1}
                value={currentPosition}
                minimumTrackTintColor={isDark ? '#FFFFFF' : colors.primary}
                maximumTrackTintColor={isDark ? 'rgba(255, 255, 255, 0.24)' : colors.border}
                thumbTintColor={isDark ? '#FFFFFF' : colors.primary}
                onValueChange={(val) => {
                  setIsSeeking(true);
                  setSeekingValue(val);
                }}
                onSlidingComplete={(val) => {
                  setIsSeeking(false);
                  seekTo(val);
                }}
              />

              <View style={styles.timeRow}>
                <Text style={[styles.timeText, isDark && styles.timeTextDark]}>{formatTime(currentPosition)}</Text>
                <Text style={[styles.timeText, isDark && styles.timeTextDark]}>{formatTime(duration)}</Text>
              </View>
            </View>

            <View style={styles.controlsSection}>
              <TouchableOpacity
                style={styles.secondaryControl}
                onPress={toggleShuffle}
                activeOpacity={0.7}
              >
                <Shuffle
                  size={20}
                  color={
                    isShuffle
                      ? (isDark ? '#FFFFFF' : colors.textPrimary)
                      : (isDark ? 'rgba(255, 255, 255, 0.45)' : colors.textTertiary)
                  }
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={playPrevious}
                activeOpacity={0.7}
              >
                <SkipBack
                  size={26}
                  color={isDark ? '#FFFFFF' : colors.textPrimary}
                  fill={isDark ? '#FFFFFF' : colors.textPrimary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mainPlayBtn, isDark && styles.mainPlayBtnDark]}
                onPress={togglePlayPause}
                activeOpacity={0.85}
              >
                {isPlaying ? (
                  <Pause
                    size={28}
                    color={isDark ? '#000000' : colors.primaryContrast}
                    fill={isDark ? '#000000' : colors.primaryContrast}
                  />
                ) : (
                  <Play
                    size={28}
                    color={isDark ? '#000000' : colors.primaryContrast}
                    fill={isDark ? '#000000' : colors.primaryContrast}
                    style={{ marginLeft: 3 }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={playNext}
                activeOpacity={0.7}
              >
                <SkipForward
                  size={26}
                  color={isDark ? '#FFFFFF' : colors.textPrimary}
                  fill={isDark ? '#FFFFFF' : colors.textPrimary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryControl}
                onPress={() => setIsQueueModalVisible(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ListMusic
                  size={20}
                  color={isDark ? '#FFFFFF' : colors.textPrimary}
                />
              </TouchableOpacity>
            </View>

            {/* Bottom Swipe-Up Indicator Handle */}
            <Animated.View style={[styles.swipeUpHandleContainer, swipeUpHandleAnimStyle]}>
              <TouchableOpacity
                style={[styles.swipeUpHandleBtn, isDark && styles.swipeUpHandleBtnDark]}
                onPress={openDrawer}
                activeOpacity={0.7}
              >
                <ChevronUp size={16} color={isDark ? 'rgba(255, 255, 255, 0.75)' : colors.textSecondary} />
                <Text style={[styles.swipeUpText, isDark && styles.swipeUpTextDark]}>
                  {upcomingTracks.length > 0
                    ? `${t('queue.quickPicks')} • ${t('queue.upNext')}`
                    : t('queue.quickPicks')}
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </Animated.View>

        </View>

        {/* Drawer backdrop */}
        <Animated.View
          style={[
            StyleSheet.absoluteFillObject,
            styles.drawerBackdrop,
            drawerBackdropAnimStyle,
          ]}
          pointerEvents={isDrawerOpen ? 'auto' : 'none'}
        >
          <Pressable style={StyleSheet.absoluteFillObject} onPress={closeDrawer} />
        </Animated.View>

        {/* Up Next & Quick Picks Drawer */}
        <Animated.View
          style={[
            styles.drawerContainer,
            { height: drawerHeight },
            isDark ? styles.drawerContainerDark : styles.drawerContainerLight,
            drawerAnimStyle,
          ]}
        >
          {/* Dynamic Album-Art matched background gradient */}
          <LinearGradient
            colors={drawerGradientColors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          {/* Drawer Handle Area (PanResponder for dragging down) */}
          <View style={styles.drawerHandleArea} {...panResponder.panHandlers}>
            <View style={[styles.drawerHandleBar, isDark && styles.drawerHandleBarDark]} />

            {/* Segmented Tabs: Hızlı Seçimler & Sıradaki Parçalar */}
            <View style={styles.drawerTabRow}>
              <View style={[styles.drawerTabsSegment, isDark && styles.drawerTabsSegmentDark]}>
                <TouchableOpacity
                  style={[
                    styles.drawerTabBtn,
                    drawerTab === 'quick' && (isDark ? styles.drawerTabBtnActiveDark : styles.drawerTabBtnActive),
                  ]}
                  onPress={() => setDrawerTab('quick')}
                  activeOpacity={0.75}
                >
                  <Sparkles
                    size={13}
                    color={
                      drawerTab === 'quick'
                        ? (isDark ? '#000000' : colors.primaryContrast)
                        : (isDark ? 'rgba(255,255,255,0.65)' : colors.textSecondary)
                    }
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.drawerTabText,
                      isDark && styles.drawerTabTextDark,
                      drawerTab === 'quick' && (isDark ? styles.drawerTabTextActiveDark : styles.drawerTabTextActive),
                    ]}
                  >
                    {t('queue.quickPicks')}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.drawerTabBtn,
                    drawerTab === 'queue' && (isDark ? styles.drawerTabBtnActiveDark : styles.drawerTabBtnActive),
                  ]}
                  onPress={() => setDrawerTab('queue')}
                  activeOpacity={0.75}
                >
                  <ListMusic
                    size={13}
                    color={
                      drawerTab === 'queue'
                        ? (isDark ? '#000000' : colors.primaryContrast)
                        : (isDark ? 'rgba(255,255,255,0.65)' : colors.textSecondary)
                    }
                    style={{ marginRight: 4 }}
                  />
                  <Text
                    style={[
                      styles.drawerTabText,
                      isDark && styles.drawerTabTextDark,
                      drawerTab === 'queue' && (isDark ? styles.drawerTabTextActiveDark : styles.drawerTabTextActive),
                    ]}
                  >
                    {t('queue.upNext')}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.drawerHeaderRightBtns}>
                {drawerTab === 'quick' && (
                  <TouchableOpacity
                    style={[styles.refreshPicksBtn, isDark && styles.refreshPicksBtnDark]}
                    onPress={refreshQuickPicks}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <RefreshCw size={14} color={isDark ? '#FFFFFF' : colors.textPrimary} />
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.closeDrawerBtn, isDark && styles.closeDrawerBtnDark]}
                  onPress={closeDrawer}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronDown size={18} color={isDark ? '#FFFFFF' : colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* List Content */}
          <View style={styles.drawerListContainer}>
            {drawerTab === 'queue' ? (
              upcomingTracks.length > 0 ? (
                <FlatList
                  data={upcomingTracks}
                  keyExtractor={(item, index) => `queue-${item.id}-${index}`}
                  renderItem={renderDrawerSongItem}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.drawerListContent}
                />
              ) : (
                <View style={styles.emptyDrawerWrap}>
                  <ListMusic size={32} color={isDark ? 'rgba(255,255,255,0.3)' : colors.textTertiary} />
                  <Text style={[styles.emptyDrawerTitle, isDark && styles.emptyDrawerTitleDark]}>
                    {t('queue.emptyTitle')}
                  </Text>
                  <Text style={[styles.emptyDrawerDesc, isDark && styles.emptyDrawerDescDark]}>
                    {t('queue.emptyDesc')}
                  </Text>
                  <TouchableOpacity
                    style={[styles.emptySwitchBtn, isDark && styles.emptySwitchBtnDark]}
                    onPress={() => setDrawerTab('quick')}
                    activeOpacity={0.8}
                  >
                    <Sparkles size={14} color={isDark ? '#000000' : colors.primaryContrast} style={{ marginRight: 6 }} />
                    <Text style={[styles.emptySwitchText, isDark && styles.emptySwitchTextDark]}>
                      {t('queue.quickPicks')}
                    </Text>
                  </TouchableOpacity>
                </View>
              )
            ) : (
              <FlatList
                data={quickPicks}
                keyExtractor={(item, index) => `quick-${item.id}-${index}`}
                renderItem={renderDrawerSongItem}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.drawerListContent}
                ListEmptyComponent={
                  <View style={styles.emptyDrawerWrap}>
                    <Text style={[styles.emptyDrawerTitle, isDark && styles.emptyDrawerTitleDark]}>
                      {t('home.emptySongsTitle')}
                    </Text>
                  </View>
                }
              />
            )}
          </View>
        </Animated.View>
      </Animated.View>

      <EditSongModal
        visible={isEditSongModalVisible}
        track={currentTrack}
        onClose={() => setIsEditSongModalVisible(false)}
      />

      <QueueModal
        visible={isQueueModalVisible}
        onClose={() => setIsQueueModalVisible(false)}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    backgroundColor: '#F3F3F4',
  },
  gradientBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.xs,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: spacing.sm,
    height: 40,
    overflow: 'hidden',
    position: 'relative',
  },
  headerCenterContent: {
    alignItems: 'center',
    width: '100%',
  },
  headerCompactContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCompactTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  headerCompactTitleDark: {
    color: '#FFFFFF',
  },
  headerCompactArtist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs - 1,
    color: colors.textMuted,
    marginTop: 1,
    textAlign: 'center',
  },
  headerCompactArtistDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  headerSubtitle: {
    fontFamily: typography.fonts.headerBold,
    fontSize: typography.sizes.xxs,
    color: colors.textMuted,
    letterSpacing: typography.letterSpacing.widest,
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    marginTop: 2,
  },
  headerRightGroup: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlayBtnWrap: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.sm,
  },
  headerPlayBtnDark: {
    backgroundColor: '#FFFFFF',
  },
  artworkSection: {
    alignItems: 'center',
    marginTop: -100,
    marginBottom: spacing.xxs,
  },
  artworkContainer: {
    width: ARTWORK_WIDTH,
    height: ARTWORK_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'visible',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  artworkLayer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: ARTWORK_WIDTH,
    height: ARTWORK_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  lyricsLayer: {
    position: 'absolute',
    top: 0,
    left: -(LYRICS_WIDTH - ARTWORK_WIDTH) / 2,
    width: LYRICS_WIDTH,
    height: ARTWORK_HEIGHT,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  artworkCard: {
    width: ARTWORK_WIDTH,
    height: ARTWORK_HEIGHT,
    borderRadius: radius.xl,
    borderWidth: 0,
    padding: 0,
    backgroundColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  bottomSection: {
    width: '100%',
    paddingBottom: spacing.sm,
    marginTop: -90,
    marginBottom: 50,
  },
  lyricsButtonContainer: {
    alignItems: 'center',
    marginTop: -8,
    marginBottom: 8,
  },
  lyricsPillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  lyricsPillButtonActive: {
    backgroundColor: 'rgba(26, 26, 26, 0.78)',
  },
  lyricsPillText: {
    fontSize: 11,
    fontFamily: typography.fonts.bold,
    color: colors.textPrimary,
    letterSpacing: 0.2,
  },
  lyricsPillTextActive: {
    color: colors.primaryContrast,
  },
  metaSection: {
    marginBottom: spacing.xs,
    paddingHorizontal: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  titleTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  trackTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  trackArtist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.textMuted,
    marginTop: 2,
  },
  metaActionsCol: {
    alignItems: 'center',
    gap: 8,
  },
  fetchCoverBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heartBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.45)',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressSection: {
    marginBottom: spacing.xs,
    paddingHorizontal: 2,
  },
  slider: {
    width: '100%',
    height: 36,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: -4,
    paddingHorizontal: 4,
  },
  timeText: {
    fontFamily: typography.fonts.headerBold,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    letterSpacing: typography.letterSpacing.wide,
  },
  controlsSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    marginTop: spacing.xxs,
  },
  secondaryControl: {
    padding: spacing.sm,
  },
  skipBtn: {
    padding: spacing.sm,
  },
  mainPlayBtn: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.floating,
  },
  closeBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerIconBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerSubtitleDark: {
    color: 'rgba(255, 255, 255, 0.65)',
  },
  lyricsPillButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  lyricsPillButtonActiveDark: {
    backgroundColor: '#FFFFFF',
  },
  lyricsPillTextDark: {
    color: '#FFFFFF',
  },
  lyricsPillTextActiveDark: {
    color: '#000000',
  },
  trackTitleDark: {
    color: '#FFFFFF',
  },
  trackArtistDark: {
    color: 'rgba(255, 255, 255, 0.72)',
  },
  actionBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  timeTextDark: {
    color: 'rgba(255, 255, 255, 0.65)',
  },
  mainPlayBtnDark: {
    backgroundColor: '#FFFFFF',
  },
  swipeUpHandleContainer: {
    alignItems: 'center',
    marginTop: spacing.md,
    paddingBottom: 2,
  },
  swipeUpHandleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'transparent',
    borderWidth: 0,
    gap: 6,
  },
  swipeUpHandleBtnDark: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  swipeUpText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    letterSpacing: 0.2,
  },
  swipeUpTextDark: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  drawerBackdrop: {
    backgroundColor: '#000000',
  },
  drawerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    overflow: 'hidden',
  },
  drawerContainerLight: {},
  drawerContainerDark: {},
  drawerHandleArea: {
    paddingTop: 12,
    paddingBottom: 8,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  drawerHandleBar: {
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
    marginBottom: 10,
  },
  drawerHandleBarDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  drawerTabRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  drawerTabsSegment: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: radius.full,
    padding: 3,
    gap: 3,
  },
  drawerTabsSegmentDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  drawerTabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: radius.full,
  },
  drawerTabBtnActive: {
    backgroundColor: colors.primary,
  },
  drawerTabBtnActiveDark: {
    backgroundColor: '#FFFFFF',
  },
  drawerTabText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  drawerTabTextDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  drawerTabTextActive: {
    color: colors.primaryContrast,
  },
  drawerTabTextActiveDark: {
    color: '#000000',
  },
  drawerHeaderRightBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshPicksBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshPicksBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  closeDrawerBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeDrawerBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  drawerListContainer: {
    flex: 1,
  },
  drawerListContent: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    paddingBottom: 24,
  },
  drawerSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: radius.md,
    marginVertical: 1,
  },
  drawerSongRowDark: {
    backgroundColor: 'transparent',
  },
  drawerSongRowActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  drawerSongRowActiveDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  drawerSongLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  drawerSongTexts: {
    marginLeft: spacing.sm + 2,
    flex: 1,
  },
  drawerSongTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  drawerSongTitleDark: {
    color: '#FFFFFF',
  },
  drawerSongTitleActive: {
    fontFamily: typography.fonts.semiBold,
    color: colors.primary,
  },
  drawerSongArtist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  drawerSongArtistDark: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  drawerSongRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  drawerSongDuration: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  drawerSongDurationDark: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  drawerPlayMiniBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerPlayMiniBtnDark: {
    backgroundColor: '#FFFFFF',
  },
  emptyDrawerWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: spacing.lg,
    gap: 8,
  },
  emptyDrawerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 6,
  },
  emptyDrawerTitleDark: {
    color: '#FFFFFF',
  },
  emptyDrawerDesc: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyDrawerDescDark: {
    color: 'rgba(255, 255, 255, 0.6)',
  },
  emptySwitchBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.full,
    marginTop: 8,
  },
  emptySwitchBtnDark: {
    backgroundColor: '#FFFFFF',
  },
  emptySwitchText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.xs,
    color: colors.primaryContrast,
  },
  emptySwitchTextDark: {
    color: '#000000',
  },
});

export default FullPlayerModal;
