import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, MoreVertical } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { formatTime } from '../../services/musicService';
import AlbumArtwork from './AlbumArtwork';

export const SongItem = React.memo(({
  track,
  index,
  isCurrent,
  isPlaying,
  isFavorite,
  onPress,
  onToggleFavorite,
  onOpenPlaylistModal,
}) => {
  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCurrent && styles.activeContainer,
      ]}
      activeOpacity={0.65}
      onPress={() => track && onPress && onPress(track)}
    >
      <View style={styles.leftSection}>
        <View style={styles.artworkContainer}>
          <AlbumArtwork
            size={52}
            borderRadius={radius.md + 2}
            index={index + 1}
            coverId={track?.coverId}
          />
          {isCurrent && isPlaying && (
            <View style={styles.playingOverlay}>
              <View style={styles.playingDot} />
            </View>
          )}
        </View>

        <View style={styles.trackInfo}>
          <Text
            style={[
              styles.title,
              isCurrent && styles.activeText,
            ]}
            numberOfLines={1}
          >
            {track?.title || ''}
          </Text>
          <View style={styles.metaRow}>
            <Text style={styles.artist} numberOfLines={1}>
              {track?.artist || ''}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.duration}>
          {formatTime(track?.duration || 0)}
        </Text>

        <TouchableOpacity
          style={styles.actionBtn}
          onPress={() => track && onToggleFavorite && onToggleFavorite(track.id)}
          activeOpacity={0.6}
          hitSlop={{ top: 10, bottom: 10, left: 6, right: 6 }}
        >
          <Heart
            size={16}
            color={isFavorite ? colors.textPrimary : colors.textTertiary}
            fill={isFavorite ? colors.textPrimary : 'transparent'}
          />
        </TouchableOpacity>

        {onOpenPlaylistModal && (
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => track && onOpenPlaylistModal(track)}
            activeOpacity={0.6}
            hitSlop={{ top: 10, bottom: 10, left: 6, right: 10 }}
          >
            <MoreVertical size={16} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: spacing.xs,
    borderWidth: 0,
    borderBottomWidth: 0,
  },
  activeContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderRadius: radius.md,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: spacing.sm,
  },
  artworkContainer: {
    position: 'relative',
  },
  playingOverlay: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playingDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.primaryContrast,
  },
  trackInfo: {
    marginLeft: spacing.md - 2,
    flex: 1,
  },
  title: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  activeText: {
    fontFamily: typography.fonts.semiBold,
    color: colors.primary,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  localBadge: {
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: radius.xs,
  },
  localBadgeText: {
    fontFamily: typography.fonts.bold,
    fontSize: 8,
    color: colors.textMuted,
    letterSpacing: 0.5,
  },
  artist: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    flex: 1,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
  },
  duration: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginRight: 2,
  },
  actionBtn: {
    padding: 4,
  },
});

SongItem.displayName = 'SongItem';

export default SongItem;
