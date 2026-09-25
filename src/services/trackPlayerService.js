import TrackPlayer, { Capability, Event } from 'react-native-track-player';

/**
 * Arka Plan Medya Kontrolleri ve Oynatma Servisi
 */
export const PlaybackService = async () => {
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => TrackPlayer.seekTo(event.position));
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.reset());
};

/**
 * TrackPlayer Kurulum Fonksiyonu
 */
export const setupTrackPlayer = async () => {
  let isSetup = false;
  try {
    if (!TrackPlayer || typeof TrackPlayer.setupPlayer !== 'function') {
      return false;
    }
    await TrackPlayer.setupPlayer({});
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
      ],
    });
    isSetup = true;
  } catch (error) {
    if (
      error?.message?.includes('already initialized') ||
      error?.message?.includes('already setup')
    ) {
      isSetup = true;
    } else {
      console.warn('TrackPlayer native modül kurulumu uyarısı:', error?.message || error);
    }
  }
  return isSetup;
};
