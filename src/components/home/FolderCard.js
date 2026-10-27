import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Folder, Play, Pause } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';

export const FolderCard = ({
  folder,
  isCurrentFolder,
  isPlaying,
  onPress,
  onPlay,
}) => {
  const { t } = useLanguage();
  const isPlayingThisFolder = isCurrentFolder && isPlaying;

  const handlePlayPress = (e) => {
    e?.stopPropagation?.();
    if (onPlay && folder) {
      onPlay(folder);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.card,
        isCurrentFolder && styles.activeCard,
      ]}
      activeOpacity={0.82}
      onPress={() => onPress && folder && onPress(folder)}
    >
      <View style={styles.topRow}>
        <View style={[styles.iconBox, isCurrentFolder && styles.activeIconBox]}>
          <Folder
            size={18}
            color={isCurrentFolder ? colors.primary : colors.textPrimary}
            strokeWidth={2}
          />
        </View>

        <TouchableOpacity
          style={[
            styles.playButton,
            isPlayingThisFolder ? styles.playButtonActive : styles.playButtonInactive,
          ]}
          activeOpacity={0.8}
          onPress={handlePlayPress}
          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
        >
          {isPlayingThisFolder ? (
            <Pause size={13} color={colors.primaryContrast} fill={colors.primaryContrast} />
          ) : (
            <Play size={13} color={colors.textPrimary} fill={colors.textPrimary} />
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.bottomInfo}>
        <Text style={styles.folderName} numberOfLines={1}>
          {folder.name}
        </Text>
        <Text style={styles.trackCount} numberOfLines={1}>
          {t('home.folderTracksCount', { count: folder.trackCount })}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 142,
    height: 106,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.sm,
    marginRight: spacing.sm,
    justifyContent: 'space-between',
    elevation: 0,
    shadowOpacity: 0,
  },
  activeCard: {
    backgroundColor: '#FFFFFF',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.cardSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activeIconBox: {
    backgroundColor: colors.cardHigh,
  },
  playButton: {
    width: 30,
    height: 30,
    borderRadius: radius.full,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 0,
    shadowOpacity: 0,
  },
  playButtonInactive: {
    backgroundColor: colors.cardSubtle,
  },
  playButtonActive: {
    backgroundColor: colors.primary,
  },
  bottomInfo: {
    marginTop: spacing.xs,
  },
  folderName: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  trackCount: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xxs,
    color: colors.textMuted,
    marginTop: 2,
    letterSpacing: typography.letterSpacing.wide,
  },
});

export default FolderCard;
