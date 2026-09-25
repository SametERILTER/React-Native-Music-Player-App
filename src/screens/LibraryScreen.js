import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Play,
  Shuffle,
  Trash2,
  ChevronLeft,
  ListMusic,
  Music2,
  X,
  RefreshCw,
  HardDrive,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import SongItem from '../components/home/SongItem';
import MiniPlayer from '../components/player/MiniPlayer';
import FullPlayerModal from '../components/player/FullPlayerModal';
import AddToPlaylistModal from '../components/playlist/AddToPlaylistModal';

export const LibraryScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    favorites,
    isScanningDevice,
    deviceTrackCount,
    scanDeviceTracks,
    playTrack,
    toggleFavorite,
    createPlaylist,
    deletePlaylist,
    onScrollForPlayer,
  } = usePlayer();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [playlistTargetTrack, setPlaylistTargetTrack] = useState(null);

  const isFocused = useIsFocused();
  const [animScale] = useState(() => new Animated.Value(0));
  const [animOpacity] = useState(() => new Animated.Value(0));
  const [pressScale] = useState(() => new Animated.Value(1));

  const targetFabBottom = currentTrack
    ? Math.max(insets.bottom, 16) + 64 + 68
    : Math.max(insets.bottom, 16) + 64 + 14;

  useEffect(() => {
    if (isFocused && !selectedPlaylistId) {
      Animated.parallel([
        Animated.spring(animScale, {
          toValue: 1,
          friction: 6,
          tension: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(animScale, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isFocused, selectedPlaylistId]);

  const [detailOpacity] = useState(() => new Animated.Value(0));
  const [detailTranslateY] = useState(() => new Animated.Value(24));

  useEffect(() => {
    if (selectedPlaylistId) {
      detailOpacity.setValue(0);
      detailTranslateY.setValue(24);
      Animated.parallel([
        Animated.timing(detailOpacity, {
          toValue: 1,
          duration: 260,
          useNativeDriver: true,
        }),
        Animated.timing(detailTranslateY, {
          toValue: 0,
          duration: 260,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [selectedPlaylistId]);

  const handleBackToPlaylists = () => {
    Animated.parallel([
      Animated.timing(detailOpacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.timing(detailTranslateY, {
        toValue: 16,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedPlaylistId(null);
    });
  };

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + spacing.sm;
  const bottomPadding = 220;

  // Seçili çalma listesi nesnesi
  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  // Seçili çalma listesindeki şarkı nesneleri
  const activePlaylistTracks = activePlaylist
    ? tracks.filter((t) => activePlaylist.trackIds.includes(t.id))
    : [];

  const handleCreatePlaylist = () => {
    if (newPlaylistName.trim()) {
      const created = createPlaylist(newPlaylistName);
      setNewPlaylistName('');
      setIsCreateModalVisible(false);
      if (created) {
        setSelectedPlaylistId(created.id);
      }
    }
  };

  const handlePlayPlaylist = (plTracks, shouldShuffle = false) => {
    if (plTracks && plTracks.length > 0) {
      if (shouldShuffle) {
        const randomIndex = Math.floor(Math.random() * plTracks.length);
        playTrack(plTracks[randomIndex]);
      } else {
        playTrack(plTracks[0]);
      }
    }
  };

  const handleDeletePlaylist = (playlistId) => {
    deletePlaylist(playlistId);
    if (selectedPlaylistId === playlistId) {
      setSelectedPlaylistId(null);
    }
  };

  // --- Çalma Listesi Detay Görünümü ---
  if (selectedPlaylistId && activePlaylist) {
        return (
          <Animated.View style={[styles.mainWrapper, { opacity: detailOpacity, transform: [{ translateY: detailTranslateY }] }]}>
            <FlatList
              data={activePlaylistTracks}
              keyExtractor={(item) => item.id.toString()}
              onScroll={onScrollForPlayer}
              scrollEventThrottle={16}
              initialNumToRender={8}
              maxToRenderPerBatch={8}
              windowSize={5}
              removeClippedSubviews={Platform.OS === 'android'}
              ListHeaderComponent={
                <View style={styles.detailHeaderContainer}>
                  {/* Geri Butonu */}
                  <TouchableOpacity
                    style={styles.backBtn}
                    onPress={handleBackToPlaylists}
                    activeOpacity={0.7}
                  >
                    <ChevronLeft size={20} color={colors.textPrimary} />
                    <Text style={styles.backBtnText}>Çalma Listeleri</Text>
                  </TouchableOpacity>

                  {/* Liste Başlığı & Bilgisi */}
                  <View style={styles.detailTitleWrap}>
                    <Text style={styles.detailTitle}>{activePlaylist.name}</Text>
                    <Text style={styles.detailSubtitle}>
                      {activePlaylistTracks.length} Parça
                    </Text>
                  </View>

                  {/* Hızlı Butonlar: Çal, Karıştır, Sil */}
                  <View style={styles.detailActionsRow}>
                    <TouchableOpacity
                      style={[
                        styles.primaryActionBtn,
                        activePlaylistTracks.length === 0 && styles.disabledBtn,
                      ]}
                      onPress={() => handlePlayPlaylist(activePlaylistTracks, false)}
                      disabled={activePlaylistTracks.length === 0}
                      activeOpacity={0.8}
                    >
                      <Play size={15} color={colors.primaryContrast} fill={colors.primaryContrast} />
                      <Text style={styles.primaryActionBtnText}>Tümünü Çal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.secondaryActionBtn,
                        activePlaylistTracks.length === 0 && styles.disabledBtn,
                      ]}
                      onPress={() => handlePlayPlaylist(activePlaylistTracks, true)}
                      disabled={activePlaylistTracks.length === 0}
                      activeOpacity={0.8}
                    >
                      <Shuffle size={15} color={colors.textPrimary} />
                      <Text style={styles.secondaryActionBtnText}>Karıştır</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.deleteActionBtn}
                      onPress={() => handleDeletePlaylist(activePlaylist.id)}
                      activeOpacity={0.7}
                    >
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>
              }
              renderItem={({ item, index }) => (
                <View style={styles.songItemWrapper}>
                  <SongItem
                    track={item}
                    index={index}
                    isCurrent={currentTrack?.id === item.id}
                    isPlaying={isPlaying}
                    isFavorite={favorites.includes(item.id)}
                    onPress={playTrack}
                    onToggleFavorite={toggleFavorite}
                    onOpenPlaylistModal={(track) => setPlaylistTargetTrack(track)}
                  />
                </View>
              )}
              contentContainerStyle={[
                styles.listContent,
                { paddingTop: topPadding, paddingBottom: bottomPadding }
              ]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Music2 size={32} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>Bu Liste Henüz Boş</Text>
                  <Text style={styles.emptyDesc}>
                    Ana sayfadaki şarkıların yanındaki (⋮) simgesine dokunarak bu listeye müzik ekleyebilirsin.
                  </Text>
                </View>
              }
            />

            {/* Üst Gradient */}
            <LinearGradient
              colors={[
                colors.background,
                'rgba(243, 243, 243, 0.85)',
                'rgba(243, 243, 243, 0)',
              ]}
              locations={[0, 0.5, 1]}
              style={[styles.gradientTop, { height: topPadding + 16 }]}
              pointerEvents="none"
            />

            {/* Mini Player */}
            <MiniPlayer onOpenFullPlayer={() => setIsPlayerModalVisible(true)} />

            {/* Full Player Modal */}
            <FullPlayerModal
              visible={isPlayerModalVisible}
              onClose={() => setIsPlayerModalVisible(false)}
            />

            {/* Şarkıyı Başka Listeye Ekleme Modalı */}
            <AddToPlaylistModal
              visible={!!playlistTargetTrack}
              track={playlistTargetTrack}
              onClose={() => setPlaylistTargetTrack(null)}
            />
          </Animated.View>
        );
      }

      // --- Ana Çalma Listeleri Listesi Görünümü ---
      return (
        <Animated.View style={[styles.mainWrapper, { opacity: animOpacity }]}>
          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            onScroll={onScrollForPlayer}
            scrollEventThrottle={16}
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            windowSize={5}
            removeClippedSubviews={Platform.OS === 'android'}
            ListHeaderComponent={
              <View style={styles.headerContainer}>
                <View style={styles.customHeader}>
                  <Text style={styles.screenTitle}>Kitaplık</Text>
                  
                  <TouchableOpacity
                    style={styles.scanDeviceHeaderBtn}
                    onPress={() => scanDeviceTracks(true)}
                    disabled={isScanningDevice}
                    activeOpacity={0.7}
                  >
                    {isScanningDevice ? (
                      <ActivityIndicator size="small" color={colors.textPrimary} />
                    ) : (
                      <>
                        <RefreshCw size={14} color={colors.textPrimary} />
                        <Text style={styles.scanDeviceBtnText}>Cihazı Tara</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            }
            renderItem={({ item }) => {
              const playlistTracks = tracks.filter((t) => item.trackIds.includes(t.id));
              return (
                <View style={styles.playlistCardWrapper}>
                  <TouchableOpacity
                    style={styles.playlistCard}
                    onPress={() => setSelectedPlaylistId(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.playlistCardLeft}>
                      <View style={styles.playlistCardIconBox}>
                        <ListMusic size={22} color={colors.textPrimary} strokeWidth={1.8} />
                      </View>

                      <View style={styles.playlistCardTextWrap}>
                        <Text style={styles.playlistCardTitle} numberOfLines={1}>
                          {item.name}
                        </Text>
                        <Text style={styles.playlistCardCount}>
                          {item.trackIds.length} Parça
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.playlistCardPlayBtn,
                        playlistTracks.length === 0 && styles.disabledPlayBtn,
                      ]}
                      onPress={() => handlePlayPlaylist(playlistTracks, false)}
                      disabled={playlistTracks.length === 0}
                      activeOpacity={0.8}
                    >
                      <Play size={14} color={colors.primaryContrast} fill={colors.primaryContrast} style={{ marginLeft: 2 }} />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </View>
              );
            }}
            contentContainerStyle={[
              styles.listContent,
              { paddingTop: topPadding, paddingBottom: bottomPadding }
            ]}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <ListMusic size={36} color={colors.textTertiary} />
                <Text style={styles.emptyTitle}>Çalma Listesi Yok</Text>
                <Text style={styles.emptyDesc}>
                  Sağ alttaki (+) butonuna dokunarak yeni çalma listesi oluşturabilirsin.
                </Text>
              </View>
            }
          />

          {/* Ekranın En Üstündeki Yumuşak Kaybolma Gradienti */}
          <LinearGradient
            colors={[
              colors.background,
              'rgba(243, 243, 243, 0.85)',
              'rgba(243, 243, 243, 0)',
            ]}
            locations={[0, 0.5, 1]}
            style={[styles.gradientTop, { height: topPadding + 16 }]}
            pointerEvents="none"
          />

          {/* Native Driver Animated FAB: Music Player'ın üstünde sağda yuvarlak + ikonu */}
          <Animated.View
            style={[
              styles.fabContainer,
              {
                bottom: targetFabBottom,
                opacity: animOpacity,
                transform: [
                  { scale: Animated.multiply(animScale, pressScale) },
                ],
              },
            ]}
            pointerEvents="box-none"
          >
            <TouchableOpacity
              style={styles.fabButton}
              activeOpacity={0.9}
              onPressIn={() => {
                Animated.spring(pressScale, {
                  toValue: 0.88,
                  friction: 5,
                  tension: 150,
                  useNativeDriver: true,
                }).start();
              }}
              onPressOut={() => {
                Animated.spring(pressScale, {
                  toValue: 1,
                  friction: 5,
                  tension: 150,
                  useNativeDriver: true,
                }).start();
              }}
              onPress={() => setIsCreateModalVisible(true)}
            >
              <Plus size={22} color={colors.primaryContrast} strokeWidth={2.4} />
            </TouchableOpacity>
          </Animated.View>

          {/* Mini Player */}
          <MiniPlayer onOpenFullPlayer={() => setIsPlayerModalVisible(true)} />

          {/* Full Player Modal */}
          <FullPlayerModal
            visible={isPlayerModalVisible}
            onClose={() => setIsPlayerModalVisible(false)}
          />

          {/* Yeni Çalma Listesi Oluşturma Modalı */}
          <Modal
            visible={isCreateModalVisible}
            transparent
            animationType="fade"
            statusBarTranslucent
            onRequestClose={() => setIsCreateModalVisible(false)}
          >
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setIsCreateModalVisible(false)}
            >
              <TouchableOpacity activeOpacity={1} style={styles.modalCard} onPress={() => { }}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Yeni Çalma Listesi</Text>
                  <TouchableOpacity
                    onPress={() => setIsCreateModalVisible(false)}
                    activeOpacity={0.7}
                  >
                    <X size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>

                <TextInput
                  style={styles.modalInput}
                  placeholder="Liste adını girin..."
                  placeholderTextColor={colors.textMuted}
                  value={newPlaylistName}
                  onChangeText={setNewPlaylistName}
                  autoFocus
                />

                <View style={styles.modalButtonsRow}>
                  <TouchableOpacity
                    style={styles.modalCancelBtn}
                    onPress={() => {
                      setNewPlaylistName('');
                      setIsCreateModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.modalCancelBtnText}>İptal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalSaveBtn}
                    onPress={handleCreatePlaylist}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.modalSaveBtnText}>Oluştur</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </Animated.View>
      );
    };

    const styles = StyleSheet.create({
      mainWrapper: {
        flex: 1,
        backgroundColor: colors.background,
      },
      gradientTop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 10,
      },
      fabContainer: {
        position: 'absolute',
        right: 20,
        zIndex: 35,
      },
      fabButton: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        elevation: 4,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      listContent: {
        // Dinamik paddingTop ve paddingBottom ile desteklenir
      },
      headerContainer: {
        paddingBottom: spacing.sm,
      },
      customHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: spacing.lg,
        paddingTop: spacing.xs,
        paddingBottom: spacing.sm,
      },
      screenTitle: {
        fontFamily: typography.fonts.headerBold,
        fontSize: typography.sizes.display,
        color: colors.headerTitle,
        letterSpacing: typography.letterSpacing.tight,
      },
      scanDeviceHeaderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: radius.full,
        gap: 6,
      },
      scanDeviceBtnText: {
        fontFamily: typography.fonts.medium,
        fontSize: typography.sizes.xs,
        color: colors.textPrimary,
      },
      playlistCardWrapper: {
        paddingHorizontal: spacing.lg,
        marginBottom: spacing.xs + 2,
      },
      playlistCard: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: colors.card,
        paddingVertical: 12,
        paddingHorizontal: 14,
        borderRadius: radius.lg,
        elevation: 1.2,
        shadowRadius: 8,
        shadowOpacity: 0.06,
        shadowColor: 'rgba(176, 176, 176, 0.4)',
      },
      playlistCardLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: spacing.sm + 2,
      },
      playlistCardIconBox: {
        width: 44,
        height: 44,
        borderRadius: radius.md,
        backgroundColor: colors.backgroundSecondary,
        justifyContent: 'center',
        alignItems: 'center',
      },
      playlistCardTextWrap: {
        flex: 1,
      },
      playlistCardTitle: {
        fontFamily: typography.fonts.semiBold,
        fontSize: typography.sizes.base,
        color: colors.textPrimary,
        letterSpacing: typography.letterSpacing.tight,
      },
      playlistCardCount: {
        fontFamily: typography.fonts.regular,
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
        marginTop: 2,
      },
      playlistCardPlayBtn: {
        width: 34,
        height: 34,
        borderRadius: radius.full,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
      },
      disabledPlayBtn: {
        opacity: 0.3,
      },
      songItemWrapper: {
        paddingHorizontal: spacing.sm,
      },
      detailHeaderContainer: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.md,
      },
      backBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: spacing.sm,
        gap: 2,
      },
      backBtnText: {
        fontFamily: typography.fonts.medium,
        fontSize: typography.sizes.sm,
        color: colors.textPrimary,
      },
      detailTitleWrap: {
        marginVertical: spacing.xs,
      },
      detailTitle: {
        fontFamily: typography.fonts.headerBold,
        fontSize: typography.sizes.xxl,
        color: colors.headerTitle,
        letterSpacing: typography.letterSpacing.tight,
      },
      detailSubtitle: {
        fontFamily: typography.fonts.regular,
        fontSize: typography.sizes.sm,
        color: colors.textMuted,
        marginTop: 2,
      },
      detailActionsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.xs + 2,
        marginTop: spacing.md,
      },
      primaryActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.primary,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: radius.full,
        gap: 6,
      },
      primaryActionBtnText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: typography.sizes.xs,
        color: colors.primaryContrast,
      },
      secondaryActionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.card,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: radius.full,
        gap: 6,
      },
      secondaryActionBtnText: {
        fontFamily: typography.fonts.medium,
        fontSize: typography.sizes.xs,
        color: colors.textPrimary,
      },
      deleteActionBtn: {
        width: 38,
        height: 38,
        borderRadius: radius.full,
        backgroundColor: colors.card,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 'auto',
      },
      disabledBtn: {
        opacity: 0.4,
      },
      emptyContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingVertical: spacing.huge,
        paddingHorizontal: spacing.xl,
        gap: spacing.xs,
      },
      emptyTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: typography.sizes.base,
        color: colors.textPrimary,
        marginTop: spacing.xs,
      },
      emptyDesc: {
        fontFamily: typography.fonts.regular,
        fontSize: typography.sizes.xs,
        color: colors.textMuted,
        textAlign: 'center',
        lineHeight: 18,
      },
      modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.55)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: spacing.xl,
      },
      modalCard: {
        width: '100%',
        backgroundColor: colors.card,
        borderRadius: radius.xl,
        padding: spacing.lg,
      },
      modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: spacing.md,
      },
      modalTitle: {
        fontFamily: typography.fonts.bold,
        fontSize: typography.sizes.lg,
        color: colors.textPrimary,
      },
      modalInput: {
        backgroundColor: colors.backgroundSecondary,
        borderRadius: radius.md,
        paddingHorizontal: 16,
        paddingVertical: 12,
        fontFamily: typography.fonts.regular,
        fontSize: typography.sizes.sm,
        color: colors.textPrimary,
        marginBottom: spacing.md,
      },
      modalButtonsRow: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        gap: spacing.sm,
      },
      modalCancelBtn: {
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: radius.full,
      },
      modalCancelBtnText: {
        fontFamily: typography.fonts.medium,
        fontSize: typography.sizes.sm,
        color: colors.textMuted,
      },
      modalSaveBtn: {
        backgroundColor: colors.primary,
        paddingVertical: 8,
        paddingHorizontal: 18,
        borderRadius: radius.full,
      },
      modalSaveBtnText: {
        fontFamily: typography.fonts.semiBold,
        fontSize: typography.sizes.sm,
        color: colors.primaryContrast,
      },
    });

    export default LibraryScreen;
