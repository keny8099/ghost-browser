const { app, BrowserWindow, session, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const dns = require('dns');
const { generateFingerprint } = require('./fingerprint');

let mainWindow;
let currentFingerprint = generateFingerprint();
let currentProfile = 'default';
const profilesDir = path.join(app.getPath('userData'), 'profiles');
const stateFile = path.join(app.getPath('userData'), 'state.json');

const AD_DOMAINS = [
  'doubleclick.net','googlesyndication.com','googleadservices.com',
  'google-analytics.com','googletagmanager.com','adservice.google.com',
  'pagead2.googlesyndication.com','ads.facebook.com','amazon-adsystem.com',
  'ads.yahoo.com','ad.doubleclick.net','adnxs.com','adsrvr.org',
  'outbrain.com','taboola.com','mgid.com','popads.net','popcash.net',
  'propellerads.com','criteo.com','criteo.net','pubmatic.com','openx.net',
  'scorecardresearch.com','quantserve.com','demdex.net','serving-sys.com',
];

if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });

app.disableHardwareAcceleration();

// FORZAR User-Agent en TODOS los headers HTTP (quitar Electron del UA)
const CLEAN_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
app.userAgentFallback = CLEAN_UA;

// === STATE (guardar/cargar perfil activo) ===
function saveState() {
  fs.writeFileSync(stateFile, JSON.stringify({ currentProfile }));
}
function loadState() {
  if (fs.existsSync(stateFile)) {
    try { const s = JSON.parse(fs.readFileSync(stateFile, 'utf8')); currentProfile = s.currentProfile || 'default'; } catch(e) {}
  }
}

// === PROFILE HELPERS ===
function getProfilePath(name) { return path.join(profilesDir, name); }

function loadProfileData(name) {
  const f = path.join(getProfilePath(name), 'meta.json');
  if (fs.existsSync(f)) { try { return JSON.parse(fs.readFileSync(f, 'utf8')); } catch(e) {} }
  return null;
}

function saveProfileData(name, data) {
  const p = getProfilePath(name);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  fs.writeFileSync(path.join(p, 'meta.json'), JSON.stringify(data, null, 2));
}

function listProfiles() {
  if (!fs.existsSync(profilesDir)) return ['default'];
  const dirs = fs.readdirSync(profilesDir).filter(f => {
    try { return fs.statSync(path.join(profilesDir, f)).isDirectory(); } catch(e) { return false; }
  });
  if (dirs.length === 0) {
    fs.mkdirSync(path.join(profilesDir, 'default'), { recursive: true });
    return ['default'];
  }
  return dirs;
}

function deleteProfile(name) {
  if (name === 'default') return false;
  const p = getProfilePath(name);
  if (fs.existsSync(p)) { fs.rmSync(p, { recursive: true, force: true }); return true; }
  return false;
}

function setupAdBlock(ses) {
  ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    const url = details.url.toLowerCase();
    callback({ cancel: AD_DOMAINS.some(d => url.includes(d)) });
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280, height: 800, minWidth: 800, minHeight: 600,
    title: 'Ghost Browser',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false, contextIsolation: true, webviewTag: true
    }
  });
  Menu.setApplicationMenu(null);
  mainWindow.loadFile('index.html');
  // LIMPIAR headers HTTP - quitar Electron y ghost-browser del User-Agent
  const ses = session.fromPartition('persist:profile_' + currentProfile);
  ses.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = currentFingerprint.userAgent;
    details.requestHeaders['Accept-Language'] = currentFingerprint.languages.join(',');
    delete details.requestHeaders['X-Client-Data'];
    callback({ requestHeaders: details.requestHeaders });
  });
  setupAdBlock(ses);

  // Bloquear WebRTC IPv6 leak
  mainWindow.webContents.setWebRTCIPHandlingPolicy('disable_non_proxied_udp');

  mainWindow.on('closed', () => { mainWindow = null; });
}

// === IPC HANDLERS ===
ipcMain.handle('get-fingerprint', () => currentFingerprint);

ipcMain.handle('rotate-fingerprint', () => {
  currentFingerprint = generateFingerprint();
  const data = loadProfileData(currentProfile) || {};
  data.fingerprint = currentFingerprint;
  saveProfileData(currentProfile, data);
  return currentFingerprint;
});

ipcMain.handle('get-network-info', async () => {
  let ip = 'No disponible';
  let dnsServer = 'No disponible';
  try {
    ip = await new Promise((resolve) => {
      const req = https.get('https://api.ipify.org', (res) => {
        let d = ''; res.on('data', (c) => { d += c; }); res.on('end', () => resolve(d.trim()));
      });
      req.on('error', () => resolve('No disponible'));
      req.setTimeout(5000, () => { req.destroy(); resolve('No disponible'); });
    });
  } catch(e) {}
  try { dnsServer = dns.getServers().join(', ') || 'No disponible'; } catch(e) {}
  return { ip, dns: dnsServer };
});

ipcMain.handle('get-profiles', () => ({ profiles: listProfiles(), current: currentProfile }));

ipcMain.handle('create-profile', (ev, name) => {
  const fp = generateFingerprint();
  saveProfileData(name, { fingerprint: fp, createdAt: Date.now(), lastUrl: 'https://www.google.com' });
  return { success: true, profiles: listProfiles() };
});

ipcMain.handle('switch-profile', (ev, name) => {
  // Guardar perfil actual
  const currentData = loadProfileData(currentProfile) || {};
  currentData.fingerprint = currentFingerprint;
  saveProfileData(currentProfile, currentData);
  
  // Cambiar al nuevo
  currentProfile = name;
  saveState();
  const data = loadProfileData(name);
  if (data && data.fingerprint) {
    currentFingerprint = data.fingerprint;
    // Forzar timezone/lang del sistema
    currentFingerprint.timezone = ipTimezone; currentFingerprint.languages = ipLanguage;
  } else {
    currentFingerprint = generateFingerprint();
    saveProfileData(name, { fingerprint: currentFingerprint, createdAt: Date.now(), lastUrl: 'https://www.google.com' });
  }
  return { success: true, fingerprint: currentFingerprint, profile: name, lastUrl: data ? data.lastUrl : '' };
});

ipcMain.handle('delete-profile', (ev, name) => {
  if (name === currentProfile) return { success: false, error: 'No puedes borrar el perfil activo' };
  return { success: deleteProfile(name), profiles: listProfiles() };
});

ipcMain.handle('get-profile-partition', (ev, name) => 'persist:profile_' + name);

ipcMain.handle('save-profile-url', (ev, name, url) => {
  const data = loadProfileData(name) || { fingerprint: currentFingerprint };
  data.lastUrl = url;
  saveProfileData(name, data);
  return true;
});

ipcMain.handle('get-profile-url', (ev, name) => {
  const data = loadProfileData(name);
  return (data && data.lastUrl) ? data.lastUrl : 'https://www.google.com';
});

ipcMain.handle('clear-data', async (ev, options) => {
  const ses = session.fromPartition('persist:profile_' + currentProfile);
  try {
    if (options.cookies) await ses.clearStorageData({ storages: ['cookies'] });
    if (options.cache) { await ses.clearCache(); await ses.clearStorageData({ storages: ['cachestorage'] }); }
    if (options.localStorage) await ses.clearStorageData({ storages: ['localstorage'] });
    if (options.sessionStorage) await ses.clearStorageData({ storages: ['sessionstorage'] });
    if (options.indexedDB) await ses.clearStorageData({ storages: ['indexdb'] });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('clear-all-data', async () => {
  const ses = session.fromPartition('persist:profile_' + currentProfile);
  try {
    await ses.clearStorageData(); await ses.clearCache();
    currentFingerprint = generateFingerprint();
    saveProfileData(currentProfile, { fingerprint: currentFingerprint, lastUrl: 'https://www.google.com' });
    return { success: true, newFingerprint: currentFingerprint };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('get-user-agent', () => currentFingerprint.userAgent);

// === DETECTAR TIMEZONE POR IP ===
async function detectTimezoneByIP() {
  return new Promise((resolve) => {
    const req = https.get('https://worldtimeapi.org/api/ip', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const info = JSON.parse(data);
          resolve(info.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone);
        } catch(e) { resolve(Intl.DateTimeFormat().resolvedOptions().timeZone); }
      });
    });
    req.on('error', () => resolve(Intl.DateTimeFormat().resolvedOptions().timeZone));
    req.setTimeout(5000, () => { req.destroy(); resolve(Intl.DateTimeFormat().resolvedOptions().timeZone); });
  });
}

function getLanguageForTimezone(tz) {
  if (tz.includes('New_York') || tz.includes('Chicago') || tz.includes('Denver') || tz.includes('Los_Angeles')) return ['en-US', 'en'];
  if (tz.includes('Madrid')) return ['es-ES', 'es'];
  if (tz.includes('Mexico')) return ['es-MX', 'es'];
  if (tz.includes('Bogota')) return ['es-CO', 'es'];
  if (tz.includes('London')) return ['en-GB', 'en'];
  if (tz.includes('Berlin') || tz.includes('Paris')) return ['de-DE', 'de'];
  if (tz.includes('Sao_Paulo')) return ['pt-BR', 'pt'];
  return ['en-US', 'en'];
}

// === INICIO ===
app.whenReady().then(async () => {
  // Detectar timezone real por IP
  const ipTimezone = await detectTimezoneByIP();
  const ipLanguage = getLanguageForTimezone(ipTimezone);
  loadState();
  const data = loadProfileData(currentProfile);
  if (data && data.fingerprint) {
    currentFingerprint = data.fingerprint;
    currentFingerprint.timezone = ipTimezone; currentFingerprint.languages = ipLanguage;
  }
  // Asegurar que default existe
  if (!fs.existsSync(path.join(profilesDir, 'default'))) {
    saveProfileData('default', { fingerprint: currentFingerprint, createdAt: Date.now(), lastUrl: 'https://www.google.com' });
  }
  createWindow();
});

app.on('window-all-closed', () => { saveState(); app.quit(); });
