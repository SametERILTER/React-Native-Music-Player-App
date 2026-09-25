import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { RefreshCw, Music } from 'lucide-react-native';
import { colors, typography, spacing, radius } from '../../theme';

export const Header = ({ title, subtitle, onRefresh, isRefreshing }) => {
  return (
    <View style={styles.container}>
      <View style={styles.titleWrapper}>
        {subtitle ? <Text style={styles.subtitle}>{subtitle.toUpperCase()}</Text> : null}
        <Text style={styles.title}>{title}</Text>
      </View>

      {onRefresh && (
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <RefreshCw
            size={18}
            color={colors.textPrimary}
            style={isRefreshing ? styles.spinning : undefined}
          />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  titleWrapper: {
    flex: 1,
  },
  subtitle: {
    fontFamily: typography.fonts.medium,
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    letterSpacing: typography.letterSpacing.wide,
    marginBottom: spacing.xxs,
  },
  title: {
    fontFamily: typography.fonts.headerBold,
    fontSize: typography.sizes.display,
    color: colors.headerTitle,
    letterSpacing: typography.letterSpacing.tight,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.shadowColor,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
    marginBottom: 4,
  },
  spinning: {
    opacity: 0.6,
  },
});

export default Header;
