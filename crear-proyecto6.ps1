# Ghost Browser - Parte 6: renderer.js

@'
const webview = document.getElementById('browser-view');
const urlInput = document.getElementById('url-input');
const statusText = document.getElementById('status-text');
const fpId = document.getElementById('fp-id');
const notification = document.getElementById('notification');
const cleanPanel = document.getElementById('clean-panel');
const fpPanel = document.getElementById('fp-panel');
const fpInfo = document.getElementById('fp-info');

async function init() {
  const fp = await window.ghostAPI.getFingerprint();
  fpId.textContent = fp.profileId.substring(0, 8);
  updateStatus('Listo - Fingerprint cargado');
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

document.getElementById('btn-back').addEventListener('click', () => { if (webview.canGoBack()) webview.goBack(); });
document.getElementById('btn-forward').addEventListener('click', () => { if (webview.canGoForward()) webview.goForward(); });
document.getElementById('btn-reload').addEventListener('click', () => { webview.reload(); });
document.getElementById('btn-home').addEventListener('click', () => { navigate('https://www.google.com'); });
document.getElementById('btn-go').addEventListener('click', () => { navigate(urlInput.value); });
urlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') navigate(urlInput.value); });

webview.addEventListener('did-start-loading', () => { updateStatus('Cargando...'); });
webview.addEventListener('did-finish-load', () => { updateStatus('Cargado'); });
webview.addEventListener('did-navigate', (e) => { urlInput.value = e.url; });
webview.addEventListener('did-navigate-in-page', (e) => { urlInput.value = e.url; });
webview.addEventListener('page-title-updated', (e) => { document.title = 'Ghost Browser - ' + e.title; });

document.getElementById('btn-rotate').addEventListener('click', async () => {
  const fp = await window.ghostAPI.rotateFingerprint();
  fpId.textContent = fp.profileId.substring(0, 8);
  showNotification('Fingerprint rotado correctamente');
  updateStatus('Fingerprint actualizado');
  webview.reload();
});

document.getElementById('btn-clean').addEventListener('click', () => {
  cleanPanel.classList.toggle('hidden');
  fpPanel.classList.add('hidden');
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
    showNotification('Datos limpiados correctamente');
    cleanPanel.classList.add('hidden');
  } else {
    showNotification('Error: ' + result.error);
  }
});

document.getElementById('btn-clean-all').addEventListener('click', async () => {
  const result = await window.ghostAPI.clearAllData();
  if (result.success) {
    fpId.textContent = result.newFingerprint.profileId.substring(0, 8);
    showNotification('TODO limpiado + Fingerprint rotado');
    cleanPanel.classList.add('hidden');
    webview.reload();
  } else {
    showNotification('Error: ' + result.error);
  }
});

document.getElementById('btn-fingerprint').addEventListener('click', async () => {
  fpPanel.classList.toggle('hidden');
  cleanPanel.classList.add('hidden');
  if (!fpPanel.classList.contains('hidden')) {
    const fp = await window.ghostAPI.getFingerprint();
    renderFingerprintInfo(fp);
  }
});

document.getElementById('close-fp-panel').addEventListener('click', () => { fpPanel.classList.add('hidden'); });

document.getElementById('fp-badge').addEventListener('click', async () => {
  fpPanel.classList.toggle('hidden');
  cleanPanel.classList.add('hidden');
  if (!fpPanel.classList.contains('hidden')) {
    const fp = await window.ghostAPI.getFingerprint();
    renderFingerprintInfo(fp);
  }
});

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
'@ | Set-Content -Path "renderer.js" -Encoding UTF8

Write-Host "Parte 6 completada: renderer.js" -ForegroundColor Green
