import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, typography, spacing, radius } from '../../theme';

export const FilterPills = ({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <View style={styles.container}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.pill,
                isSelected ? styles.pillActive : styles.pillInactive,
              ]}
              onPress={() => onSelectCategory(cat.id)}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.pillText,
                  isSelected ? styles.pillTextActive : styles.pillTextInactive,
                ]}
              >
                {cat.label}
              </Text>
              {cat.count !== undefined && (
                <View
                  style={[
                    styles.countBadge,
                    isSelected ? styles.countBadgeActive : styles.countBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.countText,
                      isSelected ? styles.countTextActive : styles.countTextInactive,
                    ]}
                  >
                    {cat.count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xs,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: radius.full,
  },
  pillActive: {
    backgroundColor: colors.primary,
  },
  pillInactive: {
    backgroundColor: colors.card,
  },
  pillText: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.sm,
  },
  pillTextActive: {
    color: colors.primaryContrast,
  },
  pillTextInactive: {
    color: colors.textSecondary,
  },
  countBadge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.full,
  },
  countBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  countBadgeInactive: {
    backgroundColor: colors.backgroundSecondary,
  },
  countText: {
    fontFamily: typography.fonts.semiBold,
    fontSize: typography.sizes.xxs,
  },
  countTextActive: {
    color: colors.primaryContrast,
  },
  countTextInactive: {
    color: colors.textMuted,
  },
});

export default FilterPills;
