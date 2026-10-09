import React, { useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Dimensions,
  FlatList,
  Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  X,
  Play,
  Pause,
  ListMusic,
  Shuffle,
  Repeat,
  Volume2,
  Trash2,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { usePlayer } from '../../context/PlayerContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatTime } from '../../services/musicService';
import AlbumArtwork from '../home/AlbumArtwork';

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

const OPEN_MS = 280;
const CLOSE_MS = 220;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

const QueueContent = ({ onClose, insets, translateY }) => {
  const { t } = useLanguage();
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    queue,
    playbackContext,
    playTrack,
    removeFromQueue,
    clearUpcomingQueue,
    isShuffle,
    toggleShuffle,
    repeatMode,
    toggleRepeatMode,
  } = usePlayer();

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

  const previousTracks = useMemo(() => {
    if (currentIndex <= 0) return [];
    return activeQueue.slice(0, currentIndex);
  }, [currentIndex, activeQueue]);

  const contextTitle = useMemo(() => {
    if (playbackContext?.type === 'playlist' && playbackContext?.name) {
      return t('queue.fromPlaylist', { name: playbackContext.name });
    }
    if (playbackContext?.type === 'favorites') {
      return t('queue.fromFavorites');
    }
    if (playbackContext?.type === 'search') {
      return t('queue.fromSearch');
    }
    return t('queue.fromDevice');
  }, [playbackContext, t]);

  const handlePlayFromQueue = useCallback(
    (track) => {
      if (!track) return;
      playTrack(track, activeQueue, playbackContext);
    },
    [playTrack, activeQueue, playbackContext]
  );

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const renderUpcomingItem = useCallback(
    ({ item, index }) => (
      <View style={styles.trackRowWrapper}>
        <TouchableOpacity
          style={styles.trackRow}
          onPress={() => handlePlayFromQueue(item)}
          activeOpacity={0.7}
        >
          <View style={styles.artworkWrap}>
            <AlbumArtwork
              width={42}
              height={42}
              index={item.trackNumber || index + 1}
              coverId={item.coverId}
              borderRadius={radius.sm}
            />
          </View>

          <View style={styles.trackInfo}>
            <Text style={styles.trackTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.trackArtist} numberOfLines={1}>
              {item.artist || t('common.unknownArtist')}
            </Text>
          </View>

          <Text style={styles.trackDuration}>{formatTime(item.duration)}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.removeBtn}
          onPress={() => removeFromQueue(item.id)}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          activeOpacity={0.65}
        >
          <X size={15} color={colors.textTertiary} />
        </TouchableOpacity>
      </View>
    ),
    [handlePlayFromQueue, removeFromQueue, t]
  );

  return (
    <Animated.View
      style={[
        styles.sheetContainer,
        { paddingBottom: Math.max(insets.bottom, 16) + spacing.xs },
        sheetAnimatedStyle,
      ]}
    >
      <View style={styles.handleBar} />

      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {contextTitle.toUpperCase()}
          </Text>
          <View style={styles.titleWithBadge}>
            <Text style={styles.headerTitle}>{t('queue.title')}</Text>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{t('queue.songsCount', { count: activeQueue.length })}</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.closeBtn}
          onPress={onClose}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.quickControlsRow}>
        <TouchableOpacity
          style={[styles.quickChip, isShuffle && styles.quickChipActive]}
          onPress={toggleShuffle}
          activeOpacity={0.75}
        >
          <Shuffle
            size={13}
            color={isShuffle ? colors.primaryContrast : colors.textPrimary}
            style={{ marginRight: 5 }}
          />
          <Text
            style={[styles.quickChipText, isShuffle && styles.quickChipTextActive]}
          >
            {isShuffle ? t('queue.shuffleOn') : t('queue.shuffleOff')}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickChip, repeatMode !== 'off' && styles.quickChipActive]}
          onPress={toggleRepeatMode}
          activeOpacity={0.75}
        >
          <Repeat
            size={13}
            color={repeatMode !== 'off' ? colors.primaryContrast : colors.textPrimary}
            style={{ marginRight: 5 }}
          />
          <Text
            style={[
              styles.quickChipText,
              repeatMode !== 'off' && styles.quickChipTextActive,
            ]}
          >
            {repeatMode === 'one'
              ? t('queue.repeatOne')
              : repeatMode === 'all'
              ? t('queue.repeatAll')
              : t('queue.repeatOff')}
          </Text>
        </TouchableOpacity>

        {upcomingTracks.length > 0 && (
          <TouchableOpacity
            style={styles.clearChip}
            onPress={clearUpcomingQueue}
            activeOpacity={0.75}
          >
            <Trash2 size={12} color={colors.textTertiary} style={{ marginRight: 4 }} />
            <Text style={styles.clearChipText}>{t('queue.clear')}</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={upcomingTracks}
        keyExtractor={(item) => `up-${item.id}`}
        renderItem={renderUpcomingItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={
          <View style={styles.listHeaderSection}>
            {currentTrack && (
              <View style={styles.nowPlayingSection}>
                <View style={styles.sectionTitleRow}>
                  <Text style={styles.sectionTitle}>{t('queue.nowPlaying')}</Text>
                  <View style={styles.liveIndicator}>
                    <Volume2 size={13} color={colors.primary} style={{ marginRight: 4 }} />
                    <Text style={styles.liveIndicatorText}>
                      {isPlaying ? t('queue.playing') : t('queue.paused')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.nowPlayingCard}
                  onPress={togglePlayPause}
                  activeOpacity={0.88}
                >
                  <View style={styles.nowPlayingArtworkWrap}>
                    <AlbumArtwork
                      width={48}
                      height={48}
                      index={currentTrack.trackNumber || 1}
                      coverId={currentTrack.coverId}
                      borderRadius={radius.sm}
                    />
                  </View>

                  <View style={styles.nowPlayingInfo}>
                    <Text style={styles.nowPlayingTitle} numberOfLines={1}>
                      {currentTrack.title}
                    </Text>
                    <Text style={styles.nowPlayingArtist} numberOfLines={1}>
                      {currentTrack.artist || t('common.unknownArtist')}
                    </Text>
                  </View>

                  <View style={styles.nowPlayingControl}>
                    <View style={styles.playPauseIconCircle}>
                      {isPlaying ? (
                        <Pause size={15} color={colors.primaryContrast} fill={colors.primaryContrast} />
                      ) : (
                        <Play
                          size={15}
                          color={colors.primaryContrast}
                          fill={colors.primaryContrast}
                          style={{ marginLeft: 2 }}
                        />
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.sectionTitleRow}>
              <Text style={styles.sectionTitle}>
                {t('queue.upcomingSongs', { count: upcomingTracks.length })}
              </Text>
            </View>
          </View>
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrap}>
              <ListMusic size={26} color={colors.textTertiary} strokeWidth={1.8} />
            </View>
            <Text style={styles.emptyTitle}>{t('queue.emptyTitle')}</Text>
            <Text style={styles.emptySubtitle}>
              {t('queue.emptyDesc')}
            </Text>
          </View>
        }
        ListFooterComponent={
          previousTracks.length > 0 ? (
            <View style={styles.previousSection}>
              <View style={styles.sectionTitleRow}>
                <Text style={styles.sectionTitle}>
                  {t('queue.previousSongs', { count: previousTracks.length })}
                </Text>
              </View>
              {previousTracks.map((item, idx) => (
                <View key={`prev-${item.id}`} style={styles.trackRowWrapper}>
                  <TouchableOpacity
                    style={[styles.trackRow, styles.trackRowPrevious]}
                    onPress={() => handlePlayFromQueue(item)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.artworkWrap, { opacity: 0.72 }]}>
                      <AlbumArtwork
                        width={42}
                        height={42}
                        index={item.trackNumber || idx + 1}
                        coverId={item.coverId}
                        borderRadius={radius.sm}
                      />
                    </View>

                    <View style={styles.trackInfo}>
                      <Text
                        style={[styles.trackTitle, styles.trackTitlePrevious]}
                        numberOfLines={1}
                      >
                        {item.title}
                      </Text>
                      <Text style={styles.trackArtist} numberOfLines={1}>
                        {item.artist || t('common.unknownArtist')}
                      </Text>
                    </View>

                    <Text style={styles.trackDuration}>
                      {formatTime(item.duration)}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ) : null
        }
      />
    </Animated.View>
  );
};

export const QueueModal = ({
  visible,
  onClose,
  useModal = false,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT * 0.9);
  const backdropOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      backdropOpacity.value = 0;
      backdropOpacity.value = withTiming(1, { duration: OPEN_MS, easing: EASE_OUT });
      translateY.value = SCREEN_HEIGHT * 0.9;
      translateY.value = withTiming(0, { duration: OPEN_MS, easing: EASE_OUT });
    }
  }, [visible, translateY, backdropOpacity]);

  const handleClose = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability
    backdropOpacity.value = withTiming(0, { duration: CLOSE_MS, easing: EASE_IN });
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(
      SCREEN_HEIGHT * 0.9,
      { duration: CLOSE_MS, easing: EASE_IN },
      (finished) => {
        if (finished) {
          runOnJS(onClose)();
        }
      }
    );
  }, [onClose, translateY, backdropOpacity]);

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  const content = (
    <Animated.View style={[styles.overlayRoot, backdropAnimStyle]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

      <QueueContent
        onClose={handleClose}
        insets={insets}
        translateY={translateY}
      />
    </Animated.View>
  );

  if (useModal) {
    return (
      <Modal
        visible={visible}
        transparent
        animationType="none"
        statusBarTranslucent
        onRequestClose={handleClose}
      >
        {content}
      </Modal>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  overlayRoot: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
    zIndex: 9999,
    elevation: 9999,
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 24,
    height: Math.round(SCREEN_HEIGHT * 0.86),
    maxHeight: Math.round(SCREEN_HEIGHT * 0.92),
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderMuted,
    alignSelf: 'center',
    marginBottom: spacing.sm,
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  headerTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.headerBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  titleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  countBadge: {
    marginLeft: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countBadgeText: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: colors.textSecondary,
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quickControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  quickChipActive: {
    backgroundColor: colors.primary,
  },
  quickChipText: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: colors.textPrimary,
  },
  quickChipTextActive: {
    color: colors.primaryContrast,
  },
  clearChip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  clearChipText: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    color: colors.textTertiary,
  },
  listContent: {
    paddingBottom: spacing.xxl,
  },
  listHeaderSection: {
    paddingTop: 4,
  },
  nowPlayingSection: {
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    marginTop: 4,
  },
  sectionTitle: {
    fontFamily: typography.fonts.headerBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 1.1,
  },
  sectionSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: 11,
    color: colors.textTertiary,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  liveIndicatorText: {
    fontFamily: typography.fonts.medium,
    fontSize: 10,
    color: colors.textPrimary,
  },
  nowPlayingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  nowPlayingArtworkWrap: {
    marginRight: spacing.sm,
  },
  nowPlayingInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  nowPlayingTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  nowPlayingArtist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  nowPlayingControl: {
    marginLeft: 4,
  },
  playPauseIconCircle: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 2,
  },
  trackRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 7,
    paddingRight: 6,
    borderRadius: radius.md,
  },
  trackRowPrevious: {
    opacity: 0.7,
  },
  artworkWrap: {
    marginRight: spacing.sm,
  },
  trackInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  trackTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  trackTitlePrevious: {
    color: colors.textSecondary,
  },
  trackArtist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 1,
  },
  trackDuration: {
    fontFamily: typography.fonts.headerBold,
    fontSize: 11,
    color: colors.textTertiary,
    marginRight: 4,
  },
  removeBtn: {
    padding: 6,
    marginLeft: 2,
  },
  previousSection: {
    marginTop: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  emptyIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default QueueModal;
