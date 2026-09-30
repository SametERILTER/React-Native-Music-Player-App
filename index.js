import 'react-native-reanimated';
import { registerRootComponent } from 'expo';

import App from './App';
import { PlaybackService, getTrackPlayer } from './src/services/trackPlayerService';

registerRootComponent(App);

const TrackPlayer = getTrackPlayer();
if (TrackPlayer && typeof TrackPlayer.registerPlaybackService === 'function') {
  try {
    TrackPlayer.registerPlaybackService(() => PlaybackService);
  } catch (error) {
  }
}

