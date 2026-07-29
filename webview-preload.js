const { ipcRenderer } = require('electron');

let fingerprint = null;

async function loadFingerprint() {
  fingerprint = await ipcRenderer.invoke('get-fingerprint');
  applyFingerprint();
}

function applyFingerprint() {
  if (!fingerprint) return;

  const script = `
    (function() {
      'use strict';
      const fp = ${JSON.stringify(fingerprint)};

      // USAR TIMEZONE DEL SISTEMA REAL (no del fingerprint guardado)
      const REAL_TZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
      fp.timezone = REAL_TZ;

      // === OCULTAR ELECTRON ===
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      delete window.process;
      delete window.require;
      Object.defineProperty(navigator, 'plugins', {
        get: () => ({
          length: 3,
          0: { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
          1: { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
          2: { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
          item: function(i) { return this[i]; },
          namedItem: function(n) { for(let i=0;i<this.length;i++) if(this[i].name===n) return this[i]; return null; },
          refresh: function() {},
        })
      });
      if (!window.chrome) {
        window.chrome = { runtime: {}, loadTimes: function(){}, csi: function(){} };
      }

      // === CANVAS SPOOFING ===
      const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
        const ctx = this.getContext('2d');
        if (ctx && this.width > 0 && this.height > 0) {
          try {
            const imageData = ctx.getImageData(0, 0, Math.min(this.width, 100), Math.min(this.height, 100));
            const data = imageData.data;
            for (let i = 0; i < data.length; i += 4) {
              data[i] = Math.min(255, Math.max(0, data[i] + ((Math.sin(fp.canvas.seed + i) * 10000) % 1) * 2));
            }
            ctx.putImageData(imageData, 0, 0);
          } catch(e) {}
        }
        return origToDataURL.call(this, type, quality);
      };

      // === WEBGL SPOOFING ===
      const origGetParam = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(p) {
        if (p === 37445) return fp.webgl.vendor;
        if (p === 37446) return fp.webgl.renderer;
        return origGetParam.call(this, p);
      };
      if (typeof WebGL2RenderingContext !== 'undefined') {
        const origGetParam2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(p) {
          if (p === 37445) return fp.webgl.vendor;
          if (p === 37446) return fp.webgl.renderer;
          return origGetParam2.call(this, p);
        };
      }

      // === NAVIGATOR SPOOFING ===
      Object.defineProperty(navigator, 'userAgent', { get: () => fp.userAgent });
      Object.defineProperty(navigator, 'platform', { get: () => fp.platform });
      Object.defineProperty(navigator, 'languages', { get: () => Object.freeze([...fp.languages]) });
      Object.defineProperty(navigator, 'language', { get: () => fp.languages[0] });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory });
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => fp.maxTouchPoints });
      Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });

      // === SCREEN SPOOFING ===
      Object.defineProperty(screen, 'width', { get: () => fp.screen.width });
      Object.defineProperty(screen, 'height', { get: () => fp.screen.height });
      Object.defineProperty(screen, 'availWidth', { get: () => fp.screen.width });
      Object.defineProperty(screen, 'availHeight', { get: () => fp.screen.height - 40 });
      Object.defineProperty(screen, 'colorDepth', { get: () => fp.screen.colorDepth });

      // === TIMEZONE - NO TOCAR === 
      // Dejamos el timezone REAL del sistema (no lo modificamos)
      // Asi Local y System siempre coinciden

      // === WEBRTC PROTECTION ===
      if (typeof RTCPeerConnection !== 'undefined') {
        const origRTC = RTCPeerConnection;
        window.RTCPeerConnection = function(config) {
          if (config && config.iceServers) config.iceServers = [];
          return new origRTC(config);
        };
        window.RTCPeerConnection.prototype = origRTC.prototype;
      }

      console.log('[Ghost v2.0] OK | TZ real:', REAL_TZ);
    })();
  `;

  window.addEventListener('DOMContentLoaded', () => {
    const s = document.createElement('script');
    s.textContent = script;
    document.documentElement.prepend(s);
    s.remove();
  });
}

loadFingerprint();
