const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

const WEBGL_VENDORS = ['Google Inc. (NVIDIA)', 'Google Inc. (AMD)', 'Google Inc. (Intel)'];

const WEBGL_RENDERERS = [
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
];

const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function getSystemTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

function getLanguageForTimezone(tz) {
  if (tz.startsWith('America/New_York') || tz.startsWith('America/Chicago') || tz.startsWith('America/Denver') || tz.startsWith('America/Los_Angeles') || tz.includes('US')) return ['en-US', 'en'];
  if (tz.includes('Madrid')) return ['es-ES', 'es'];
  if (tz.includes('Mexico')) return ['es-MX', 'es'];
  if (tz.includes('Bogota')) return ['es-CO', 'es'];
  if (tz.includes('Buenos_Aires')) return ['es-AR', 'es'];
  if (tz.includes('London')) return ['en-GB', 'en'];
  if (tz.includes('Berlin')) return ['de-DE', 'de'];
  if (tz.includes('Paris')) return ['fr-FR', 'fr'];
  if (tz.includes('Sao_Paulo')) return ['pt-BR', 'pt'];
  if (tz.includes('Santiago')) return ['es-CL', 'es'];
  if (tz.includes('Lima')) return ['es-PE', 'es'];
  // Default para USA
  return ['en-US', 'en'];
}

function generateFingerprint() {
  const screen = randomItem(SCREEN_RESOLUTIONS);
  const systemTZ = getSystemTimezone();
  const languages = getLanguageForTimezone(systemTZ);
  return {
    userAgent: randomItem(USER_AGENTS),
    platform: 'Win32',
    languages: languages,
    timezone: systemTZ,
    screen: { width: screen.width, height: screen.height, colorDepth: 24, pixelRatio: 1 },
    hardwareConcurrency: randomItem([4, 6, 8]),
    deviceMemory: randomItem([8, 16]),
    webgl: { vendor: randomItem(WEBGL_VENDORS), renderer: randomItem(WEBGL_RENDERERS) },
    canvas: { seed: Math.random() * 1000, noiseLevel: Math.random() * 0.03 + 0.01, colorShift: { r: randomInt(-3, 3), g: randomInt(-3, 3), b: randomInt(-3, 3) } },
    audio: { noiseLevel: Math.random() * 0.0001, frequencyShift: Math.random() * 0.001 },
    doNotTrack: null,
    maxTouchPoints: 0,
    profileId: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
  };
}

module.exports = { generateFingerprint };
