let TrackPlayerModule = null;
let CapabilityModule = {};
let EventModule = {};

try {
  const RNTrackPlayer = require('react-native-track-player');
  TrackPlayerModule = RNTrackPlayer.default || RNTrackPlayer;
  CapabilityModule = RNTrackPlayer.Capability || {};
  EventModule = RNTrackPlayer.Event || {};
} catch (e) {
  console.log('TrackPlayer native modülü bu ortamda mevcut değil (Expo Go / Web):', e?.message || e);
}

export const getTrackPlayer = () => TrackPlayerModule;
export const Capability = CapabilityModule;
export const Event = EventModule;

export const PlaybackService = async () => {
  if (!TrackPlayerModule) return;
  try {
    TrackPlayerModule.addEventListener(EventModule.RemotePlay, () => TrackPlayerModule.play());
    TrackPlayerModule.addEventListener(EventModule.RemotePause, () => TrackPlayerModule.pause());
    TrackPlayerModule.addEventListener(EventModule.RemoteNext, () => TrackPlayerModule.skipToNext());
    TrackPlayerModule.addEventListener(EventModule.RemotePrevious, () => TrackPlayerModule.skipToPrevious());
    TrackPlayerModule.addEventListener(EventModule.RemoteSeek, (event) => TrackPlayerModule.seekTo(event.position));
    TrackPlayerModule.addEventListener(EventModule.RemoteStop, () => TrackPlayerModule.reset());
  } catch (e) {
    console.warn('PlaybackService event ekleme uyarısı:', e);
  }
};
let isPlayerInitialized = false;
let setupPromise = null;

export const setupTrackPlayer = async () => {
  if (!TrackPlayerModule || typeof TrackPlayerModule.setupPlayer !== 'function') {
    return false;
  }
  if (isPlayerInitialized) {
    return true;
  }
  if (setupPromise) {
    return setupPromise;
  }

  setupPromise = (async () => {
    let isSetup = false;
    try {
      await TrackPlayerModule.setupPlayer({});
      await TrackPlayerModule.updateOptions({
        capabilities: [
          CapabilityModule.Play,
          CapabilityModule.Pause,
          CapabilityModule.SkipToNext,
          CapabilityModule.SkipToPrevious,
          CapabilityModule.SeekTo,
        ],
        compactCapabilities: [
          CapabilityModule.Play,
          CapabilityModule.Pause,
          CapabilityModule.SkipToNext,
        ],
        notificationCapabilities: [
          CapabilityModule.Play,
          CapabilityModule.Pause,
          CapabilityModule.SkipToNext,
          CapabilityModule.SkipToPrevious,
        ],
      });
      isSetup = true;
      isPlayerInitialized = true;
    } catch (error) {
      const errCode = error?.code;
      const errMsg = (error?.message || String(error || '')).toLowerCase();
      if (
        errCode === 'player_already_initialized' ||
        errMsg.includes('already') ||
        errMsg.includes('setup')
      ) {
        isSetup = true;
        isPlayerInitialized = true;
      } else {
        console.warn('TrackPlayer native modül kurulumu uyarısı:', error?.message || error);
      }
    } finally {
      setupPromise = null;
    }
    return isSetup;
  })();

  return setupPromise;
};

