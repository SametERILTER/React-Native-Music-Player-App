import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, PanResponder } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { Play, Pause, SkipForward, Heart, Headphones } from 'lucide-react-native';
import { typography, spacing, radius } from '../../theme';
import { usePlayer } from '../../context/PlayerContext';
import { useLanguage } from '../../context/LanguageContext';
import { useTheme } from '../../context/ThemeContext';
import AlbumArtwork from '../home/AlbumArtwork';

const APPLE_EASE_OUT = Easing.bezier(0.22, 1, 0.36, 1);

export const MiniPlayer = ({ onOpenFullPlayer }) => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    playNext,
    playPrevious,
    favorites,
    toggleFavorite,
    compactProgress,
    audioDevice,
  } = usePlayer();

  const swipeX = useSharedValue(0);
  const swipeY = useSharedValue(0);
  const trackSlideX = useSharedValue(0);

  /* eslint-disable react-hooks/immutability */
  const panResponder = useMemo(() => {
    let lockedAxis = null;
    let hasTriggered = false;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onStartShouldSetPanResponderCapture: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 6 || Math.abs(dy) > 6;
      },
      onMoveShouldSetPanResponderCapture: (_, gestureState) => {
        const { dx, dy } = gestureState;
        return Math.abs(dx) > 8 || Math.abs(dy) > 8;
      },
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        lockedAxis = null;
        hasTriggered = false;
      },
      onPanResponderMove: (_, gestureState) => {
        if (hasTriggered) return;
        const { dx, dy } = gestureState;

        if (!lockedAxis && (Math.abs(dx) > 6 || Math.abs(dy) > 6)) {
          lockedAxis = Math.abs(dx) >= Math.abs(dy) ? 'x' : 'y';
        }

        if (lockedAxis === 'x') {
          swipeX.value = Math.sign(dx) * Math.min(Math.abs(dx) * 0.28, 22);
          trackSlideX.value = Math.sign(dx) * Math.min(Math.abs(dx) * 0.22, 14);
          swipeY.value = 0;
        } else if (lockedAxis === 'y') {
          swipeX.value = 0;
          trackSlideX.value = 0;
          if (dy < 0) {
            swipeY.value = Math.max(dy * 0.2, -10);
            if (dy < -24) {
              hasTriggered = true;
              swipeY.value = withTiming(0, { duration: 180, easing: APPLE_EASE_OUT });
              onOpenFullPlayer?.();
            }
          } else {
            swipeY.value = Math.min(dy * 0.08, 4);
          }
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (hasTriggered) {
          swipeX.value = withTiming(0, { duration: 200, easing: APPLE_EASE_OUT });
          swipeY.value = withTiming(0, { duration: 180, easing: APPLE_EASE_OUT });
          trackSlideX.value = withTiming(0, { duration: 200, easing: APPLE_EASE_OUT });
          return;
        }

        const { dx, dy, vx, vy } = gestureState;

        // Normal tap: Open full player
        if (!lockedAxis && Math.abs(dx) < 8 && Math.abs(dy) < 8) {
          swipeX.value = withTiming(0, { duration: 150, easing: APPLE_EASE_OUT });
          swipeY.value = withTiming(0, { duration: 150, easing: APPLE_EASE_OUT });
          trackSlideX.value = withTiming(0, { duration: 150, easing: APPLE_EASE_OUT });
          onOpenFullPlayer?.();
          return;
        }

        // Horizontal swipe: right -> next, left -> previous
        if (lockedAxis === 'x' && (Math.abs(dx) > 24 || Math.abs(vx) > 0.25)) {
          hasTriggered = true;
          swipeY.value = withTiming(0, { duration: 180, easing: APPLE_EASE_OUT });
          swipeX.value = withTiming(0, { duration: 240, easing: APPLE_EASE_OUT });
          if (dx > 0) {
            trackSlideX.value = withSequence(
              withTiming(-12, { duration: 0 }),
              withTiming(0, { duration: 240, easing: APPLE_EASE_OUT })
            );
            playNext?.();
          } else {
            trackSlideX.value = withSequence(
              withTiming(12, { duration: 0 }),
              withTiming(0, { duration: 240, easing: APPLE_EASE_OUT })
            );
            playPrevious?.();
          }
          return;
        }

        // Short vertical flick up: Open full player
        if (lockedAxis === 'y' && (dy < -12 || vy < -0.22)) {
          hasTriggered = true;
          swipeX.value = withTiming(0, { duration: 180, easing: APPLE_EASE_OUT });
          swipeY.value = withTiming(0, { duration: 180, easing: APPLE_EASE_OUT });
          trackSlideX.value = withTiming(0, { duration: 180, easing: APPLE_EASE_OUT });
          onOpenFullPlayer?.();
          return;
        }

        // Smooth Apple-style settle if threshold not reached
        swipeX.value = withTiming(0, { duration: 220, easing: APPLE_EASE_OUT });
        swipeY.value = withTiming(0, { duration: 200, easing: APPLE_EASE_OUT });
        trackSlideX.value = withTiming(0, { duration: 220, easing: APPLE_EASE_OUT });
      },
      onPanResponderTerminate: () => {
        swipeX.value = withTiming(0, { duration: 220, easing: APPLE_EASE_OUT });
        swipeY.value = withTiming(0, { duration: 200, easing: APPLE_EASE_OUT });
        trackSlideX.value = withTiming(0, { duration: 220, easing: APPLE_EASE_OUT });
      },
    });
  }, [swipeX, swipeY, trackSlideX, playNext, playPrevious, onOpenFullPlayer]);
  /* eslint-enable react-hooks/immutability */

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const scale = 1 - compactProgress.value * 0.12;
    const translateY = compactProgress.value * 6 + swipeY.value;
    const translateX = swipeX.value;

    return {
      transform: [{ scale }, { translateY }, { translateX }],
    };
  });

  const artworkAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 - compactProgress.value * 0.2 }],
    };
  });

  const artistAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - compactProgress.value,
    };
  });

  const titleWrapperAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateY: compactProgress.value * 7 },
        { translateX: trackSlideX.value },
      ],
    };
  });

  const heartAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: 1 - compactProgress.value,
      transform: [{ scale: 1 - compactProgress.value * 0.2 }],
    };
  });

  const playBtnAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 - compactProgress.value * 0.15 }],
    };
  });

  const skipBtnAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 - compactProgress.value * 0.15 }],
    };
  });

  if (!currentTrack) return null;

  const isFav = favorites.includes(currentTrack.id);
  const bottomOffset = Math.max(insets.bottom, 16) + 64;

  const trackTitle = currentTrack.title || t('common.tracks');
  const trackArtist = currentTrack.artist || t('common.unknownArtist');

  return (
    <View style={[styles.outerContainer, { bottom: bottomOffset }]} pointerEvents="box-none">
      <Animated.View
        style={[styles.container, containerAnimatedStyle]}
        {...panResponder.panHandlers}
      >
        <View style={styles.contentRow}>
          <View style={styles.leftInfo}>
            <Animated.View style={artworkAnimatedStyle}>
              <AlbumArtwork
                size={40}
                index={currentTrack.trackNumber || 1}
                track={currentTrack}
                coverId={currentTrack.coverId}
                artwork={currentTrack.coverArt || currentTrack.artwork}
              />
            </Animated.View>

            <Animated.View style={[styles.textWrapper, titleWrapperAnimatedStyle]}>
              <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                {trackTitle}
              </Text>
              <Animated.View style={artistAnimatedStyle}>
                <View style={styles.artistRow}>
                  {audioDevice?.isConnected && (
                    <Headphones
                      size={11}
                      color={colors.accent || colors.miniPlayerTextSecondary}
                      style={styles.deviceIcon}
                    />
                  )}
                  <Text style={styles.artist} numberOfLines={1} ellipsizeMode="tail">
                    {trackArtist}
                  </Text>
                </View>
              </Animated.View>
            </Animated.View>
          </View>

          <View style={styles.controlsRow}>
            <Animated.View style={heartAnimatedStyle}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={() => toggleFavorite(currentTrack.id)}
                activeOpacity={0.6}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Heart
                  size={18}
                  color={isFav ? '#FFFFFF' : colors.miniPlayerTextSecondary}
                  fill={isFav ? '#FFFFFF' : 'transparent'}
                />
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={playBtnAnimatedStyle}>
              <TouchableOpacity
                style={styles.playBtn}
                onPress={togglePlayPause}
                activeOpacity={0.8}
              >
                {isPlaying ? (
                  <Pause size={16} color={colors.miniPlayerBackground} fill={colors.miniPlayerBackground} />
                ) : (
                  <Play size={16} color={colors.miniPlayerBackground} fill={colors.miniPlayerBackground} style={{ marginLeft: 2 }} />
                )}
              </TouchableOpacity>
            </Animated.View>

            <Animated.View style={skipBtnAnimatedStyle}>
              <TouchableOpacity
                style={styles.iconBtn}
                onPress={playNext}
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <SkipForward size={18} color="#FFFFFF" fill="#FFFFFF" />
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>
      </Animated.View>
    </View>
  );
};

const createStyles = (colors) =>
  StyleSheet.create({
    outerContainer: {
      position: 'absolute',
      left: 20,
      right: 20,
      backgroundColor: 'transparent',
      borderWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
      zIndex: 99,
    },
    container: {
      backgroundColor: colors.miniPlayerBackground,
      borderRadius: radius.lg,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderWidth: 0,
      elevation: 4,
      shadowRadius: 12,
      shadowOpacity: 0.2,
      shadowColor: 'rgba(0, 0, 0, 0.35)',
    },
    contentRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    leftInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: spacing.sm,
    },
    textWrapper: {
      marginLeft: spacing.sm,
      flex: 1,
    },
    title: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.sm,
      color: colors.miniPlayerTextPrimary,
      letterSpacing: typography.letterSpacing.tight,
    },
    artistRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    deviceIcon: {
      marginRight: 4,
    },
    artist: {
      fontFamily: typography.fonts.regular,
      fontSize: typography.sizes.xs,
      color: colors.miniPlayerTextSecondary,
      flexShrink: 1,
    },
    controlsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs + 2,
    },
    iconBtn: {
      padding: 6,
      justifyContent: 'center',
      alignItems: 'center',
    },
    playBtn: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      backgroundColor: '#FFFFFF',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default MiniPlayer;
