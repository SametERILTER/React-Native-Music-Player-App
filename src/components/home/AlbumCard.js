import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Play, Pause } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import AlbumArtwork from './AlbumArtwork';

export const AlbumCard = ({ track, isCurrent, isPlaying, onPlay }) => {
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.88}
      onPress={() => onPlay(track)}
    >
      <View style={styles.artworkWrapper}>
        <AlbumArtwork size={130} index={track.trackNumber || 1} />
        <TouchableOpacity
          style={styles.floatingPlayBtn}
          onPress={() => onPlay(track)}
          activeOpacity={0.8}
        >
          {isCurrent && isPlaying ? (
            <Pause size={16} color={colors.primaryContrast} fill={colors.primaryContrast} />
          ) : (
            <Play size={16} color={colors.primaryContrast} fill={colors.primaryContrast} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.infoWrapper}>
        <Text style={styles.title} numberOfLines={1}>
          {track.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1}>
          {track.artist}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 148,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xs,
    marginRight: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.subtle,
  },
  artworkWrapper: {
    width: '100%',
    alignItems: 'center',
    position: 'relative',
  },
  floatingPlayBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.card,
  },
  infoWrapper: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xxs,
    paddingBottom: spacing.xxs,
  },
  title: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  artist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default AlbumCard;
