import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart } from 'lucide-react-native';
import { colors, spacing } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import Header from '../components/common/Header';
import SongItem from '../components/home/SongItem';

export const FavoritesScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    tracks,
    currentTrack,
    isPlaying,
    favorites,
    playTrack,
    toggleFavorite,
    onScrollForPlayer,
    openAddToPlaylist,
  } = usePlayer();

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + spacing.sm;
  const bottomPadding = 220;

  const favoriteTracks = useMemo(() => {
    return tracks.filter((t) => favorites.includes(t.id));
  }, [tracks, favorites]);

  return (
    <View style={styles.mainWrapper}>
      <FlatList
        data={favoriteTracks}
        keyExtractor={(item) => item.id.toString()}
        onScroll={onScrollForPlayer}
        scrollEventThrottle={64}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={5}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Header title="Favoriler" />
            <View style={styles.listTitleRow}>
              <Text style={styles.listTitle}>
                {favoriteTracks.length} Beğenilen Parça
              </Text>
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
              isFavorite={true}
              onPress={playTrack}
              onToggleFavorite={toggleFavorite}
              onOpenPlaylistModal={openAddToPlaylist}
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
            <Heart size={32} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Henüz Favori Eklenmedi</Text>
            <Text style={styles.emptyDesc}>
              Şarkıların yanındaki kalp simgesine dokunarak favorilerine ekleyebilirsin.
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
  listContent: {
  },
  headerContainer: {
    paddingBottom: spacing.xs,
  },
  listTitleRow: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  listTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 14,
    color: colors.textSecondary,
    letterSpacing: -0.2,
  },
  songItemWrapper: {
    paddingHorizontal: spacing.sm,
    marginBottom: spacing.xs,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xxl * 1.5,
    gap: spacing.sm,
  },
  emptyTitle: {
    fontFamily: 'Geist_700Bold',
    fontSize: 16,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  emptyDesc: {
    fontFamily: 'Geist_400Regular',
    fontSize: 13,
    color: colors.textTertiary,
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    lineHeight: 18,
  },
});

export default FavoritesScreen;
