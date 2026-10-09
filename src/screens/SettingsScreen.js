import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Platform,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ChevronRight,
  ChevronLeft,
  Sliders,
  Palette,
  HardDrive,
  Info,
  RotateCcw,
  Sparkles,
  Check,
  Trash2,
  Shuffle,
  Music,
  FolderOpen,
  ExternalLink,
  Globe,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import { useLanguage } from '../context/LanguageContext';
import { safeStorage } from '../services/storageService';
import { clearLyricsCache } from '../services/lyricsService';

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const { t, language, setLanguage } = useLanguage();
  const {
    onScrollForPlayer,
    scanDeviceTracks,
    isScanningDevice,
    deviceTrackCount,
    trackCovers,
    assignRandomCoversToAll,
    resetAllCovers,
    tracks,
    playlists,
    autoPlayNext,
    setAutoPlayNext,
    isArtworkGradientEnabled,
    toggleArtworkGradient,
  } = usePlayer();

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + spacing.xs;
  const bottomPadding = 220;

  const [activeSubpage, setActiveSubpage] = useState(null);

  const [filterShortTracks, setFilterShortTracks] = useState(true);
  const [cacheCleanedMessage, setCacheCleanedMessage] = useState(null);
  const [isClearingCache, setIsClearingCache] = useState(false);

  useEffect(() => {
    safeStorage.getItem('@settings_filter_short_tracks').then((val) => {
      if (val !== null) setFilterShortTracks(val === 'true');
    });
  }, []);

  const toggleFilterShortTracks = useCallback((val) => {
    setFilterShortTracks(val);
    safeStorage.setItem('@settings_filter_short_tracks', String(val)).catch(() => { });
  }, []);

  const handleRescan = useCallback(async () => {
    if (typeof scanDeviceTracks === 'function') {
      try {
        await scanDeviceTracks(true);
      } catch (_err) {
        Alert.alert(t('settings.scanErrorTitle'), t('settings.scanErrorMsg'));
      }
    }
  }, [scanDeviceTracks, t]);

  const handleAssignRandomCovers = useCallback(() => {
    if (typeof assignRandomCoversToAll === 'function') {
      const count = assignRandomCoversToAll();
      Alert.alert(
        t('settings.randomAssignedTitle'),
        t('settings.randomAssignedMsg', { count })
      );
    }
  }, [assignRandomCoversToAll, t]);

  const handleResetCovers = useCallback(() => {
    const customCount = Object.keys(trackCovers || {}).length;
    if (customCount === 0) {
      Alert.alert(t('settings.infoTitle'), t('settings.noCustomCoversMsg'));
      return;
    }

    Alert.alert(
      t('settings.resetConfirmTitle'),
      t('settings.resetConfirmMsg', { count: customCount }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.reset'),
          style: 'destructive',
          onPress: () => {
            if (typeof resetAllCovers === 'function') {
              resetAllCovers();
            }
            Alert.alert(t('settings.resetSuccessTitle'), t('settings.resetSuccessMsg'));
          },
        },
      ]
    );
  }, [trackCovers, resetAllCovers, t]);

  const handleClearCache = useCallback(async () => {
    setIsClearingCache(true);
    try {
      clearLyricsCache();
      const allKeys = await safeStorage.getAllKeys();
      const lyricsKeys = allKeys.filter((k) => k && k.startsWith('@lyrics_cache_'));
      if (lyricsKeys.length > 0) {
        await safeStorage.multiRemove(lyricsKeys);
      }
      setCacheCleanedMessage(t('settings.cacheCleaned'));
    } catch (_err) {
      setCacheCleanedMessage(t('settings.cacheCleaned'));
    } finally {
      setIsClearingCache(false);
      setTimeout(() => {
        setCacheCleanedMessage(null);
      }, 3500);
    }
  }, [t]);

  const customCoverCount = useMemo(
    () => Object.keys(trackCovers || {}).length,
    [trackCovers]
  );

  const totalTracksCount = deviceTrackCount > 0 ? deviceTrackCount : tracks.length;

  const handleOpenGithub = useCallback(async () => {
    const url = 'https://github.com/SametERILTER/React-Native-Music-Player-App';
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        await Linking.openURL(url);
      }
    } catch {
      Alert.alert(t('settings.errorTitle'), t('settings.githubErrorMsg'));
    }
  }, [t]);

  const pageHeader = useMemo(() => {
    switch (activeSubpage) {
      case 'language':
        return { title: t('settings.languageSelect') };
      case 'playback':
        return { title: t('settings.playback') };
      case 'theme':
        return { title: t('settings.appearance') };
      case 'storage':
        return { title: t('settings.storage') };
      case 'about':
        return { title: t('settings.about') };
      default:
        return { title: t('settings.title') };
    }
  }, [activeSubpage, t]);

  return (
    <View style={styles.mainWrapper}>
      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: topPadding, paddingBottom: bottomPadding },
        ]}
        onScroll={onScrollForPlayer}
        scrollEventThrottle={64}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          {activeSubpage ? (
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => setActiveSubpage(null)}
              activeOpacity={0.7}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <ChevronLeft size={22} color={colors.textPrimary} />
            </TouchableOpacity>
          ) : null}

          <View style={styles.headerTextWrap}>
            <Text style={styles.headerTitle}>{pageHeader.title}</Text>
          </View>
        </View>

        {!activeSubpage && (
          <View style={styles.unifiedCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubpage('language')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Globe size={19} color={colors.textPrimary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>{t('settings.languageTitle')}</Text>
                <Text style={styles.menuSubtitle}>{t('settings.languageDesc')}</Text>
              </View>
              <View style={styles.menuRightGroup}>
                <Text style={styles.menuBadgeText}>
                  {language === 'tr' ? 'Türkçe' : 'English'}
                </Text>
                <ChevronRight size={18} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubpage('playback')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Sliders size={19} color={colors.textPrimary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>{t('settings.playbackTitle')}</Text>
                <Text style={styles.menuSubtitle}>{t('settings.playbackDesc')}</Text>
              </View>
              <View style={styles.menuRightGroup}>
                <Text style={styles.menuBadgeText}>
                  {autoPlayNext ? t('settings.autoOn') : t('settings.manual')}
                </Text>
                <ChevronRight size={18} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubpage('theme')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Palette size={19} color={colors.textPrimary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>{t('settings.appearanceTitle')}</Text>
                <Text style={styles.menuSubtitle}>{t('settings.appearanceDesc')}</Text>
              </View>
              <View style={styles.menuRightGroup}>
                <Text style={styles.menuBadgeText}>
                  {customCoverCount > 0 ? t('settings.customCount', { count: customCoverCount }) : t('settings.defaultCover')}
                </Text>
                <ChevronRight size={18} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubpage('storage')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <HardDrive size={19} color={colors.textPrimary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>{t('settings.storageTitle')}</Text>
                <Text style={styles.menuSubtitle}>{t('settings.storageDesc')}</Text>
              </View>
              <View style={styles.menuRightGroup}>
                <Text style={styles.menuBadgeText}>{totalTracksCount} {t('common.songs')}</Text>
                <ChevronRight size={18} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => setActiveSubpage('about')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Info size={19} color={colors.textPrimary} />
              </View>
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuTitle}>{t('settings.aboutTitle')}</Text>
                <Text style={styles.menuSubtitle}>{t('settings.aboutDesc')}</Text>
              </View>
              <View style={styles.menuRightGroup}>
                <Text style={styles.menuBadgeText}>v1.0.0</Text>
                <ChevronRight size={18} color={colors.textTertiary} />
              </View>
            </TouchableOpacity>
          </View>
        )}

        {activeSubpage === 'language' && (
          <View style={styles.unifiedCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setLanguage('tr')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Text style={styles.flagText}>🇹🇷</Text>
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>{t('settings.turkish')}</Text>
                <Text style={styles.settingSubtitle}>{t('settings.turkishDesc')}</Text>
              </View>
              {language === 'tr' ? (
                <View style={styles.statusSuccessBadge}>
                  <Check size={14} color={colors.textPrimary} strokeWidth={2.6} />
                </View>
              ) : null}
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={() => setLanguage('en')}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Text style={styles.flagText}>🇬🇧</Text>
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>{t('settings.english')}</Text>
                <Text style={styles.settingSubtitle}>{t('settings.englishDesc')}</Text>
              </View>
              {language === 'en' ? (
                <View style={styles.statusSuccessBadge}>
                  <Check size={14} color={colors.textPrimary} strokeWidth={2.6} />
                </View>
              ) : null}
            </TouchableOpacity>
          </View>
        )}

        {activeSubpage === 'playback' && (
          <View style={styles.unifiedCard}>
            <View style={styles.settingRow}>
              <View style={styles.menuIconBox}>
                <Music size={18} color={colors.textPrimary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>{t('settings.autoPlayNext')}</Text>
                <Text style={styles.settingSubtitle}>
                  {t('settings.autoPlayNextDesc')}
                </Text>
              </View>
              <Switch
                value={autoPlayNext}
                onValueChange={setAutoPlayNext}
                trackColor={{ false: colors.borderLight, true: colors.primary }}
                thumbColor={colors.primaryContrast}
              />
            </View>
          </View>
        )}

        {activeSubpage === 'theme' && (
          <View style={styles.unifiedCard}>
            <View style={styles.settingRow}>
              <View style={styles.menuIconBox}>
                <Sparkles size={18} color={colors.textPrimary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>{t('settings.dynamicGradient')}</Text>
                <Text style={styles.settingSubtitle}>
                  {t('settings.dynamicGradientDesc')}
                </Text>
              </View>
              <Switch
                value={isArtworkGradientEnabled !== false}
                onValueChange={toggleArtworkGradient}
                trackColor={{ false: colors.borderLight, true: colors.primary }}
                thumbColor={colors.primaryContrast}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleAssignRandomCovers}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Shuffle size={18} color={colors.textPrimary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>{t('settings.randomCovers')}</Text>
                <Text style={styles.settingSubtitle}>
                  {t('settings.randomCoversDesc')}
                </Text>
              </View>
              <View style={styles.badgeAction}>
                <Text style={styles.badgeActionText}>{t('settings.apply')}</Text>
              </View>
            </TouchableOpacity>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleResetCovers}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Trash2 size={18} color={colors.textPrimary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>{t('settings.resetCovers')}</Text>
                <Text style={styles.settingSubtitle}>
                  {customCoverCount > 0
                    ? t('settings.resetCoversDesc', { count: customCoverCount })
                    : t('settings.noCustomCovers')}
                </Text>
              </View>
              {customCoverCount > 0 && (
                <View style={styles.badgeAction}>
                  <Text style={styles.badgeActionText}>{t('settings.reset')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeSubpage === 'storage' && (
          <View style={styles.unifiedCard}>
            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleRescan}
              disabled={isScanningDevice}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <RotateCcw size={18} color={colors.textPrimary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>{t('settings.scanDeviceTracks')}</Text>
                <Text style={styles.settingSubtitle}>
                  {isScanningDevice
                    ? t('settings.scanningDesc')
                    : t('settings.rescanDesc', { count: totalTracksCount })}
                </Text>
              </View>
              {isScanningDevice ? (
                <ActivityIndicator size="small" color={colors.textPrimary} />
              ) : (
                <View style={styles.statusSuccessBadge}>
                  <Check size={13} color={colors.textPrimary} strokeWidth={2.5} />
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.divider} />

            <View style={styles.settingRow}>
              <View style={styles.menuIconBox}>
                <FolderOpen size={18} color={colors.textPrimary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>{t('settings.filterShortTracks')}</Text>
                <Text style={styles.settingSubtitle}>
                  {t('settings.filterShortTracksDesc')}
                </Text>
              </View>
              <Switch
                value={filterShortTracks}
                onValueChange={toggleFilterShortTracks}
                trackColor={{ false: colors.borderLight, true: colors.primary }}
                thumbColor={colors.primaryContrast}
              />
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.settingRow}
              onPress={handleClearCache}
              disabled={isClearingCache}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconBox}>
                <Sparkles size={18} color={colors.textPrimary} />
              </View>
              <View style={styles.settingTextWrap}>
                <Text style={styles.settingTitle}>{t('settings.clearCache')}</Text>
                <Text style={styles.settingSubtitle}>
                  {cacheCleanedMessage || t('settings.clearCacheDesc')}
                </Text>
              </View>
              {isClearingCache ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <View style={styles.badgeAction}>
                  <Text style={styles.badgeActionText}>{t('settings.clear')}</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        )}

        {activeSubpage === 'about' && (
          <View style={styles.unifiedCard}>
            <View style={styles.aboutHeader}>
              <View style={styles.appLogoCircle}>
                <Music size={26} color={colors.textPrimary} />
              </View>
              <Text style={styles.appName}>MusicPlayer</Text>
              <Text style={styles.appVersion}>{t('settings.version')}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutStatRow}>
              <Text style={styles.aboutStatLabel}>{t('settings.totalTracks')}</Text>
              <Text style={styles.aboutStatValue}>{totalTracksCount}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutStatRow}>
              <Text style={styles.aboutStatLabel}>{t('settings.totalPlaylists')}</Text>
              <Text style={styles.aboutStatValue}>{playlists.length}</Text>
            </View>

            <View style={styles.divider} />

            <View style={styles.aboutStatRow}>
              <Text style={styles.aboutStatLabel}>{t('settings.customCoversCount')}</Text>
              <Text style={styles.aboutStatValue}>{customCoverCount}</Text>
            </View>

            <View style={styles.divider} />

            <TouchableOpacity
              style={styles.aboutLinkRow}
              onPress={handleOpenGithub}
              activeOpacity={0.7}
            >
              <Text style={styles.aboutLinkLabel}>{t('settings.githubRepo')}</Text>
              <View style={styles.aboutLinkValueWrap}>
                <Text style={styles.aboutLinkValue}>SametERILTER</Text>
                <ExternalLink size={15} color={colors.textPrimary} style={{ marginLeft: 6 }} />
              </View>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

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
    </View>
  );
};

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
  },
  gradientTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  headerTextWrap: {
    flex: 1,
  },
  headerTitle: {
    fontFamily: typography.fonts.headerBold,
    fontSize: typography.sizes.display,
    color: colors.headerTitle,
    letterSpacing: typography.letterSpacing.tight,
    marginTop: 2,
  },
  unifiedCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md - 1,
  },
  menuIconBox: {
    width: 38,
    height: 38,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm + 2,
  },
  menuTextWrap: {
    flex: 1,
    marginRight: spacing.xs,
  },
  menuTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  menuSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  menuRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  menuBadgeText: {
    fontFamily: typography.fonts.medium,
    fontSize: 11,
    color: colors.textTertiary,
    marginRight: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md - 1,
  },
  settingTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  settingTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  settingSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
    lineHeight: 16,
  },
  flagText: {
    fontSize: 18,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginLeft: 50,
  },
  badgeAction: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  badgeActionText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 11,
    color: colors.textPrimary,
  },
  statusSuccessBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aboutHeader: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  appLogoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  appName: {
    fontFamily: typography.fonts.headerBold,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  appVersion: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 3,
  },
  aboutStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.xs,
  },
  aboutStatLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  aboutStatValue: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  aboutLinkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md - 2,
    paddingHorizontal: spacing.xs,
  },
  aboutLinkLabel: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  aboutLinkValueWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aboutLinkValue: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
});

export default SettingsScreen;
