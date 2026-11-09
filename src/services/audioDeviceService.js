import { getConnectedAudioDevice, addAudioDeviceListener } from '../../modules/audio-device';

class AudioDeviceService {
  constructor() {
    this._listeners = new Set();
    this._currentDevice = {
      isConnected: false,
      type: 'speaker',
      name: '',
    };
    this._subscription = null;
    this._initialized = false;
  }

  init() {
    if (this._initialized) return;
    this._initialized = true;

    try {
      this._currentDevice = getConnectedAudioDevice();
    } catch (_) {
      // fallback
    }

    try {
      this._subscription = addAudioDeviceListener((device) => {
        this._currentDevice = device;
        this._notifyListeners(device);
      });
    } catch (_) {
      // fallback
    }
  }

  getCurrentDevice() {
    try {
      const live = getConnectedAudioDevice();
      if (live) {
        this._currentDevice = live;
      }
    } catch (_) {
      // ignore
    }
    return this._currentDevice;
  }

  subscribe(callback) {
    this.init();
    this._listeners.add(callback);
    // Send initial device immediately
    try {
      callback(this._currentDevice);
    } catch (_) {
      // ignore
    }

    return () => {
      this._listeners.delete(callback);
    };
  }

  _notifyListeners(device) {
    for (const listener of this._listeners) {
      try {
        listener(device);
      } catch (_) {
        // ignore
      }
    }
  }

  destroy() {
    if (this._subscription && typeof this._subscription.remove === 'function') {
      try {
        this._subscription.remove();
      } catch (_) {
        // ignore
      }
      this._subscription = null;
    }
    this._listeners.clear();
    this._initialized = false;
  }
}

export const audioDeviceService = new AudioDeviceService();
export default audioDeviceService;

