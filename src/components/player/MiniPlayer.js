import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { Play, Pause, SkipForward, Heart } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { usePlayer } from '../../context/PlayerContext';
import AlbumArtwork from '../home/AlbumArtwork';

export const MiniPlayer = ({ onOpenFullPlayer }) => {
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    isPlaying,
    togglePlayPause,
    playNext,
    favorites,
    toggleFavorite,
    compactProgress,
  } = usePlayer();

  const containerAnimatedStyle = useAnimatedStyle(() => {
    const scale = 1 - compactProgress.value * 0.12;
    const translateY = compactProgress.value * 6;

    return {
      transform: [{ scale }, { translateY }],
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

  // Sanatçı adı kaybolunca başlık dikey olarak ortalansın diye aşağı kayar
  const titleWrapperAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateY: compactProgress.value * 7 }],
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

  const trackTitle = currentTrack.title || 'Midnight Resonance';
  const trackArtist = currentTrack.artist || 'Mono Studio';

  return (
    <View style={[styles.outerContainer, { bottom: bottomOffset }]} pointerEvents="box-none">
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={onOpenFullPlayer}
      >
        <Animated.View style={[styles.container, containerAnimatedStyle]}>
          <View style={styles.contentRow}>
            {/* Sol: Kapak ve Şarkı Bilgisi */}
            <View style={styles.leftInfo}>
              <Animated.View style={artworkAnimatedStyle}>
                <AlbumArtwork size={40} index={currentTrack.trackNumber || 1} />
              </Animated.View>

              <Animated.View style={[styles.textWrapper, titleWrapperAnimatedStyle]}>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
                  {trackTitle}
                </Text>
                <Animated.View style={artistAnimatedStyle}>
                  <Text style={styles.artist} numberOfLines={1} ellipsizeMode="tail">
                    {trackArtist}
                  </Text>
                </Animated.View>
              </Animated.View>
            </View>

            {/* Sağ: Kontroller */}
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
                    color={isFav ? '#FFFFFF' : '#A5A6AF'}
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
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 20,
    right: 20,
    backgroundColor: 'transparent',
    borderWidth: 0,
    elevation: 0,
    shadowOpacity: 0,
    zIndex: 99
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
  artist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.miniPlayerTextSecondary,
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
