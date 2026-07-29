function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const WEBGL_VENDORS = ["Google Inc. (NVIDIA)", "Google Inc. (AMD)", "Google Inc. (Intel)"];
const WEBGL_RENDERERS = [
  "ANGLE (NVIDIA, NVIDIA GeForce RTX 3060 Direct3D11 vs_5_0 ps_5_0, D3D11)",
  "ANGLE (NVIDIA, NVIDIA GeForce GTX 1660 Ti Direct3D11 vs_5_0 ps_5_0, D3D11)",
  "ANGLE (AMD, AMD Radeon RX 580 Direct3D11 vs_5_0 ps_5_0, D3D11)",
  "ANGLE (Intel, Intel(R) UHD Graphics 630 Direct3D11 vs_5_0 ps_5_0, D3D11)",
  "ANGLE (Intel, Intel(R) Iris(R) Xe Graphics Direct3D11 vs_5_0 ps_5_0, D3D11)",
];
const SCREENS = [{w:1920,h:1080},{w:1366,h:768},{w:1536,h:864},{w:1440,h:900}];

function generateFingerprint() {
  const scr = randomItem(SCREENS);
  return {
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    platform: "Win32",
    languages: ["en-US", "en"],
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    screen: { width: scr.w, height: scr.h, colorDepth: 24, pixelRatio: 1 },
    hardwareConcurrency: randomItem([4, 8]),
    deviceMemory: randomItem([8, 16]),
    webgl: { vendor: randomItem(WEBGL_VENDORS), renderer: randomItem(WEBGL_RENDERERS) },
    canvas: { seed: Math.random() * 1000, noiseLevel: Math.random() * 0.02 + 0.005, colorShift: { r: randomInt(-2,2), g: randomInt(-2,2), b: randomInt(-2,2) } },
    doNotTrack: null,
    maxTouchPoints: 0,
    profileId: Date.now().toString(36) + Math.random().toString(36).substr(2, 9),
  };
}
module.exports = { generateFingerprint };