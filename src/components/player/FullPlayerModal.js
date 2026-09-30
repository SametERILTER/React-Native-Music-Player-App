import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
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
  Repeat,
  Heart,
  MoreVertical,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import { usePlayer, usePlayerProgress } from '../../context/PlayerContext';
import { formatTime } from '../../services/musicService';
import { getCoverGradientColors } from '../../constants/playlistCovers';
import AlbumArtwork from '../home/AlbumArtwork';
import EditSongModal from './EditSongModal';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('screen');
const ARTWORK_WIDTH = SCREEN_WIDTH - 56;
const ARTWORK_HEIGHT = Math.min(Math.round(ARTWORK_WIDTH * 0.94), 310);

const OPEN_DURATION = 360;
const CLOSE_DURATION = 240;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);
const START_TRANSLATE_Y = 180;

export const FullPlayerModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
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
  } = usePlayer();
  const { position, duration, seekTo } = usePlayerProgress();

  const [isEditSongModalVisible, setIsEditSongModalVisible] = useState(false);

  const translateY = useSharedValue(START_TRANSLATE_Y);
  const sheetOpacity = useSharedValue(0);
  const sheetScale = useSharedValue(0.97);
  const overlayOpacity = useSharedValue(0);
  const artworkScale = useSharedValue(0.95);

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
  }, [onClose, artworkScale, overlayOpacity, sheetOpacity, sheetScale, translateY]);

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
    transform: [{ scale: artworkScale.value }],
  }));

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekingValue, setSeekingValue] = useState(0);

  const handleBackRequest = useCallback(() => {
    if (isEditSongModalVisible) {
      setIsEditSongModalVisible(false);
      return;
    }
    handleClose();
  }, [isEditSongModalVisible, handleClose]);

  if (!currentTrack) return null;

  const isFav = favorites.includes(currentTrack.id);
  const currentPosition = isSeeking ? seekingValue : position;
  const showGradient = isArtworkGradientEnabled !== false;
  const gradientColors = getCoverGradientColors(
    currentTrack.coverId,
    currentTrack.title || currentTrack.id || currentTrack.trackNumber || 1,
    '#F3F3F4'
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleBackRequest}
    >
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.overlay, overlayStyle]}
        pointerEvents="none"
      />

      <Animated.View style={[styles.sheet, sheetStyle]}>
        {showGradient && (
          <LinearGradient
            colors={gradientColors}
            locations={[0, 0.38, 0.72, 1.0]}
            style={styles.gradientBackground}
            pointerEvents="none"
          />
        )}

        <View style={{ height: insets.top }} />

        <View style={[styles.container, { paddingBottom: Math.max(insets.bottom, 16) + spacing.huge + 34 }]}>

          <View style={styles.header}>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <ChevronDown size={24} color={colors.textPrimary} />
            </TouchableOpacity>

            <View style={styles.headerTitleWrapper}>
              <Text style={styles.headerSubtitle}>OYNATILIYOR</Text>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {currentTrack.album || 'Kitaplık'}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.moreBtn}
              onPress={() => setIsEditSongModalVisible(true)}
              activeOpacity={0.7}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MoreVertical size={20} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          <Animated.View style={[styles.artworkSection, artworkAnimStyle]}>
            <View style={styles.artworkCard}>
              <AlbumArtwork
                width={ARTWORK_WIDTH}
                height={ARTWORK_HEIGHT}
                index={currentTrack.trackNumber || 1}
                coverId={currentTrack.coverId}
                borderRadius={radius.xl}
              />
            </View>
          </Animated.View>

          <View style={styles.bottomSection}>
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

                <TouchableOpacity
                  style={styles.heartBtn}
                  onPress={() => toggleFavorite(currentTrack.id)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Heart
                    size={22}
                    color={isFav ? colors.textPrimary : colors.textTertiary}
                    fill={isFav ? colors.textPrimary : 'transparent'}
                  />
                </TouchableOpacity>
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
                activeOpacity={0.7}
              >
                <Repeat size={20} color={colors.textTertiary} />
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
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
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
  moreBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  artworkSection: {
    alignItems: 'center',
    marginTop: -56,
    marginBottom: spacing.xxs,
  },
  artworkCard: {
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
    marginTop: -72,
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
  heartBtn: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
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
