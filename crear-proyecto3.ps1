# Ghost Browser - Parte 3: webview-preload.js

@'
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

      // CANVAS FINGERPRINT SPOOFING
      const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
      HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
        const ctx = this.getContext('2d');
        if (ctx) {
          const imageData = ctx.getImageData(0, 0, this.width, this.height);
          const data = imageData.data;
          const seed = fp.canvas.seed;
          for (let i = 0; i < data.length; i += 4) {
            const noise = ((Math.sin(seed + i) * 10000) % 1) * fp.canvas.noiseLevel;
            data[i] = Math.min(255, Math.max(0, data[i] + fp.canvas.colorShift.r + noise * 255));
            data[i+1] = Math.min(255, Math.max(0, data[i+1] + fp.canvas.colorShift.g + noise * 255));
            data[i+2] = Math.min(255, Math.max(0, data[i+2] + fp.canvas.colorShift.b + noise * 255));
          }
          ctx.putImageData(imageData, 0, 0);
        }
        return origToDataURL.call(this, type, quality);
      };

      const origGetImageData = CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData = function(sx, sy, sw, sh) {
        const imageData = origGetImageData.call(this, sx, sy, sw, sh);
        const data = imageData.data;
        const seed = fp.canvas.seed;
        for (let i = 0; i < data.length; i += 4) {
          const noise = ((Math.sin(seed + i) * 10000) % 1) * fp.canvas.noiseLevel;
          data[i] = Math.min(255, Math.max(0, data[i] + noise * 3));
          data[i+1] = Math.min(255, Math.max(0, data[i+1] + noise * 3));
          data[i+2] = Math.min(255, Math.max(0, data[i+2] + noise * 3));
        }
        return imageData;
      };

      // WEBGL FINGERPRINT SPOOFING
      const origGetParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function(param) {
        if (param === 37445) return fp.webgl.vendor;
        if (param === 37446) return fp.webgl.renderer;
        return origGetParameter.call(this, param);
      };
      if (typeof WebGL2RenderingContext !== 'undefined') {
        const origGetParameter2 = WebGL2RenderingContext.prototype.getParameter;
        WebGL2RenderingContext.prototype.getParameter = function(param) {
          if (param === 37445) return fp.webgl.vendor;
          if (param === 37446) return fp.webgl.renderer;
          return origGetParameter2.call(this, param);
        };
      }

      // NAVIGATOR SPOOFING
      Object.defineProperty(navigator, 'userAgent', { get: () => fp.userAgent });
      Object.defineProperty(navigator, 'platform', { get: () => fp.platform });
      Object.defineProperty(navigator, 'languages', { get: () => fp.languages });
      Object.defineProperty(navigator, 'language', { get: () => fp.languages[0] });
      Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => fp.hardwareConcurrency });
      Object.defineProperty(navigator, 'deviceMemory', { get: () => fp.deviceMemory });
      Object.defineProperty(navigator, 'maxTouchPoints', { get: () => fp.maxTouchPoints });
      if (fp.doNotTrack) {
        Object.defineProperty(navigator, 'doNotTrack', { get: () => fp.doNotTrack });
      }

      // SCREEN SPOOFING
      Object.defineProperty(screen, 'width', { get: () => fp.screen.width });
      Object.defineProperty(screen, 'height', { get: () => fp.screen.height });
      Object.defineProperty(screen, 'availWidth', { get: () => fp.screen.width });
      Object.defineProperty(screen, 'availHeight', { get: () => fp.screen.height - 40 });
      Object.defineProperty(screen, 'colorDepth', { get: () => fp.screen.colorDepth });
      Object.defineProperty(screen, 'pixelDepth', { get: () => fp.screen.colorDepth });
      Object.defineProperty(window, 'devicePixelRatio', { get: () => fp.screen.pixelRatio });

      // WEBRTC LEAK PROTECTION
      if (typeof RTCPeerConnection !== 'undefined') {
        const origRTC = RTCPeerConnection;
        window.RTCPeerConnection = function(config) {
          if (config && config.iceServers) config.iceServers = [];
          return new origRTC(config);
        };
        window.RTCPeerConnection.prototype = origRTC.prototype;
      }

      // TIMEZONE SPOOFING
      const origDateTimeFormat = Intl.DateTimeFormat;
      Intl.DateTimeFormat = function(locale, options) {
        if (!options) options = {};
        options.timeZone = fp.timezone;
        return new origDateTimeFormat(locale, options);
      };
      Intl.DateTimeFormat.prototype = origDateTimeFormat.prototype;

      console.log('[Ghost] Fingerprint aplicado:', fp.profileId);
    })();
  `;

  window.addEventListener('DOMContentLoaded', () => {
    const scriptEl = document.createElement('script');
    scriptEl.textContent = script;
    document.documentElement.prepend(scriptEl);
    scriptEl.remove();
  });
}

loadFingerprint();
'@ | Set-Content -Path "webview-preload.js" -Encoding UTF8

Write-Host "Parte 3 completada: webview-preload.js" -ForegroundColor Green
