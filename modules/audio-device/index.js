import { requireNativeModule, EventEmitter } from 'expo-modules-core';

let AudioDeviceNativeModule = null;
try {
  AudioDeviceNativeModule = requireNativeModule('AudioDevice');
} catch (_) {
  // Not linked in current build or running in standard Expo Go / web
}

const emitter = AudioDeviceNativeModule ? new EventEmitter(AudioDeviceNativeModule) : null;

/**
 * Returns current connected audio device details.
 * @returns {{ isConnected: boolean, type: 'bluetooth' | 'wired' | 'speaker', name: string }}
 */
export function getConnectedAudioDevice() {
  if (AudioDeviceNativeModule && typeof AudioDeviceNativeModule.getConnectedAudioDevice === 'function') {
    try {
      const res = AudioDeviceNativeModule.getConnectedAudioDevice();
      if (res && typeof res === 'object') {
        return {
          isConnected: Boolean(res.isConnected),
          type: res.type || 'speaker',
          name: res.name || '',
        };
      }
    } catch (_) {
      // ignore
    }
  }
  return {
    isConnected: false,
    type: 'speaker',
    name: '',
  };
}

/**
 * Subscribes to audio device changes (plug/unplug/bluetooth connect/disconnect).
 * @param {(device: { isConnected: boolean, type: 'bluetooth' | 'wired' | 'speaker', name: string }) => void} callback
 * @returns {{ remove: () => void }}
 */
export function addAudioDeviceListener(callback) {
  if (emitter) {
    try {
      const subscription = emitter.addListener('onAudioDeviceChanged', (data) => {
        if (typeof callback === 'function') {
          callback({
            isConnected: Boolean(data?.isConnected),
            type: data?.type || 'speaker',
            name: data?.name || '',
          });
        }
      });
      return subscription;
    } catch (_) {
      // ignore
    }
  }
  return { remove: () => {} };
}

export default {
  getConnectedAudioDevice,
  addAudioDeviceListener,
};

