import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
  TextInput,
  Image,
  ScrollView,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
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
  Check,
  ListMusic,
  CheckCircle2,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { PLAYLIST_COVERS, getPlaylistCoverSource } from '../../constants/playlistCovers';
import { useLanguage } from '../../context/LanguageContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

const OPEN_MS = 300;
const CLOSE_MS = 200;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

const EditPlaylistContent = ({
  playlist,
  onClose,
  onSave,
  insets,
  translateY,
}) => {
  const { t } = useLanguage();
  const [name, setName] = useState(playlist?.name || '');
  const [selectedCoverId, setSelectedCoverId] = useState(playlist?.coverId || null);
  const [coverPosition, setCoverPosition] = useState(playlist?.coverPosition || 'left');

  const handleClose = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: CLOSE_MS, easing: EASE_IN }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [onClose, translateY]);

  const handleSave = () => {
    const trimmed = name.trim();
    if (!trimmed) return;
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: CLOSE_MS, easing: EASE_IN }, (finished) => {
      if (finished) {
        runOnJS(onSave)({
          name: trimmed,
          coverId: selectedCoverId,
          coverPosition,
        });
      }
    });
  };

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const activeCoverSource = getPlaylistCoverSource(selectedCoverId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardWrap}
    >
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
            <Text style={styles.headerSubtitle}>{t('editPlaylist.headerSubtitle')}</Text>
            <Text style={styles.headerTitle}>{t('editPlaylist.headerTitle')}</Text>
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

        <ScrollView
          style={styles.scrollArea}
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View
            style={[
              styles.coverPreviewContainer,
              {
                alignItems:
                  coverPosition === 'center'
                    ? 'center'
                    : coverPosition === 'right'
                    ? 'flex-end'
                    : 'flex-start',
              },
            ]}
          >
            <View style={styles.coverImageFrame}>
              {activeCoverSource ? (
                <Image
                  source={activeCoverSource}
                  style={styles.coverPreviewImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.emptyCoverBox}>
                  <ListMusic size={40} color={colors.textMuted} strokeWidth={1.5} />
                  <Text style={styles.emptyCoverText}>{t('editPlaylist.noCover')}</Text>
                </View>
              )}
            </View>
            <Text style={styles.coverPreviewLabel}>{t('editPlaylist.coverPreview')}</Text>
          </View>

          <View style={styles.inputSection}>
            <Text style={styles.sectionLabel}>{t('editPlaylist.nameLabel')}</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.textInput}
                value={name}
                onChangeText={setName}
                placeholder={t('editPlaylist.namePlaceholder')}
                placeholderTextColor={colors.textTertiary}
                maxLength={40}
                autoCorrect={false}
                returnKeyType="done"
              />
              {name.length > 0 && (
                <TouchableOpacity
                  onPress={() => setName('')}
                  style={styles.clearBtn}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <X size={14} color={colors.textSecondary} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.positionSection}>
            <Text style={styles.sectionLabel}>{t('editPlaylist.positionLabel')}</Text>
            <View style={styles.positionRow}>
              {[
                { id: 'left', label: t('editPlaylist.posLeft'), Icon: AlignLeft },
                { id: 'center', label: t('editPlaylist.posCenter'), Icon: AlignCenter },
                { id: 'right', label: t('editPlaylist.posRight'), Icon: AlignRight },
              ].map(({ id, label, Icon }) => {
                const isSelected = coverPosition === id;
                return (
                  <TouchableOpacity
                    key={id}
                    style={[
                      styles.positionOption,
                      isSelected && styles.positionOptionActive,
                    ]}
                    onPress={() => setCoverPosition(id)}
                    activeOpacity={0.8}
                  >
                    <Icon
                      size={16}
                      color={isSelected ? colors.primaryContrast : colors.textSecondary}
                      strokeWidth={isSelected ? 2.4 : 1.8}
                    />
                    <Text
                      style={[
                        styles.positionText,
                        isSelected && styles.positionTextActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.coversSection}>
            <Text style={styles.sectionLabel}>{t('editPlaylist.selectCover')}</Text>

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
                  <ListMusic size={22} color={colors.textPrimary} strokeWidth={1.8} />
                  {selectedCoverId === null && (
                    <View style={styles.selectedBadge}>
                      <Check size={12} color={colors.primaryContrast} strokeWidth={3} />
                    </View>
                  )}
                </View>
              </TouchableOpacity>

              {PLAYLIST_COVERS.map((cover) => {
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
            style={[
              styles.saveBtn,
              !name.trim() && styles.saveBtnDisabled,
            ]}
            onPress={handleSave}
            disabled={!name.trim()}
            activeOpacity={0.85}
          >
            <CheckCircle2 size={18} color={colors.primaryContrast} />
            <Text style={styles.saveBtnText}>{t('editPlaylist.saveChanges')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

export const EditPlaylistModal = ({
  visible,
  playlist,
  onClose,
  onSave,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      translateY.value = SCREEN_HEIGHT;
      translateY.value = withTiming(0, { duration: OPEN_MS, easing: EASE_OUT });
    }
  }, [visible, translateY]);

  const handleClose = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: CLOSE_MS, easing: EASE_IN }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  }, [onClose, translateY]);

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

        {visible && playlist ? (
          <EditPlaylistContent
            key={`${playlist.id}-${visible}`}
            playlist={playlist}
            onClose={onClose}
            onSave={onSave}
            insets={insets}
            translateY={translateY}
          />
        ) : null}
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
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.18,
    shadowRadius: 18,
    elevation: 24,
    height: Math.round(SCREEN_HEIGHT * 0.92),
    maxHeight: Math.round(SCREEN_HEIGHT * 0.95),
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
    marginVertical: spacing.sm,
  },
  coverImageFrame: {
    width: 130,
    height: 130,
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
  coverPreviewImage: {
    width: '100%',
    height: '100%',
  },
  emptyCoverBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    gap: 4,
  },
  emptyCoverText: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: colors.textTertiary,
  },
  coverPreviewLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  inputSection: {
    marginTop: spacing.sm,
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
  },
  textInput: {
    flex: 1,
    height: 46,
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  clearBtn: {
    padding: 6,
    backgroundColor: colors.card,
    borderRadius: radius.full,
  },
  positionSection: {
    marginBottom: spacing.md,
  },
  positionRow: {
    flexDirection: 'row',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.md,
    padding: 4,
    gap: 6,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  positionOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: radius.sm,
    gap: 6,
  },
  positionOptionActive: {
    backgroundColor: colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.14,
    shadowRadius: 4,
    elevation: 2,
  },
  positionText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  positionTextActive: {
    fontFamily: typography.fonts.semiBold,
    color: colors.primaryContrast,
  },
  coversSection: {
    marginBottom: spacing.xl,
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
    marginBottom: spacing.md,
  },
  saveBtnDisabled: {
    opacity: 0.4,
  },
  saveBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.primaryContrast,
  },
});

export default EditPlaylistModal;
