import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Folder, RefreshCw, ChevronRight } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';
import { FolderCard } from './FolderCard';

export const FolderSection = ({
  folders = [],
  activeFolderName = null,
  isPlaying = false,
  onSelectFolder,
  onPlayFolder,
  onSeeAllFolders,
  onScanDevice,
  isScanningDevice = false,
}) => {
  const { t } = useLanguage();

  if (folders.length === 0 && !onScanDevice) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleLeft}>
          <Folder size={16} color={colors.textPrimary} strokeWidth={2} />
          <Text style={styles.title}>{t('home.foldersTitle')}</Text>
          {folders.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{folders.length}</Text>
            </View>
          )}
        </View>

        {folders.length > 0 && onSeeAllFolders ? (
          <TouchableOpacity
            style={styles.seeAllBtn}
            onPress={onSeeAllFolders}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Text style={styles.seeAllText}>{t('home.seeAll')}</Text>
            <ChevronRight size={14} color={colors.textMuted} />
          </TouchableOpacity>
        ) : onScanDevice && folders.length === 0 ? (
          <TouchableOpacity
            style={styles.scanBtn}
            onPress={onScanDevice}
            disabled={isScanningDevice}
            activeOpacity={0.7}
          >
            {isScanningDevice ? (
              <ActivityIndicator size="small" color={colors.textPrimary} />
            ) : (
              <RefreshCw size={13} color={colors.textPrimary} />
            )}
            <Text style={styles.scanBtnText}>{t('home.scanFolders')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollList}
      >
        {folders.length > 0 ? (
          folders.map((folder) => {
            const isCurrentFolder = Boolean(
              activeFolderName &&
              activeFolderName.toLowerCase() === folder.name.toLowerCase()
            );

            return (
              <FolderCard
                key={folder.id || folder.name}
                folder={folder}
                isCurrentFolder={isCurrentFolder}
                isPlaying={isPlaying}
                onPress={onSelectFolder}
                onPlay={onPlayFolder}
              />
            );
          })
        ) : (
          <TouchableOpacity
            style={styles.emptyCard}
            onPress={onScanDevice}
            activeOpacity={0.8}
            disabled={isScanningDevice}
          >
            <View style={styles.emptyIconBox}>
              <Folder size={20} color={colors.textSecondary} />
            </View>
            <View style={styles.emptyTextBox}>
              <Text style={styles.emptyTitle}>{t('home.emptyFoldersTitle')}</Text>
              <Text style={styles.emptySub}>{t('home.emptyFoldersSub')}</Text>
            </View>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xs,
  },
  titleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  title: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.base,
    color: colors.textPrimary,
    letterSpacing: typography.letterSpacing.tight,
  },
  countBadge: {
    backgroundColor: colors.cardSubtle,
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: radius.full,
  },
  countBadgeText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xxs,
    color: colors.textMuted,
  },
  scanBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    backgroundColor: colors.cardSubtle,
  },
  scanBtnText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  scrollList: {
    paddingLeft: spacing.lg,
    paddingRight: spacing.sm,
    paddingVertical: 4,
  },
  seeAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 260,
    height: 90,
    backgroundColor: '#FFFFFF',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    elevation: 0,
    shadowOpacity: 0,
  },
  emptyIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: colors.cardSubtle,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyTextBox: {
    flex: 1,
  },
  emptyTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  emptySub: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
});

export default FolderSection;
