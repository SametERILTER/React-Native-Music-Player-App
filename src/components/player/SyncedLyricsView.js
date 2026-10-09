import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { fetchLyrics } from '../../services/lyricsService';

const LyricLineItem = React.memo(({
  item,
  index,
  activeIndex,
  isSynced,
  onPress,
}) => {
  const isStarted = activeIndex >= 0;
  const isActive = isSynced && index === activeIndex;
  const targetIdx = isStarted ? activeIndex : 0;
  const distance = isSynced ? Math.abs(index - targetIdx) : 0;

  let targetOpacity = 0.75;
  let targetScale = 1;

  if (isSynced) {
    if (isActive) {
      targetOpacity = 1;
      targetScale = 1.02;
    } else if (!isStarted) {
      if (index === 0) {
        targetOpacity = 0.85;
        targetScale = 1.01;
      } else if (index === 1) {
        targetOpacity = 0.50;
        targetScale = 1.0;
      } else if (index === 2) {
        targetOpacity = 0.26;
        targetScale = 0.98;
      } else {
        targetOpacity = 0.10;
        targetScale = 0.96;
      }
    } else {
      if (distance === 1) {
        targetOpacity = 0.44;
        targetScale = 1.0;
      } else if (distance === 2) {
        targetOpacity = 0.20;
        targetScale = 0.98;
      } else if (distance === 3) {
        targetOpacity = 0.08;
        targetScale = 0.96;
      } else {
        targetOpacity = 0.03;
        targetScale = 0.94;
      }
    }
  }

  const [animOpacity] = useState(() => new Animated.Value(targetOpacity));
  const [animScale] = useState(() => new Animated.Value(targetScale));

  useEffect(() => {
    Animated.parallel([
      Animated.timing(animOpacity, {
        toValue: targetOpacity,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(animScale, {
        toValue: targetScale,
        duration: 280,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, [targetOpacity, targetScale, animOpacity, animScale]);

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => onPress(item)}
      style={styles.lineWrapper}
    >
      <Animated.Text
        style={[
          styles.lyricText,
          isActive ? styles.activeLyricText : styles.inactiveLyricText,
          {
            opacity: animOpacity,
            transform: [{ scale: animScale }],
          },
        ]}
      >
        {item.text}
      </Animated.Text>
    </TouchableOpacity>
  );
});

LyricLineItem.displayName = 'LyricLineItem';

export const SyncedLyricsView = ({
  currentTrack,
  position = 0,
  seekTo,
  height,
  width,
}) => {
  const { t } = useLanguage();
  const [prevTrackId, setPrevTrackId] = useState(currentTrack?.id);
  const [lyrics, setLyrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAutoScrollEnabled, setIsAutoScrollEnabled] = useState(true);
  const [reloadKey, setReloadKey] = useState(0);

  const flatListRef = useRef(null);
  const autoScrollTimeoutRef = useRef(null);

  if (currentTrack?.id !== prevTrackId) {
    setPrevTrackId(currentTrack?.id);
    setLyrics(null);
    setLoading(true);
    setError(null);
  }

  const handleRetry = useCallback(() => {
    setLoading(true);
    setError(null);
    setReloadKey((k) => k + 1);
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const load = async () => {
      if (!currentTrack) {
        setLoading(false);
        return;
      }
      try {
        const data = await fetchLyrics(currentTrack, reloadKey > 0);
        if (isCancelled) return;
        if (data && data.lines && data.lines.length > 0) {
          setLyrics(data);
          setError(null);
        } else {
          setLyrics(null);
          setError(t('lyrics.notFound'));
        }
      } catch (_) {
        if (isCancelled) return;
        setError(t('lyrics.error'));
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isCancelled = true;
      if (autoScrollTimeoutRef.current) {
        clearTimeout(autoScrollTimeoutRef.current);
      }
    };
  }, [currentTrack, reloadKey, t]);

  const activeIndex = useMemo(() => {
    if (!lyrics?.isSynced || !lyrics?.lines || lyrics.lines.length === 0) return -1;
    let idx = -1;
    for (let i = 0; i < lyrics.lines.length; i++) {
      if (lyrics.lines[i].time <= position) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [lyrics, position]);

  useEffect(() => {
    if (!flatListRef.current || !isAutoScrollEnabled || !lyrics?.lines || lyrics.lines.length === 0) {
      return;
    }
    const target = activeIndex >= 0 ? activeIndex : 0;
    try {
      flatListRef.current.scrollToIndex({
        index: target,
        animated: true,
        viewPosition: activeIndex <= 0 ? 0 : 0.16,
      });
    } catch (_) {}
  }, [activeIndex, isAutoScrollEnabled, lyrics?.lines]);

  const handleScrollToIndexFailed = useCallback((info) => {
    setTimeout(() => {
      if (flatListRef.current) {
        try {
          flatListRef.current.scrollToIndex({
            index: info.index,
            animated: true,
            viewPosition: info.index <= 0 ? 0 : 0.16,
          });
        } catch (_) {}
      }
    }, 60);
  }, []);

  const handleScrollBeginDrag = () => {
    setIsAutoScrollEnabled(false);
    if (autoScrollTimeoutRef.current) {
      clearTimeout(autoScrollTimeoutRef.current);
    }
    autoScrollTimeoutRef.current = setTimeout(() => {
      setIsAutoScrollEnabled(true);
    }, 4000);
  };

  const handleLinePress = useCallback((item) => {
    if (item.time !== null && typeof item.time === 'number') {
      seekTo?.(item.time);
      setIsAutoScrollEnabled(true);
    }
  }, [seekTo]);

  const renderItem = useCallback(
    ({ item, index }) => (
      <LyricLineItem
        item={item}
        index={index}
        activeIndex={activeIndex}
        isSynced={Boolean(lyrics?.isSynced)}
        onPress={handleLinePress}
      />
    ),
    [activeIndex, lyrics?.isSynced, handleLinePress]
  );

  const renderFooter = useCallback(() => {
    if (!lyrics?.lines || lyrics.lines.length === 0) return null;
    return (
      <View style={styles.lyricsFooter}>
        <View style={styles.lyricsSourceBadge}>
          <Text style={styles.lyricsSourceText}>
            {t('lyrics.source', { source: lyrics.source || 'LRCLIB' })}
          </Text>
        </View>
      </View>
    );
  }, [lyrics, t]);

  return (
    <View style={[styles.container, { width, height, borderRadius: radius.xl }]} collapsable={false}>
      {loading ? (
        <View style={[styles.centerContainer, { height }]}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={styles.loadingText}>{t('lyrics.searching')}</Text>
        </View>
      ) : error || !lyrics ? (
        <View style={[styles.centerContainer, { height }]}>
          <Text style={styles.errorText}>{error || t('lyrics.notFoundGeneric')}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={handleRetry}
            activeOpacity={0.7}
          >
            <RefreshCw size={13} color={colors.primary} style={{ marginRight: 6 }} />
            <Text style={styles.retryText}>{t('lyrics.retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={lyrics.lines}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListFooterComponent={renderFooter}
          extraData={activeIndex}
          style={styles.flatList}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onScrollBeginDrag={handleScrollBeginDrag}
          onScrollToIndexFailed={handleScrollToIndexFailed}
          initialNumToRender={50}
          maxToRenderPerBatch={50}
          windowSize={21}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  flatList: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  listContent: {
    paddingTop: 16,
    paddingBottom: 72,
    paddingHorizontal: 8,
  },
  lineWrapper: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    minHeight: 38,
    justifyContent: 'center',
    overflow: 'visible',
  },
  lyricText: {
    fontFamily: typography.fonts.bold,
    letterSpacing: -0.2,
    fontSize: 18,
    lineHeight: 26,
    color: colors.textPrimary,
  },
  activeLyricText: {
    color: colors.textPrimary,
  },
  inactiveLyricText: {
    color: colors.textPrimary,
  },
  lyricsFooter: {
    paddingTop: 28,
    paddingBottom: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lyricsSourceBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  lyricsSourceText: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: colors.textMuted,
    letterSpacing: 0.3,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.large,
  },
  loadingText: {
    marginTop: spacing.small,
    fontSize: 13,
    fontFamily: typography.fonts.medium,
    color: colors.textSecondary,
  },
  errorText: {
    fontSize: 14,
    fontFamily: typography.fonts.medium,
    color: colors.textMuted,
    textAlign: 'center',
    marginBottom: spacing.medium,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
  },
  retryText: {
    fontSize: 12,
    fontFamily: typography.fonts.bold,
    color: colors.primary,
  },
});

export default SyncedLyricsView;
