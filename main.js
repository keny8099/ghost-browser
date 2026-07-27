const { app, BrowserWindow, session, ipcMain, Menu } = require('electron');
const path = require('path');
const { generateFingerprint, getRandomUserAgent } = require('./fingerprint');

let mainWindow;
let currentFingerprint = generateFingerprint();

app.disableHardwareAcceleration();

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

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

ipcMain.handle('get-fingerprint', () => {
  return currentFingerprint;
});

ipcMain.handle('rotate-fingerprint', () => {
  currentFingerprint = generateFingerprint();
  return currentFingerprint;
});

ipcMain.handle('clear-data', async (event, options) => {
  const ses = session.defaultSession;
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
  const ses = session.defaultSession;
  try {
    await ses.clearStorageData();
    await ses.clearCache();
    await ses.clearAuthCache();
    currentFingerprint = generateFingerprint();
    return { success: true, newFingerprint: currentFingerprint };
  } catch (error) {
    return { success: false, error: error.message };
  }
});

ipcMain.handle('get-user-agent', () => {
  return currentFingerprint.userAgent;
});

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});
