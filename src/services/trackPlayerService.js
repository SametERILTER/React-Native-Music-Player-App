let TrackPlayerModule = null;
let CapabilityModule = {};
let EventModule = {};
let StateModule = {};

try {
  const RNTrackPlayer = require('react-native-track-player');
  TrackPlayerModule = RNTrackPlayer.default || RNTrackPlayer;
  CapabilityModule = RNTrackPlayer.Capability || {};
  EventModule = RNTrackPlayer.Event || {};
  StateModule = RNTrackPlayer.State || {};
} catch (e) {
  console.log('TrackPlayer native modülü bu ortamda mevcut değil (Expo Go / Web):', e?.message || e);
}

export const getTrackPlayer = () => TrackPlayerModule;
export const Capability = CapabilityModule;
export const Event = EventModule;
export const State = StateModule;

let serviceCallbacks = {
  onNext: null,
  onPrevious: null,
  onPlay: null,
  onPause: null,
  onTrackEnded: null,
};

export const registerServiceCallbacks = (callbacks) => {
  serviceCallbacks = { ...serviceCallbacks, ...callbacks };
};

export const PlaybackService = async () => {
  if (!TrackPlayerModule) return;
  try {
    TrackPlayerModule.addEventListener(EventModule.RemotePlay || 'remote-play', () => {
      if (serviceCallbacks.onPlay) {
        serviceCallbacks.onPlay();
      } else {
        TrackPlayerModule.play();
      }
    });
    TrackPlayerModule.addEventListener(EventModule.RemotePause || 'remote-pause', () => {
      if (serviceCallbacks.onPause) {
        serviceCallbacks.onPause();
      } else {
        TrackPlayerModule.pause();
      }
    });
    TrackPlayerModule.addEventListener(EventModule.RemoteNext || 'remote-next', () => {
      if (serviceCallbacks.onNext) {
        serviceCallbacks.onNext();
      } else {
        TrackPlayerModule.skipToNext();
      }
    });
    TrackPlayerModule.addEventListener(EventModule.RemotePrevious || 'remote-previous', () => {
      if (serviceCallbacks.onPrevious) {
        serviceCallbacks.onPrevious();
      } else {
        TrackPlayerModule.skipToPrevious();
      }
    });
    TrackPlayerModule.addEventListener(EventModule.RemoteSeek || 'remote-seek', (event) => {
      TrackPlayerModule.seekTo(event.position);
    });
    TrackPlayerModule.addEventListener(EventModule.RemoteStop || 'remote-stop', () => {
      TrackPlayerModule.reset();
    });
    TrackPlayerModule.addEventListener(EventModule.PlaybackQueueEnded || 'playback-queue-ended', () => {
      if (serviceCallbacks.onTrackEnded) {
        serviceCallbacks.onTrackEnded();
      }
    });
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

