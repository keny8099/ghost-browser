const { app, BrowserWindow, session, ipcMain, Menu } = require("electron");
const path = require("path");
const fs = require("fs");
const https = require("https");
const dns = require("dns");
const { generateFingerprint } = require("./fingerprint");

const UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
app.userAgentFallback = UA;

let mainWindow;
let currentFingerprint = generateFingerprint();
let currentProfile = "default";
const profilesDir = path.join(app.getPath("userData"), "profiles");
const stateFile = path.join(app.getPath("userData"), "state.json");

const AD_DOMAINS = ["doubleclick.net","googlesyndication.com","googleadservices.com","google-analytics.com","googletagmanager.com","adservice.google.com","pagead2.googlesyndication.com","ads.facebook.com","amazon-adsystem.com","ads.yahoo.com","ad.doubleclick.net","adnxs.com","adsrvr.org","outbrain.com","taboola.com","mgid.com","popads.net","popcash.net","propellerads.com","criteo.com","criteo.net","pubmatic.com","openx.net","scorecardresearch.com","quantserve.com","demdex.net","serving-sys.com"];

if (!fs.existsSync(profilesDir)) fs.mkdirSync(profilesDir, { recursive: true });
app.disableHardwareAcceleration();

function saveState() { fs.writeFileSync(stateFile, JSON.stringify({ currentProfile })); }
function loadState() { try { if (fs.existsSync(stateFile)) { currentProfile = JSON.parse(fs.readFileSync(stateFile,"utf8")).currentProfile || "default"; } } catch(e) {} }

function getProfilePath(n) { return path.join(profilesDir, n); }
function loadProfileData(n) { const f = path.join(getProfilePath(n), "meta.json"); try { if (fs.existsSync(f)) return JSON.parse(fs.readFileSync(f,"utf8")); } catch(e) {} return null; }
function saveProfileData(n, d) { const p = getProfilePath(n); if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); fs.writeFileSync(path.join(p, "meta.json"), JSON.stringify(d, null, 2)); }
function listProfiles() { try { const dirs = fs.readdirSync(profilesDir).filter(f => fs.statSync(path.join(profilesDir, f)).isDirectory()); return dirs.length > 0 ? dirs : ["default"]; } catch(e) { return ["default"]; } }
function deleteProfile(n) { if (n === "default" || n === currentProfile) return false; try { fs.rmSync(getProfilePath(n), { recursive: true, force: true }); return true; } catch(e) { return false; } }

function createWindow() {
  mainWindow = new BrowserWindow({ width: 1280, height: 800, minWidth: 800, minHeight: 600, title: "Ghost Browser", icon: path.join(__dirname, "assets", "icon.png"), webPreferences: { preload: path.join(__dirname, "preload.js"), nodeIntegration: false, contextIsolation: true, webviewTag: true } });
  Menu.setApplicationMenu(null);
  mainWindow.loadFile("index.html");
  mainWindow.webContents.setWebRTCIPHandlingPolicy("disable_non_proxied_udp");
  mainWindow.on("closed", () => { mainWindow = null; });
}

app.on("web-contents-created", (ev, contents) => {
  contents.session.webRequest.onBeforeSendHeaders((details, callback) => {
    details.requestHeaders["User-Agent"] = UA;
    details.requestHeaders["Accept-Language"] = "en-US,en;q=0.9";
    delete details.requestHeaders["X-Client-Data"];
    callback({ requestHeaders: details.requestHeaders });
  });
  contents.session.webRequest.onBeforeRequest({ urls: ["*://*/*"] }, (details, callback) => {
    const url = details.url.toLowerCase();
    callback({ cancel: AD_DOMAINS.some(d => url.includes(d)) });
  });
});

ipcMain.handle("get-fingerprint", () => currentFingerprint);
ipcMain.handle("rotate-fingerprint", () => { currentFingerprint = generateFingerprint(); const d = loadProfileData(currentProfile) || {}; d.fingerprint = currentFingerprint; saveProfileData(currentProfile, d); return currentFingerprint; });
ipcMain.handle("get-network-info", async () => { let ip = "No disponible", dnsS = "No disponible"; try { ip = await new Promise(r => { const q = https.get("https://api.ipify.org", res => { let d=""; res.on("data",c=>{d+=c}); res.on("end",()=>r(d.trim())); }); q.on("error",()=>r("No disponible")); q.setTimeout(5000,()=>{q.destroy();r("No disponible");}); }); } catch(e){} try { dnsS = dns.getServers().join(", "); } catch(e){} return { ip, dns: dnsS }; });
ipcMain.handle("get-profiles", () => ({ profiles: listProfiles(), current: currentProfile }));
ipcMain.handle("create-profile", (ev, name) => { saveProfileData(name, { fingerprint: generateFingerprint(), createdAt: Date.now(), lastUrl: "" }); return { success: true, profiles: listProfiles() }; });
ipcMain.handle("switch-profile", (ev, name) => { const cur = loadProfileData(currentProfile) || {}; cur.fingerprint = currentFingerprint; saveProfileData(currentProfile, cur); currentProfile = name; saveState(); const d = loadProfileData(name); if (d && d.fingerprint) { currentFingerprint = d.fingerprint; } else { currentFingerprint = generateFingerprint(); saveProfileData(name, { fingerprint: currentFingerprint, lastUrl: "" }); } currentFingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; currentFingerprint.languages = ["en-US", "en"]; return { success: true, fingerprint: currentFingerprint, profile: name, lastUrl: d ? (d.lastUrl||"") : "" }; });
ipcMain.handle("delete-profile", (ev, name) => ({ success: deleteProfile(name), profiles: listProfiles() }));
ipcMain.handle("save-profile-url", (ev, name, url) => { const d = loadProfileData(name) || { fingerprint: currentFingerprint }; d.lastUrl = url; saveProfileData(name, d); return true; });
ipcMain.handle("get-profile-url", (ev, name) => { const d = loadProfileData(name); return (d && d.lastUrl) ? d.lastUrl : ""; });
ipcMain.handle("clear-data", async (ev, opts) => { const s = session.fromPartition("persist:" + currentProfile); try { if (opts.cookies) await s.clearStorageData({ storages: ["cookies"] }); if (opts.cache) { await s.clearCache(); } if (opts.localStorage) await s.clearStorageData({ storages: ["localstorage"] }); return { success: true }; } catch(e) { return { success: false, error: e.message }; } });
ipcMain.handle("clear-all-data", async () => { const s = session.fromPartition("persist:" + currentProfile); try { await s.clearStorageData(); await s.clearCache(); currentFingerprint = generateFingerprint(); saveProfileData(currentProfile, { fingerprint: currentFingerprint, lastUrl: "" }); return { success: true, newFingerprint: currentFingerprint }; } catch(e) { return { success: false, error: e.message }; } });

app.whenReady().then(() => { loadState(); const d = loadProfileData(currentProfile); if (d && d.fingerprint) { currentFingerprint = d.fingerprint; } currentFingerprint.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone; currentFingerprint.languages = ["en-US", "en"]; if (!fs.existsSync(getProfilePath("default"))) { saveProfileData("default", { fingerprint: currentFingerprint, createdAt: Date.now(), lastUrl: "" }); } createWindow(); });
app.on("window-all-closed", () => { saveState(); app.quit(); });