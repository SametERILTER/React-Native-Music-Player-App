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
  Alert,
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
  ListPlus,
  Folder,
  Trash2,
  ChevronRight,
  ChevronLeft,
  X,
  Plus,
  Check,
  ListMusic,
  Info,
  Clock,
  HardDrive,
  FileText,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { usePlayer } from '../../context/PlayerContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatTime } from '../../services/musicService';
import AlbumArtwork from '../home/AlbumArtwork';

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

const OPEN_MS = 320;
const CLOSE_MS = 220;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

export const SongOptionsModal = ({ visible, track, onClose }) => {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const {
    playlists,
    createPlaylist,
    toggleTrackInPlaylist,
    deleteTrack,
  } = usePlayer();

  const [viewMode, setViewMode] = useState('options');
  const [isCreating, setIsCreating] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const translateY = useSharedValue(SCREEN_HEIGHT * 0.85);

  useEffect(() => {
    if (visible) {
      translateY.value = SCREEN_HEIGHT * 0.85;
      translateY.value = withTiming(0, { duration: OPEN_MS, easing: EASE_OUT });
    }
  }, [visible, translateY]);

  const handleClose = useCallback(() => {
    setIsCreating(false);
    setNewPlaylistName('');
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(SCREEN_HEIGHT * 0.85, { duration: CLOSE_MS, easing: EASE_IN }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
        runOnJS(setViewMode)('options');
      }
    });
  }, [onClose, translateY]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const handleCreatePlaylist = () => {
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

  const handleDeleteSong = () => {
    if (!track) return;
    Alert.alert(
      t('songOptions.deleteAlertTitle'),
      t('songOptions.deleteAlertMsg', { title: track.title }),
      [
        { text: t('songOptions.cancel'), style: 'cancel' },
        {
          text: t('songOptions.delete'),
          style: 'destructive',
          onPress: () => {
            if (deleteTrack) {
              deleteTrack(track.id);
            }
            handleClose();
          },
        },
      ]
    );
  };

  if (!track) return null;

  const rawUri = track.uri || '';
  const decodedUri = decodeURIComponent(rawUri);
  let fileExt = t('common.unknown');
  if (decodedUri.includes('.')) {
    const ext = decodedUri.split('.').pop().split('?')[0].toUpperCase();
    if (ext.length <= 5) {
      fileExt = ext;
    }
  }

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
              {viewMode !== 'options' ? (
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={() => setViewMode('options')}
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <ChevronLeft size={20} color={colors.textPrimary} />
                  <Text style={styles.backText}>{t('songOptions.options')}</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.trackInfoRow}>
                  <AlbumArtwork size={42} index={track.trackNumber || 1} coverId={track?.coverId} />
                  <View style={styles.trackTexts}>
                    <Text style={styles.trackTitle} numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text style={styles.trackArtist} numberOfLines={1}>
                      {track.artist || t('songOptions.unknownArtist')} • {formatTime(track.duration || 0)}
                    </Text>
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={styles.closeBtn}
                onPress={handleClose}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={18} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            {viewMode === 'options' && (
              <View style={styles.optionsList}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => setViewMode('playlists')}
                  activeOpacity={0.65}
                >
                  <View style={styles.optionIconContainer}>
                    <ListPlus size={20} color={colors.textPrimary} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{t('songOptions.addToPlaylist')}</Text>
                    <Text style={styles.optionDesc}>
                      {t('songOptions.addToPlaylistDesc')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => setViewMode('path')}
                  activeOpacity={0.65}
                >
                  <View style={styles.optionIconContainer}>
                    <Folder size={20} color={colors.textPrimary} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={styles.optionTitle}>{t('songOptions.viewPath')}</Text>
                    <Text style={styles.optionDesc}>
                      {t('songOptions.viewPathDesc')}
                    </Text>
                  </View>
                  <ChevronRight size={18} color={colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.optionItem, styles.deleteOptionItem]}
                  onPress={handleDeleteSong}
                  activeOpacity={0.65}
                >
                  <View style={[styles.optionIconContainer, styles.deleteIconContainer]}>
                    <Trash2 size={20} color={colors.error || '#D9534F'} />
                  </View>
                  <View style={styles.optionContent}>
                    <Text style={[styles.optionTitle, styles.deleteOptionTitle]}>
                      {t('songOptions.deleteSong')}
                    </Text>
                    <Text style={styles.optionDesc}>
                      {t('songOptions.deleteSongDesc')}
                    </Text>
                  </View>
                </TouchableOpacity>
              </View>
            )}

            {viewMode === 'playlists' && (
              <View style={styles.subViewContainer}>
                <View style={styles.subViewHeader}>
                  <Text style={styles.subViewTitle}>{t('songOptions.playlistsTitle')}</Text>
                  <Text style={styles.subViewSubtitle}>
                    {t('songOptions.playlistsSubtitle')}
                  </Text>
                </View>

                {!isCreating ? (
                  <TouchableOpacity
                    style={styles.createBtn}
                    onPress={() => setIsCreating(true)}
                    activeOpacity={0.7}
                  >
                    <Plus size={16} color={colors.textPrimary} />
                    <Text style={styles.createBtnText}>{t('songOptions.newPlaylistBtn')}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.createInputContainer}>
                    <TextInput
                      style={styles.createInput}
                      placeholder={t('songOptions.newPlaylistPlaceholder')}
                      placeholderTextColor={colors.textTertiary}
                      value={newPlaylistName}
                      onChangeText={setNewPlaylistName}
                      autoFocus
                      onSubmitEditing={handleCreatePlaylist}
                      returnKeyType="done"
                    />
                    <TouchableOpacity
                      style={[
                        styles.createConfirmBtn,
                        !newPlaylistName.trim() && styles.createConfirmBtnDisabled,
                      ]}
                      onPress={handleCreatePlaylist}
                      disabled={!newPlaylistName.trim()}
                    >
                      <Text style={styles.createConfirmText}>{t('songOptions.add')}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.createCancelBtn}
                      onPress={() => {
                        setIsCreating(false);
                        setNewPlaylistName('');
                      }}
                    >
                      <X size={16} color={colors.textSecondary} />
                    </TouchableOpacity>
                  </View>
                )}

                <ScrollView
                  style={styles.playlistsScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  {playlists.length === 0 ? (
                    <View style={styles.emptyWrap}>
                      <ListMusic size={32} color={colors.textTertiary} />
                      <Text style={styles.emptyText}>{t('songOptions.emptyPlaylists')}</Text>
                      <Text style={styles.emptySubtext}>
                        {t('songOptions.emptyPlaylistsSub')}
                      </Text>
                    </View>
                  ) : (
                    playlists.map((pl) => {
                      const isInPlaylist = pl.trackIds.includes(track.id);
                      return (
                        <TouchableOpacity
                          key={pl.id}
                          style={[
                            styles.playlistRow,
                            isInPlaylist && styles.playlistRowActive,
                          ]}
                          onPress={() => toggleTrackInPlaylist(pl.id, track.id)}
                          activeOpacity={0.7}
                        >
                          <View style={styles.playlistRowLeft}>
                            <View
                              style={[
                                styles.playlistIconBox,
                                isInPlaylist && styles.playlistIconBoxActive,
                              ]}
                            >
                              <ListMusic
                                size={18}
                                color={isInPlaylist ? colors.primaryText || '#FFFFFF' : colors.textPrimary}
                              />
                            </View>
                            <View style={styles.playlistTexts}>
                              <Text style={styles.playlistName} numberOfLines={1}>
                                {pl.name}
                              </Text>
                              <Text style={styles.playlistCount}>
                                {t('songOptions.songsCount', { count: pl.trackIds.length })}
                              </Text>
                            </View>
                          </View>

                          <View
                            style={[
                              styles.checkbox,
                              isInPlaylist && styles.checkboxActive,
                            ]}
                          >
                            {isInPlaylist && (
                              <Check
                                size={14}
                                color={colors.primaryText || '#FFFFFF'}
                                strokeWidth={3}
                              />
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })
                  )}
                </ScrollView>
              </View>
            )}

            {viewMode === 'path' && (
              <ScrollView
                style={styles.subViewContainer}
                showsVerticalScrollIndicator={false}
              >
                <View style={styles.subViewHeader}>
                  <Text style={styles.subViewTitle}>{t('songOptions.filePathTitle')}</Text>
                  <Text style={styles.subViewSubtitle}>
                    {t('songOptions.filePathSubtitle')}
                  </Text>
                </View>

                <View style={styles.pathCard}>
                  <View style={styles.pathCardHeader}>
                    <HardDrive size={15} color={colors.textSecondary} />
                    <Text style={styles.pathCardLabel}>{t('songOptions.filePathLabel')}</Text>
                  </View>
                  <Text style={styles.pathValue} selectable={true}>
                    {decodedUri || t('songOptions.noFilePath')}
                  </Text>
                </View>

                <View style={styles.detailsCard}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelWrap}>
                      <FileText size={15} color={colors.textSecondary} />
                      <Text style={styles.detailLabel}>{t('songOptions.formatLabel')}</Text>
                    </View>
                    <Text style={styles.detailValue}>{fileExt} {t('songOptions.fileSuffix')}</Text>
                  </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelWrap}>
                      <Clock size={15} color={colors.textSecondary} />
                      <Text style={styles.detailLabel}>{t('songOptions.durationLabel')}</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {formatTime(track.duration || 0)} ({track.duration || 0} {t('songOptions.secSuffix')})
                    </Text>
                  </View>

                  <View style={styles.detailDivider} />

                  <View style={styles.detailRow}>
                    <View style={styles.detailLabelWrap}>
                      <Info size={15} color={colors.textSecondary} />
                      <Text style={styles.detailLabel}>{t('songOptions.storageLabel')}</Text>
                    </View>
                    <Text style={styles.detailValue}>
                      {track.isLocal ? t('songOptions.localFile') : t('songOptions.onlineDemo')}
                    </Text>
                  </View>

                  {track.album && (
                    <>
                      <View style={styles.detailDivider} />
                      <View style={styles.detailRow}>
                        <View style={styles.detailLabelWrap}>
                          <ListMusic size={15} color={colors.textSecondary} />
                          <Text style={styles.detailLabel}>{t('songOptions.albumLabel')}</Text>
                        </View>
                        <Text style={styles.detailValue} numberOfLines={1}>
                          {track.album}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </ScrollView>
            )}
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
    width: '100%',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    minHeight: Math.round(SCREEN_HEIGHT * 0.52),
    maxHeight: Math.round(SCREEN_HEIGHT * 0.88),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 20,
      },
    }),
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignSelf: 'center',
    marginBottom: spacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  trackTexts: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  trackTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  trackArtist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  backText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    marginLeft: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsList: {
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
  },
  deleteOptionItem: {
    borderBottomWidth: 0,
    marginTop: 2,
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  deleteIconContainer: {
    backgroundColor: 'rgba(217, 83, 79, 0.08)',
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  deleteOptionTitle: {
    fontFamily: typography.fonts.semiBold,
    color: colors.error || '#D9534F',
  },
  optionDesc: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 3,
  },
  subViewContainer: {
    paddingTop: spacing.md,
    flex: 1,
  },
  subViewHeader: {
    marginBottom: spacing.md,
  },
  subViewTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  subViewSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 3,
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderRadius: radius.md,
    paddingVertical: spacing.sm + 4,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
    marginBottom: spacing.md,
  },
  createBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
  },
  createInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  createInput: {
    flex: 1,
    height: 44,
    backgroundColor: 'rgba(0,0,0,0.03)',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  createConfirmBtn: {
    backgroundColor: colors.textPrimary,
    paddingHorizontal: spacing.md,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.xs,
  },
  createConfirmBtnDisabled: {
    opacity: 0.4,
  },
  createConfirmText: {
    fontFamily: typography.fonts.semiBold,
    color: '#FFFFFF',
    fontSize: typography.sizes.sm,
  },
  createCancelBtn: {
    width: 36,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  playlistsScroll: {
    maxHeight: Math.round(SCREEN_HEIGHT * 0.44),
  },
  playlistRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    marginBottom: 6,
    backgroundColor: 'transparent',
  },
  playlistRowActive: {
    backgroundColor: 'rgba(0,0,0,0.035)',
  },
  playlistRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  playlistIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  playlistIconBoxActive: {
    backgroundColor: colors.textPrimary,
  },
  playlistTexts: {
    flex: 1,
  },
  playlistName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  playlistCount: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxActive: {
    backgroundColor: colors.textPrimary,
    borderColor: colors.textPrimary,
  },
  emptyWrap: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.sm,
  },
  emptySubtext: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 4,
    textAlign: 'center',
  },
  pathCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.025)',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  pathCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  pathCardLabel: {
    fontFamily: typography.fonts.bold,
    fontSize: 11,
    color: colors.textSecondary,
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  pathValue: {
    fontFamily: typography.fonts.regular,
    fontSize: 13,
    color: colors.textPrimary,
    lineHeight: 19,
    backgroundColor: '#FFFFFF',
    padding: spacing.md,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  detailLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  detailValue: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  detailDivider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.04)',
    marginVertical: 4,
  },
});

export default SongOptionsModal;
