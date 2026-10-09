import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet, Appearance } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
} from '@expo-google-fonts/geist';
import { Doto_900Black } from '@expo-google-fonts/doto';

import { LanguageProvider } from './src/context/LanguageContext';
import { PlayerProvider } from './src/context/PlayerContext';
import AppNavigator from './src/navigation/AppNavigator';
import { colors } from './src/theme';

if (Appearance && Appearance.setColorScheme) {
  try {
    Appearance.setColorScheme('light');
  } catch (e) { }
}

export default function App() {
  useEffect(() => {
    if (Appearance && Appearance.setColorScheme) {
      try {
        Appearance.setColorScheme('light');
      } catch (e) { }
    }
  }, []);
  const [fontsLoaded] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
    Doto_900Black,
  });

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="small" color={colors.textPrimary} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <PlayerProvider>
          <StatusBar style="dark" backgroundColor={colors.background} />
          <AppNavigator />
        </PlayerProvider>
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
