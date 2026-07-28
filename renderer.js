const webview = document.getElementById('browser-view');
const urlInput = document.getElementById('url-input');
const statusText = document.getElementById('status-text');
const fpId = document.getElementById('fp-id');
const notification = document.getElementById('notification');
const cleanPanel = document.getElementById('clean-panel');
const fpPanel = document.getElementById('fp-panel');
const fpInfo = document.getElementById('fp-info');
const profilesPanel = document.getElementById('profiles-panel');
const profilesList = document.getElementById('profiles-list');
const currentProfileName = document.getElementById('current-profile-name');

// Guardar URLs por perfil en memoria
let profileUrls = {};
let currentProfile = 'default';

async function init() {
  const fp = await window.ghostAPI.getFingerprint();
  fpId.textContent = fp.profileId.substring(0, 8);
  
  // Cargar perfil actual
  const profileData = await window.ghostAPI.getProfiles();
  currentProfile = profileData.current;
  currentProfileName.textContent = currentProfile;
  
  // Configurar partition del webview para cookies independientes
  const partition = await window.ghostAPI.getProfilePartition(currentProfile);
  webview.partition = partition;
  
  // Cargar URL guardada del perfil
  const savedUrl = await window.ghostAPI.getProfileUrl(currentProfile);
  if (savedUrl && savedUrl !== '') {
    webview.setAttribute('useragent', result.fingerprint.userAgent);
        webview.src = savedUrl;
    urlInput.value = savedUrl;
  }
  
  updateStatus('Listo - Perfil: ' + currentProfile);
  
  // Forzar User-Agent limpio en el webview (sin Electron)
  const ua = fp.userAgent;
  webview.setAttribute('useragent', ua);
}

function navigate(url) {
  if (!url) return;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    if (url.includes('.') && !url.includes(' ')) {
      url = 'https://' + url;
    } else {
      url = 'https://www.google.com/search?q=' + encodeURIComponent(url);
    }
  }
  webview.src = url;
  urlInput.value = url;
  updateStatus('Cargando...');
}

// Guardar URL actual del perfil cuando cambia
function saveCurrentUrl() {
  const url = urlInput.value;
  if (url && url !== '' && url !== 'about:blank') {
    window.ghostAPI.saveProfileUrl(currentProfile, url);
  }
}

// Navegacion
document.getElementById('btn-back').addEventListener('click', () => { if (webview.canGoBack()) webview.goBack(); });
document.getElementById('btn-forward').addEventListener('click', () => { if (webview.canGoForward()) webview.goForward(); });
document.getElementById('btn-reload').addEventListener('click', () => { webview.reload(); });
document.getElementById('btn-home').addEventListener('click', () => { navigate('https://www.google.com'); });
document.getElementById('btn-go').addEventListener('click', () => { navigate(urlInput.value); });
urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(urlInput.value); });

webview.addEventListener('did-start-loading', () => { updateStatus('Cargando...'); });
webview.addEventListener('did-finish-load', () => { updateStatus('Cargado'); saveCurrentUrl(); });
webview.addEventListener('did-navigate', (e) => { urlInput.value = e.url; saveCurrentUrl(); });
webview.addEventListener('did-navigate-in-page', (e) => { urlInput.value = e.url; saveCurrentUrl(); });
webview.addEventListener('page-title-updated', (e) => { document.title = 'Ghost Browser - ' + e.title; });

// === ROTAR FINGERPRINT ===
document.getElementById('btn-rotate').addEventListener('click', async () => {
  const fp = await window.ghostAPI.rotateFingerprint();
  fpId.textContent = fp.profileId.substring(0, 8);
  showNotification('Fingerprint rotado correctamente');
  updateStatus('Fingerprint actualizado');
  webview.reload();
});

// === PANEL LIMPIAR ===
document.getElementById('btn-clean').addEventListener('click', () => {
  cleanPanel.classList.toggle('hidden');
  fpPanel.classList.add('hidden');
  profilesPanel.classList.add('hidden');
});
document.getElementById('close-clean-panel').addEventListener('click', () => { cleanPanel.classList.add('hidden'); });

document.getElementById('btn-clean-selected').addEventListener('click', async () => {
  const options = {
    cookies: document.getElementById('chk-cookies').checked,
    cache: document.getElementById('chk-cache').checked,
    localStorage: document.getElementById('chk-localstorage').checked,
    sessionStorage: document.getElementById('chk-sessionstorage').checked,
    indexedDB: document.getElementById('chk-indexeddb').checked,
    webSQL: document.getElementById('chk-websql').checked,
  };
  const result = await window.ghostAPI.clearData(options);
  if (result.success) {
    showNotification('Datos limpiados (perfil: ' + currentProfile + ')');
    cleanPanel.classList.add('hidden');
  } else {
    showNotification('Error: ' + result.error);
  }
});

document.getElementById('btn-clean-all').addEventListener('click', async () => {
  const result = await window.ghostAPI.clearAllData();
  if (result.success) {
    fpId.textContent = result.newFingerprint.profileId.substring(0, 8);
    showNotification('TODO limpiado + Fingerprint rotado (perfil: ' + currentProfile + ')');
    cleanPanel.classList.add('hidden');
    webview.reload();
  } else {
    showNotification('Error: ' + result.error);
  }
});

// === PANEL PERFILES ===
document.getElementById('btn-profiles').addEventListener('click', async () => {
  profilesPanel.classList.toggle('hidden');
  cleanPanel.classList.add('hidden');
  fpPanel.classList.add('hidden');
  if (!profilesPanel.classList.contains('hidden')) {
    await renderProfiles();
  }
});
document.getElementById('close-profiles-panel').addEventListener('click', () => { profilesPanel.classList.add('hidden'); });

document.getElementById('btn-create-profile').addEventListener('click', async () => {
  const input = document.getElementById('new-profile-name');
  const name = input.value.trim();
  if (!name) { showNotification('Escribe un nombre para el perfil'); return; }
  const result = await window.ghostAPI.createProfile(name);
  if (result.success) {
    input.value = '';
    showNotification('Perfil "' + name + '" creado');
    await renderProfiles();
  }
});

document.getElementById('new-profile-name').addEventListener('keydown', (e) => {
  if (e.key === 'Enter') document.getElementById('btn-create-profile').click();
});

async function renderProfiles() {
  const data = await window.ghostAPI.getProfiles();
  profilesList.innerHTML = '';
  data.profiles.forEach(name => {
    const isActive = name === data.current;
    const div = document.createElement('div');
    div.className = 'profile-item' + (isActive ? ' active' : '');
    div.innerHTML = '<span class="profile-name">' + name + (isActive ? ' (activo)' : '') + '</span>' +
      '<div class="profile-actions">' +
      (isActive ? '' : '<button class="profile-switch-btn" data-name="' + name + '">Usar</button>') +
      (name !== 'default' && !isActive ? '<button class="profile-delete-btn" data-name="' + name + '">X</button>' : '') +
      '</div>';
    profilesList.appendChild(div);
  });

  document.querySelectorAll('.profile-switch-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.getAttribute('data-name');
      // Guardar URL actual antes de cambiar
      saveCurrentUrl();
      
      const result = await window.ghostAPI.switchProfile(name);
      if (result.success) {
        currentProfile = name;
        currentProfileName.textContent = name;
        fpId.textContent = result.fingerprint.profileId.substring(0, 8);
        
        // Cambiar partition del webview (cookies independientes)
        const partition = await window.ghostAPI.getProfilePartition(name);
        webview.partition = partition;
        
        // Cargar URL guardada del perfil
        const savedUrl = await window.ghostAPI.getProfileUrl(name);
        if (savedUrl && savedUrl !== '') {
          webview.setAttribute('useragent', result.fingerprint.userAgent);
        webview.src = savedUrl;
          urlInput.value = savedUrl;
        } else {
          webview.setAttribute('useragent', result.fingerprint.userAgent);
          webview.src = 'https://www.google.com';
          urlInput.value = 'https://www.google.com';
        }
        
        showNotification('Cambiado a perfil: ' + name);
        profilesPanel.classList.add('hidden');
        await renderProfiles();
      }
    });
  });

  document.querySelectorAll('.profile-delete-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const name = btn.getAttribute('data-name');
      const result = await window.ghostAPI.deleteProfile(name);
      if (result.success) {
        showNotification('Perfil "' + name + '" eliminado');
        await renderProfiles();
      } else {
        showNotification('Error: ' + (result.error || 'No se pudo eliminar'));
      }
    });
  });
}

// === PANEL FINGERPRINT + IP/DNS ===
document.getElementById('btn-fingerprint').addEventListener('click', async () => {
  fpPanel.classList.toggle('hidden');
  cleanPanel.classList.add('hidden');
  profilesPanel.classList.add('hidden');
  if (!fpPanel.classList.contains('hidden')) {
    const fp = await window.ghostAPI.getFingerprint();
    renderFingerprintInfo(fp);
    loadNetworkInfo();
  }
});
document.getElementById('close-fp-panel').addEventListener('click', () => { fpPanel.classList.add('hidden'); });

document.getElementById('fp-badge').addEventListener('click', async () => {
  fpPanel.classList.toggle('hidden');
  cleanPanel.classList.add('hidden');
  profilesPanel.classList.add('hidden');
  if (!fpPanel.classList.contains('hidden')) {
    const fp = await window.ghostAPI.getFingerprint();
    renderFingerprintInfo(fp);
    loadNetworkInfo();
  }
});

async function loadNetworkInfo() {
  document.getElementById('info-ip').textContent = 'Cargando...';
  document.getElementById('info-dns').textContent = 'Cargando...';
  const info = await window.ghostAPI.getNetworkInfo();
  document.getElementById('info-ip').textContent = info.ip;
  document.getElementById('info-dns').textContent = info.dns;
}

function renderFingerprintInfo(fp) {
  fpInfo.innerHTML = '<div class="fp-row"><span class="fp-label">Profile ID</span><span class="fp-value">' + fp.profileId + '</span></div>' +
    '<div class="fp-row"><span class="fp-label">User-Agent</span><span class="fp-value">' + fp.userAgent.substring(0, 30) + '...</span></div>' +
    '<div class="fp-row"><span class="fp-label">Platform</span><span class="fp-value">' + fp.platform + '</span></div>' +
    '<div class="fp-row"><span class="fp-label">Language</span><span class="fp-value">' + fp.languages.join(', ') + '</span></div>' +
    '<div class="fp-row"><span class="fp-label">Timezone</span><span class="fp-value">' + fp.timezone + '</span></div>' +
    '<div class="fp-row"><span class="fp-label">Screen</span><span class="fp-value">' + fp.screen.width + 'x' + fp.screen.height + '</span></div>' +
    '<div class="fp-row"><span class="fp-label">CPU Cores</span><span class="fp-value">' + fp.hardwareConcurrency + '</span></div>' +
    '<div class="fp-row"><span class="fp-label">Memory</span><span class="fp-value">' + fp.deviceMemory + ' GB</span></div>' +
    '<div class="fp-row"><span class="fp-label">WebGL Vendor</span><span class="fp-value">' + fp.webgl.vendor + '</span></div>' +
    '<div class="fp-row"><span class="fp-label">WebGL Renderer</span><span class="fp-value">' + fp.webgl.renderer.substring(0, 25) + '...</span></div>' +
    '<div class="fp-row"><span class="fp-label">Canvas Noise</span><span class="fp-value">' + (fp.canvas.noiseLevel * 100).toFixed(1) + '%</span></div>' +
    '<div class="fp-row"><span class="fp-label">Touch Points</span><span class="fp-value">' + fp.maxTouchPoints + '</span></div>';
}

function updateStatus(text) { statusText.textContent = text; }

function showNotification(message) {
  notification.textContent = message;
  notification.classList.remove('hidden');
  setTimeout(() => { notification.classList.add('hidden'); }, 2500);
}

init();
