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
} from 'react-native';
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

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

const OPEN_MS = 340;
const CLOSE_MS = 260;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

export const AddToPlaylistModal = ({ visible, track, onClose }) => {
  const { playlists, createPlaylist, toggleTrackInPlaylist } = usePlayer();
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [activeTrack, setActiveTrack] = useState(track);

  const translateY = useSharedValue(SCREEN_HEIGHT);
  const overlayOpacity = useSharedValue(0);

  useEffect(() => {
    if (track) {
      setActiveTrack(track);
    }
  }, [track]);

  useEffect(() => {
    if (visible) {
      translateY.value = SCREEN_HEIGHT;
      overlayOpacity.value = 0;
      translateY.value = withTiming(0, { duration: OPEN_MS, easing: EASE_OUT });
      overlayOpacity.value = withTiming(1, { duration: OPEN_MS, easing: EASE_OUT });
    }
  }, [visible]);

  const handleClose = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: CLOSE_MS, easing: EASE_IN });
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: CLOSE_MS, easing: EASE_IN }, (finished) => {
      if (finished) runOnJS(onClose)();
    });
  }, [onClose]);

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const overlayStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const currentDisplayTrack = track || activeTrack;

  const handleCreate = () => {
    if (newPlaylistName.trim() && currentDisplayTrack) {
      const newPl = createPlaylist(newPlaylistName);
      if (newPl) toggleTrackInPlaylist(newPl.id, currentDisplayTrack.id);
      setNewPlaylistName('');
      setIsCreating(false);
    }
  };

  if (!visible && !activeTrack) return null;
  if (!currentDisplayTrack) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.root}>
        {/* Yumuşak kararan animated koyu arka plan (overlay) */}
        <Animated.View
          style={[StyleSheet.absoluteFillObject, styles.overlay, overlayStyle]}
        />
        <Pressable
          style={StyleSheet.absoluteFillObject}
          onPress={handleClose}
        />

        {/* Bottom Sheet */}
        <Animated.View style={[styles.sheetContainer, sheetStyle]}>

          {/* Tutamaç çizgisi */}
          <View style={styles.handleBar} />

          {/* Başlık & Kapat */}
          <View style={styles.headerRow}>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerSubtitle}>LİSTEYE EKLE</Text>
              <Text style={styles.trackTitle} numberOfLines={1}>
                {currentDisplayTrack.title}
              </Text>
            </View>

            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              activeOpacity={0.7}
            >
              <X size={18} color={colors.textPrimary} />
            </TouchableOpacity>
          </View>

          {/* Yeni Liste Oluşturma */}
          {isCreating ? (
            <View style={styles.createInputRow}>
              <TextInput
                style={styles.input}
                placeholder="Liste adı yazın..."
                placeholderTextColor={colors.textMuted}
                value={newPlaylistName}
                onChangeText={setNewPlaylistName}
                autoFocus
              />
              <TouchableOpacity
                style={styles.addBtn}
                onPress={handleCreate}
                activeOpacity={0.8}
              >
                <Text style={styles.addBtnText}>Oluştur</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.newPlaylistBtn}
              onPress={() => setIsCreating(true)}
              activeOpacity={0.7}
            >
              <View style={styles.newPlaylistIconBox}>
                <Plus size={18} color={colors.primaryContrast} />
              </View>
              <Text style={styles.newPlaylistBtnText}>Yeni Çalma Listesi Oluştur</Text>
            </TouchableOpacity>
          )}

          {/* Çalma Listeleri */}
          <ScrollView
            style={styles.playlistsScroll}
            showsVerticalScrollIndicator={false}
          >
            {playlists.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>Henüz çalma listesi bulunmuyor.</Text>
              </View>
            ) : (
              playlists.map((pl) => {
                const isAdded = currentDisplayTrack ? pl.trackIds.includes(currentDisplayTrack.id) : false;
                return (
                  <TouchableOpacity
                    key={pl.id}
                    style={[
                      styles.playlistItem,
                      isAdded && styles.playlistItemAdded,
                    ]}
                    onPress={() => currentDisplayTrack && toggleTrackInPlaylist(pl.id, currentDisplayTrack.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.playlistLeft}>
                      <View style={styles.playlistIconWrap}>
                        <ListMusic size={18} color={colors.textPrimary} />
                      </View>
                      <View>
                        <Text style={styles.playlistName}>{pl.name}</Text>
                        <Text style={styles.playlistCount}>
                          {pl.trackIds.length} parça
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
                        <Check size={14} color={colors.primaryContrast} strokeWidth={2.5} />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    paddingBottom: spacing.xxl,
    maxHeight: '88%',
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: radius.full,
    backgroundColor: colors.borderMuted,
    alignSelf: 'center',
    marginBottom: spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.06)',
  },
  headerTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  headerSubtitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.xxs,
    color: colors.textMuted,
    letterSpacing: typography.letterSpacing.wider,
  },
  trackTitle: {
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
  createInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginVertical: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  addBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: radius.full,
  },
  addBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.xs,
    color: colors.primaryContrast,
  },
  playlistsScroll: {
    marginTop: spacing.xs,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    marginBottom: 4,
  },
  playlistItemAdded: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
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
  },
  emptyText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});

export default AddToPlaylistModal;
