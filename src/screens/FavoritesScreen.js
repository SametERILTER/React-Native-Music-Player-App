import React, { useState } from 'react';
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
import { colors, typography, spacing, radius } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import Header from '../components/common/Header';
import SongItem from '../components/home/SongItem';
import MiniPlayer from '../components/player/MiniPlayer';
import FullPlayerModal from '../components/player/FullPlayerModal';
import AddToPlaylistModal from '../components/playlist/AddToPlaylistModal';

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
  } = usePlayer();

  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [playlistTargetTrack, setPlaylistTargetTrack] = useState(null);

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + spacing.sm;
  const bottomPadding = 220;

  // Favori parçalar
  const favoriteTracks = tracks.filter((t) => favorites.includes(t.id));

  return (
    <View style={styles.mainWrapper}>
      <FlatList
        data={favoriteTracks}
        keyExtractor={(item) => item.id.toString()}
        onScroll={onScrollForPlayer}
        scrollEventThrottle={16}
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
            <Heart size={32} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Henüz Favori Eklenmedi</Text>
            <Text style={styles.emptyDesc}>
              Şarkıların yanındaki kalp simgesine dokunarak favorilerine ekleyebilirsin.
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

      {/* Mini Player */}
      <MiniPlayer onOpenFullPlayer={() => setIsPlayerModalVisible(true)} />

      {/* Full Player Modal */}
      <FullPlayerModal
        visible={isPlayerModalVisible}
        onClose={() => setIsPlayerModalVisible(false)}
      />

      {/* Şarkıyı Çalma Listesine Ekleme Modalı */}
      <AddToPlaylistModal
        visible={!!playlistTargetTrack}
        track={playlistTargetTrack}
        onClose={() => setPlaylistTargetTrack(null)}
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
    // Dinamik paddingTop ve paddingBottom ile desteklenir
  },
  headerContainer: {
    paddingBottom: spacing.xs,
  },
  listTitleRow: {
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  listTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    letterSpacing: typography.letterSpacing.wide,
  },
  songItemWrapper: {
    paddingHorizontal: spacing.sm,
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
  },
});

export default FavoritesScreen;
