import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
  Easing,
  BackHandler,
  Alert,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Plus,
  Play,
  Shuffle,
  ChevronLeft,
  ListMusic,
  Music2,
  X,
  RefreshCw,
  Search,
  MoreVertical,
  Check,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import SongItem from '../components/home/SongItem';
import AlbumArtwork from '../components/home/AlbumArtwork';
import PlaylistOptionsModal from '../components/playlist/PlaylistOptionsModal';
import EditPlaylistModal from '../components/playlist/EditPlaylistModal';
import { getPlaylistCoverSource, getPlaylistScreenGradientColors } from '../constants/playlistCovers';


export const LibraryScreen = ({ route }) => {
  const insets = useSafeAreaInsets();
  const {
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    favorites,
    isScanningDevice,
    scanDeviceTracks,
    playTrack,
    toggleFavorite,
    createPlaylist,
    updatePlaylist,
    deletePlaylist,
    onScrollForPlayer,
    openAddToPlaylist,
    toggleTrackInPlaylist,
  } = usePlayer();

  const [selectedPlaylistId, setSelectedPlaylistId] = useState(null);

  useEffect(() => {
    if (route?.params?.playlistId) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedPlaylistId(route.params.playlistId);
    }
  }, [route?.params?.playlistId, route?.params?.timestamp]);
  const [playlistSearchQuery, setPlaylistSearchQuery] = useState('');
  const [isPlaylistOptionsModalVisible, setIsPlaylistOptionsModalVisible] = useState(false);
  const [optionsTargetPlaylist, setOptionsTargetPlaylist] = useState(null);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [isAddSongsModalVisible, setIsAddSongsModalVisible] = useState(false);
  const [addSongsSearchQuery, setAddSongsSearchQuery] = useState('');
  const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  const isFocused = useIsFocused();
  const [animScale] = useState(() => new Animated.Value(0));
  const [animOpacity] = useState(() => new Animated.Value(0));
  const [pressScale] = useState(() => new Animated.Value(1));

  const targetFabBottom = currentTrack
    ? Math.max(insets.bottom, 16) + 64 + 70
    : Math.max(insets.bottom, 16) + 64 + 16;

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
  }, [isFocused, selectedPlaylistId, animOpacity, animScale]);

  const [detailOpacity] = useState(() => new Animated.Value(0));
  const [detailTranslateY] = useState(() => new Animated.Value(12));
  const [detailScrollY] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (selectedPlaylistId) {
      detailScrollY.setValue(0);
      detailOpacity.setValue(0);
      detailTranslateY.setValue(12);
      const frame = requestAnimationFrame(() => {
        Animated.parallel([
          Animated.timing(detailOpacity, {
            toValue: 1,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(detailTranslateY, {
            toValue: 0,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }),
        ]).start();
      });
      return () => cancelAnimationFrame(frame);
    }
  }, [selectedPlaylistId, detailOpacity, detailTranslateY, detailScrollY]);

  const handleBackToPlaylists = useCallback(() => {
    detailScrollY.setValue(0);
    setPlaylistSearchQuery('');
    setIsPlaylistOptionsModalVisible(false);
    setIsAddSongsModalVisible(false);
    setAddSongsSearchQuery('');
    Animated.parallel([
      Animated.timing(detailOpacity, {
        toValue: 0,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(detailTranslateY, {
        toValue: 10,
        duration: 180,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedPlaylistId(null);
      detailTranslateY.setValue(0);
    });
  }, [detailOpacity, detailTranslateY, detailScrollY]);

  useEffect(() => {
    if (!selectedPlaylistId) return;

    const onBackPress = () => {
      handleBackToPlaylists();
      return true;
    };

    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [selectedPlaylistId, handleBackToPlaylists]);

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + spacing.sm;
  const bottomPadding = 220;

  const activePlaylist = playlists.find((p) => p.id === selectedPlaylistId);

  const activePlaylistTracks = useMemo(() => {
    if (!activePlaylist) return [];
    const listTracks = tracks.filter((t) => activePlaylist.trackIds.includes(t.id));
    if (!playlistSearchQuery.trim()) return listTracks;
    const q = playlistSearchQuery.toLowerCase().trim();
    return listTracks.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.artist?.toLowerCase().includes(q) ||
        t.album?.toLowerCase().includes(q)
    );
  }, [activePlaylist, tracks, playlistSearchQuery]);

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
        // eslint-disable-next-line react-hooks/purity
        const randomIndex = Math.floor(Math.random() * plTracks.length);
        playTrack(plTracks[randomIndex]);
      } else {
        playTrack(plTracks[0]);
      }
    }
  };

  const confirmDeletePlaylist = (playlistId, playlistName) => {
    Alert.alert(
      'Çalma Listesini Sil',
      `"${playlistName || 'Bu çalma listesi'}" kalıcı olarak silinecek. Emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            setIsPlaylistOptionsModalVisible(false);
            deletePlaylist(playlistId);
            setSelectedPlaylistId(null);
          },
        },
      ]
    );
  };

  const allFilteredTracks = useMemo(() => {
    if (!addSongsSearchQuery.trim()) return tracks;
    const q = addSongsSearchQuery.toLowerCase().trim();
    return tracks.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.artist?.toLowerCase().includes(q)
    );
  }, [tracks, addSongsSearchQuery]);

  const addSongKeyExtractor = useCallback((item) => item.id.toString(), []);
  const addSongItemLayout = useCallback(
    (data, index) => ({ length: 60, offset: 60 * index, index }),
    []
  );

  const renderAddSongItem = useCallback(
    ({ item, index }) => {
      const isAdded = activePlaylist ? activePlaylist.trackIds.includes(item.id) : false;

      return (
        <TouchableOpacity
          style={[styles.addSongRow, isAdded && styles.addSongRowActive]}
          onPress={() => {
            if (activePlaylist) {
              toggleTrackInPlaylist(activePlaylist.id, item.id);
            }
          }}
          activeOpacity={0.65}
        >
          <View style={styles.addSongArtworkWrap}>
            <AlbumArtwork size={42} index={index + 1} coverId={item.coverId} />
          </View>

          <View style={styles.addSongInfo}>
            <Text style={styles.addSongTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.addSongArtist} numberOfLines={1}>
              {item.artist}
            </Text>
          </View>

          <View style={[styles.addSongCheckCircle, isAdded && styles.addSongCheckCircleActive]}>
            {isAdded && <Check size={13} color={colors.primaryContrast} strokeWidth={2.6} />}
          </View>
        </TouchableOpacity>
      );
    },
    [activePlaylist, toggleTrackInPlaylist]
  );

  const renderDetailItem = useCallback(
    ({ item, index }) => (
      <View style={styles.songItemWrapper}>
        <SongItem
          track={item}
          index={index}
          isCurrent={currentTrack?.id === item.id}
          isPlaying={isPlaying}
          isFavorite={favorites.includes(item.id)}
          onPress={playTrack}
          onToggleFavorite={toggleFavorite}
          onOpenPlaylistModal={openAddToPlaylist}
        />
      </View>
    ),
    [currentTrack?.id, isPlaying, favorites, playTrack, toggleFavorite, openAddToPlaylist]
  );

  const detailKeyExtractor = useCallback((item) => item.id.toString(), []);

  const handleDetailScroll = useCallback(
    (event) => {
      onScrollForPlayer(event);
      const offsetY = event?.nativeEvent?.contentOffset?.y ?? 0;
      detailScrollY.setValue(offsetY);
    },
    [onScrollForPlayer, detailScrollY]
  );

  const detailGradientTopOpacity = useMemo(() => {
    if (!activePlaylist?.isGradientEnabled) {
      return 1;
    }
    return detailScrollY.interpolate({
      inputRange: [80, 200],
      outputRange: [0, 1],
      extrapolate: 'clamp',
    });
  }, [activePlaylist?.isGradientEnabled, detailScrollY]);

  if (selectedPlaylistId && activePlaylist) {
    const activeCoverSource = getPlaylistCoverSource(activePlaylist.coverId);
    const playlistGradientColors = getPlaylistScreenGradientColors(
      activePlaylist.coverId,
      activePlaylist.name || activePlaylist.id || 1
    );

    return (
      <Animated.View
        key="playlist-detail"
        style={[styles.mainWrapper, { opacity: detailOpacity, transform: [{ translateY: detailTranslateY }] }]}
      >
        <FlatList
          data={activePlaylistTracks}
          keyExtractor={detailKeyExtractor}
          onScroll={handleDetailScroll}
          scrollEventThrottle={16}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={5}
          removeClippedSubviews={Platform.OS === 'android'}
          ListHeaderComponent={
            <View style={styles.detailHeaderWrapper}>
              {activePlaylist.isGradientEnabled && (
                <LinearGradient
                  colors={playlistGradientColors}
                  locations={[0, 0.22, 0.52, 0.80, 1.0]}
                  style={[
                    styles.playlistGradientHeader,
                    {
                      top: -topPadding - 180,
                      height: 520 + topPadding + 180,
                    },
                  ]}
                  pointerEvents="none"
                />
              )}
              <View style={styles.detailHeaderContainer}>
                <TouchableOpacity
                  style={styles.backBtn}
                  onPress={handleBackToPlaylists}
                  activeOpacity={0.7}
                >
                <ChevronLeft size={20} color={colors.textPrimary} />
                <Text style={styles.backBtnText}>Çalma Listeleri</Text>
              </TouchableOpacity>

              <View
                style={[
                  styles.detailCoverSection,
                  {
                    alignItems:
                      activePlaylist.coverPosition === 'center'
                        ? 'center'
                        : activePlaylist.coverPosition === 'right'
                        ? 'flex-end'
                        : 'flex-start',
                  },
                ]}
              >
                <View style={styles.detailCoverCard}>
                  {activeCoverSource ? (
                    <Image
                      source={activeCoverSource}
                      style={styles.detailCoverImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.detailCoverFallback}>
                      <ListMusic size={46} color={colors.textTertiary} strokeWidth={1.5} />
                    </View>
                  )}
                </View>
              </View>

              <View style={styles.detailTitleWrap}>
                <Text style={styles.detailTitle}>{activePlaylist.name}</Text>
                <Text style={styles.detailSubtitle}>
                  {activePlaylistTracks.length !== activePlaylist.trackIds.length
                    ? `${activePlaylistTracks.length} / ${activePlaylist.trackIds.length} Parça`
                    : `${activePlaylist.trackIds.length} Parça`}
                </Text>
              </View>

              <View style={styles.playlistSearchBar}>
                <Search size={17} color={colors.textTertiary} style={styles.playlistSearchIcon} />
                <TextInput
                  style={styles.playlistSearchInput}
                  value={playlistSearchQuery}
                  onChangeText={setPlaylistSearchQuery}
                  placeholder="Bu listede ara..."
                  placeholderTextColor={colors.textTertiary}
                  autoCorrect={false}
                  clearButtonMode="never"
                />
                {playlistSearchQuery ? (
                  <TouchableOpacity
                    onPress={() => setPlaylistSearchQuery('')}
                    style={styles.playlistSearchClearBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={15} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>

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
                  style={styles.optionsActionBtn}
                  onPress={() => {
                    setOptionsTargetPlaylist(activePlaylist);
                    setIsPlaylistOptionsModalVisible(true);
                  }}
                  activeOpacity={0.7}
                >
                  <MoreVertical size={18} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        }
          renderItem={renderDetailItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingTop: topPadding, paddingBottom: bottomPadding }
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Music2 size={32} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>
                {playlistSearchQuery ? 'Sonuç Bulunamadı' : 'Bu Liste Henüz Boş'}
              </Text>
              <Text style={styles.emptyDesc}>
                {playlistSearchQuery
                  ? `"${playlistSearchQuery}" aramasına uygun şarkı bulunamadı.`
                  : 'Ana sayfadaki şarkıların yanındaki (⋮) simgesine dokunarak bu listeye müzik ekleyebilirsin.'}
              </Text>
            </View>
          }
        />

        <Animated.View
          style={[styles.gradientTop, { height: topPadding + 16, opacity: detailGradientTopOpacity }]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={[
              colors.background,
              'rgba(243, 243, 243, 0.85)',
              'rgba(243, 243, 243, 0)',
            ]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
        </Animated.View>

        <PlaylistOptionsModal
          visible={isPlaylistOptionsModalVisible}
          playlist={optionsTargetPlaylist || activePlaylist}
          onClose={() => {
            setIsPlaylistOptionsModalVisible(false);
            setOptionsTargetPlaylist(null);
          }}
          onEdit={() => {
            setIsPlaylistOptionsModalVisible(false);
            setIsEditModalVisible(true);
          }}
          onAddSongs={() => {
            setIsPlaylistOptionsModalVisible(false);
            setAddSongsSearchQuery('');
            setIsAddSongsModalVisible(true);
          }}
          onDelete={() => {
            const target = optionsTargetPlaylist || activePlaylist;
            if (target) {
              confirmDeletePlaylist(target.id, target.name);
            }
          }}
          onToggleGradient={() => {
            const target = optionsTargetPlaylist || activePlaylist;
            if (target) {
              const nextVal = !target.isGradientEnabled;
              updatePlaylist(target.id, { isGradientEnabled: nextVal });
              setOptionsTargetPlaylist((prev) => (prev ? { ...prev, isGradientEnabled: nextVal } : null));
            }
          }}
        />

        <EditPlaylistModal
          visible={isEditModalVisible}
          playlist={optionsTargetPlaylist || activePlaylist}
          onClose={() => {
            setIsEditModalVisible(false);
            setOptionsTargetPlaylist(null);
          }}
          onSave={({ name, coverId, coverPosition }) => {
            const target = optionsTargetPlaylist || activePlaylist;
            if (target) {
              updatePlaylist(target.id, { name, coverId, coverPosition });
            }
            setIsEditModalVisible(false);
            setOptionsTargetPlaylist(null);
          }}
        />

        <Modal
          visible={isAddSongsModalVisible}
          transparent={false}
          animationType="slide"
          statusBarTranslucent
          onRequestClose={() => setIsAddSongsModalVisible(false)}
        >
          <View style={styles.addSongsModalRoot}>
            <View style={[styles.addSongsHeader, { paddingTop: Math.max(insets.top, 24) + 4 }]}>
              <View style={styles.addSongsHeaderLeft}>
                <Text style={styles.addSongsHeaderSubtitle}>ŞARKI EKLE</Text>
                <Text style={styles.addSongsHeaderTitle} numberOfLines={1}>
                  {activePlaylist?.name || ''}
                </Text>
                <Text style={styles.addSongsHeaderCount}>
                  {activePlaylist ? `${activePlaylist.trackIds.length} parça eklendi` : ''}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.addSongsDoneBtn}
                onPress={() => setIsAddSongsModalVisible(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.addSongsDoneBtnText}>Bitti</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.addSongsSearchBarWrap}>
              <View style={styles.addSongsSearchBar}>
                <Search size={17} color={colors.textTertiary} style={styles.playlistSearchIcon} />
                <TextInput
                  style={styles.playlistSearchInput}
                  value={addSongsSearchQuery}
                  onChangeText={setAddSongsSearchQuery}
                  placeholder="Tüm şarkılarda ara..."
                  placeholderTextColor={colors.textTertiary}
                  autoCorrect={false}
                  clearButtonMode="never"
                />
                {addSongsSearchQuery ? (
                  <TouchableOpacity
                    onPress={() => setAddSongsSearchQuery('')}
                    style={styles.playlistSearchClearBtn}
                    activeOpacity={0.7}
                  >
                    <X size={15} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            <FlatList
              data={allFilteredTracks}
              keyExtractor={addSongKeyExtractor}
              renderItem={renderAddSongItem}
              initialNumToRender={14}
              maxToRenderPerBatch={10}
              windowSize={7}
              removeClippedSubviews={Platform.OS === 'android'}
              getItemLayout={addSongItemLayout}
              contentContainerStyle={[
                styles.addSongsListContent,
                { paddingBottom: Math.max(insets.bottom, 20) + 16 }
              ]}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Music2 size={32} color={colors.textTertiary} />
                  <Text style={styles.emptyTitle}>
                    {addSongsSearchQuery ? 'Şarkı Bulunamadı' : 'Kütüphane Boş'}
                  </Text>
                  <Text style={styles.emptyDesc}>
                    {addSongsSearchQuery
                      ? `"${addSongsSearchQuery}" aramasına uygun müzik bulunamadı.`
                      : 'Cihazınızda oynatılabilir şarkı bulunamadı.'}
                  </Text>
                </View>
              }
            />
          </View>
        </Modal>

      </Animated.View>
    );
  }

  return (
    <View key="library-main" style={styles.mainWrapper}>
      <FlatList
        data={playlists}
        keyExtractor={(item) => item.id}
        onScroll={onScrollForPlayer}
        scrollEventThrottle={64}
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
          const cardCoverSource = getPlaylistCoverSource(item.coverId);

          return (
            <View style={styles.playlistCardWrapper}>
              <TouchableOpacity
                style={styles.playlistCard}
                onPress={() => setSelectedPlaylistId(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.playlistCardLeft}>
                  <View style={styles.playlistCardIconBox}>
                    {cardCoverSource ? (
                      <Image
                        source={cardCoverSource}
                        style={styles.playlistCardCoverImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <ListMusic size={22} color={colors.textPrimary} strokeWidth={1.8} />
                    )}
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

                <View style={styles.playlistCardActions}>
                  <TouchableOpacity
                    style={styles.playlistCardMoreBtn}
                    onPress={() => {
                      setOptionsTargetPlaylist(item);
                      setIsPlaylistOptionsModalVisible(true);
                    }}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MoreVertical size={18} color={colors.textSecondary} />
                  </TouchableOpacity>

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
                </View>
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

      <PlaylistOptionsModal
        visible={isPlaylistOptionsModalVisible && !selectedPlaylistId}
        playlist={optionsTargetPlaylist}
        onClose={() => {
          setIsPlaylistOptionsModalVisible(false);
          setOptionsTargetPlaylist(null);
        }}
        onEdit={() => {
          setIsPlaylistOptionsModalVisible(false);
          setIsEditModalVisible(true);
        }}
        onAddSongs={() => {
          if (optionsTargetPlaylist) {
            setSelectedPlaylistId(optionsTargetPlaylist.id);
            setIsPlaylistOptionsModalVisible(false);
            setAddSongsSearchQuery('');
            setIsAddSongsModalVisible(true);
          }
        }}
        onDelete={() => {
          if (optionsTargetPlaylist) {
            confirmDeletePlaylist(optionsTargetPlaylist.id, optionsTargetPlaylist.name);
          }
        }}
        onToggleGradient={() => {
          if (optionsTargetPlaylist) {
            const nextVal = !optionsTargetPlaylist.isGradientEnabled;
            updatePlaylist(optionsTargetPlaylist.id, { isGradientEnabled: nextVal });
            setOptionsTargetPlaylist((prev) => (prev ? { ...prev, isGradientEnabled: nextVal } : null));
          }
        }}
      />

      <EditPlaylistModal
        visible={isEditModalVisible && !selectedPlaylistId}
        playlist={optionsTargetPlaylist}
        onClose={() => {
          setIsEditModalVisible(false);
          setOptionsTargetPlaylist(null);
        }}
        onSave={({ name, coverId, coverPosition }) => {
          if (optionsTargetPlaylist) {
            updatePlaylist(optionsTargetPlaylist.id, { name, coverId, coverPosition });
          }
          setIsEditModalVisible(false);
          setOptionsTargetPlaylist(null);
        }}
      />

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
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  detailHeaderWrapper: {
    position: 'relative',
    overflow: 'visible',
  },
  playlistGradientHeader: {
    position: 'absolute',
    left: 0,
    right: 0,
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
    overflow: 'hidden',
  },
  playlistCardCoverImage: {
    width: '100%',
    height: '100%',
  },
  playlistCardActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  playlistCardMoreBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
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
  detailCoverSection: {
    marginTop: spacing.md,
    marginBottom: spacing.xs,
    width: '100%',
  },
  detailCoverCard: {
    width: 140,
    height: 140,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  detailCoverImage: {
    width: '100%',
    height: '100%',
  },
  detailCoverFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: 4,
  },
  backBtnText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  detailTitleWrap: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  detailTitle: {
    fontFamily: typography.fonts.headerBold,
    fontSize: 40,
    lineHeight: 46,
    color: colors.headerTitle,
    letterSpacing: -0.8,
  },
  detailSubtitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: 6,
  },
  playlistSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: 14,
    height: 42,
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  playlistSearchIcon: {
    marginRight: spacing.xs,
  },
  playlistSearchInput: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  playlistSearchClearBtn: {
    padding: 4,
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
  optionsActionBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 'auto',
  },

  addSongsModalRoot: {
    flex: 1,
    backgroundColor: colors.background,
  },
  addSongsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  addSongsHeaderLeft: {
    flex: 1,
    marginRight: spacing.sm,
  },
  addSongsHeaderSubtitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 10,
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  addSongsHeaderTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginTop: 2,
  },
  addSongsHeaderCount: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  addSongsDoneBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  addSongsDoneBtnText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.primaryContrast,
  },
  addSongsSearchBarWrap: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    backgroundColor: colors.card,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  addSongsSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: radius.full,
    paddingHorizontal: 14,
    height: 40,
  },
  addSongsListContent: {
    paddingTop: spacing.xs,
  },
  addSongRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: spacing.lg,
    height: 60,
  },
  addSongRowActive: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
  },
  addSongArtworkWrap: {
    marginRight: spacing.sm + 2,
  },
  addSongInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  addSongTitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  addSongArtist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  addSongCheckCircle: {
    width: 24,
    height: 24,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.borderMuted,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSongCheckCircleActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
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
