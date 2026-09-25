import 'react-native-reanimated';
import { registerRootComponent } from 'expo';
import TrackPlayer from 'react-native-track-player';

import App from './App';
import { PlaybackService } from './src/services/trackPlayerService';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
registerRootComponent(App);

// Arka plan oynatma servisini kaydet (TrackPlayer)
try {
  TrackPlayer.registerPlaybackService(() => PlaybackService);
} catch (error) {
  // Expo Go veya native modülsüz ortamlarda sessizce yutulur
}
