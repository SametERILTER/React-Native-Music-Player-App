import React, { useState, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Image,
  Animated,
  Easing,
  BackHandler,
  FlatList,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Clock,
  ListMusic,
  Plus,
  ChevronRight,
  ChevronLeft,
  Folder,
  Play,
  Pause,
  Shuffle,
  Search,
  X,
  HardDrive,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';
import { Header } from '../components/common/Header';
import { SongItem } from '../components/home/SongItem';
import { FolderSection } from '../components/home/FolderSection';
import { getPlaylistCoverSource } from '../constants/playlistCovers';
import { groupTracksByFolder } from '../utils/folderUtils';

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { t } = useLanguage();
  const {
    tracks,
    playlists,
    currentTrack,
    isPlaying,
    favorites,
    isShuffle,
    isScanningDevice,
    scanDeviceTracks,
    playTrack,
    openFullPlayer,
    toggleFavorite,
    toggleShuffle,
    onScrollForPlayer,
    openAddToPlaylist,
    playbackContext,
  } = usePlayer();

  // Navigation states within HomeScreen: 'home' | 'all_folders' | 'folder_detail'
  const [currentScreen, setCurrentScreen] = useState('home');
  const [folderDetailSource, setFolderDetailSource] = useState('home');
  const [selectedFolder, setSelectedFolder] = useState(null);
  const [folderSearchQuery, setFolderSearchQuery] = useState('');
  const [allFoldersSearchQuery, setAllFoldersSearchQuery] = useState('');

  // Animation values for All Folders page
  const [allFoldersOpacity] = useState(() => new Animated.Value(0));
  const [allFoldersTranslateY] = useState(() => new Animated.Value(12));

  // Animation values for Folder Detail page
  const [detailOpacity] = useState(() => new Animated.Value(0));
  const [detailTranslateY] = useState(() => new Animated.Value(12));
  const [detailScrollY] = useState(() => new Animated.Value(0));

  const folders = useMemo(() => groupTracksByFolder(tracks), [tracks]);

  const activePlayingFolderName = useMemo(() => {
    if (playbackContext?.type === 'folder' && playbackContext?.name) {
      return playbackContext.name;
    }
    return null;
  }, [playbackContext]);

  const activeFolder = useMemo(() => {
    if (!selectedFolder) return null;
    return folders.find((f) => f.id === selectedFolder.id) || selectedFolder;
  }, [folders, selectedFolder]);

  const handleOpenAllFolders = useCallback(() => {
    setCurrentScreen('all_folders');
    setAllFoldersSearchQuery('');
    allFoldersOpacity.setValue(0);
    allFoldersTranslateY.setValue(12);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(allFoldersOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(allFoldersTranslateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [allFoldersOpacity, allFoldersTranslateY]);

  const handleBackFromAllFolders = useCallback(() => {
    setAllFoldersSearchQuery('');
    Animated.parallel([
      Animated.timing(allFoldersOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(allFoldersTranslateY, {
        toValue: 10,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setCurrentScreen('home');
      allFoldersTranslateY.setValue(0);
    });
  }, [allFoldersOpacity, allFoldersTranslateY]);

  const handleOpenFolder = useCallback((folder, source = 'home') => {
    setSelectedFolder(folder);
    setFolderDetailSource(source);
    setCurrentScreen('folder_detail');
    detailScrollY.setValue(0);
    setFolderSearchQuery('');
    detailOpacity.setValue(0);
    detailTranslateY.setValue(12);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(detailOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(detailTranslateY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  }, [detailOpacity, detailTranslateY, detailScrollY]);

  const handleBackFromDetail = useCallback(() => {
    detailScrollY.setValue(0);
    setFolderSearchQuery('');
    Animated.parallel([
      Animated.timing(detailOpacity, {
        toValue: 0,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(detailTranslateY, {
        toValue: 10,
        duration: 160,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      setSelectedFolder(null);
      detailTranslateY.setValue(0);
      if (folderDetailSource === 'all_folders') {
        setCurrentScreen('all_folders');
      } else {
        setCurrentScreen('home');
      }
    });
  }, [detailOpacity, detailTranslateY, detailScrollY, folderDetailSource]);

  useEffect(() => {
    if (currentScreen === 'home') return;
    const onBackPress = () => {
      if (currentScreen === 'folder_detail') {
        handleBackFromDetail();
        return true;
      }
      if (currentScreen === 'all_folders') {
        handleBackFromAllFolders();
        return true;
      }
      return false;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [currentScreen, handleBackFromDetail, handleBackFromAllFolders]);

  const handleDetailScroll = useCallback(
    (event) => {
      onScrollForPlayer(event);
      const offsetY = event?.nativeEvent?.contentOffset?.y ?? 0;
      detailScrollY.setValue(offsetY);
    },
    [onScrollForPlayer, detailScrollY]
  );

  const filteredFolderTracks = useMemo(() => {
    if (!activeFolder) return [];
    const fTracks = activeFolder.tracks || [];
    if (!folderSearchQuery.trim()) return fTracks;
    const q = folderSearchQuery.toLowerCase().trim();
    return fTracks.filter(
      (t) =>
        t.title?.toLowerCase().includes(q) ||
        t.artist?.toLowerCase().includes(q) ||
        t.album?.toLowerCase().includes(q)
    );
  }, [activeFolder, folderSearchQuery]);

  const handlePlayFolder = useCallback((folder, shuffle = false, customQueue = null) => {
    if (!folder) return;
    const folderTracks = customQueue || folder.tracks;
    if (!folderTracks || folderTracks.length === 0) return;
    let targetTracks = [...folderTracks];
    if (shuffle) {
      if (!isShuffle) {
        toggleShuffle();
      }
      targetTracks.sort(() => Math.random() - 0.5);
    }
    playTrack(targetTracks[0], targetTracks, {
      type: 'folder',
      name: folder.name,
    });
    openFullPlayer();
  }, [isShuffle, toggleShuffle, playTrack, openFullPlayer]);

  const handlePlaySongInFolder = useCallback((track, folderTracks) => {
    playTrack(track, folderTracks, {
      type: 'folder',
      name: activeFolder?.name || track.folder || t('home.deviceTracks'),
    });
    openFullPlayer();
  }, [playTrack, activeFolder, openFullPlayer, t]);

  const recentTracks = useMemo(() => tracks.slice(0, 5), [tracks]);

  const handleSongPress = useCallback((track) => {
    playTrack(track, tracks, { type: 'library', name: t('home.deviceTracks') });
    openFullPlayer();
  }, [tracks, playTrack, openFullPlayer, t]);

  const handlePlaylistPress = useCallback((playlist) => {
    navigation.navigate('Library', {
      playlistId: playlist.id,
      timestamp: Date.now(),
    });
  }, [navigation]);

  const handleGoToLibrary = useCallback(() => {
    navigation.navigate('Library');
  }, [navigation]);

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + spacing.sm;
  const bottomPadding = 220;

  const filteredAllFolders = useMemo(() => {
    if (!allFoldersSearchQuery.trim()) return folders;
    const q = allFoldersSearchQuery.toLowerCase().trim();
    return folders.filter(
      (f) =>
        f.name?.toLowerCase().includes(q) ||
        f.path?.toLowerCase().includes(q)
    );
  }, [folders, allFoldersSearchQuery]);

  if (currentScreen === 'folder_detail' && activeFolder) {
    return (
      <Animated.View
        key="folder-detail"
        style={[
          styles.mainWrapper,
          { opacity: detailOpacity, transform: [{ translateY: detailTranslateY }] }
        ]}
      >
        <FlatList
          data={filteredFolderTracks}
          keyExtractor={(item) => item.id}
          onScroll={handleDetailScroll}
          scrollEventThrottle={16}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={{
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.detailHeaderWrapper}>
              <View style={styles.detailHeaderContainer}>
                <TouchableOpacity
                  style={styles.backCircleBtn}
                  onPress={handleBackFromDetail}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronLeft size={22} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.folderHeaderTitleRow}>
                  <View style={styles.folderHeaderIconBox}>
                    <Folder size={28} color={colors.headerTitle} strokeWidth={2.4} />
                  </View>
                  <Text style={styles.folderHeaderTitle} numberOfLines={2}>
                    {activeFolder.name}
                  </Text>
                </View>

                {Boolean(activeFolder.path) && (
                  <View style={styles.folderPathPill}>
                    <HardDrive size={12} color={colors.textMuted} />
                    <Text style={styles.folderPathText} numberOfLines={1}>
                      {activeFolder.path}
                    </Text>
                  </View>
                )}

                <Text style={styles.detailSubtitle}>
                  {filteredFolderTracks.length !== activeFolder.tracks.length
                    ? `${filteredFolderTracks.length} / ${activeFolder.tracks.length} ${t('common.tracks')}`
                    : `${activeFolder.tracks.length} ${t('common.tracks')}`}
                </Text>

                <View style={styles.playlistSearchBar}>
                  <Search size={17} color={colors.textTertiary} style={styles.playlistSearchIcon} />
                  <TextInput
                    style={styles.playlistSearchInput}
                    value={folderSearchQuery}
                    onChangeText={setFolderSearchQuery}
                    placeholder={t('home.searchInFolder')}
                    placeholderTextColor={colors.textTertiary}
                    autoCorrect={false}
                    clearButtonMode="never"
                  />
                  {folderSearchQuery ? (
                    <TouchableOpacity
                      onPress={() => setFolderSearchQuery('')}
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
                      filteredFolderTracks.length === 0 && styles.disabledBtn,
                    ]}
                    onPress={() => handlePlayFolder(activeFolder, false, filteredFolderTracks)}
                    disabled={filteredFolderTracks.length === 0}
                    activeOpacity={0.8}
                  >
                    <Play size={15} color={colors.primaryContrast} fill={colors.primaryContrast} />
                    <Text style={styles.primaryActionBtnText}>{t('home.playAll')}</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.secondaryActionBtn,
                      filteredFolderTracks.length === 0 && styles.disabledBtn,
                    ]}
                    onPress={() => handlePlayFolder(activeFolder, true, filteredFolderTracks)}
                    disabled={filteredFolderTracks.length === 0}
                    activeOpacity={0.8}
                  >
                    <Shuffle size={15} color={colors.textPrimary} />
                    <Text style={styles.secondaryActionBtnText}>{t('home.shuffle')}</Text>
                  </TouchableOpacity>
                </View>
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
                onPress={(track) => handlePlaySongInFolder(track, filteredFolderTracks)}
                onToggleFavorite={toggleFavorite}
                onOpenPlaylistModal={openAddToPlaylist}
              />
            </View>
          )}
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
      </Animated.View>
    );
  }

  if (currentScreen === 'all_folders') {
    return (
      <Animated.View
        key="all-folders-screen"
        style={[
          styles.mainWrapper,
          { opacity: allFoldersOpacity, transform: [{ translateY: allFoldersTranslateY }] }
        ]}
      >
        <FlatList
          data={filteredAllFolders}
          keyExtractor={(item) => item.id || item.name}
          onScroll={onScrollForPlayer}
          scrollEventThrottle={16}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          windowSize={7}
          removeClippedSubviews={Platform.OS === 'android'}
          contentContainerStyle={{
            paddingTop: topPadding,
            paddingBottom: bottomPadding,
          }}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={styles.detailHeaderWrapper}>
              <View style={styles.detailHeaderContainer}>
                <TouchableOpacity
                  style={styles.backCircleBtn}
                  onPress={handleBackFromAllFolders}
                  activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <ChevronLeft size={22} color={colors.textPrimary} />
                </TouchableOpacity>

                <View style={styles.folderHeaderTitleRow}>
                  <View style={styles.folderHeaderIconBox}>
                    <Folder size={28} color={colors.headerTitle} strokeWidth={2.4} />
                  </View>
                  <View style={styles.foldersHeaderTitleTextWrap}>
                    <Text style={styles.folderHeaderTitle} numberOfLines={1}>
                      {t('home.allFolders')}
                    </Text>
                    <Text style={styles.foldersHeaderSubtitle}>
                      {t('home.foldersCount', { count: filteredAllFolders.length })}
                    </Text>
                  </View>
                </View>

                <View style={styles.playlistSearchBar}>
                  <Search size={17} color={colors.textTertiary} style={styles.playlistSearchIcon} />
                  <TextInput
                    style={styles.playlistSearchInput}
                    value={allFoldersSearchQuery}
                    onChangeText={setAllFoldersSearchQuery}
                    placeholder={t('home.searchFolders')}
                    placeholderTextColor={colors.textTertiary}
                    autoCorrect={false}
                    clearButtonMode="never"
                  />
                  {allFoldersSearchQuery ? (
                    <TouchableOpacity
                      onPress={() => setAllFoldersSearchQuery('')}
                      style={styles.playlistSearchClearBtn}
                      activeOpacity={0.7}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <X size={15} color={colors.textSecondary} />
                    </TouchableOpacity>
                  ) : null}
                </View>
              </View>
            </View>
          }
          renderItem={({ item }) => {
            const isCurrentFolder = Boolean(
              activePlayingFolderName &&
              activePlayingFolderName.toLowerCase() === item.name.toLowerCase()
            );
            const isPlayingThisFolder = isCurrentFolder && isPlaying;

            return (
              <View style={styles.folderItemContainer}>
                <TouchableOpacity
                  style={[styles.folderItemCard, isCurrentFolder && styles.folderItemActiveCard]}
                  onPress={() => handleOpenFolder(item, 'all_folders')}
                  activeOpacity={0.75}
                >
                  <View style={styles.folderItemLeft}>
                    <View style={[styles.folderItemIconBox, isCurrentFolder && styles.folderItemIconBoxActive]}>
                      <Folder
                        size={20}
                        color={isCurrentFolder ? colors.primary : colors.textPrimary}
                        strokeWidth={2}
                      />
                    </View>
                    <View style={styles.folderItemInfo}>
                      <Text style={styles.folderItemName} numberOfLines={1}>
                        {item.name}
                      </Text>
                      <Text style={styles.folderItemMeta} numberOfLines={1}>
                        {t('home.folderTracksCount', { count: item.trackCount })}
                        {Boolean(item.path) ? ` • ${item.path}` : ''}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.folderItemRight}>
                    <TouchableOpacity
                      style={[
                        styles.folderItemPlayBtn,
                        isPlayingThisFolder && styles.folderItemPlayBtnActive
                      ]}
                      onPress={(e) => {
                        e?.stopPropagation?.();
                        handlePlayFolder(item, false);
                      }}
                      activeOpacity={0.8}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      {isPlayingThisFolder ? (
                        <Pause size={13} color={colors.primaryContrast} fill={colors.primaryContrast} />
                      ) : (
                        <Play size={13} color={colors.textPrimary} fill={colors.textPrimary} />
                      )}
                    </TouchableOpacity>
                    <ChevronRight size={16} color={colors.textTertiary} />
                  </View>
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyFoldersContainer}>
              <Folder size={32} color={colors.textTertiary} />
              <Text style={styles.emptyFoldersText}>{t('home.noTracksInFolder')}</Text>
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
      </Animated.View>
    );
  }

  return (
    <View style={styles.mainWrapper}>
      <ScrollView
        onScroll={onScrollForPlayer}
        scrollEventThrottle={64}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding, paddingBottom: bottomPadding }
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Header title={t('home.title')} />

        <FolderSection
          folders={folders}
          activeFolderName={activePlayingFolderName}
          isPlaying={isPlaying}
          onSelectFolder={(f) => handleOpenFolder(f, 'home')}
          onSeeAllFolders={handleOpenAllFolders}
          onPlayFolder={(f) => handlePlayFolder(f, false)}
          onScanDevice={() => scanDeviceTracks(true)}
          isScanningDevice={isScanningDevice}
        />

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <Clock size={16} color={colors.textPrimary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>{t('home.recentTracks')}</Text>
            </View>
          </View>

          <View style={styles.songListWrap}>
            {recentTracks.length > 0 ? (
              recentTracks.map((item, index) => (
                <SongItem
                  key={item.id}
                  track={item}
                  index={index}
                  isCurrent={currentTrack?.id === item.id}
                  isPlaying={isPlaying}
                  isFavorite={favorites.includes(item.id)}
                  onPress={handleSongPress}
                  onToggleFavorite={toggleFavorite}
                  onOpenPlaylistModal={openAddToPlaylist}
                />
              ))
            ) : (
              <View style={styles.emptyRecentWrap}>
                <Text style={styles.emptyRecentTitle}>{t('home.emptySongsTitle')}</Text>
                <Text style={styles.emptyRecentSubtitle}>{t('home.emptySongsDesc')}</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <ListMusic size={16} color={colors.textPrimary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>{t('home.yourPlaylists')}</Text>
            </View>
            <TouchableOpacity
              onPress={handleGoToLibrary}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
              <ChevronRight size={14} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {playlists.length === 0 ? (
            <View style={styles.emptyPlaylistContainer}>
              <TouchableOpacity
                style={styles.createPlaylistCard}
                onPress={handleGoToLibrary}
                activeOpacity={0.8}
              >
                <View style={styles.createPlaylistIconBox}>
                  <Plus size={22} color={colors.primaryContrast} strokeWidth={2.4} />
                </View>
                <View style={styles.createPlaylistTextWrap}>
                  <Text style={styles.createPlaylistTitle}>{t('home.newPlaylistTitle')}</Text>
                  <Text style={styles.createPlaylistSubtitle}>{t('home.newPlaylistSub')}</Text>
                </View>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.playlistsScrollRow}
            >
              {playlists.map((playlist) => {
                const coverSource = getPlaylistCoverSource(playlist.coverId);
                return (
                  <TouchableOpacity
                    key={playlist.id}
                    style={styles.playlistCard}
                    onPress={() => handlePlaylistPress(playlist)}
                    activeOpacity={0.8}
                  >
                    <View style={styles.playlistCoverBox}>
                      {coverSource ? (
                        <Image
                          source={coverSource}
                          style={styles.playlistCoverImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <View style={styles.playlistFallbackCover}>
                          <ListMusic size={36} color={colors.textTertiary} strokeWidth={1.6} />
                        </View>
                      )}
                    </View>
                    <Text style={styles.playlistName} numberOfLines={1}>
                      {playlist.name}
                    </Text>
                    <Text style={styles.playlistTrackCount}>
                      {t('home.tracksCount', { count: playlist.trackIds.length })}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}
        </View>
      </ScrollView>

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
    </View>
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
  scrollContent: {
  },
  sectionContainer: {
    marginTop: spacing.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  songListWrap: {
    flexDirection: 'column',
    paddingHorizontal: spacing.sm,
  },
  songItemWrapper: {
    paddingHorizontal: spacing.sm,
  },
  playlistsScrollRow: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.md,
  },
  playlistCard: {
    width: 136,
  },
  playlistCoverBox: {
    width: 136,
    height: 136,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  playlistCoverImage: {
    width: '100%',
    height: '100%',
  },
  playlistFallbackCover: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
  },
  playlistName: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    marginTop: 8,
    letterSpacing: typography.letterSpacing.tight,
  },
  playlistTrackCount: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xxs,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyPlaylistContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
  },
  createPlaylistCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    borderStyle: 'dashed',
  },
  createPlaylistIconBox: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  createPlaylistTextWrap: {
    flex: 1,
  },
  createPlaylistTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  createPlaylistSubtitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xxs,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptyRecentWrap: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginTop: spacing.xs,
  },
  emptyRecentTitle: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  emptyRecentSubtitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  detailHeaderWrapper: {
    paddingTop: spacing.xs,
  },
  detailHeaderContainer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
    gap: 4,
  },
  backCircleBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
    elevation: 0,
    shadowOpacity: 0,
  },
  backBtnText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  folderHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    marginBottom: spacing.xxs,
  },
  folderHeaderIconBox: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  folderHeaderTitle: {
    fontFamily: typography.fonts.headerBold,
    fontSize: 34,
    lineHeight: 40,
    color: colors.headerTitle,
    letterSpacing: -0.8,
    flex: 1,
  },
  foldersHeaderTitleTextWrap: {
    flex: 1,
  },
  foldersHeaderSubtitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  folderPathPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.card,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
    marginTop: 6,
    marginBottom: 2,
    elevation: 0,
    shadowOpacity: 0,
  },
  folderPathText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xxs,
    color: colors.textMuted,
  },
  folderItemContainer: {
    paddingHorizontal: spacing.lg,
    marginVertical: 4,
  },
  folderItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    elevation: 0,
    shadowOpacity: 0,
  },
  folderItemActiveCard: {
    backgroundColor: '#FFFFFF',
  },
  folderItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
    gap: spacing.sm + 2,
  },
  folderItemIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.cardSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  folderItemIconBoxActive: {
    backgroundColor: colors.cardHigh,
  },
  folderItemInfo: {
    flex: 1,
  },
  folderItemName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm + 1,
    color: colors.textPrimary,
  },
  folderItemMeta: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xxs,
    color: colors.textMuted,
    marginTop: 3,
  },
  folderItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  folderItemPlayBtn: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.cardSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  folderItemPlayBtnActive: {
    backgroundColor: colors.primary,
  },
  emptyFoldersContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  emptyFoldersText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
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
  disabledBtn: {
    opacity: 0.35,
  },
});

export default HomeScreen;
