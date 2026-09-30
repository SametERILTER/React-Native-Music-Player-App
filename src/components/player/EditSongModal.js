import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Image,
  ScrollView,
  Dimensions,
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { X, Check, CheckCircle2, ListPlus, Sparkles } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { ALL_COVERS } from '../../constants/playlistCovers';
import { usePlayer } from '../../context/PlayerContext';
import AlbumArtwork from '../home/AlbumArtwork';

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

const OPEN_MS = 300;
const CLOSE_MS = 200;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

const EditSongContent = ({
  track,
  onClose,
  insets,
  translateY,
}) => {
  const {
    updateTrackCover,
    openAddToPlaylist,
    isArtworkGradientEnabled,
    toggleArtworkGradient,
  } = usePlayer();
  const [selectedCoverId, setSelectedCoverId] = useState(track?.coverId || null);

  const handleSave = () => {
    if (!track) return;
    try {
      if (typeof updateTrackCover === 'function') {
        updateTrackCover(track.id, selectedCoverId);
      }
    } catch (err) {
      console.warn('handleSave updateTrackCover error:', err);
    }
    if (typeof onClose === 'function') {
      onClose();
    }
  };

  const handleOpenAddToPlaylist = () => {
    if (typeof onClose === 'function') {
      onClose();
    }
    if (track && openAddToPlaylist) {
      setTimeout(() => {
        openAddToPlaylist(track);
      }, CLOSE_MS + 50);
    }
  };

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.sheetContainer,
        { paddingBottom: Math.max(insets.bottom, spacing.md) + spacing.sm },
        sheetAnimatedStyle,
      ]}
    >
      <View style={styles.handleBar} />

      <View style={styles.headerRow}>
        <View style={styles.headerTextWrap}>
          <Text style={styles.headerSubtitle}>ŞARKI SEÇENEKLERİ</Text>
          <Text style={styles.headerTitle}>Şarkı Kapağını Düzenle</Text>
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

      <ScrollView
        style={styles.scrollArea}
        showsVerticalScrollIndicator={false}
        bounces={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.coverPreviewContainer}>
          <View style={styles.coverImageFrame}>
            <AlbumArtwork
              width={140}
              height={140}
              index={track?.trackNumber || 1}
              coverId={selectedCoverId}
              borderRadius={radius.lg}
            />
          </View>
          <Text style={styles.coverPreviewLabel}>Kapak Önizlemesi</Text>
        </View>

        <View style={styles.trackInfoBox}>
          <Text style={styles.trackTitle} numberOfLines={1}>
            {track?.title}
          </Text>
          <Text style={styles.trackArtist} numberOfLines={1}>
            {track?.artist || 'Bilinmeyen Sanatçı'}
          </Text>
        </View>

        <View style={styles.gradientOptionCard}>
          <View style={styles.gradientOptionLeft}>
            <View
              style={[
                styles.gradientOptionIconBox,
                isArtworkGradientEnabled && styles.gradientOptionIconBoxActive,
              ]}
            >
              <Sparkles
                size={18}
                color={isArtworkGradientEnabled ? colors.primaryContrast : colors.textPrimary}
                strokeWidth={2}
              />
            </View>
            <View style={styles.gradientOptionTextWrap}>
              <Text style={styles.gradientOptionTitle}>Kapak Rengi Gradyanı</Text>
              <Text style={styles.gradientOptionDesc}>
                Oynatıcı arka planına kapağın rengini yayar
              </Text>
            </View>
          </View>
          <Switch
            value={isArtworkGradientEnabled}
            onValueChange={toggleArtworkGradient}
            trackColor={{ false: colors.borderLight, true: colors.primary }}
            thumbColor={colors.primaryContrast}
          />
        </View>

        <View style={styles.coversSection}>
          <Text style={styles.sectionLabel}>KAPAK RESMİ SEÇİN</Text>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.coverOptionsRow}
          >
            <TouchableOpacity
              style={[
                styles.coverOptionCard,
                selectedCoverId === null && styles.coverOptionCardActive,
              ]}
              onPress={() => setSelectedCoverId(null)}
              activeOpacity={0.8}
            >
              <View style={[styles.coverThumbnail, styles.defaultThumbnail]}>
                <AlbumArtwork
                  width={66}
                  height={66}
                  index={track?.trackNumber || 1}
                  coverId={null}
                  borderRadius={radius.md}
                />
                {selectedCoverId === null && (
                  <View style={styles.selectedBadge}>
                    <Check size={12} color={colors.primaryContrast} strokeWidth={3} />
                  </View>
                )}
              </View>
            </TouchableOpacity>

            {ALL_COVERS.map((cover) => {
              const isSelected = selectedCoverId === cover.id;
              return (
                <TouchableOpacity
                  key={cover.id}
                  style={[
                    styles.coverOptionCard,
                    isSelected && styles.coverOptionCardActive,
                  ]}
                  onPress={() => setSelectedCoverId(cover.id)}
                  activeOpacity={0.8}
                >
                  <View style={styles.coverThumbnail}>
                    <Image
                      source={cover.source}
                      style={styles.coverThumbImage}
                      resizeMode="cover"
                    />
                    {isSelected && (
                      <View style={styles.selectedBadge}>
                        <Check size={12} color={colors.primaryContrast} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <TouchableOpacity
          style={styles.saveBtn}
          onPress={handleSave}
          activeOpacity={0.85}
        >
          <CheckCircle2 size={18} color={colors.primaryContrast} />
          <Text style={styles.saveBtnText}>Değişiklikleri Kaydet</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryActionBtn}
          onPress={handleOpenAddToPlaylist}
          activeOpacity={0.85}
        >
          <ListPlus size={18} color={colors.textPrimary} />
          <Text style={styles.secondaryActionBtnText}>Çalma Listesine Ekle</Text>
        </TouchableOpacity>
      </ScrollView>
    </Animated.View>
  );
};

export const EditSongModal = ({
  visible,
  track,
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
    translateY.value = withTiming(SCREEN_HEIGHT * 0.9, { duration: CLOSE_MS, easing: EASE_IN }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [onClose, translateY, backdropOpacity]);

  const backdropAnimStyle = useAnimatedStyle(() => ({
    opacity: backdropOpacity.value,
  }));

  if (!visible) return null;

  const content = (
    <Animated.View style={[styles.overlayRoot, backdropAnimStyle]}>
      <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

      {track ? (
        <EditSongContent
          key={`${track.id}-${visible}`}
          track={track}
          onClose={handleClose}
          insets={insets}
          translateY={translateY}
        />
      ) : null}
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
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
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
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 24,
    height: Math.round(SCREEN_HEIGHT * 0.82),
    maxHeight: Math.round(SCREEN_HEIGHT * 0.90),
  },
  handleBar: {
    width: 38,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderMuted,
    alignSelf: 'center',
    marginBottom: spacing.md,
    opacity: 0.7,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xl,
  },
  coverPreviewContainer: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  coverImageFrame: {
    width: 140,
    height: 140,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  coverPreviewLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  trackInfoBox: {
    alignItems: 'center',
    marginVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  trackTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    textAlign: 'center',
  },
  trackArtist: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  gradientOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.lg,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gradientOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
    gap: 12,
  },
  gradientOptionIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  gradientOptionIconBoxActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  gradientOptionTextWrap: {
    flex: 1,
  },
  gradientOptionTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  gradientOptionDesc: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  sectionLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  coversSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  coverOptionsRow: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  coverOptionCard: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  coverOptionCardActive: {
    transform: [{ scale: 1.04 }],
  },
  coverThumbnail: {
    width: 66,
    height: 66,
    borderRadius: radius.md,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    position: 'relative',
    backgroundColor: colors.backgroundSecondary,
  },
  defaultThumbnail: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  coverThumbImage: {
    width: '100%',
    height: '100%',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.textPrimary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 50,
    borderRadius: radius.full,
    gap: spacing.xs,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
    marginTop: spacing.sm,
  },
  saveBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.primaryContrast,
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.backgroundSecondary,
    height: 48,
    borderRadius: radius.full,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  secondaryActionBtnText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
});

export default EditSongModal;
