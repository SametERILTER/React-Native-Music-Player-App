import React, { useEffect, useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  StatusBar,
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
  Volume2,
} from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import { usePlayer } from '../../context/PlayerContext';
import { formatTime } from '../../services/musicService';
import AlbumArtwork from '../home/AlbumArtwork';

const { width, height } = Dimensions.get('screen');  // status bar dahil tam ekran yüksekliği
const SLIDE_DISTANCE = height + 50;  // ekranın tamamen dışına çıksın
const ARTWORK_SIZE = width - 64;

// Animasyon parametreleri — yaylanma yok, Apple tarzı ease eğrisi
const OPEN_DURATION = 400;
const CLOSE_DURATION = 320;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);   // açılış: hızlı başla yavaşla
const EASE_IN  = Easing.bezier(0.7, 0, 0.84, 0);    // kapanış: yavaşla hızlan

export const FullPlayerModal = ({ visible, onClose }) => {
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    isPlaying,
    position,
    duration,
    togglePlayPause,
    playNext,
    playPrevious,
    seekTo,
    favorites,
    toggleFavorite,
    isShuffle,
    toggleShuffle,
    repeatMode,
  } = usePlayer();

  const translateY = useSharedValue(SLIDE_DISTANCE);
  const overlayOpacity = useSharedValue(0);

  // Açılış animasyonu
  useEffect(() => {
    if (visible) {
      translateY.value = SLIDE_DISTANCE;
      overlayOpacity.value = 0;
      translateY.value = withTiming(0, { duration: OPEN_DURATION, easing: EASE_OUT });
      overlayOpacity.value = withTiming(1, { duration: OPEN_DURATION, easing: EASE_OUT });
    }
  }, [visible]);

  // Kapanış: translateY animasyonu bitince onClose tetiklenir
  const handleClose = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: CLOSE_DURATION, easing: EASE_IN });
    translateY.value = withTiming(SLIDE_DISTANCE, { duration: CLOSE_DURATION, easing: EASE_IN }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const [isSeeking, setIsSeeking] = useState(false);
  const [seekingValue, setSeekingValue] = useState(0);

  if (!currentTrack) return null;

  const isFav = favorites.includes(currentTrack.id);
  const currentPosition = isSeeking ? seekingValue : position;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* Arkaplan overlay */}
      <Animated.View
        style={[StyleSheet.absoluteFillObject, styles.overlay, overlayStyle]}
        pointerEvents="none"
      />

      {/* Tam ekran sheet */}
      <Animated.View style={[styles.sheet, sheetStyle]}>
        {/* Status bar alanı */}
        <View style={{ height: insets.top }} />

        {/* İçerik */}
        <View style={[styles.container, { paddingBottom: insets.bottom + spacing.md }]}>

          {/* Üst Bar: Kapat Butonu & Başlık */}
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
              style={styles.favBtn}
              onPress={() => toggleFavorite(currentTrack.id)}
              activeOpacity={0.7}
            >
              <Heart
                size={22}
                color={isFav ? colors.textPrimary : colors.textTertiary}
                fill={isFav ? colors.textPrimary : 'transparent'}
              />
            </TouchableOpacity>
          </View>

          {/* Büyük Monokrom Kapak Kartı */}
          <View style={styles.artworkSection}>
            <View style={styles.artworkCard}>
              <AlbumArtwork
                size={ARTWORK_SIZE - 20}
                index={currentTrack.trackNumber || 1}
              />
            </View>
          </View>

          {/* Şarkı ve Sanatçı Bilgisi */}
          <View style={styles.metaSection}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {currentTrack.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {currentTrack.artist}
            </Text>
          </View>

          {/* İlerleme Çubuğu ve Süreler */}
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

          {/* Ana Kontroller */}
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

          {/* Alt Footer Bilgisi */}
          <View style={styles.footerSection}>
            <Volume2 size={16} color={colors.textTertiary} />
            <Text style={styles.footerText}>
              {currentTrack.isLocal ? 'Cihaz İçi Yerel Depolama' : 'Kaydedilmiş Ses Akışı'}
            </Text>
          </View>

        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
  sheet: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.background,
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
    paddingVertical: spacing.sm,
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
  favBtn: {
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
    marginVertical: spacing.md,
  },
  artworkCard: {
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    padding: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  metaSection: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  trackTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
    textAlign: 'center',
  },
  trackArtist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.base,
    color: colors.textMuted,
    marginTop: 4,
    textAlign: 'center',
  },
  progressSection: {
    marginVertical: spacing.sm,
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
    marginVertical: spacing.md,
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
  footerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  footerText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
});

export default FullPlayerModal;
