import React from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import LibraryScreen from '../screens/LibraryScreen';
import SearchScreen from '../screens/SearchScreen';
import FavoritesScreen from '../screens/FavoritesScreen';
import SettingsScreen from '../screens/SettingsScreen';
import FloatingTabBar from '../components/navigation/FloatingTabBar';
import MiniPlayer from '../components/player/MiniPlayer';
import FullPlayerModal from '../components/player/FullPlayerModal';
import SongOptionsModal from '../components/playlist/SongOptionsModal';
import { usePlayer } from '../context/PlayerContext';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export const AppNavigator = () => {
  const {
    isFullPlayerOpen,
    openFullPlayer,
    closeFullPlayer,
    songOptionsTrack,
    closeSongOptions,
  } = usePlayer();

  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Tab.Navigator
          tabBar={(props) => <FloatingTabBar {...props} />}
          sceneContainerStyle={{ backgroundColor: colors.background }}
          screenOptions={{
            headerShown: false,
            lazy: true,
            tabBarStyle: {
              position: 'absolute',
              backgroundColor: 'transparent',
              borderTopWidth: 0,
              elevation: 0,
              shadowOpacity: 0,
              borderWidth: 0,
              bottom: 0,
              left: 0,
              right: 0,
              height: 0,
            },
          }}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Library" component={LibraryScreen} />
          <Tab.Screen name="Search" component={SearchScreen} />
          <Tab.Screen name="Favorites" component={FavoritesScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>

        <MiniPlayer onOpenFullPlayer={openFullPlayer} />

        <FullPlayerModal
          visible={isFullPlayerOpen}
          onClose={closeFullPlayer}
        />

        <SongOptionsModal
          visible={!!songOptionsTrack}
          track={songOptionsTrack}
          onClose={closeSongOptions}
        />
      </View>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
});

export default AppNavigator;
