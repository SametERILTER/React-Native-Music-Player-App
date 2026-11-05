import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  Image,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Heart, Play, Shuffle, Search, X } from 'lucide-react-native';
import { typography, spacing, radius } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import Header from '../components/common/Header';
import SongItem from '../components/home/SongItem';

const DOT_HEART_LIGHT = require('../../assets/favorites_dot_light.png');
const DOT_HEART_DARK = require('../../assets/favorites_dot_dark.png');

export const FavoritesScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
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

  const [searchQuery, setSearchQuery] = useState('');

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + spacing.sm;
  const bottomPadding = 220;

  const allFavoriteTracks = useMemo(() => {
    return tracks.filter((tItem) => favorites.includes(tItem.id));
  }, [tracks, favorites]);

  const favoriteTracks = useMemo(() => {
    if (!searchQuery.trim()) return allFavoriteTracks;
    const q = searchQuery.toLowerCase().trim();
    return allFavoriteTracks.filter(
      (tItem) =>
        tItem.title?.toLowerCase().includes(q) ||
        tItem.artist?.toLowerCase().includes(q) ||
        tItem.album?.toLowerCase().includes(q)
    );
  }, [allFavoriteTracks, searchQuery]);

  const handlePlayFavorites = useCallback(
    (shouldShuffle = false) => {
      if (!favoriteTracks || favoriteTracks.length === 0) return;
      const context = {
        type: 'favorites',
        name: t('favorites.likedSongs'),
      };
      if (shouldShuffle) {
        const randomIndex = Math.floor(Math.random() * favoriteTracks.length);
        playTrack(favoriteTracks[randomIndex], favoriteTracks, context);
      } else {
        playTrack(favoriteTracks[0], favoriteTracks, context);
      }
    },
    [favoriteTracks, playTrack, t]
  );

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
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Header title={t('favorites.title')} />
            <View style={styles.heroIconContainer}>
              <Image
                source={isDark ? DOT_HEART_DARK : DOT_HEART_LIGHT}
                style={styles.heroIconImage}
                resizeMode="contain"
              />
            </View>

            <View style={styles.controlsSection}>
              <View style={styles.favoritesSearchBar}>
                <Search size={17} color={colors.textTertiary} style={styles.searchIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder={t('library.searchInListPlaceholder')}
                  placeholderTextColor={colors.textTertiary}
                  autoCorrect={false}
                  clearButtonMode="never"
                />
                {searchQuery ? (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    style={styles.searchClearBtn}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <X size={15} color={colors.textSecondary} />
                  </TouchableOpacity>
                ) : null}
              </View>

              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.primaryActionBtn,
                    favoriteTracks.length === 0 && styles.disabledBtn,
                  ]}
                  onPress={() => handlePlayFavorites(false)}
                  disabled={favoriteTracks.length === 0}
                  activeOpacity={0.8}
                >
                  <Play size={15} color={colors.primaryContrast} fill={colors.primaryContrast} />
                  <Text style={styles.primaryActionBtnText}>{t('library.playAll')}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.secondaryActionBtn,
                    favoriteTracks.length === 0 && styles.disabledBtn,
                  ]}
                  onPress={() => handlePlayFavorites(true)}
                  disabled={favoriteTracks.length === 0}
                  activeOpacity={0.8}
                >
                  <Shuffle size={15} color={colors.textPrimary} />
                  <Text style={styles.secondaryActionBtnText}>{t('library.shuffle')}</Text>
                </TouchableOpacity>

                <Text style={styles.listTitle}>
                  {favoriteTracks.length !== allFavoriteTracks.length
                    ? `${favoriteTracks.length} / ${allFavoriteTracks.length}`
                    : t('favorites.likedSongsCount', { count: allFavoriteTracks.length })}
                </Text>
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
              isFavorite={true}
              onPress={(tItem) =>
                playTrack(tItem, favoriteTracks, {
                  type: 'favorites',
                  name: t('favorites.likedSongs'),
                })
              }
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
            <Text style={styles.emptyTitle}>
              {searchQuery ? t('library.searchNoResultTitle') : t('favorites.emptyTitle')}
            </Text>
            <Text style={styles.emptyDesc}>
              {searchQuery
                ? t('library.searchNoResultDesc', { query: searchQuery })
                : t('favorites.emptyDesc')}
            </Text>
          </View>
        }
      />

      <LinearGradient
        colors={colors.gradientTop}
        locations={[0, 0.5, 1]}
        style={[styles.gradientTop, { height: topPadding + 16 }]}
        pointerEvents="none"
      />
    </View>
  );
};

const createStyles = (colors) => StyleSheet.create({
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
  heroIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing.xs,
    paddingBottom: spacing.xs,
  },
  heroIconImage: {
    width: 118,
    height: 118,
  },
  controlsSection: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.xs,
    marginBottom: spacing.sm,
  },
  favoritesSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 0,
    paddingHorizontal: 14,
    height: 42,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  searchInput: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  searchClearBtn: {
    padding: 4,
  },
  actionsRow: {
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
    borderWidth: 0,
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
    opacity: 0.4,
  },
  listTitle: {
    marginLeft: 'auto',
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
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
