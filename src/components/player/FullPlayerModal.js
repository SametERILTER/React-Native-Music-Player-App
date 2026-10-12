import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
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
import { STATIC_LIGHT_GRAY_GRADIENT } from '../../services/colorService';
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
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
const START_TRANSLATE_Y = 180;

export const FullPlayerModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
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
  } = usePlayer();
  const { position, duration, seekTo } = usePlayerProgress();
  const trackColors = useTrackColors(currentTrack, '#F3F3F4');

  const [isEditSongModalVisible, setIsEditSongModalVisible] = useState(false);
  const [isQueueModalVisible, setIsQueueModalVisible] = useState(false);
  const [showLyrics, setShowLyrics] = useState(false);
  const [hasLyrics, setHasLyrics] = useState(false);
  const [prevTrackId, setPrevTrackId] = useState(currentTrack?.id);
  const [isFetchingCover, setIsFetchingCover] = useState(false);

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

      translateY.value = withTiming(0, { duration: OPEN_DURATION, easing: EASE_OUT });
      sheetOpacity.value = withTiming(1, { duration: OPEN_DURATION - 50, easing: EASE_OUT });
      sheetScale.value = withTiming(1, { duration: OPEN_DURATION, easing: EASE_OUT });
      overlayOpacity.value = withTiming(1, { duration: OPEN_DURATION, easing: EASE_OUT });
      artworkScale.value = withTiming(1, { duration: OPEN_DURATION + 40, easing: EASE_OUT });
    }
  }, [visible, artworkScale, overlayOpacity, sheetOpacity, sheetScale, translateY]);

  const handleClose = useCallback(() => {
    setShowLyrics(false);
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
  }, [onClose, artworkScale, overlayOpacity, sheetOpacity, sheetScale, translateY, lyricsButtonEntrance]);

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
    handleClose();
  }, [isEditSongModalVisible, isQueueModalVisible, handleClose]);

  const isPlaylistPlayback = playbackContext?.type === 'playlist' && Boolean(playbackContext?.name);
  const headerSubtitleText = isPlaylistPlayback ? t('player.playlistSubtitle') : t('player.nowPlayingSubtitle');
  const headerTitleText = isPlaylistPlayback
    ? playbackContext.name
    : (currentTrack?.album && currentTrack.album !== 'Kütüphane' && currentTrack.album !== 'Library'
        ? currentTrack.album
        : t('player.deviceTracks'));

  if (!currentTrack) return null;

  const isFav = favorites.includes(currentTrack.id);
  const currentPosition = isSeeking ? seekingValue : position;
  const showGradient = isArtworkGradientEnabled !== false;
  const isExtracted = trackColors?.isExtracted === true;
  const gradientColors = isExtracted
    ? trackColors?.gradientColors
    : STATIC_LIGHT_GRAY_GRADIENT;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleBackRequest}
    >
      <StatusBar style="dark" />
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.overlay, overlayStyle]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.sheet, sheetStyle]}>
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

        <View style={[styles.container, { paddingTop: insets.top + spacing.xs, paddingBottom: Math.max(insets.bottom, 20) + 40 }]}>

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <ChevronDown size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleWrapper}>
              <Text style={styles.headerSubtitle}>{headerSubtitleText}</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {headerTitleText}
              </Text>
            </View>

            <View style={styles.headerRightGroup}>
              <TouchableOpacity
                style={styles.headerIconBtn}
                onPress={() => setIsEditSongModalVisible(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MoreVertical size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>
          </View>

          <Animated.View style={[styles.artworkSection, artworkAnimStyle]}>
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
                />
              </Animated.View>
            </View>
          </Animated.View>

          <View style={styles.bottomSection}>
            {hasLyrics && (
              <Animated.View style={[styles.lyricsButtonContainer, lyricsButtonAnimStyle]}>
                <TouchableOpacity
                  style={[
                    styles.lyricsPillButton,
                    showLyrics && styles.lyricsPillButtonActive,
                  ]}
                  onPress={() => setShowLyrics((prev) => !prev)}
                  activeOpacity={0.8}
                >
                  <Music
                    size={12}
                    color={showLyrics ? colors.primaryContrast : colors.textPrimary}
                    style={{ marginRight: 5 }}
                  />
                  <Text
                    style={[
                      styles.lyricsPillText,
                      showLyrics && styles.lyricsPillTextActive,
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
                  <Text style={styles.trackTitle} numberOfLines={1}>
                    {currentTrack.title}
                  </Text>
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {currentTrack.artist}
                  </Text>
                </View>

                <View style={styles.metaActionsCol}>
                  <TouchableOpacity
                    style={styles.fetchCoverBtn}
                    onPress={handleFetchOnlineCover}
                    disabled={isFetchingCover}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    {isFetchingCover ? (
                      <ActivityIndicator size="small" color={colors.textPrimary} />
                    ) : (
                      <ImageDown size={18} color={colors.textPrimary} strokeWidth={1.8} />
                    )}
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.heartBtn}
                    onPress={() => toggleFavorite(currentTrack.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  >
                    <Heart
                      size={20}
                      color={isFav ? colors.textPrimary : colors.textTertiary}
                      fill={isFav ? colors.textPrimary : 'transparent'}
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
                minimumTrackTintColor={colors.primary}
                maximumTrackTintColor={colors.border}
                thumbTintColor={colors.primary}
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
                <Text style={styles.timeText}>{formatTime(currentPosition)}</Text>
                <Text style={styles.timeText}>{formatTime(duration)}</Text>
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
                  color={isShuffle ? colors.textPrimary : colors.textTertiary}
                />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={playPrevious}
                activeOpacity={0.7}
              >
                <SkipBack size={26} color={colors.textPrimary} fill={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mainPlayBtn}
                onPress={togglePlayPause}
                activeOpacity={0.85}
              >
                {isPlaying ? (
                  <Pause size={28} color={colors.primaryContrast} fill={colors.primaryContrast} />
                ) : (
                  <Play
                    size={28}
                    color={colors.primaryContrast}
                    fill={colors.primaryContrast}
                    style={{ marginLeft: 3 }}
                  />
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.skipBtn}
                onPress={playNext}
                activeOpacity={0.7}
              >
                <SkipForward size={26} color={colors.textPrimary} fill={colors.textPrimary} />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryControl}
                onPress={() => setIsQueueModalVisible(true)}
                activeOpacity={0.7}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <ListMusic
                  size={20}
                  color={colors.textPrimary}
                />
              </TouchableOpacity>
            </View>
          </View>

        </View>
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
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrapper: {
    alignItems: 'center',
    flex: 1,
    marginHorizontal: spacing.sm,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255, 255, 255, 0.42)',
    justifyContent: 'center',
    alignItems: 'center',
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
});

export default FullPlayerModal;
