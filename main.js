const { app, BrowserWindow, session, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const https = require('https');
const dns = require('dns');
const { generateFingerprint } = require('./fingerprint');

let mainWindow;
let detectedLang = ['en-US', 'en'];
let detectedTZ = 'America/New_York';
let currentFingerprint = null;
let currentProfile = 'default';
const profilesDir = path.join(app.getPath('userData'), 'profiles');

const AD_DOMAINS = [
  'doubleclick.net','googlesyndication.com','googleadservices.com',
  'google-analytics.com','googletagmanager.com','adservice.google.com',
  'pagead2.googlesyndication.com','ads.facebook.com','amazon-adsystem.com',
  'ads.yahoo.com','ad.doubleclick.net','adnxs.com','adsrvr.org',
  'outbrain.com','taboola.com','mgid.com','popads.net','popcash.net',
  'propellerads.com','criteo.com','criteo.net','casalemedia.com',
  'rubiconproject.com','pubmatic.com','openx.net','adform.net',
  'smartadserver.com','scorecardresearch.com','quantserve.com',
  'bluekai.com','demdex.net','krxd.net','serving-sys.com','sizmek.com',
];

if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });

app.disableHardwareAcceleration();

// Detectar pais por IP al iniciar
async function detectCountry() {
  return new Promise((resolve) => {
    const req = https.get('https://ipapi.co/json/', (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          const info = JSON.parse(data);
          const countryMap = {
            'US': { lang: ['en-US', 'en'], tz: 'America/New_York' },
            'GB': { lang: ['en-GB', 'en'], tz: 'Europe/London' },
            'ES': { lang: ['es-ES', 'es'], tz: 'Europe/Madrid' },
            'MX': { lang: ['es-MX', 'es'], tz: 'America/Mexico_City' },
            'CO': { lang: ['es-CO', 'es'], tz: 'America/Bogota' },
            'AR': { lang: ['es-AR', 'es'], tz: 'America/Buenos_Aires' },
            'BR': { lang: ['pt-BR', 'pt'], tz: 'America/Sao_Paulo' },
            'DE': { lang: ['de-DE', 'de'], tz: 'Europe/Berlin' },
            'FR': { lang: ['fr-FR', 'fr'], tz: 'Europe/Paris' },
            'CA': { lang: ['en-CA', 'en'], tz: 'America/Toronto' },
          };
          const country = info.country_code || 'US';
          const match = countryMap[country] || countryMap['US'];
          detectedLang = match.lang;
          detectedTZ = info.timezone || match.tz;
          resolve();
        } catch(e) { resolve(); }
      });
    });
    req.on('error', () => resolve());
    req.setTimeout(5000, () => { req.destroy(); resolve(); });
  });
}

function getProfilePath(name) { return path.join(profilesDir, name); }

function loadProfileData(name) {
  const f = path.join(getProfilePath(name), 'meta.json');
  if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f, 'utf8'));
  return null;
}

function saveProfileData(name, data) {
  const p = getProfilePath(name);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  fs.writeFileSync(path.join(p, 'meta.json'), JSON.stringify(data, null, 2));
}

function listProfiles() {
  if (!fs.existsSync(profilesDir)) return ['default'];
  const dirs = fs.readdirSync(profilesDir).filter(f => fs.statSync(path.join(profilesDir, f)).isDirectory());
  return dirs.length === 0 ? ['default'] : dirs;
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
    const blocked = AD_DOMAINS.some(d => url.includes(d));
    callback({ cancel: blocked });
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

  const defaultSes = session.fromPartition('persist:profile_default');
  setupAdBlock(defaultSes);

  mainWindow.webContents.session.setPermissionRequestHandler((wc, perm, cb) => {
    cb(perm !== 'media');
  });
  mainWindow.on('closed', () => { mainWindow = null; });
}

// === IPC HANDLERS ===
ipcMain.handle('get-fingerprint', () => currentFingerprint);

ipcMain.handle('rotate-fingerprint', () => {
  currentFingerprint = generateFingerprint(detectedLang, detectedTZ);
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
  try { const s = dns.getServers(); dnsServer = s.length > 0 ? s.join(', ') : 'No disponible'; } catch(e) {}
  return { ip, dns: dnsServer };
});

ipcMain.handle('get-profiles', () => ({ profiles: listProfiles(), current: currentProfile }));

ipcMain.handle('create-profile', (ev, name) => {
  const p = getProfilePath(name);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  const fp = generateFingerprint(detectedLang, detectedTZ);
  saveProfileData(name, { fingerprint: fp, createdAt: Date.now(), lastUrl: '' });
  const ses = session.fromPartition('persist:profile_' + name);
  setupAdBlock(ses);
  return { success: true, profiles: listProfiles() };
});

ipcMain.handle('switch-profile', (ev, name) => {
  saveProfileData(currentProfile, { fingerprint: currentFingerprint, lastUsed: Date.now() });
  currentProfile = name;
  const data = loadProfileData(name);
  if (data && data.fingerprint) {
    currentFingerprint = data.fingerprint;
  } else {
    currentFingerprint = generateFingerprint(detectedLang, detectedTZ);
    saveProfileData(name, { fingerprint: currentFingerprint, createdAt: Date.now() });
  }
  const ses = session.fromPartition('persist:profile_' + name);
  setupAdBlock(ses);
  return { success: true, fingerprint: currentFingerprint, profile: name };
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
  return data ? (data.lastUrl || '') : '';
});

ipcMain.handle('clear-data', async (ev, options) => {
  const ses = session.fromPartition('persist:profile_' + currentProfile);
  try {
    if (options.cookies) await ses.clearStorageData({ storages: ['cookies'] });
    if (options.cache) { await ses.clearCache(); await ses.clearStorageData({ storages: ['cachestorage'] }); }
    if (options.localStorage) await ses.clearStorageData({ storages: ['localstorage'] });
    if (options.sessionStorage) await ses.clearStorageData({ storages: ['sessionstorage'] });
    if (options.indexedDB) await ses.clearStorageData({ storages: ['indexdb'] });
    if (options.webSQL) await ses.clearStorageData({ storages: ['websql'] });
    return { success: true };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('clear-all-data', async () => {
  const ses = session.fromPartition('persist:profile_' + currentProfile);
  try {
    await ses.clearStorageData(); await ses.clearCache();
    currentFingerprint = generateFingerprint(detectedLang, detectedTZ);
    saveProfileData(currentProfile, { fingerprint: currentFingerprint, lastUsed: Date.now() });
    return { success: true, newFingerprint: currentFingerprint };
  } catch (e) { return { success: false, error: e.message }; }
});

ipcMain.handle('get-user-agent', () => currentFingerprint.userAgent);

// === INICIO ===
app.whenReady().then(async () => {
  await detectCountry();
  currentFingerprint = generateFingerprint(detectedLang, detectedTZ);
  // Cargar perfil guardado
  const data = loadProfileData(currentProfile);
  if (data && data.fingerprint) {
    currentFingerprint = data.fingerprint;
    // Actualizar idioma/timezone del perfil con el detectado
    currentFingerprint.languages = detectedLang;
    currentFingerprint.timezone = detectedTZ;
  }
  createWindow();
});

app.on('window-all-closed', () => { app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
