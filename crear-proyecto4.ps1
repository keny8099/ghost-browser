# Ghost Browser - Parte 4: index.html

@'
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Ghost Browser</title>
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="toolbar">
    <div class="nav-buttons">
      <button id="btn-back" class="nav-btn" title="Atras">&#x2190;</button>
      <button id="btn-forward" class="nav-btn" title="Adelante">&#x2192;</button>
      <button id="btn-reload" class="nav-btn" title="Recargar">&#x21BB;</button>
      <button id="btn-home" class="nav-btn" title="Inicio">&#x2302;</button>
    </div>
    <div class="url-bar">
      <input type="text" id="url-input" placeholder="Buscar o escribir URL..." spellcheck="false">
      <button id="btn-go" class="go-btn" title="Ir">&#x2192;</button>
    </div>
    <div class="tool-buttons">
      <button id="btn-rotate" class="tool-btn rotate-btn" title="Rotar Fingerprint">&#x1F504; Rotar</button>
      <button id="btn-clean" class="tool-btn clean-btn" title="Limpiar Datos">&#x1F5D1; Limpiar</button>
      <button id="btn-fingerprint" class="tool-btn fp-btn" title="Ver Fingerprint">&#x1F50D; ID</button>
    </div>
  </div>

  <div id="clean-panel" class="panel hidden">
    <div class="panel-header">
      <h3>Limpiar Datos de Navegacion</h3>
      <button id="close-clean-panel" class="close-btn">&times;</button>
    </div>
    <div class="panel-body">
      <label class="checkbox-item"><input type="checkbox" id="chk-cookies" checked> Cookies</label>
      <label class="checkbox-item"><input type="checkbox" id="chk-cache" checked> Cache</label>
      <label class="checkbox-item"><input type="checkbox" id="chk-localstorage" checked> LocalStorage</label>
      <label class="checkbox-item"><input type="checkbox" id="chk-sessionstorage" checked> SessionStorage</label>
      <label class="checkbox-item"><input type="checkbox" id="chk-indexeddb" checked> IndexedDB</label>
      <label class="checkbox-item"><input type="checkbox" id="chk-websql"> WebSQL</label>
      <div class="panel-actions">
        <button id="btn-clean-selected" class="action-btn">Limpiar Seleccionados</button>
        <button id="btn-clean-all" class="action-btn danger-btn">Limpiar TODO + Rotar</button>
      </div>
    </div>
  </div>

  <div id="fp-panel" class="panel hidden">
    <div class="panel-header">
      <h3>Fingerprint Actual</h3>
      <button id="close-fp-panel" class="close-btn">&times;</button>
    </div>
    <div class="panel-body">
      <div id="fp-info" class="fp-info"></div>
    </div>
  </div>

  <div id="notification" class="notification hidden"></div>

  <webview id="browser-view" src="https://www.google.com" preload="./webview-preload.js"></webview>

  <div class="status-bar">
    <span id="status-text">Listo</span>
    <span id="fp-badge" class="fp-badge" title="ID del perfil actual">ID: <span id="fp-id">---</span></span>
  </div>

  <script src="renderer.js"></script>
</body>
</html>
'@ | Set-Content -Path "index.html" -Encoding UTF8

Write-Host "Parte 4 completada: index.html" -ForegroundColor Green
