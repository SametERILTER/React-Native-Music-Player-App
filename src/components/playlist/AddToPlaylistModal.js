import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import { Plus, Check, ListMusic, X } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { usePlayer } from '../../context/PlayerContext';
import { useLanguage } from '../../context/LanguageContext';
import { getPlaylistCoverSource } from '../../constants/playlistCovers';

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

const OPEN_MS = 320;
const CLOSE_MS = 220;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

export const AddToPlaylistModal = ({ visible, track, onClose }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { playlists, createPlaylist, toggleTrackInPlaylist } = usePlayer();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const translateY = useSharedValue(SCREEN_HEIGHT * 0.6);

  useEffect(() => {
    if (visible) {
      translateY.value = SCREEN_HEIGHT * 0.6;
      translateY.value = withTiming(0, { duration: OPEN_MS, easing: EASE_OUT });
    }
  }, [visible, translateY]);

  const handleClose = useCallback(() => {
    setIsCreating(false);
    setNewPlaylistName('');
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(SCREEN_HEIGHT * 0.6, { duration: CLOSE_MS, easing: EASE_IN }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [onClose, translateY]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleCreate = () => {
    const trimmed = newPlaylistName.trim();
    if (trimmed && track) {
      const newPl = createPlaylist(trimmed);
      if (newPl) {
        toggleTrackInPlaylist(newPl.id, track.id);
      }
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlayRoot}>
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
        />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <Animated.View
            style={[
              styles.sheetContainer,
              { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xs },
              sheetAnimatedStyle,
            ]}
          >
            <View style={styles.handleBar} />

            <View style={styles.headerRow}>
              <View style={styles.headerTextWrap}>
                <Text style={styles.headerSubtitle}>{t('addToPlaylist.headerSubtitle')}</Text>
                <Text style={styles.trackTitle} numberOfLines={1}>
                  {track?.title || t('addToPlaylist.trackDefault')}
                </Text>
                {track?.artist ? (
                  <Text style={styles.trackArtist} numberOfLines={1}>
                    {track.artist}
                  </Text>
                ) : null}
              </View>

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            {isCreating ? (
              <View style={styles.createInputContainer}>
                <TextInput
                  style={styles.input}
                  placeholder={t('addToPlaylist.inputPlaceholder')}
                  placeholderTextColor={colors.textMuted}
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                  maxLength={40}
                  returnKeyType="done"
                  onSubmitEditing={handleCreate}
                />
                <View style={styles.createActionsRow}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => {
                      setIsCreating(false);
                      setNewPlaylistName('');
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>{t('addToPlaylist.cancel')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[
                      styles.addBtn,
                      !newPlaylistName.trim() && styles.addBtnDisabled,
                    ]}
                    onPress={handleCreate}
                    disabled={!newPlaylistName.trim()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addBtnText}>{t('addToPlaylist.create')}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.newPlaylistBtn}
                onPress={() => setIsCreating(true)}
                activeOpacity={0.7}
              >
                <View style={styles.newPlaylistIconBox}>
                  <Plus size={18} color={colors.primaryContrast} strokeWidth={2.4} />
                </View>
                <Text style={styles.newPlaylistBtnText}>{t('addToPlaylist.newPlaylistBtn')}</Text>
              </TouchableOpacity>
            )}

            <ScrollView
              style={styles.playlistsScroll}
              contentContainerStyle={styles.playlistsContent}
              showsVerticalScrollIndicator={false}
              bounces={false}
            >
              {playlists.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <View style={styles.emptyIconBox}>
                    <ListMusic size={26} color={colors.textMuted} />
                  </View>
                  <Text style={styles.emptyTitle}>{t('addToPlaylist.emptyTitle')}</Text>
                  <Text style={styles.emptyText}>
                    {t('addToPlaylist.emptyDesc')}
                  </Text>
                </View>
              ) : (
                playlists.map((pl) => {
                  const isAdded = track ? pl.trackIds.includes(track.id) : false;

                  return (
                    <TouchableOpacity
                      key={pl.id}
                      style={[
                        styles.playlistItem,
                        isAdded && styles.playlistItemAdded,
                      ]}
                      onPress={() => {
                        if (track) {
                          toggleTrackInPlaylist(pl.id, track.id);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <View style={styles.playlistLeft}>
                        <View
                          style={[
                            styles.playlistIconWrap,
                            isAdded && styles.playlistIconWrapActive,
                            getPlaylistCoverSource(pl.coverId) && styles.playlistIconWrapCover,
                          ]}
                        >
                          {getPlaylistCoverSource(pl.coverId) ? (
                            <Image
                              source={getPlaylistCoverSource(pl.coverId)}
                              style={styles.playlistThumbImage}
                              resizeMode="cover"
                            />
                          ) : (
                            <ListMusic
                              size={18}
                              color={isAdded ? colors.primaryContrast : colors.textPrimary}
                            />
                          )}
                        </View>
                        <View style={styles.playlistTextWrap}>
                          <Text style={styles.playlistName} numberOfLines={1}>
                            {pl.name}
                          </Text>
                          <Text style={styles.playlistCount}>
                            {t('addToPlaylist.songsCount', { count: pl.trackIds.length })}
                          </Text>
                        </View>
                      </View>

                      <View
                        style={[
                          styles.checkCircle,
                          isAdded && styles.checkCircleActive,
                        ]}
                      >
                        {isAdded && (
                          <Check
                            size={13}
                            color={colors.primaryContrast}
                            strokeWidth={2.6}
                          />
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </Animated.View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardWrap: {
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: SCREEN_HEIGHT * 0.78,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 20,
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
    marginRight: spacing.md,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  trackTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    marginTop: 2,
  },
  trackArtist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 1,
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
  newPlaylistBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  newPlaylistIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  newPlaylistBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  createInputContainer: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  input: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  createActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xxs,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  cancelBtnText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.xs,
    color: colors.primaryContrast,
  },
  playlistsScroll: {
    marginTop: spacing.xs,
  },
  playlistsContent: {
    paddingBottom: spacing.sm,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  playlistItemAdded: {
    backgroundColor: 'rgba(0, 0, 0, 0.035)',
  },
  playlistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  playlistIconWrap: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  playlistIconWrapCover: {
    backgroundColor: 'transparent',
  },
  playlistThumbImage: {
    width: '100%',
    height: '100%',
    borderRadius: radius.md,
  },
  playlistIconWrapActive: {
    backgroundColor: colors.primary,
  },
  playlistTextWrap: {
    flex: 1,
    paddingRight: spacing.xs,
  },
  playlistName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  playlistCount: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  emptyWrap: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  emptyIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
});

export default AddToPlaylistModal;
