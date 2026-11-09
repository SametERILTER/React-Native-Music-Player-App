import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import {
  ArrowUpDown,
  ArrowDownAZ,
  ArrowDownZA,
  Clock,
  Timer,
} from 'lucide-react-native';
import { typography, spacing, radius } from '../../theme';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { SORT_MODES } from '../../utils/trackSorter';

export const TrackSortBar = ({
  activeSort = SORT_MODES.DEFAULT,
  onSelectSort,
  showDefault = true,
  style,
}) => {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const styles = useMemo(() => createStyles(colors, isDark), [colors, isDark]);

  const sortOptions = useMemo(() => {
    const list = [];
    if (showDefault) {
      list.push({
        id: SORT_MODES.DEFAULT,
        label: t('sort.default'),
        Icon: ArrowUpDown,
      });
    }
    list.push(
      {
        id: SORT_MODES.TITLE_ASC,
        label: t('sort.titleAsc'),
        Icon: ArrowDownAZ,
      },
      {
        id: SORT_MODES.TITLE_DESC,
        label: t('sort.titleDesc'),
        Icon: ArrowDownZA,
      },
      {
        id: SORT_MODES.DATE_DESC,
        label: t('sort.dateDesc'),
        Icon: Clock,
      },
      {
        id: SORT_MODES.DURATION_DESC,
        label: t('sort.durationDesc'),
        Icon: Timer,
      },
      {
        id: SORT_MODES.DURATION_ASC,
        label: t('sort.durationAsc'),
        Icon: Timer,
      }
    );
    return list;
  }, [showDefault, t]);

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {sortOptions.map((opt) => {
          const isSelected = activeSort === opt.id;
          const Icon = opt.Icon;
          return (
            <TouchableOpacity
              key={opt.id}
              style={[
                styles.pill,
                isSelected ? styles.pillActive : styles.pillInactive,
              ]}
              onPress={() => onSelectSort(opt.id)}
              activeOpacity={0.75}
            >
              <Icon
                size={13}
                color={isSelected ? colors.primaryContrast : isDark ? '#FFFFFF' : colors.textPrimary}
                strokeWidth={isSelected ? 2.4 : 2}
                style={styles.pillIcon}
              />
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextActive : styles.pillTextInactive,
                ]}
                numberOfLines={1}
              >
                {opt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors, isDark) =>
  StyleSheet.create({
    container: {
      marginTop: spacing.xs + 2,
      marginBottom: spacing.xs,
    },
    scrollContent: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: 6,
      paddingHorizontal: 12,
      borderRadius: radius.full,
    },
    pillActive: {
      backgroundColor: colors.primary,
    },
    pillInactive: {
      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.05)',
      borderWidth: 1,
      borderColor: isDark ? 'transparent' : 'rgba(0, 0, 0, 0.06)',
    },
    pillIcon: {
      marginRight: 5,
    },
    pillText: {
      fontFamily: typography.fonts.medium,
      fontSize: typography.sizes.xs - 0.5,
      letterSpacing: 0.1,
    },
    pillTextActive: {
      color: colors.primaryContrast,
      fontFamily: typography.fonts.semiBold,
    },
    pillTextInactive: {
      color: isDark ? 'rgba(255, 255, 255, 0.82)' : colors.textPrimary,
    },
  });

export default TrackSortBar;

