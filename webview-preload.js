const { ipcRenderer } = require("electron");
let fingerprint = null;

async function loadFingerprint() {
  fingerprint = await ipcRenderer.invoke("get-fingerprint");
  applyFingerprint();
}

function applyFingerprint() {
  if (!fingerprint) return;
  const script = `(function() {
    const fp = ${JSON.stringify(fingerprint)};
    // NO tocar timezone - dejamos el real del sistema
    // Ocultar Electron
    Object.defineProperty(navigator, "webdriver", { get: () => false });
    delete window.process; delete window.require;
    Object.defineProperty(navigator, "plugins", { get: () => ({ length: 3, 0: { name: "Chrome PDF Plugin", filename: "internal-pdf-viewer" }, 1: { name: "Chrome PDF Viewer", filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai" }, 2: { name: "Native Client", filename: "internal-nacl-plugin" }, item: function(i){return this[i]}, namedItem: function(){return null}, refresh: function(){} }) });
    if (!window.chrome) { window.chrome = { runtime: {}, loadTimes: function(){}, csi: function(){} }; }
    // Canvas spoofing
    const origToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function(type, quality) { const ctx = this.getContext("2d"); if (ctx && this.width > 0) { try { const img = ctx.getImageData(0,0,Math.min(this.width,50),Math.min(this.height,50)); for(let i=0;i<img.data.length;i+=4){img.data[i]=Math.min(255,Math.max(0,img.data[i]+((Math.sin(fp.canvas.seed+i)*10000)%1)*2));} ctx.putImageData(img,0,0); } catch(e){} } return origToDataURL.call(this, type, quality); };
    // WebGL spoofing
    const origP = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = function(p) { if(p===37445) return fp.webgl.vendor; if(p===37446) return fp.webgl.renderer; return origP.call(this,p); };
    if(typeof WebGL2RenderingContext!=="undefined"){const o2=WebGL2RenderingContext.prototype.getParameter;WebGL2RenderingContext.prototype.getParameter=function(p){if(p===37445)return fp.webgl.vendor;if(p===37446)return fp.webgl.renderer;return o2.call(this,p);};}
    // Navigator
    Object.defineProperty(navigator, "userAgent", { get: () => fp.userAgent });
    Object.defineProperty(navigator, "platform", { get: () => fp.platform });
    Object.defineProperty(navigator, "languages", { get: () => Object.freeze([...fp.languages]) });
    Object.defineProperty(navigator, "language", { get: () => fp.languages[0] });
    Object.defineProperty(navigator, "hardwareConcurrency", { get: () => fp.hardwareConcurrency });
    Object.defineProperty(navigator, "deviceMemory", { get: () => fp.deviceMemory });
    Object.defineProperty(navigator, "maxTouchPoints", { get: () => fp.maxTouchPoints });
    Object.defineProperty(navigator, "vendor", { get: () => "Google Inc." });
    // Screen
    Object.defineProperty(screen, "width", { get: () => fp.screen.width });
    Object.defineProperty(screen, "height", { get: () => fp.screen.height });
    Object.defineProperty(screen, "availWidth", { get: () => fp.screen.width });
    Object.defineProperty(screen, "availHeight", { get: () => fp.screen.height - 40 });
    Object.defineProperty(screen, "colorDepth", { get: () => fp.screen.colorDepth });
    // WebRTC block
    if(typeof RTCPeerConnection!=="undefined"){const oRTC=RTCPeerConnection;window.RTCPeerConnection=function(c){if(c&&c.iceServers)c.iceServers=[];return new oRTC(c);};window.RTCPeerConnection.prototype=oRTC.prototype;}
    console.log("[Ghost v2.1] OK");
  })();`;
  window.addEventListener("DOMContentLoaded", () => { const s = document.createElement("script"); s.textContent = script; document.documentElement.prepend(s); s.remove(); });
}

loadFingerprint();