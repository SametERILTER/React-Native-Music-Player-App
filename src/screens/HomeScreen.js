import React, { useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Clock, ListMusic, Plus, ChevronRight } from 'lucide-react-native';
import { colors, spacing, radius } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import Header from '../components/common/Header';
import SongItem from '../components/home/SongItem';
import QuickActionBar from '../components/home/QuickActionBar';
import { getPlaylistCoverSource } from '../constants/playlistCovers';

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
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
  } = usePlayer();

  const recentTracks = useMemo(() => tracks.slice(0, 5), [tracks]);

  const handleSongPress = useCallback((track) => {
    playTrack(track);
    openFullPlayer();
  }, [playTrack, openFullPlayer]);

  const handlePlayAll = useCallback(() => {
    if (recentTracks.length > 0) {
      playTrack(recentTracks[0]);
    }
  }, [recentTracks, playTrack]);

  const handleShuffleAll = useCallback(() => {
    if (tracks.length > 0) {
      if (!isShuffle) {
        toggleShuffle();
      }
      const randomIndex = Math.floor(Math.random() * tracks.length);
      playTrack(tracks[randomIndex]);
    }
  }, [tracks, isShuffle, toggleShuffle, playTrack]);

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
        <Header title="Music Player" />

        <QuickActionBar
          trackCount={tracks.length}
          onShuffleAll={handleShuffleAll}
          onPlayAll={handlePlayAll}
          isShuffleActive={isShuffle}
          onScanDevice={() => scanDeviceTracks(true)}
          isScanningDevice={isScanningDevice}
        />

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <Clock size={16} color={colors.textPrimary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Son Çalınanlar</Text>
            </View>
          </View>

          <View style={styles.songListWrap}>
            {recentTracks.map((item, index) => (
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
            ))}
          </View>
        </View>

        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <ListMusic size={16} color={colors.textPrimary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Çalma Listelerin</Text>
            </View>
            <TouchableOpacity
              onPress={handleGoToLibrary}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              style={styles.seeAllBtn}
            >
              <Text style={styles.seeAllText}>Tümünü Gör</Text>
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
                  <Text style={styles.createPlaylistTitle}>Yeni Çalma Listesi Oluştur</Text>
                  <Text style={styles.createPlaylistSubtitle}>Kitaplığa giderek çalma listesi oluşturabilirsin</Text>
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
                      {playlist.trackIds.length} Parça
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
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  seeAllText: {
    fontFamily: 'Geist_600SemiBold',
    fontSize: 12,
    color: colors.textMuted,
  },
  songListWrap: {
    flexDirection: 'column',
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
    fontFamily: 'Geist_700Bold',
    fontSize: 13,
    color: colors.textPrimary,
    marginTop: 8,
    letterSpacing: -0.1,
  },
  playlistTrackCount: {
    fontFamily: 'Geist_500Medium',
    fontSize: 11,
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
    fontFamily: 'Geist_700Bold',
    fontSize: 13,
    color: colors.textPrimary,
  },
  createPlaylistSubtitle: {
    fontFamily: 'Geist_500Medium',
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default HomeScreen;
