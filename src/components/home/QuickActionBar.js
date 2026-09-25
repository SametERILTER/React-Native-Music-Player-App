import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Shuffle, Play, HardDrive, RefreshCw } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';

export const QuickActionBar = ({
  trackCount = 0,
  onShuffleAll,
  onPlayAll,
  isShuffleActive,
  onScanDevice,
  isScanningDevice,
  deviceTrackCount = 0,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.countWrapper}>
        <Text style={styles.countNumber}>{trackCount}</Text>
        <Text style={styles.countLabel}>PARÇA</Text>
        {deviceTrackCount > 0 && (
          <View style={styles.deviceBadge}>
            <HardDrive size={10} color={colors.textSecondary} />
            <Text style={styles.deviceBadgeText}>{deviceTrackCount} Yerel</Text>
          </View>
        )}
      </View>

      <View style={styles.actionsWrapper}>
        {onScanDevice && (
          <TouchableOpacity
            style={styles.scanButton}
            onPress={onScanDevice}
            disabled={isScanningDevice}
            activeOpacity={0.7}
          >
            {isScanningDevice ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <RefreshCw size={14} color={colors.textPrimary} />
            )}
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[
            styles.shuffleButton,
            isShuffleActive ? styles.shuffleActive : styles.shuffleInactive,
          ]}
          onPress={onShuffleAll}
          activeOpacity={0.8}
        >
          <Shuffle
            size={14}
            color={isShuffleActive ? colors.primaryContrast : colors.textPrimary}
          />
          <Text
            style={[
              styles.shuffleText,
              isShuffleActive ? styles.shuffleTextActive : styles.shuffleTextInactive,
            ]}
          >
            Karıştır
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.playAllButton}
          onPress={onPlayAll}
          activeOpacity={0.8}
        >
          <Play size={13} color={colors.primaryContrast} fill={colors.primaryContrast} />
          <Text style={styles.playAllText}>Tümünü Çal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginVertical: spacing.sm,
  },
  countWrapper: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  countNumber: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  countLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xxs,
    color: colors.textMuted,
    letterSpacing: typography.letterSpacing.wider,
  },
  deviceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.sm,
    gap: 3,
    marginLeft: 4,
  },
  deviceBadgeText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xxs,
    color: colors.textSecondary,
  },
  actionsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  scanButton: {
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    gap: 6,
  },
  shuffleInactive: {
    backgroundColor: colors.card,
  },
  shuffleActive: {
    backgroundColor: colors.primary,
  },
  shuffleText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
  },
  shuffleTextInactive: {
    color: colors.textPrimary,
  },
  shuffleTextActive: {
    color: colors.primaryContrast,
  },
  playAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.primary,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.full,
    gap: 6,
  },
  playAllText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.primaryContrast,
  },
});

export default QuickActionBar;
