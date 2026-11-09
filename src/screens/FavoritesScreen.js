import React, { useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Platform,
  Image,
  TouchableOpacity,
  TextInput,
  Animated,
  Easing,
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
import TrackSortBar from '../components/common/TrackSortBar';
import { sortTrackList, SORT_MODES } from '../utils/trackSorter';

const DOT_HEART_LIGHT = require('../../assets/favorites_dot_light.png');
const DOT_HEART_DARK = require('../../assets/favorites_dot_dark.png');

export const FavoritesScreen = () => {
  const { colors, isDark } = useTheme();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);
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
  const [favoriteSortMode, setFavoriteSortMode] = useState(SORT_MODES.DEFAULT);
  const [stickyBarAnim] = useState(() => new Animated.Value(0));
  const [isStickyVisible, setIsStickyVisible] = useState(false);
  const isStickyRef = useRef(false);

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + spacing.sm;
  const bottomPadding = 220;

  const handleScroll = useCallback(
    (event) => {
      onScrollForPlayer(event);
      const offsetY = event?.nativeEvent?.contentOffset?.y ?? 0;

      if (offsetY > 190 && !isStickyRef.current) {
        isStickyRef.current = true;
        setIsStickyVisible(true);
        Animated.timing(stickyBarAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      } else if (offsetY < 160 && isStickyRef.current) {
        isStickyRef.current = false;
        setIsStickyVisible(false);
        Animated.timing(stickyBarAnim, {
          toValue: 0,
          duration: 180,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
    },
    [onScrollForPlayer, stickyBarAnim]
  );

  const stickyBarTranslateY = useMemo(
    () =>
      stickyBarAnim.interpolate({
        inputRange: [0, 1],
        outputRange: [-18, 0],
      }),
    [stickyBarAnim]
  );

  const allFavoriteTracks = useMemo(() => {
    return tracks.filter((tItem) => favorites.includes(tItem.id));
  }, [tracks, favorites]);

  const favoriteTracks = useMemo(() => {
    let list = allFavoriteTracks;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (tItem) =>
          tItem.title?.toLowerCase().includes(q) ||
          tItem.artist?.toLowerCase().includes(q) ||
          tItem.album?.toLowerCase().includes(q)
      );
    }
    if (favoriteSortMode !== SORT_MODES.DEFAULT) {
      list = sortTrackList(list, favoriteSortMode);
    }
    return list;
  }, [allFavoriteTracks, searchQuery, favoriteSortMode]);

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
        onScroll={handleScroll}
        scrollEventThrottle={16}
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

              {allFavoriteTracks.length > 1 && (
                <TrackSortBar
                  activeSort={favoriteSortMode}
                  onSelectSort={setFavoriteSortMode}
                />
              )}

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

      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPadding - 4,
            opacity: stickyBarAnim,
            transform: [{ translateY: stickyBarTranslateY }],
          },
        ]}
        pointerEvents={isStickyVisible ? 'box-none' : 'none'}
      >
        <LinearGradient
          colors={colors.gradientStickySearch}
          locations={[0, 0.6, 0.8, 0.92, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={styles.stickyBarRow}>
          <View style={styles.stickyIconBox}>
            <Heart size={18} color={isDark ? '#FFFFFF' : colors.primary} fill={isDark ? '#FFFFFF' : colors.primary} />
          </View>

          <Text style={styles.stickyHeaderTitle} numberOfLines={1}>
            {t('favorites.title')}
          </Text>

          <TouchableOpacity
            style={[styles.stickyActionBtn, favoriteTracks.length === 0 && styles.disabledBtn]}
            onPress={() => handlePlayFavorites(false)}
            disabled={favoriteTracks.length === 0}
            activeOpacity={0.7}
          >
            <Play size={16} color={colors.textPrimary} fill={colors.textPrimary} style={{ marginLeft: 1 }} />
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const createStyles = (colors, isDark) => StyleSheet.create({
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
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    zIndex: 45,
  },
  stickyBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    backgroundColor: isDark ? '#181818' : colors.card,
    borderRadius: radius.full,
    paddingVertical: 5,
    paddingHorizontal: 6,
    elevation: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.35 : 0.08,
    shadowRadius: 10,
  },
  stickyIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: isDark ? '#242424' : colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stickyHeaderTitle: {
    flex: 1,
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
    color: colors.headerTitle,
    textAlign: 'center',
    letterSpacing: typography.letterSpacing.tight,
  },
  stickyActionBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: isDark ? '#242424' : colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
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
