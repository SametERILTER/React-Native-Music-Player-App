import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Search, X } from 'lucide-react-native';
import { colors, typography, spacing, radius, shadows } from '../../theme';
import { useLanguage } from '../../context/LanguageContext';

export const SearchBar = React.forwardRef(({ value, onChangeText, onClear, placeholder }, ref) => {
  const { t } = useLanguage();
  const activePlaceholder = placeholder || t('search.placeholder');

  return (
    <View style={styles.container}>
      <Search size={18} color={colors.textTertiary} style={styles.searchIcon} />
      <TextInput
        ref={ref}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={activePlaceholder}
        placeholderTextColor={colors.textTertiary}
        autoCorrect={false}
        clearButtonMode="never"
      />
      {value ? (
        <TouchableOpacity
          onPress={onClear}
          style={styles.clearBtn}
          activeOpacity={0.7}
        >
          <X size={16} color={colors.textSecondary} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
});

SearchBar.displayName = 'SearchBar';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    height: 46,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.xs,
    ...shadows.subtle,
  },
  searchIcon: {
    marginRight: spacing.xs,
  },
  input: {
    flex: 1,
    fontFamily: typography.fonts.regular,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
});

export default SearchBar;
