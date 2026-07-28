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

// Lista de dominios de anuncios para bloquear
const AD_DOMAINS = [
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'google-analytics.com', 'googletagmanager.com', 'googletagservices.com',
  'adservice.google.com', 'pagead2.googlesyndication.com',
  'facebook.com/tr', 'connect.facebook.net/en_US/fbevents.js',
  'ads.facebook.com', 'pixel.facebook.com',
  'amazon-adsystem.com', 'ads.yahoo.com', 'ad.doubleclick.net',
  'adsserver.com', 'adnxs.com', 'adsrvr.org',
  'outbrain.com', 'taboola.com', 'mgid.com',
  'popads.net', 'popcash.net', 'propellerads.com',
  'adcolony.com', 'admob.com', 'applovin.com',
  'criteo.com', 'criteo.net', 'casalemedia.com',
  'rubiconproject.com', 'pubmatic.com', 'openx.net',
  'advertising.com', 'adform.net', 'smartadserver.com',
  'zedo.com', 'bidswitch.net', 'turn.com',
  'scorecardresearch.com', 'quantserve.com', 'bluekai.com',
  'exelator.com', 'eyeota.net', 'rlcdn.com',
  'demdex.net', 'krxd.net', 'adtechus.com',
  'serving-sys.com', 'sizmek.com', 'flashtalking.com',
  'tracker.com', 'analytics.com', 'clicktrack.com',
];

if (!fs.existsSync(profilesDir)) {
  fs.mkdirSync(profilesDir, { recursive: true });
}

app.disableHardwareAcceleration();

function getProfilePath(profileName) {
  return path.join(profilesDir, profileName);
}

function loadProfileData(profileName) {
  const metaFile = path.join(getProfilePath(profileName), 'meta.json');
  if (fs.existsSync(metaFile)) {
    return JSON.parse(fs.readFileSync(metaFile, 'utf8'));
  }
  return null;
}

function saveProfileData(profileName, data) {
  const profilePath = getProfilePath(profileName);
  if (!fs.existsSync(profilePath)) {
    fs.mkdirSync(profilePath, { recursive: true });
  }
  const metaFile = path.join(profilePath, 'meta.json');
  fs.writeFileSync(metaFile, JSON.stringify(data, null, 2));
}

function listProfiles() {
  if (!fs.existsSync(profilesDir)) return ['default'];
  const dirs = fs.readdirSync(profilesDir).filter(f => {
    return fs.statSync(path.join(profilesDir, f)).isDirectory();
  });
  if (dirs.length === 0) return ['default'];
  return dirs;
}

function deleteProfile(profileName) {
  if (profileName === 'default') return false;
  const profilePath = getProfilePath(profileName);
  if (fs.existsSync(profilePath)) {
    fs.rmSync(profilePath, { recursive: true, force: true });
    return true;
  }
  return false;
}

function setupAdBlock(ses) {
  ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
    const url = details.url.toLowerCase();
    const blocked = AD_DOMAINS.some(domain => url.includes(domain));
    if (blocked) {
      callback({ cancel: true });
    } else {
      callback({ cancel: false });
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 800,
    minHeight: 600,
    title: 'Ghost Browser',
    icon: path.join(__dirname, 'assets', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      webviewTag: true
    }
  });

  Menu.setApplicationMenu(null);
  mainWindow.loadFile('index.html');

  // Aplicar AdBlock a la sesion por defecto
  setupAdBlock(session.defaultSession);

  // Interceptar User-Agent
  session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders['User-Agent'] = currentFingerprint.userAgent;
    delete details.requestHeaders['X-Client-Data'];
    callback({ cancel: false, requestHeaders: details.requestHeaders });
  });

  mainWindow.webContents.session.setPermissionRequestHandler((webContents, permission, callback) => {
    if (permission === 'media') {
      callback(false);
    } else {
      callback(true);
    }
  });

  mainWindow.on('closed', () => { mainWindow = null; });
}

// === IPC: FINGERPRINT ===
ipcMain.handle('get-fingerprint', () => currentFingerprint);

ipcMain.handle('rotate-fingerprint', () => {
  currentFingerprint = generateFingerprint();
  return currentFingerprint;
});

// === IPC: IP Y DNS ===
ipcMain.handle('get-network-info', async () => {
  let ip = 'No disponible';
  let dnsServer = 'No disponible';

  try {
    ip = await new Promise((resolve) => {
      const req = https.get('https://api.ipify.org', (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data.trim()));
      });
      req.on('error', () => resolve('No disponible'));
      req.setTimeout(5000, () => { req.destroy(); resolve('No disponible'); });
    });
  } catch (e) { ip = 'No disponible'; }

  try {
    const servers = dns.getServers();
    dnsServer = servers.length > 0 ? servers.join(', ') : 'No disponible';
  } catch (e) { dnsServer = 'No disponible'; }

  return { ip, dns: dnsServer };
});

// === IPC: PERFILES ===
ipcMain.handle('get-profiles', () => {
  const profiles = listProfiles();
  return { profiles, current: currentProfile };
});

ipcMain.handle('create-profile', (event, name) => {
  const profilePath = getProfilePath(name);
  if (!fs.existsSync(profilePath)) {
    fs.mkdirSync(profilePath, { recursive: true });
  }
  const fp = generateFingerprint();
  saveProfileData(name, { fingerprint: fp, createdAt: Date.now() });
  // Configurar AdBlock para la particion del perfil
  const ses = session.fromPartition('persist:profile_' + name);
  setupAdBlock(ses);
  return { success: true, profiles: listProfiles() };
});

ipcMain.handle('switch-profile', (event, name) => {
  saveProfileData(currentProfile, { fingerprint: currentFingerprint, lastUsed: Date.now() });
  currentProfile = name;
  const data = loadProfileData(name);
  if (data && data.fingerprint) {
    currentFingerprint = data.fingerprint;
  } else {
    currentFingerprint = generateFingerprint();
    saveProfileData(name, { fingerprint: currentFingerprint, createdAt: Date.now() });
  }
  // Configurar AdBlock para la particion del perfil
  const ses = session.fromPartition('persist:profile_' + name);
  setupAdBlock(ses);
  return { success: true, fingerprint: currentFingerprint, profile: name };
});

ipcMain.handle('delete-profile', (event, name) => {
  if (name === currentProfile) return { success: false, error: 'No puedes borrar el perfil activo' };
  const result = deleteProfile(name);
  return { success: result, profiles: listProfiles() };
});

ipcMain.handle('get-profile-partition', (event, name) => {
  return 'persist:profile_' + name;
});

// === IPC: LIMPIAR DATOS (solo del perfil actual) ===
ipcMain.handle('clear-data', async (event, options) => {
  const ses = session.fromPartition('persist:profile_' + currentProfile);
  try {
    if (options.cookies) await ses.clearStorageData({ storages: ['cookies'] });
    if (options.cache) { await ses.clearCache(); await ses.clearStorageData({ storages: ['cachestorage'] }); }
    if (options.localStorage) await ses.clearStorageData({ storages: ['localstorage'] });
    if (options.sessionStorage) await ses.clearStorageData({ storages: ['sessionstorage'] });
    if (options.indexedDB) await ses.clearStorageData({ storages: ['indexdb'] });
    if (options.webSQL) await ses.clearStorageData({ storages: ['websql'] });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('clear-all-data', async () => {
  const ses = session.fromPartition('persist:profile_' + currentProfile);
  try {
    await ses.clearStorageData();
    await ses.clearCache();
    currentFingerprint = generateFingerprint();
    saveProfileData(currentProfile, { fingerprint: currentFingerprint, lastUsed: Date.now() });
    return { success: true, newFingerprint: currentFingerprint };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-user-agent', () => currentFingerprint.userAgent);


// === IPC: URLs POR PERFIL ===
ipcMain.handle('save-profile-url', (event, name, url) => {
  const data = loadProfileData(name) || {};
  data.lastUrl = url;
  saveProfileData(name, data);
  return true;
});

ipcMain.handle('get-profile-url', (event, name) => {
  const data = loadProfileData(name);
  return data ? (data.lastUrl || '') : '';
});

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { app.quit(); });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
