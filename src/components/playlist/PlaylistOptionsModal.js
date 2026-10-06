import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  Image,
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
import { Plus, Trash2, X, Pencil, ListMusic } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { getPlaylistCoverSource } from '../../constants/playlistCovers';

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

const OPEN_MS = 320;
const CLOSE_MS = 220;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

export const PlaylistOptionsModal = ({
  visible,
  playlist,
  onClose,
  onAddSongs,
  onEdit,
  onDelete,
  onToggleGradient,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT * 0.5);

  useEffect(() => {
    if (visible) {
      translateY.value = SCREEN_HEIGHT * 0.5;
      translateY.value = withTiming(0, { duration: OPEN_MS, easing: EASE_OUT });
    }
  }, [visible, translateY]);

  const handleClose = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(SCREEN_HEIGHT * 0.5, { duration: CLOSE_MS, easing: EASE_IN }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [onClose, translateY]);

  const handleEditPress = () => {
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(SCREEN_HEIGHT * 0.5, { duration: CLOSE_MS, easing: EASE_IN }, (finished) => {
      if (finished) {
        if (onEdit) {
          runOnJS(onEdit)();
        }
      }
    });
  };

  const handleAddSongsPress = () => {
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(SCREEN_HEIGHT * 0.5, { duration: CLOSE_MS, easing: EASE_IN }, (finished) => {
      if (finished) {
        runOnJS(onAddSongs)();
      }
    });
  };

  const handleDeletePress = () => {
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(SCREEN_HEIGHT * 0.5, { duration: CLOSE_MS, easing: EASE_IN }, (finished) => {
      if (finished) {
        runOnJS(onDelete)();
      }
    });
  };

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const coverSource = getPlaylistCoverSource(playlist?.coverId);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlayRoot}>
        <Pressable style={StyleSheet.absoluteFillObject} onPress={handleClose} />

        <Animated.View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, spacing.lg) + spacing.xs },
            sheetAnimatedStyle,
          ]}
        >
          <View style={styles.handleBar} />

          <View style={styles.headerRow}>
            <View style={styles.headerCoverWrap}>
              {coverSource ? (
                <Image source={coverSource} style={styles.headerCoverImage} resizeMode="cover" />
              ) : (
                <View style={styles.headerCoverFallback}>
                  <ListMusic size={20} color={colors.textSecondary} strokeWidth={1.8} />
                </View>
              )}
            </View>

            <View style={styles.headerTextWrap}>
              <Text style={styles.headerSubtitle}>ÇALMA LİSTESİ SEÇENEKLERİ</Text>
              <Text style={styles.playlistTitle} numberOfLines={1}>
                {playlist?.name || 'Çalma Listesi'}
              </Text>
              <Text style={styles.playlistCount}>
                {playlist ? `${playlist.trackIds.length} parça` : ''}
              </Text>
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

          <View style={styles.optionsList}>
            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={handleEditPress}
            >
              <View style={[styles.optionIconBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Pencil size={19} color={colors.textPrimary} strokeWidth={2} />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Düzenle</Text>
                <Text style={styles.optionDesc}>Çalma listesi adını ve kapak resmini değiştir</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={() => onToggleGradient?.(playlist)}
            >
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Kapak Rengi Gradyanı</Text>
                <Text style={styles.optionDesc}>Kapağın rengini ekranın üstünden aşağı yayar</Text>
              </View>
              <Switch
                value={Boolean(playlist?.isGradientEnabled)}
                onValueChange={() => onToggleGradient?.(playlist)}
                trackColor={{ false: colors.borderLight, true: colors.primary }}
                thumbColor={colors.card}
                ios_backgroundColor={colors.borderLight}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={handleAddSongsPress}
            >
              <View style={[styles.optionIconBox, { backgroundColor: colors.backgroundSecondary }]}>
                <Plus size={20} color={colors.textPrimary} strokeWidth={2.2} />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Şarkı Ekle</Text>
                <Text style={styles.optionDesc}>Kütüphaneden bu listeye müzik ekle veya çıkar</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionRow}
              activeOpacity={0.7}
              onPress={handleDeletePress}
            >
              <View style={[styles.optionIconBox, { backgroundColor: 'rgba(186, 26, 26, 0.09)' }]}>
                <Trash2 size={19} color={colors.error} strokeWidth={2} />
              </View>
              <View style={styles.optionTextWrap}>
                <Text style={[styles.optionTitle, { color: colors.error }]}>Çalma Listesini Sil</Text>
                <Text style={styles.optionDesc}>Bu çalma listesi kalıcı olarak silinir</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>
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
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  headerCoverWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginRight: spacing.md,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  headerCoverImage: {
    width: '100%',
    height: '100%',
  },
  headerCoverFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
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
  playlistTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    marginTop: 2,
  },
  playlistCount: {
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
  optionsList: {
    paddingVertical: spacing.sm,
    gap: spacing.xs,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    gap: spacing.md,
  },
  optionIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTextWrap: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  optionDesc: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default PlaylistOptionsModal;
