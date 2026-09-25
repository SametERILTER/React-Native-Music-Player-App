import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Sparkles, Clock, Compass } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import Header from '../components/common/Header';
import SongItem from '../components/home/SongItem';
import QuickActionBar from '../components/home/QuickActionBar';
import MiniPlayer from '../components/player/MiniPlayer';
import FullPlayerModal from '../components/player/FullPlayerModal';
import AddToPlaylistModal from '../components/playlist/AddToPlaylistModal';

export const HomeScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    tracks,
    currentTrack,
    isPlaying,
    favorites,
    isShuffle,
    isScanningDevice,
    deviceTrackCount,
    scanDeviceTracks,
    playTrack,
    toggleFavorite,
    toggleShuffle,
    onScrollForPlayer,
  } = usePlayer();

  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [playlistTargetTrack, setPlaylistTargetTrack] = useState(null);

  // Son Çalınanlar (İlk 6 parça)
  const recentTracks = tracks.slice(0, 6);
  // Senin İçin / Sık Dinlenenler (Sonraki 5 parça)
  const forYouTracks = tracks.slice(6, 11);

  const handlePlayAll = () => {
    if (recentTracks.length > 0) {
      playTrack(recentTracks[0]);
    }
  };

  const handleShuffleAll = () => {
    if (tracks.length > 0) {
      if (!isShuffle) {
        toggleShuffle();
      }
      const randomIndex = Math.floor(Math.random() * tracks.length);
      playTrack(tracks[randomIndex]);
    }
  };

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + spacing.sm;
  const bottomPadding = 220;

  return (
    <View style={styles.mainWrapper}>
      <ScrollView
        onScroll={onScrollForPlayer}
        scrollEventThrottle={16}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding, paddingBottom: bottomPadding }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Üst Başlık */}
        <Header title="Music Player" />

        {/* Hızlı Karıştır & Başlat */}
        <QuickActionBar
          trackCount={tracks.length}
          onShuffleAll={handleShuffleAll}
          onPlayAll={handlePlayAll}
          isShuffleActive={isShuffle}
          onScanDevice={() => scanDeviceTracks(true)}
          isScanningDevice={isScanningDevice}
          deviceTrackCount={deviceTrackCount}
        />

        {/* 1. Bölüm: Son Çalınanlar */}
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
                onPress={playTrack}
                onToggleFavorite={toggleFavorite}
                onOpenPlaylistModal={(track) => setPlaylistTargetTrack(track)}
              />
            ))}
          </View>
        </View>

        {/* 2. Bölüm: Senin İçin Seçilenler */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionTitleLeft}>
              <Sparkles size={16} color={colors.textPrimary} strokeWidth={2} />
              <Text style={styles.sectionTitle}>Senin İçin</Text>
            </View>
          </View>

          <View style={styles.songListWrap}>
            {forYouTracks.map((item, index) => (
              <SongItem
                key={item.id}
                track={item}
                index={index + 6}
                isCurrent={currentTrack?.id === item.id}
                isPlaying={isPlaying}
                isFavorite={favorites.includes(item.id)}
                onPress={playTrack}
                onToggleFavorite={toggleFavorite}
                onOpenPlaylistModal={(track) => setPlaylistTargetTrack(track)}
              />
            ))}
          </View>
        </View>
      </ScrollView>

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

      {/* Yüzen Tab Bar'ın üstündeki Mini Player */}
      <MiniPlayer onOpenFullPlayer={() => setIsPlayerModalVisible(true)} />

      {/* Tam Ekran Player Modal */}
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
  scrollContent: {
    // Dinamik paddingTop ve paddingBottom ile desteklenir
  },
  sectionContainer: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  sectionTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  songListWrap: {
    marginTop: spacing.xxs,
  },
});

export default HomeScreen;
