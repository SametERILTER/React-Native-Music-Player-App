import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Appearance, useColorScheme } from 'react-native';
import { safeStorage } from '../services/storageService';
import { lightColors, darkColors, applyThemeColors } from '../theme/colors';

const THEME_STORAGE_KEY = '@app_theme_mode';

const ThemeContext = createContext({
  themeMode: 'dark',
  isDark: true,
  colors: darkColors,
  setThemeMode: () => {},
  toggleTheme: () => {},
  isThemeLoaded: true,
});

export const ThemeProvider = ({ children }) => {
  const rnColorScheme = useColorScheme();
  const [listenerScheme, setListenerScheme] = useState(() => {
    try {
      return Appearance?.getColorScheme?.() || 'dark';
    } catch (_) {
      return 'dark';
    }
  });
  const [themeMode, setThemeModeState] = useState('dark');
  const [isThemeLoaded, setIsThemeLoaded] = useState(false);

  const systemScheme =
    rnColorScheme === 'light' || rnColorScheme === 'dark'
      ? rnColorScheme
      : listenerScheme;

  useEffect(() => {
    if (!Appearance?.addChangeListener) return;
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (colorScheme === 'light' || colorScheme === 'dark') {
        setListenerScheme(colorScheme);
      }
    });
    return () => {
      subscription?.remove?.();
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    safeStorage
      .getItem(THEME_STORAGE_KEY)
      .then((saved) => {
        if (isMounted) {
          if (saved === 'light' || saved === 'dark' || saved === 'system') {
            setThemeModeState(saved);
          }
          setIsThemeLoaded(true);
        }
      })
      .catch(() => {
        if (isMounted) setIsThemeLoaded(true);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const isDark = useMemo(() => {
    if (themeMode === 'system') {
      return systemScheme !== 'light';
    }
    return themeMode === 'dark';
  }, [themeMode, systemScheme]);

  const activeColors = useMemo(() => {
    applyThemeColors(isDark);
    return isDark ? darkColors : lightColors;
  }, [isDark]);

  useEffect(() => {
    applyThemeColors(isDark);
  }, [isDark]);

  const setThemeMode = useCallback(
    (mode) => {
      if (mode !== 'light' && mode !== 'dark' && mode !== 'system') return;
      const nextIsDark = mode === 'system' ? systemScheme !== 'light' : mode === 'dark';
      applyThemeColors(nextIsDark);
      setThemeModeState(mode);
      safeStorage.setItem(THEME_STORAGE_KEY, mode).catch(() => {});
    },
    [systemScheme]
  );

  const toggleTheme = useCallback(() => {
    setThemeModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      applyThemeColors(next === 'dark');
      safeStorage.setItem(THEME_STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      themeMode,
      isDark,
      colors: activeColors,
      setThemeMode,
      toggleTheme,
      isThemeLoaded,
    }),
    [themeMode, isDark, activeColors, setThemeMode, toggleTheme, isThemeLoaded]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    return {
      themeMode: 'dark',
      isDark: true,
      colors: darkColors,
      setThemeMode: () => {},
      toggleTheme: () => {},
      isThemeLoaded: true,
    };
  }
  return context;
};

export default ThemeContext;

