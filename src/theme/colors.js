export const lightColors = {
  background: '#F3F3F4',
  backgroundSecondary: '#EAEAEA',

  card: '#FFFFFF',
  cardSubtle: '#F3F3F4',
  cardSelected: '#EEEEEE',
  cardHigh: '#E8E8E8',

  border: '#E2E2E2',
  borderLight: '#EEEEEE',
  borderMuted: '#C8C5CA',

  headerTitle: '#000000',
  textPrimary: '#000000',
  textSecondary: '#47464A',
  textMuted: '#78767B',
  textTertiary: '#9E9CA1',
  textInverse: '#FFFFFF',

  primary: '#000000',
  primaryHover: '#1C1B1D',
  primaryContrast: '#FFFFFF',
  secondary: '#5D5E66',

  tabBarBackground: '#FFFFFF',
  tabBarActive: '#28292E',
  tabBarInactive: '#78767B',
  tabBarPill: '#28292E',

  miniPlayerBackground: '#28292E',
  miniPlayerTextPrimary: '#FFFFFF',
  miniPlayerTextSecondary: '#A5A6AF',
  progressBarBackground: '#E8E8E8',
  progressBarFill: '#000000',

  error: '#BA1A1A',
  errorBg: 'rgba(186, 26, 26, 0.09)',
  errorBorder: '#FCA5A5',

  surfaceHighlight: 'rgba(0, 0, 0, 0.04)',
  surfaceSubtle: 'rgba(0, 0, 0, 0.05)',
  artworkPatternBg: '#FAFAFA',

  gradientTop: [
    '#F3F3F4',
    'rgba(243, 243, 244, 0.85)',
    'rgba(243, 243, 244, 0)',
  ],
  gradientBottom: [
    'rgba(243, 243, 244, 0)',
    'rgba(243, 243, 244, 0.5)',
    'rgba(243, 243, 244, 0.95)',
    '#F3F3F4',
  ],
  gradientStickySearch: [
    '#F3F3F4',
    '#F3F3F4',
    'rgba(243, 243, 244, 0.95)',
    'rgba(243, 243, 244, 0.65)',
    'rgba(243, 243, 244, 0)',
  ],
};

export const darkColors = {
  background: '#050505',
  backgroundSecondary: '#181818',

  card: '#121212',
  cardSubtle: '#1A1A1A',
  cardSelected: '#202020',
  cardHigh: '#262626',

  border: 'transparent',
  borderLight: 'transparent',
  borderMuted: '#333333',

  headerTitle: '#FFFFFF',
  textPrimary: '#F5F5F5',
  textSecondary: '#B8B8B8',
  textMuted: '#888888',
  textTertiary: '#636363',
  textInverse: '#050505',

  primary: '#FFFFFF',
  primaryHover: '#E6E6E6',
  primaryContrast: '#050505',
  secondary: '#969696',

  tabBarBackground: '#1C1C1C',
  tabBarActive: '#FFFFFF',
  tabBarInactive: '#828282',
  tabBarPill: '#FFFFFF',

  miniPlayerBackground: '#222222',
  miniPlayerTextPrimary: '#FFFFFF',
  miniPlayerTextSecondary: '#A3A3A3',
  progressBarBackground: '#262626',
  progressBarFill: '#FFFFFF',

  error: '#FF6B6B',
  errorBg: 'rgba(255, 107, 107, 0.14)',
  errorBorder: 'transparent',

  surfaceHighlight: 'rgba(255, 255, 255, 0.06)',
  surfaceSubtle: 'rgba(255, 255, 255, 0.07)',
  artworkPatternBg: '#171717',

  gradientTop: [
    '#050505',
    'rgba(5, 5, 5, 0.85)',
    'rgba(5, 5, 5, 0)',
  ],
  gradientBottom: [
    'rgba(5, 5, 5, 0)',
    'rgba(5, 5, 5, 0.5)',
    'rgba(5, 5, 5, 0.95)',
    '#050505',
  ],
  gradientStickySearch: [
    '#050505',
    '#050505',
    'rgba(5, 5, 5, 0.95)',
    'rgba(5, 5, 5, 0.65)',
    'rgba(5, 5, 5, 0)',
  ],
};

export const colors = { ...darkColors };

export const applyThemeColors = (isDark) => {
  const target = isDark ? darkColors : lightColors;
  Object.assign(colors, target);
  return target;
};

export default colors;
