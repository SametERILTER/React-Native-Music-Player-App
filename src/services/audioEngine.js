import { createAudioPlayer } from 'expo-audio';

class AudioEngine {
  constructor() {
    this.player = null;
    this.onStatusUpdate = null;
    this.statusInterval = null;
  }

  async loadAndPlay(uri, statusCallback) {
    this.onStatusUpdate = statusCallback;

    await this.cleanup();

    if (!uri) return;

    try {
      this.player = createAudioPlayer({
        uri: uri,
      });

      this.player.play();

      this.startStatusPolling();
    } catch (error) {
      console.warn('AudioEngine çalma hatası:', error);
    }
  }

  startStatusPolling() {
    if (this.statusInterval) clearInterval(this.statusInterval);

    this.statusInterval = setInterval(() => {
      if (!this.player) return;

      try {
        const currentTime = this.player.currentTime || 0;
        const duration = this.player.duration || 0;
        const isPlaying = this.player.playing || false;

        if (this.onStatusUpdate) {
          this.onStatusUpdate({
            isLoaded: true,
            isPlaying: isPlaying,
            positionMillis: currentTime * 1000,
            durationMillis: duration * 1000,
            didJustFinish: duration > 0 && currentTime >= duration - 0.5,
          });
        }
      } catch (e) {
      }
    }, 500);
  }

  async play() {
    try {
      if (this.player) {
        this.player.play();
      }
    } catch (e) {
      console.warn('AudioEngine play hatası:', e);
    }
  }

  async pause() {
    try {
      if (this.player) {
        this.player.pause();
      }
    } catch (e) {
      console.warn('AudioEngine pause hatası:', e);
    }
  }

  async seek(seconds) {
    try {
      if (this.player) {
        this.player.seekTo(seconds);
      }
    } catch (e) {
      console.warn('AudioEngine seek hatası:', e);
    }
  }

  async cleanup() {
    if (this.statusInterval) {
      clearInterval(this.statusInterval);
      this.statusInterval = null;
    }

    if (this.player) {
      try {
        this.player.pause();
        if (typeof this.player.remove === 'function') {
          this.player.remove();
        }
      } catch (e) {
      }
      this.player = null;
    }
  }
}

export const audioEngine = new AudioEngine();
export default audioEngine;
