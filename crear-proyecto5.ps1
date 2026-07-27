# Ghost Browser - Parte 5: styles.css

@'
* { margin: 0; padding: 0; box-sizing: border-box; }

:root {
  --bg-primary: #1a1a2e;
  --bg-secondary: #16213e;
  --bg-tertiary: #0f3460;
  --accent: #e94560;
  --accent-hover: #ff6b6b;
  --text-primary: #eaeaea;
  --text-secondary: #a0a0a0;
  --border: #2a2a4a;
  --success: #4ecdc4;
  --warning: #f39c12;
  --danger: #e74c3c;
  --radius: 8px;
}

body {
  font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
  background: var(--bg-primary);
  color: var(--text-primary);
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-secondary);
  border-bottom: 1px solid var(--border);
}

.nav-buttons { display: flex; gap: 4px; }

.nav-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  padding: 6px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 16px;
  transition: all 0.2s;
}

.nav-btn:hover { background: var(--bg-tertiary); color: var(--text-primary); }
.nav-btn:active { transform: scale(0.9); }

.url-bar {
  flex: 1;
  display: flex;
  align-items: center;
  background: var(--bg-primary);
  border: 1px solid var(--border);
  border-radius: 20px;
  padding: 4px 12px;
  transition: border-color 0.2s;
}

.url-bar:focus-within { border-color: var(--accent); }

#url-input {
  flex: 1;
  background: transparent;
  border: none;
  color: var(--text-primary);
  font-size: 13px;
  outline: none;
  padding: 4px 0;
}

#url-input::placeholder { color: var(--text-secondary); }

.go-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 50%;
  transition: all 0.2s;
}

.go-btn:hover { color: var(--accent); }

.tool-buttons { display: flex; gap: 4px; }

.tool-btn {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-secondary);
  padding: 6px 10px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 12px;
  transition: all 0.2s;
}

.tool-btn:hover { border-color: var(--accent); color: var(--accent); }
.tool-btn:active { transform: scale(0.95); }
.rotate-btn:hover { border-color: var(--success); color: var(--success); }
.clean-btn:hover { border-color: var(--warning); color: var(--warning); }

.panel {
  position: absolute;
  top: 52px;
  right: 12px;
  width: 320px;
  background: var(--bg-secondary);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  z-index: 1000;
}

.panel.hidden { display: none; }

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
}

.panel-header h3 { font-size: 14px; font-weight: 600; }

.close-btn {
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 20px;
  cursor: pointer;
}

.close-btn:hover { color: var(--accent); }
.panel-body { padding: 12px 16px; }

.checkbox-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 0;
  cursor: pointer;
  font-size: 13px;
}

.checkbox-item input[type="checkbox"] { accent-color: var(--accent); width: 16px; height: 16px; }

.panel-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid var(--border);
}

.action-btn {
  background: var(--bg-tertiary);
  border: 1px solid var(--border);
  color: var(--text-primary);
  padding: 10px 16px;
  border-radius: var(--radius);
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}

.action-btn:hover { background: var(--accent); border-color: var(--accent); }

.danger-btn {
  background: rgba(231, 76, 60, 0.15);
  border-color: var(--danger);
  color: var(--danger);
}

.danger-btn:hover { background: var(--danger); color: white; }

.fp-info { font-size: 12px; max-height: 400px; overflow-y: auto; }

.fp-info .fp-row {
  display: flex;
  justify-content: space-between;
  padding: 6px 0;
  border-bottom: 1px solid rgba(255,255,255,0.05);
}

.fp-info .fp-label { color: var(--text-secondary); font-weight: 500; }

.fp-info .fp-value {
  color: var(--success);
  text-align: right;
  max-width: 180px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.notification {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: var(--bg-secondary);
  border: 1px solid var(--success);
  color: var(--success);
  padding: 10px 20px;
  border-radius: var(--radius);
  font-size: 13px;
  z-index: 2000;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
}

.notification.hidden { display: none; }

#browser-view { flex: 1; border: none; background: white; }

.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 12px;
  background: var(--bg-secondary);
  border-top: 1px solid var(--border);
  font-size: 11px;
  color: var(--text-secondary);
}

.fp-badge {
  background: rgba(233, 69, 96, 0.15);
  padding: 2px 8px;
  border-radius: 10px;
  color: var(--accent);
  cursor: pointer;
}

.fp-badge:hover { background: rgba(233, 69, 96, 0.3); }

::-webkit-scrollbar { width: 8px; }
::-webkit-scrollbar-track { background: var(--bg-primary); }
::-webkit-scrollbar-thumb { background: var(--border); border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: var(--accent); }
'@ | Set-Content -Path "styles.css" -Encoding UTF8

Write-Host "Parte 5 completada: styles.css" -ForegroundColor Green
