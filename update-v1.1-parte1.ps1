# Ghost Browser v1.1 - Parte 1: fingerprint.js actualizado (Language coherente con Timezone)

@'
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:120.0) Gecko/20100101 Firefox/120.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
];

const WEBGL_VENDORS = [
  'Google Inc. (NVIDIA)',
  'Google Inc. (AMD)',
  'Google Inc. (Intel)',
  'Google Inc.',
  'Mozilla',
];

const WEBGL_RENDERERS = [
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 SUPER Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (AMD, AMD Radeon RX 6600 XT Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (NVIDIA, NVIDIA GeForce RTX 4070 Direct3D11 vs_5_0 ps_5_0, D3D11)',
  'ANGLE (AMD, AMD Radeon RX 7900 XTX Direct3D11 vs_5_0 ps_5_0, D3D11)',
];

const SCREEN_RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 2560, height: 1440 },
  { width: 1366, height: 768 },
  { width: 1536, height: 864 },
  { width: 1440, height: 900 },
  { width: 1600, height: 900 },
  { width: 3840, height: 2160 },
];

// Language ahora esta vinculado al timezone para coherencia
const TIMEZONE_LANGUAGE_MAP = {
  'America/New_York': ['en-US', 'en'],
  'America/Chicago': ['en-US', 'en'],
  'America/Los_Angeles': ['en-US', 'en'],
  'America/Denver': ['en-US', 'en'],
  'Europe/London': ['en-GB', 'en'],
  'Europe/Madrid': ['es-ES', 'es'],
  'Europe/Berlin': ['de-DE', 'de'],
  'America/Bogota': ['es-CO', 'es'],
  'America/Mexico_City': ['es-MX', 'es'],
  'America/Sao_Paulo': ['pt-BR', 'pt'],
  'America/Buenos_Aires': ['es-AR', 'es'],
  'America/Lima': ['es-PE', 'es'],
  'America/Santiago': ['es-CL', 'es'],
};

const TIMEZONES = Object.keys(TIMEZONE_LANGUAGE_MAP);

const PLATFORMS = ['Win32', 'Win32', 'Win32', 'MacIntel', 'Linux x86_64'];

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

function generateCanvasNoise() {
  return {
    seed: Math.random() * 1000,
    noiseLevel: Math.random() * 0.03 + 0.01,
    colorShift: { r: randomInt(-3, 3), g: randomInt(-3, 3), b: randomInt(-3, 3) }
  };
}

function generateAudioNoise() {
  return { noiseLevel: Math.random() * 0.0001, frequencyShift: Math.random() * 0.001 };
}

function generateFingerprint() {
  const screen = randomItem(SCREEN_RESOLUTIONS);
  const timezone = randomItem(TIMEZONES);
  const languages = TIMEZONE_LANGUAGE_MAP[timezone]; // Coherente con timezone
  return {
    userAgent: randomItem(USER_AGENTS),
    platform: randomItem(PLATFORMS),
    languages: languages,
    timezone: timezone,
    screen: {
      width: screen.width, height: screen.height,
      colorDepth: randomItem([24, 32]),
      pixelRatio: randomItem([1, 1.25, 1.5, 2]),
    },
    hardwareConcurrency: randomItem([2, 4, 6, 8, 12, 16]),
    deviceMemory: randomItem([2, 4, 8, 16]),
    webgl: { vendor: randomItem(WEBGL_VENDORS), renderer: randomItem(WEBGL_RENDERERS) },
    canvas: generateCanvasNoise(),
    audio: generateAudioNoise(),
    doNotTrack: randomItem(['1', null]),
    maxTouchPoints: 0,
    profileId: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
  };
}

function getRandomUserAgent() { return randomItem(USER_AGENTS); }

module.exports = { generateFingerprint, getRandomUserAgent };
'@ | Set-Content -Path "fingerprint.js" -Encoding UTF8

# Fix BOM
$content = Get-Content -Path "fingerprint.js" -Raw
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText("$PWD\fingerprint.js", $content, $utf8NoBom)

Write-Host "v1.1 Parte 1 completada: fingerprint.js (Language coherente con Timezone)" -ForegroundColor Green
