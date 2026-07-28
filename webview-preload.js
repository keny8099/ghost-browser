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

      // === OCULTAR QUE ES ELECTRON/AUTOMATED ===
      // Eliminar webdriver
      Object.defineProperty(navigator, 'webdriver', { get: () => false });
      // Eliminar propiedades de Electron
      delete window.process;
      delete window.require;
      delete window.__electron;
      // Fake plugins (Chrome normal tiene plugins)
      Object.defineProperty(navigator, 'plugins', {
        get: () => {
          return {
            length: 3,
            0: { name: 'Chrome PDF Plugin', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
            1: { name: 'Chrome PDF Viewer', filename: 'mhjfbmdgcfjbbpaeojofohoefgiehjai', description: '' },
            2: { name: 'Native Client', filename: 'internal-nacl-plugin', description: '' },
            item: function(i) { return this[i]; },
            namedItem: function(n) { for(let i=0;i<this.length;i++) if(this[i].name===n) return this[i]; return null; },
            refresh: function() {},
          };
        }
      });
      // Fake chrome object
      if (!window.chrome) {
        window.chrome = { runtime: {}, loadTimes: function(){}, csi: function(){} };
      }
      // Fake permissions query
      const origQuery = window.navigator.permissions ? window.navigator.permissions.query.bind(window.navigator.permissions) : null;
      if (origQuery) {
        window.navigator.permissions.query = (params) => {
          if (params.name === 'notifications') {
            return Promise.resolve({ state: 'prompt', onchange: null });
          }
          return origQuery(params);
        };
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
              const noise = ((Math.sin(fp.canvas.seed + i) * 10000) % 1) * fp.canvas.noiseLevel;
              data[i] = Math.min(255, Math.max(0, data[i] + noise * 2));
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

      // === NAVIGATOR SPOOFING (consistente - todo Windows) ===
      Object.defineProperty(navigator, 'userAgent', { get: () => fp.userAgent });
      Object.defineProperty(navigator, 'platform', { get: () => fp.platform });
      Object.defineProperty(navigator, 'languages', { get: () => Object.freeze([...fp.languages]) });
      Object.defineProperty(navigator, 'language', { get: () => fp.languages[0] });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory });
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => fp.maxTouchPoints });
      Object.defineProperty(navigator, 'vendor', { get: () => 'Google Inc.' });
      Object.defineProperty(navigator, 'appVersion', { get: () => fp.userAgent.replace('Mozilla/', '') });

      // === SCREEN SPOOFING ===
      Object.defineProperty(screen, 'width', { get: () => fp.screen.width });
      Object.defineProperty(screen, 'height', { get: () => fp.screen.height });
      Object.defineProperty(screen, 'availWidth', { get: () => fp.screen.width });
      Object.defineProperty(screen, 'availHeight', { get: () => fp.screen.height - 40 });
      Object.defineProperty(screen, 'colorDepth', { get: () => fp.screen.colorDepth });
      Object.defineProperty(screen, 'pixelDepth', { get: () => fp.screen.colorDepth });
      Object.defineProperty(window, 'devicePixelRatio', { get: () => fp.screen.pixelRatio });
      Object.defineProperty(window, 'innerWidth', { get: () => fp.screen.width });
      Object.defineProperty(window, 'outerWidth', { get: () => fp.screen.width });
      Object.defineProperty(window, 'innerHeight', { get: () => fp.screen.height - 80 });
      Object.defineProperty(window, 'outerHeight', { get: () => fp.screen.height });

      // === TIMEZONE SPOOFING ===
      const targetTZ = fp.timezone;
      const OrigDTF = Intl.DateTimeFormat;
      Intl.DateTimeFormat = function(locale, options) {
        if (!options) options = {};
        options.timeZone = targetTZ;
        return new OrigDTF(locale, options);
      };
      Intl.DateTimeFormat.prototype = OrigDTF.prototype;
      
      const origResolved = OrigDTF.prototype.resolvedOptions;
      OrigDTF.prototype.resolvedOptions = function() {
        const r = origResolved.call(this);
        r.timeZone = targetTZ;
        return r;
      };

      const tzOffsets = { 'America/New_York':-300,'America/Chicago':-360,'America/Denver':-420,'America/Los_Angeles':-480,'Europe/London':0,'Europe/Madrid':60,'Europe/Berlin':60,'America/Bogota':-300,'America/Mexico_City':-360 };
      const fakeOffset = -(tzOffsets[targetTZ] || new Date().getTimezoneOffset());
      Date.prototype.getTimezoneOffset = function() { return fakeOffset; };

      // === WEBRTC PROTECTION ===
      if (typeof RTCPeerConnection !== 'undefined') {
        const origRTC = RTCPeerConnection;
        window.RTCPeerConnection = function(config) {
          if (config && config.iceServers) config.iceServers = [];
          return new origRTC(config);
        };
        window.RTCPeerConnection.prototype = origRTC.prototype;
      }

      console.log('[Ghost v1.5] OK:', fp.profileId, '| UA:', fp.userAgent.substring(0,30));
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
