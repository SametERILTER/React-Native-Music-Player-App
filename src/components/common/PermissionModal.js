import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Dimensions,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import {
  Music,
  HardDrive,
  ShieldCheck,
  ArrowRight,
  X,
} from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('screen');

const OPEN_MS = 320;
const CLOSE_MS = 220;
const EASE_OUT = Easing.bezier(0.16, 1, 0.3, 1);
const EASE_IN = Easing.bezier(0.7, 0, 0.84, 0);

export const PermissionModal = ({
  visible,
  onGrant,
  onClose,
  isScanning = false,
}) => {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const translateY = useSharedValue(SCREEN_HEIGHT);

  useEffect(() => {
    if (visible) {
      translateY.value = SCREEN_HEIGHT;
      translateY.value = withTiming(0, { duration: OPEN_MS, easing: EASE_OUT });
    }
  }, [visible, translateY]);

  const handleClose = useCallback(() => {
    // eslint-disable-next-line react-hooks/immutability
    translateY.value = withTiming(
      SCREEN_HEIGHT,
      { duration: CLOSE_MS, easing: EASE_IN },
      (finished) => {
        if (finished && onClose) {
          runOnJS(onClose)();
        }
      }
    );
  }, [onClose, translateY]);

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      <View style={styles.overlayRoot}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={[
            styles.sheetContainer,
            sheetAnimatedStyle,
            { paddingBottom: Math.max(insets.bottom, 16) + spacing.sm },
          ]}
        >
          <View style={styles.handleBar} />

          <View style={styles.topBar}>
            <View style={styles.badgeWrap}>
              <Text style={styles.badgeText}>{t('permission.badge')}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={handleClose}
              activeOpacity={0.65}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            >
              <X size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            bounces={false}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.mainContent}>
              {/* Header / Title */}
              <View style={styles.headerArea}>
                <View style={styles.iconCircle}>
                  <Music size={28} color={colors.textPrimary} strokeWidth={2.2} />
                </View>
                <Text style={styles.title}>{t('permission.modalTitle')}</Text>
                <Text style={styles.subtitle}>{t('permission.modalSubtitle')}</Text>
              </View>

              {/* Informative Explanation */}
              <View style={styles.infoBox}>
                <Text style={styles.descriptionText}>
                  {t('permission.description')}
                </Text>
              </View>

              {/* Feature Bullets */}
              <View style={styles.featureList}>
                <View style={styles.featureItem}>
                  <View style={styles.featureIconWrap}>
                    <Music size={18} color={colors.textPrimary} />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>
                      {t('permission.feature1Title')}
                    </Text>
                    <Text style={styles.featureDesc}>
                      {t('permission.feature1Desc')}
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <View style={styles.featureIconWrap}>
                    <HardDrive size={18} color={colors.textPrimary} />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>
                      {t('permission.feature2Title')}
                    </Text>
                    <Text style={styles.featureDesc}>
                      {t('permission.feature2Desc')}
                    </Text>
                  </View>
                </View>

                <View style={[styles.featureItem, styles.featureItemLast]}>
                  <View style={styles.featureIconWrap}>
                    <ShieldCheck size={18} color={colors.textPrimary} />
                  </View>
                  <View style={styles.featureTextWrap}>
                    <Text style={styles.featureTitle}>
                      {t('permission.feature3Title')}
                    </Text>
                    <Text style={styles.featureDesc}>
                      {t('permission.feature3Desc')}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actionsWrap}>
              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={onGrant}
                disabled={isScanning}
                activeOpacity={0.85}
              >
                {isScanning ? (
                  <ActivityIndicator size="small" color={colors.primaryContrast} />
                ) : (
                  <>
                    <Text style={styles.primaryBtnText}>
                      {t('permission.grantButton')}
                    </Text>
                    <ArrowRight
                      size={18}
                      color={colors.primaryContrast}
                      style={styles.arrowIcon}
                    />
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.secondaryBtn}
                onPress={handleClose}
                disabled={isScanning}
                activeOpacity={0.65}
              >
                <Text style={styles.secondaryBtnText}>
                  {t('permission.laterButton')}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayRoot: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.62)',
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  sheetContainer: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xs,
    height: Math.round(SCREEN_HEIGHT * 0.88),
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.14,
        shadowRadius: 18,
      },
      android: {
        elevation: 24,
      },
    }),
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.15)',
    alignSelf: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xs,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
  },
  badgeWrap: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 5,
    borderRadius: radius.full,
  },
  badgeText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: 10.5,
    color: colors.textPrimary,
    letterSpacing: 0.8,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    flexGrow: 1,
    justifyContent: 'space-between',
  },
  mainContent: {
    flex: 1,
  },
  headerArea: {
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  iconCircle: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderWidth: 1,
    borderColor: colors.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.xl + 1,
    color: colors.textPrimary,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
  },
  infoBox: {
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    marginVertical: spacing.sm + 2,
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  descriptionText: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs + 1.5,
    color: colors.textSecondary,
    lineHeight: 21,
    textAlign: 'center',
  },
  featureList: {
    marginVertical: spacing.xs,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.04)',
  },
  featureItemLast: {
    borderBottomWidth: 0,
  },
  featureIconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm + 2,
    marginTop: 2,
  },
  featureTextWrap: {
    flex: 1,
  },
  featureTitle: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    letterSpacing: -0.2,
  },
  featureDesc: {
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    lineHeight: 17,
    marginTop: 2,
  },
  actionsWrap: {
    marginTop: spacing.md,
    paddingTop: spacing.xs,
    gap: spacing.xs,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    paddingVertical: 15,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  primaryBtnText: {
    fontFamily: typography.fonts.bold,
    fontSize: typography.sizes.sm + 1,
    color: colors.primaryContrast,
    letterSpacing: -0.2,
  },
  arrowIcon: {
    marginLeft: 6,
  },
  secondaryBtn: {
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryBtnText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});

export default PermissionModal;
