import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  Animated,
  Easing,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search as SearchIcon } from 'lucide-react-native';
import { colors, typography, spacing } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';
import Header from '../components/common/Header';
import SearchBar from '../components/common/SearchBar';
import SongItem from '../components/home/SongItem';

export const SearchScreen = () => {
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

  const [query, setQuery] = useState('');

  const searchInputRef = useRef(null);
  const topSearchInputRef = useRef(null);
  const flatListRef = useRef(null);

  const isFocused = useIsFocused();
  const [animScale] = useState(() => new Animated.Value(0));
  const [animOpacity] = useState(() => new Animated.Value(0));
  const [pressScale] = useState(() => new Animated.Value(1));

  const [topBarAnim] = useState(() => new Animated.Value(0));
  const isTopBarVisibleRef = useRef(false);
  const [isTopBarVisible, setIsTopBarVisible] = useState(false);

  const targetFabBottom = currentTrack
    ? Math.max(insets.bottom, 16) + 64 + 68
    : Math.max(insets.bottom, 16) + 64 + 14;

  useEffect(() => {
    let timeoutId = null;
    if (isFocused) {
      timeoutId = setTimeout(() => {
        Animated.parallel([
          Animated.spring(animScale, {
            toValue: 1,
            friction: 6,
            tension: 100,
            useNativeDriver: true,
          }),
          Animated.timing(animOpacity, {
            toValue: 1,
            duration: 160,
            useNativeDriver: true,
          }),
        ]).start();
      }, 280);
    } else {
      Animated.parallel([
        Animated.timing(animScale, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(animOpacity, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
    return () => clearTimeout(timeoutId);
  }, [isFocused, animScale, animOpacity]);

  const handleFabPress = () => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 120);
  };

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + spacing.sm;
  const bottomPadding = 220;

  const displayedTracks = useMemo(() => {
    if (query.trim() === '') return tracks;
    const q = query.toLowerCase();
    return tracks.filter((track) => {
      return (
        track.title.toLowerCase().includes(q) ||
        track.artist.toLowerCase().includes(q) ||
        (track.genre && track.genre.toLowerCase().includes(q))
      );
    });
  }, [query, tracks]);

  const handleClear = useCallback(() => setQuery(''), []);
  const handleOpenPlaylist = useCallback((track) => openAddToPlaylist(track), [openAddToPlaylist]);

  const renderHeader = useCallback(() => (
    <View style={styles.headerContainer}>
      <Header title={t('search.title')} />

      <SearchBar
        ref={searchInputRef}
        value={query}
        onChangeText={setQuery}
        onClear={handleClear}
        placeholder={t('search.placeholder')}
      />

      <View style={styles.listTitleRow}>
        <Text style={styles.listTitle}>
          {query.trim() === ''
            ? t('search.allSongs', { count: tracks.length })
            : t('search.results', { count: displayedTracks.length })}
        </Text>
      </View>
    </View>
  ), [query, tracks.length, displayedTracks.length, handleClear, t]);

  const renderItem = useCallback(({ item, index }) => (
    <View style={styles.songItemWrapper}>
      <SongItem
        track={item}
        index={index}
        isCurrent={currentTrack?.id === item.id}
        isPlaying={isPlaying}
        isFavorite={favorites.includes(item.id)}
        onPress={(tItem) =>
          playTrack(tItem, displayedTracks, {
            type: 'search',
            name: t('search.searchResults'),
          })
        }
        onToggleFavorite={toggleFavorite}
        onOpenPlaylistModal={handleOpenPlaylist}
      />
    </View>
  ), [currentTrack?.id, isPlaying, favorites, displayedTracks, playTrack, toggleFavorite, handleOpenPlaylist, t]);

  const handleScroll = useCallback(
    (event) => {
      onScrollForPlayer?.(event);
      const scrollY = event?.nativeEvent?.contentOffset?.y ?? 0;

      if (scrollY > 85 && !isTopBarVisibleRef.current) {
        isTopBarVisibleRef.current = true;
        setIsTopBarVisible(true);
        Animated.timing(topBarAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }).start();
      } else if (scrollY < 55 && isTopBarVisibleRef.current) {
        isTopBarVisibleRef.current = false;
        Animated.timing(topBarAnim, {
          toValue: 0,
          duration: 220,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }).start(() => {
          setIsTopBarVisible(false);
        });
      }
    },
    [onScrollForPlayer, topBarAnim]
  );

  const topBarTranslateY = topBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-28, 0],
  });

  const topBarOpacity = topBarAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <View style={styles.mainWrapper}>
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + 4,
            opacity: topBarOpacity,
            transform: [{ translateY: topBarTranslateY }],
          },
        ]}
        pointerEvents={isTopBarVisible ? 'auto' : 'none'}
      >
        <LinearGradient
          colors={[
            colors.background,
            colors.background,
            'rgba(243, 243, 244, 0.95)',
            'rgba(243, 243, 244, 0.65)',
            'rgba(243, 243, 244, 0)',
          ]}
          locations={[0, 0.42, 0.68, 0.86, 1]}
          style={StyleSheet.absoluteFillObject}
          pointerEvents="none"
        />
        <View style={styles.stickySearchWrapper}>
          <SearchBar
            ref={topSearchInputRef}
            value={query}
            onChangeText={setQuery}
            onClear={handleClear}
            placeholder={t('search.placeholder')}
            style={styles.stickySearchBar}
          />
        </View>
      </Animated.View>

      <FlatList
        ref={flatListRef}
        data={displayedTracks}
        keyExtractor={(item) => item.id.toString()}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        initialNumToRender={10}
        maxToRenderPerBatch={10}
        windowSize={7}
        removeClippedSubviews={Platform.OS === 'android'}
        ListHeaderComponent={renderHeader}
        renderItem={renderItem}
        contentContainerStyle={[
          styles.listContent,
          { paddingTop: topPadding, paddingBottom: bottomPadding }
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <SearchIcon size={32} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>{t('search.emptyTitle')}</Text>
            <Text style={styles.emptyDesc}>
              {t('search.emptyDesc', { query })}
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
          onPress={handleFabPress}
        >
          <SearchIcon size={20} color={colors.primaryContrast} strokeWidth={2.2} />
        </TouchableOpacity>
      </Animated.View>

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
    paddingBottom: spacing.xs,
  },
  listTitleRow: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
    marginBottom: spacing.xxs,
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
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    paddingBottom: spacing.lg,
  },
  stickySearchWrapper: {
    width: '100%',
  },
  stickySearchBar: {
    marginHorizontal: spacing.lg,
    marginVertical: 0,
  },
});

export default SearchScreen;
