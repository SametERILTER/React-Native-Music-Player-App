import { getTrackPlayer } from './trackPlayerService';

/**
 * Şarkı geçişleri için crossfade.
 *
 * react-native-track-player tek ses motoru kullanır. Şarkıları üst üste çalmak için
 * biten şarkının kalan kısmını ikinci bir ses motoruna (expo-audio) devrediyoruz:
 *   1. Şarkı bitmeden önce expo-audio oynatıcısı aynı şarkıyı sessizce hazırlar.
 *   2. Geçiş anında aynı konumdan çalmaya başlar, ses kısa bir süre içinde ona devredilir.
 *   3. Track player sıradaki şarkıyı başlatır ve sesi yavaşça açılır.
 *   4. expo-audio oynatıcısı kalan süre boyunca sesi kısarak biter.
 * Herhangi bir adım başarısız olursa eski usul fade-out/fade-in'e geri dönülür.
 */

const STEP_MS = 60;
const AUTO_TRANSITION_WINDOW_MS = 3000;
const ALLOWED_SECONDS = [0, 3, 5, 8, 12];
const HANDOFF_MS = 160;

let crossfadeSeconds = 0;
let timer = null;
let helperTimer = null;
let fadingOut = false;
let autoTransitionAt = 0;
let overlapStartedFor = null;

let helper = null;
let helperUri = null;
let audioModeConfigured = false;

export const normalizeCrossfadeSeconds = (value) => {
  const n = Number(value);
  return ALLOWED_SECONDS.includes(n) ? n : 0;
};

export const CROSSFADE_OPTIONS = ALLOWED_SECONDS;

export const getCrossfadeSeconds = () => crossfadeSeconds;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const setVolume = async (value) => {
  const TrackPlayer = getTrackPlayer();
  if (!TrackPlayer || typeof TrackPlayer.setVolume !== 'function') return;
  try {
    await TrackPlayer.setVolume(Math.min(1, Math.max(0, value)));
  } catch (_) {
    // Ses ayarı başarısız olursa sessizce devam et
  }
};

export const setVolumeImmediately = (value) => setVolume(value);

const setHelperVolume = (value) => {
  if (!helper) return;
  try {
    helper.volume = Math.min(1, Math.max(0, value));
  } catch (_) {
    // Oynatıcı serbest bırakılmış olabilir
  }
};

export const releaseHelper = () => {
  if (helperTimer) {
    clearInterval(helperTimer);
    helperTimer = null;
  }
  if (helper) {
    try {
      helper.pause();
    } catch (_) {}
    try {
      helper.remove();
    } catch (_) {}
  }
  helper = null;
  helperUri = null;
};

export const isFadingOut = () => fadingOut;

export const cancelFade = (restoreVolume = true) => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  releaseHelper();
  fadingOut = false;
  overlapStartedFor = null;
  if (restoreVolume) {
    setVolume(1);
  }
};

export const setCrossfadeSecondsValue = (value) => {
  crossfadeSeconds = normalizeCrossfadeSeconds(value);
  if (crossfadeSeconds === 0) {
    cancelFade(true);
  }
};

// Yumuşak S-eğrisi: başlangıçta ve bitişte ani değişim olmaz
const fadeOutCurve = (t) => Math.pow(Math.sin((t * Math.PI) / 2), 2);
const fadeInCurve = (t) => Math.sin((t * Math.PI) / 2);

const runFade = (from, to, durationMs, curve) => {
  const startedAt = Date.now();
  timer = setInterval(() => {
    const t = Math.min(1, (Date.now() - startedAt) / durationMs);
    setVolume(from + (to - from) * curve(t));
    if (t >= 1) {
      clearInterval(timer);
      timer = null;
    }
  }, STEP_MS);
};

export const fadeOut = (durationMs) => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  fadingOut = true;
  runFade(1, 0, Math.max(200, durationMs), fadeOutCurve);
};

export const fadeIn = (durationMs) => {
  if (timer) {
    clearInterval(timer);
    timer = null;
  }
  fadingOut = false;
  runFade(0, 1, Math.max(200, durationMs), fadeInCurve);
};

// --- Üst üste bindirme (overlap) -------------------------------------------

const getAudioModule = () => {
  try {
    return require('expo-audio');
  } catch (_) {
    return null;
  }
};

// Şarkı bitmeden önce çağrılır; ikinci oynatıcıyı sessizce hazırlar.
export const prepareOverlap = (uri) => {
  if (!uri) return;
  if (helper && helperUri === uri) return;
  releaseHelper();
  const Audio = getAudioModule();
  if (!Audio || typeof Audio.createAudioPlayer !== 'function') return;
  try {
    // Ekran kilitliyken de ikinci oynatıcı çalmaya devam etsin; müziği kesmesin
    if (!audioModeConfigured && typeof Audio.setAudioModeAsync === 'function') {
      audioModeConfigured = true;
      Promise.resolve(
        Audio.setAudioModeAsync({ shouldPlayInBackground: true, interruptionMode: 'mixWithOthers' })
      ).catch(() => {});
    }
    helper = Audio.createAudioPlayer({ uri });
    helper.volume = 0;
    helperUri = uri;
  } catch (_) {
    helper = null;
    helperUri = null;
  }
};

export const hasOverlapStarted = (trackId) =>
  trackId != null && overlapStartedFor === trackId;

export const markOverlapStarted = (trackId) => {
  overlapStartedFor = trackId;
};

export const clearOverlapStart = () => {
  overlapStartedFor = null;
};

const readMainPosition = async () => {
  const TrackPlayer = getTrackPlayer();
  const prog = await TrackPlayer.getProgress();
  return prog && typeof prog.position === 'number' ? prog.position : null;
};

/**
 * Biten şarkının kalanını ikinci oynatıcıya devreder ve sesini kısarak bitirir.
 * Başarılıysa true döner; çağıran taraf sıradaki şarkıyı başlatmalıdır.
 */
export const beginOverlap = async (uri, fadeMs) => {
  const TrackPlayer = getTrackPlayer();
  if (!TrackPlayer || !helper || helperUri !== uri || !helper.isLoaded) {
    return false;
  }
  const current = helper;

  try {
    // 1) Aynı konumdan sessizce başla
    const startPos = await readMainPosition();
    if (startPos === null) return false;
    current.volume = 0;
    await current.seekTo(startPos + 0.25);
    current.play();
    await sleep(200);
    if (helper !== current) return null;

    // 2) Konum farkını bir kez düzelt
    const mainPos = await readMainPosition();
    if (mainPos !== null) {
      const drift = mainPos - current.currentTime;
      if (Math.abs(drift) > 0.03) {
        await current.seekTo(current.currentTime + drift + 0.12);
        await sleep(150);
        if (helper !== current) return null;
      }
    }

    // 3) Kısa süre içinde sesi ikinci oynatıcıya devret
    const handoffStart = Date.now();
    await new Promise((resolve) => {
      const id = setInterval(() => {
        const t = Math.min(1, (Date.now() - handoffStart) / HANDOFF_MS);
        setVolume(Math.cos((t * Math.PI) / 2));
        setHelperVolume(Math.sin((t * Math.PI) / 2));
        if (t >= 1) {
          clearInterval(id);
          resolve();
        }
      }, 30);
    });
    if (helper !== current) return null;
    setVolume(0);
    setHelperVolume(1);

    // 4) Kalan süre boyunca ikinci oynatıcının sesini yumuşakça kıs
    const fadeStart = Date.now();
    const duration = Math.max(400, fadeMs);
    helperTimer = setInterval(() => {
      const t = Math.min(1, (Date.now() - fadeStart) / duration);
      setHelperVolume(1 - fadeOutCurve(t));
      if (t >= 1) {
        releaseHelper();
      }
    }, STEP_MS);
    return true;
  } catch (_) {
    releaseHelper();
    setVolume(1);
    return false;
  }
};

// --- Otomatik geçiş işaretleme ---------------------------------------------

// Şarkı kendiliğinden bittiğinde çağrılır; sıradaki şarkı fade-in ile başlar.
export const markAutoTransition = () => {
  autoTransitionAt = Date.now();
};

// playTrack içinde çağrılır. Otomatik geçiş ise fade-in süresini (ms) döndürür.
export const consumeAutoTransition = () => {
  const isAuto =
    crossfadeSeconds > 0 && Date.now() - autoTransitionAt < AUTO_TRANSITION_WINDOW_MS;
  autoTransitionAt = 0;
  return isAuto ? crossfadeSeconds * 1000 : 0;
};
