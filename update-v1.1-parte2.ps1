# Ghost Browser v1.1 - Parte 2: main.js (perfiles independientes + IP/DNS)

@'
const { app, BrowserWindow, session, ipcMain, Menu } = require('electron');
const path = require('path');
const fs = require('fs');
const { generateFingerprint } = require('./fingerprint');

let mainWindow;
let currentFingerprint = generateFingerprint();
let currentProfile = 'default';
const profilesDir = path.join(app.getPath('userData'), 'profiles');

// Crear carpeta de perfiles si no existe
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
  const net = require('net');
  const dns = require('dns');
  const https = require('https');
  const http = require('http');

  let ip = 'No disponible';
  let dnsServer = 'No disponible';

  // Obtener IP publica
  try {
    ip = await new Promise((resolve, reject) => {
      const req = https.get('https://api.ipify.org', (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => resolve(data.trim()));
      });
      req.on('error', () => {
        // Intentar otro servicio
        const req2 = https.get('https://icanhazip.com', (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => resolve(data.trim()));
        });
        req2.on('error', () => resolve('No disponible'));
        req2.setTimeout(5000, () => { req2.destroy(); resolve('No disponible'); });
      });
      req.setTimeout(5000, () => { req.destroy(); reject(); });
    });
  } catch (e) { ip = 'No disponible'; }

  // Obtener DNS
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
  return { success: true, profiles: listProfiles() };
});

ipcMain.handle('switch-profile', (event, name) => {
  // Guardar fingerprint actual en perfil anterior
  saveProfileData(currentProfile, { fingerprint: currentFingerprint, lastUsed: Date.now() });
  
  // Cargar nuevo perfil
  currentProfile = name;
  const data = loadProfileData(name);
  if (data && data.fingerprint) {
    currentFingerprint = data.fingerprint;
  } else {
    currentFingerprint = generateFingerprint();
    saveProfileData(name, { fingerprint: currentFingerprint, createdAt: Date.now() });
  }
  
  return { success: true, fingerprint: currentFingerprint, profile: name };
});

ipcMain.handle('delete-profile', (event, name) => {
  if (name === currentProfile) return { success: false, error: 'No puedes borrar el perfil activo' };
  const result = deleteProfile(name);
  return { success: result, profiles: listProfiles() };
});

ipcMain.handle('get-profile-partition', (event, name) => {
  // Cada perfil usa una partition de Electron separada = cookies independientes
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

app.whenReady().then(createWindow);
app.on('window-all-closed', () => { app.quit(); });
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
'@ | Set-Content -Path "main.js" -Encoding UTF8

# Fix BOM
$content = Get-Content -Path "main.js" -Raw
$utf8NoBom = New-Object System.Text.UTF8Encoding($false)
[System.IO.File]::WriteAllText("$PWD\main.js", $content, $utf8NoBom)

Write-Host "v1.1 Parte 2 completada: main.js (perfiles + IP/DNS)" -ForegroundColor Green

