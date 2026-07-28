function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Solo User-Agents de WINDOWS (para que coincida con platform Win32)
const WIN_USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
];

const WEBGL_VENDORS = ['Google Inc. (NVIDIA)', 'Google Inc. (AMD)', 'Google Inc. (Intel)'];

const WEBGL_RENDERERS = [
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
];

const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
];

function getSystemTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getSystemLanguage() {
  // Usar el idioma REAL del sistema operativo
  const locale = Intl.DateTimeFormat().resolvedOptions().locale;
  if (locale) {
    return [locale, locale.split('-')[0]];
  }
  return ['en-US', 'en'];
}

function generateFingerprint(overrideTZ, overrideLang) {
  const screen = randomItem(SCREEN_RESOLUTIONS);
  const systemTZ = overrideTZ || getSystemTimezone();
  const systemLang = overrideLang || getSystemLanguage();
  return {
    userAgent: randomItem(WIN_USER_AGENTS),
    platform: 'Win32',
    languages: systemLang,
    timezone: systemTZ,
    screen: { width: screen.width, height: screen.height, colorDepth: 24, pixelRatio: 1 },
    hardwareConcurrency: randomItem([4, 8]),
    deviceMemory: randomItem([8, 16]),
    webgl: { vendor: randomItem(WEBGL_VENDORS), renderer: randomItem(WEBGL_RENDERERS) },
    canvas: { seed: Math.random() * 1000, noiseLevel: Math.random() * 0.02 + 0.005, colorShift: { r: randomInt(-2, 2), g: randomInt(-2, 2), b: randomInt(-2, 2) } },
    audio: { noiseLevel: Math.random() * 0.0001, frequencyShift: Math.random() * 0.001 },
    doNotTrack: null,
    maxTouchPoints: 0,
    profileId: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
  };
}

module.exports = { generateFingerprint };
