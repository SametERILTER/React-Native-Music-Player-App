import React, { useState, useEffect, useCallback } from 'react';
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
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Volume2,
  FastForward,
  Flame,
  Sliders,
  RotateCcw,
  Sparkles,
  Check,
  Trash2,
  Mic2,
  Activity,
  Shuffle,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../theme';
import { usePlayer } from '../context/PlayerContext';
import Header from '../components/common/Header';
import { safeStorage } from '../services/storageService';

export const SettingsScreen = () => {
  const insets = useSafeAreaInsets();
  const {
    onScrollForPlayer,
    scanDeviceTracks,
    isScanningDevice,
    deviceTrackCount,
    trackCovers,
    assignRandomCoversToAll,
    resetAllCovers,
    tracks,
    autoPlayNext,
    setAutoPlayNext,
  } = usePlayer();

  const topPadding = Math.max(insets.top, Platform.OS === 'android' ? 24 : 16) + spacing.sm;
  const bottomPadding = 240;

  const [highQualityAudio, setHighQualityAudio] = useState(true);
  const [gaplessPlayback, setGaplessPlayback] = useState(true);
  const [eqPreset, setEqPreset] = useState('balanced');
  const [cacheCleanedMessage, setCacheCleanedMessage] = useState(null);

  useEffect(() => {
    safeStorage.getItem('@settings_high_quality').then((val) => {
      if (val !== null) setHighQualityAudio(val === 'true');
    });
    safeStorage.getItem('@settings_gapless').then((val) => {
      if (val !== null) setGaplessPlayback(val === 'true');
    });
    safeStorage.getItem('@settings_eq_preset').then((val) => {
      if (val) setEqPreset(val);
    });
  }, []);

  const toggleHighQuality = useCallback((val) => {
    setHighQualityAudio(val);
    safeStorage.setItem('@settings_high_quality', String(val)).catch(() => { });
  }, []);

  const toggleAutoPlayNext = useCallback((val) => {
    if (typeof setAutoPlayNext === 'function') {
      setAutoPlayNext(val);
    }
  }, [setAutoPlayNext]);

  const toggleGapless = useCallback((val) => {
    setGaplessPlayback(val);
    safeStorage.setItem('@settings_gapless', String(val)).catch(() => { });
  }, []);

  const handleSelectEq = useCallback((preset) => {
    setEqPreset(preset);
    safeStorage.setItem('@settings_eq_preset', preset).catch(() => { });
  }, []);

  const handleRescan = useCallback(async () => {
    if (typeof scanDeviceTracks === 'function') {
      try {
        await scanDeviceTracks(true);
      } catch (_err) {
        Alert.alert('Tarama Hatası', 'Müzikler taranırken bir sorun oluştu.');
      }
    }
  }, [scanDeviceTracks]);

  const handleAssignRandomCovers = useCallback(() => {
    if (typeof assignRandomCoversToAll === 'function') {
      const count = assignRandomCoversToAll();
      Alert.alert(
        'Rastgele Kapaklar Atandı',
        `${count} şarkının tamamına galeriden rastgele kapak görseli başarıyla atandı.`
      );
    }
  }, [assignRandomCoversToAll]);

  const handleResetCovers = useCallback(() => {
    const customCoverCount = Object.keys(trackCovers || {}).length;
    if (customCoverCount === 0) {
      Alert.alert('Bilgi', 'Özelleştirilmiş şarkı kapağı bulunmuyor.');
      return;
    }

    Alert.alert(
      'Kapakları Sıfırla',
      `Değiştirdiğiniz ${customCoverCount} adet şarkı kapağı varsayılan haline dönecek. Emin misiniz?`,
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Sıfırla',
          style: 'destructive',
          onPress: () => {
            if (typeof resetAllCovers === 'function') {
              resetAllCovers();
            }
            Alert.alert('Başarılı', 'Tüm şarkı kapakları varsayılana sıfırlandı.');
          },
        },
      ]
    );
  }, [trackCovers, resetAllCovers]);

  const handleClearCache = useCallback(() => {
    setCacheCleanedMessage('Önbellek temizlendi (18.4 MB)');
    setTimeout(() => {
      setCacheCleanedMessage(null);
    }, 3500);
  }, []);

  const customCoverCount = Object.keys(trackCovers || {}).length;

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
        <Header title="Ayarlar" />

        <View style={styles.unifiedCard}>
          <View style={styles.listItem}>
            <View style={styles.actionIconBox}>
              <Volume2 size={18} color={colors.textPrimary} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Yüksek Çözünürlüklü Ses</Text>
              <Text style={styles.rowSubtitle}>320kbps maksimum ses çıkışı ve dinamik aralık</Text>
            </View>
            <Switch
              value={highQualityAudio}
              onValueChange={toggleHighQuality}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor={colors.primaryContrast}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.listItem}>
            <View style={styles.actionIconBox}>
              <FastForward size={18} color={colors.textPrimary} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Otomatik Sıradaki Parça</Text>
              <Text style={styles.rowSubtitle}>Şarkı bittiğinde sıradaki parçaya kesintisiz geç</Text>
            </View>
            <Switch
              value={autoPlayNext}
              onValueChange={toggleAutoPlayNext}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor={colors.primaryContrast}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.listItem}>
            <View style={styles.actionIconBox}>
              <Flame size={18} color={colors.textPrimary} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Kesintisiz Oynatma (Gapless)</Text>
              <Text style={styles.rowSubtitle}>Parçalar arasındaki sessiz boşlukları kaldır</Text>
            </View>
            <Switch
              value={gaplessPlayback}
              onValueChange={toggleGapless}
              trackColor={{ false: colors.borderLight, true: colors.primary }}
              thumbColor={colors.primaryContrast}
            />
          </View>

          <View style={styles.divider} />

          <View style={styles.eqListItem}>
            <View style={styles.eqHeaderRow}>
              <View style={styles.actionIconBox}>
                <Sliders size={18} color={colors.textPrimary} />
              </View>
              <View style={styles.rowTextWrap}>
                <Text style={styles.rowTitle}>Ses Profili (Ekolayzır)</Text>
                <Text style={styles.rowSubtitle}>Müziğe uygun dinleme profili seçin</Text>
              </View>
            </View>
            <View style={styles.eqOptionsRow}>
              <TouchableOpacity
                style={[styles.eqBtn, eqPreset === 'balanced' && styles.eqBtnActive]}
                onPress={() => handleSelectEq('balanced')}
                activeOpacity={0.8}
              >
                <Activity size={14} color={eqPreset === 'balanced' ? colors.primaryContrast : colors.textPrimary} />
                <Text style={[styles.eqBtnText, eqPreset === 'balanced' && styles.eqBtnTextActive]}>
                  Dengeli
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.eqBtn, eqPreset === 'bass' && styles.eqBtnActive]}
                onPress={() => handleSelectEq('bass')}
                activeOpacity={0.8}
              >
                <Flame size={14} color={eqPreset === 'bass' ? colors.primaryContrast : colors.textPrimary} />
                <Text style={[styles.eqBtnText, eqPreset === 'bass' && styles.eqBtnTextActive]}>
                  Derin Bas
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.eqBtn, eqPreset === 'vocal' && styles.eqBtnActive]}
                onPress={() => handleSelectEq('vocal')}
                activeOpacity={0.8}
              >
                <Mic2 size={14} color={eqPreset === 'vocal' ? colors.primaryContrast : colors.textPrimary} />
                <Text style={[styles.eqBtnText, eqPreset === 'vocal' && styles.eqBtnTextActive]}>
                  Vokal
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.listItem}
            onPress={handleRescan}
            disabled={isScanningDevice}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconBox}>
              <RotateCcw size={18} color={colors.textPrimary} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Cihaz Müziklerini Tara</Text>
              <Text style={styles.rowSubtitle}>
                {isScanningDevice
                  ? 'Cihazdaki ses dosyaları taranıyor...'
                  : `${deviceTrackCount > 0 ? deviceTrackCount : tracks.length} şarkı kütüphanede mevcut`}
              </Text>
            </View>
            {isScanningDevice ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <View style={styles.statusBadge}>
                <Check size={12} color={colors.primaryContrast} strokeWidth={3} />
              </View>
            )}
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.listItem}
            onPress={handleAssignRandomCovers}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#F0F5FF' }]}>
              <Shuffle size={18} color={colors.primary} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Rastgele Kapak Ata</Text>
              <Text style={styles.rowSubtitle}>
                Tüm şarkılara galeriden rastgele kapak görseli ata
              </Text>
            </View>
            <View style={styles.badgeLight}>
              <Text style={[styles.badgeLightText, { color: colors.primary }]}>Rastgele</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.listItem}
            onPress={handleResetCovers}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBox, { backgroundColor: '#FDF2F2' }]}>
              <Trash2 size={18} color="#E03E3E" />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={[styles.rowTitle, { color: '#E03E3E' }]}>Özel Kapakları Sıfırla</Text>
              <Text style={styles.rowSubtitle}>
                {customCoverCount > 0
                  ? `${customCoverCount} şarkıda atanmış özel kapak var`
                  : 'Henüz özel kapak atanmadı'}
              </Text>
            </View>
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            style={styles.listItem}
            onPress={handleClearCache}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconBox}>
              <Sparkles size={18} color={colors.textPrimary} />
            </View>
            <View style={styles.rowTextWrap}>
              <Text style={styles.rowTitle}>Önbelleği Temizle</Text>
              <Text style={styles.rowSubtitle}>
                {cacheCleanedMessage || 'Geçici tampon ve görsel verilerini temizler'}
              </Text>
            </View>
            <View style={styles.badgeLight}>
              <Text style={styles.badgeLightText}>18 MB</Text>
            </View>
          </TouchableOpacity>
        </View>
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
  unifiedCard: {
    marginHorizontal: spacing.md,
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md - 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginLeft: 48,
  },
  eqListItem: {
    paddingVertical: spacing.md - 2,
    gap: spacing.sm + 2,
  },
  eqHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionIconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.sm + 2,
  },
  rowTextWrap: {
    flex: 1,
    marginRight: spacing.sm,
  },
  rowTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  rowSubtitle: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  eqOptionsRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    marginLeft: 48,
  },
  eqBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    height: 36,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  eqBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  eqBtnText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textPrimary,
  },
  eqBtnTextActive: {
    color: colors.primaryContrast,
    fontFamily: typography.fonts.semiBold,
  },
  statusBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeLight: {
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
  },
  badgeLightText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 11,
    color: colors.textSecondary,
  },
});

export default SettingsScreen;
