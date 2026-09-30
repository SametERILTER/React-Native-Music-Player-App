import { NativeModules, TurboModuleRegistry } from 'react-native';

const inMemoryStorage = {};

const isNativeStorageAvailable = () => {
  try {
    if (typeof TurboModuleRegistry !== 'undefined' && TurboModuleRegistry?.get) {
      const tm =
        TurboModuleRegistry.get('PlatformLocalStorage') ||
        TurboModuleRegistry.get('RNC_AsyncSQLiteDBStorage') ||
        TurboModuleRegistry.get('RNCAsyncStorage');
      if (tm) return true;
    }
  } catch (_) {}

  try {
    if (typeof NativeModules !== 'undefined' && NativeModules) {
      const nm =
        NativeModules.PlatformLocalStorage ||
        NativeModules.RNC_AsyncSQLiteDBStorage ||
        NativeModules.RNCAsyncStorage ||
        NativeModules.AsyncSQLiteDBStorage ||
        NativeModules.AsyncLocalStorage;
      if (nm) return true;
    }
  } catch (_) {}

  return false;
};

let cachedAsyncStorage = null;
let attemptedLoad = false;

const getAsyncStorageInstance = () => {
  if (attemptedLoad) return cachedAsyncStorage;
  attemptedLoad = true;

  if (!isNativeStorageAvailable()) {
    return null;
  }

  try {
    const mod = require('@react-native-async-storage/async-storage');
    cachedAsyncStorage = mod?.default || mod;
    return cachedAsyncStorage;
  } catch (_err) {
    return null;
  }
};

export const safeStorage = {
  getItem: async (key) => {
    try {
      const storage = getAsyncStorageInstance();
      if (storage && typeof storage.getItem === 'function') {
        const res = await storage.getItem(key);
        if (res !== null && res !== undefined) return res;
      }
    } catch (_) {}
    return inMemoryStorage[key] || null;
  },

  setItem: async (key, value) => {
    inMemoryStorage[key] = value;
    try {
      const storage = getAsyncStorageInstance();
      if (storage && typeof storage.setItem === 'function') {
        await storage.setItem(key, value);
      }
    } catch (_) {}
  },

  removeItem: async (key) => {
    delete inMemoryStorage[key];
    try {
      const storage = getAsyncStorageInstance();
      if (storage && typeof storage.removeItem === 'function') {
        await storage.removeItem(key);
      }
    } catch (_) {}
  },
};

export default safeStorage;

