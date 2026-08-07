const urlInput = document.getElementById("url-input");
const statusText = document.getElementById("status-text");
const fpId = document.getElementById("fp-id");
const notification = document.getElementById("notification");
const cleanPanel = document.getElementById("clean-panel");
const fpPanel = document.getElementById("fp-panel");
const fpInfo = document.getElementById("fp-info");
const profilesPanel = document.getElementById("profiles-panel");
const profilesList = document.getElementById("profiles-list");
const currentProfileName = document.getElementById("current-profile-name");
const tabsContainer = document.getElementById("tabs-container");
const webviewsContainer = document.getElementById("webviews-container");

let currentProfile = "default";
let tabs = [];
let activeTabId = null;

function genId() { return Date.now().toString(36) + Math.random().toString(36).substr(2,5); }

function createTab(url) {
  const id = genId();
  const wv = document.createElement("webview");
  wv.setAttribute("preload", "./webview-preload.js");
  wv.setAttribute("useragent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36");
  wv.setAttribute("partition", "persist:" + currentProfile);
  wv.src = url || "https://www.google.com";
  wv.id = "wv-" + id;
  webviewsContainer.appendChild(wv);
  wv.addEventListener("new-window", (e) => { e.preventDefault(); if(e.url && e.url.startsWith("http")) { createTab(e.url); } });
  wv.addEventListener("did-create-window", (e) => { e.preventDefault(); });
  tabs.push({ id, title: "Nueva pestana", url: wv.src });
  wv.addEventListener("page-title-updated", (e) => { const tab = tabs.find(t=>t.id===id); if(tab) tab.title = e.title; renderTabs(); });
  wv.addEventListener("did-navigate", (e) => { const tab = tabs.find(t=>t.id===id); if(tab) tab.url = e.url; if(activeTabId===id) urlInput.value = e.url; saveAllUrls(); });
  wv.addEventListener("did-navigate-in-page", (e) => { if(activeTabId===id) urlInput.value = e.url; });
  wv.addEventListener("did-finish-load", () => { if(activeTabId===id) updateStatus("Cargado"); saveAllUrls(); });
  wv.addEventListener("did-start-loading", () => { if(activeTabId===id) updateStatus("Cargando..."); });
  switchTab(id);
  renderTabs();
  return id;
}

function switchTab(id) {
  activeTabId = id;
  document.querySelectorAll("#webviews-container webview").forEach(w => w.classList.remove("active"));
  const wv = document.getElementById("wv-" + id);
  if (wv) { wv.classList.add("active"); urlInput.value = wv.getURL() || wv.src || ""; }
  renderTabs();
}

function closeTab(id) {
  if (tabs.length <= 1) return;
  const idx = tabs.findIndex(t => t.id === id);
  const wv = document.getElementById("wv-" + id);
  if (wv) wv.remove();
  tabs.splice(idx, 1);
  if (activeTabId === id) { const newIdx = Math.min(idx, tabs.length-1); switchTab(tabs[newIdx].id); }
  renderTabs();
  saveAllUrls();
}

function renderTabs() {
  tabsContainer.innerHTML = "";
  tabs.forEach(tab => {
    const div = document.createElement("div");
    div.className = "tab" + (tab.id === activeTabId ? " active" : "");
    div.innerHTML = "<span class=\"tab-title\">" + (tab.title || "Nueva pestana") + "</span>" + (tabs.length > 1 ? "<button class=\"tab-close\" data-id=\"" + tab.id + "\">&times;</button>" : "");
    div.addEventListener("click", (e) => { if (!e.target.classList.contains("tab-close")) switchTab(tab.id); });
    tabsContainer.appendChild(div);
  });
  document.querySelectorAll(".tab-close").forEach(btn => { btn.addEventListener("click", (e) => { e.stopPropagation(); closeTab(btn.getAttribute("data-id")); }); });
}

function getActiveWebview() { return document.getElementById("wv-" + activeTabId); }

function navigate(url) {
  if (!url) return;
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    if (url.includes(".") && !url.includes(" ")) { url = "https://" + url; }
    else { url = "https://www.google.com/search?q=" + encodeURIComponent(url); }
  }
  const wv = getActiveWebview();
  if (wv) { wv.src = url; urlInput.value = url; }
}

function saveAllUrls() {
  const urls = tabs.map(t => t.url).filter(u => u && !u.startsWith("file://"));
  const mainUrl = urls[0] || "";
  window.ghostAPI.saveProfileUrl(currentProfile, mainUrl);
}

async function init() {
  const fp = await window.ghostAPI.getFingerprint();
  fpId.textContent = fp.profileId.substring(0, 8);
  const pd = await window.ghostAPI.getProfiles();
  currentProfile = pd.current;
  currentProfileName.textContent = currentProfile;
  const savedUrl = await window.ghostAPI.getProfileUrl(currentProfile);
  createTab(savedUrl || "https://www.google.com");
  updateStatus("Listo - Perfil: " + currentProfile);
}

document.getElementById("btn-new-tab").addEventListener("click", () => { createTab("https://www.google.com"); });
document.getElementById("btn-back").addEventListener("click", () => { const wv=getActiveWebview(); if(wv&&wv.canGoBack()) wv.goBack(); });
document.getElementById("btn-forward").addEventListener("click", () => { const wv=getActiveWebview(); if(wv&&wv.canGoForward()) wv.goForward(); });
document.getElementById("btn-reload").addEventListener("click", () => { const wv=getActiveWebview(); if(wv) wv.reload(); });
document.getElementById("btn-home").addEventListener("click", () => { navigate("https://www.google.com"); });
document.getElementById("btn-go").addEventListener("click", () => { navigate(urlInput.value); });
urlInput.addEventListener("keydown", (e) => { if(e.key==="Enter") navigate(urlInput.value); });

document.getElementById("btn-rotate").addEventListener("click", async () => { const fp = await window.ghostAPI.rotateFingerprint(); fpId.textContent = fp.profileId.substring(0,8); showNotification("Fingerprint rotado"); const wv=getActiveWebview(); if(wv) wv.reload(); });

document.getElementById("btn-clean").addEventListener("click", () => { cleanPanel.classList.toggle("hidden"); fpPanel.classList.add("hidden"); profilesPanel.classList.add("hidden"); });
document.getElementById("close-clean-panel").addEventListener("click", () => { cleanPanel.classList.add("hidden"); });
document.getElementById("btn-clean-selected").addEventListener("click", async () => {
  const opts = { cookies: document.getElementById("chk-cookies").checked, cache: document.getElementById("chk-cache").checked, localStorage: document.getElementById("chk-localstorage").checked };
  const r = await window.ghostAPI.clearData(opts);
  if(r.success) { showNotification("Datos limpiados"); cleanPanel.classList.add("hidden"); }
});
document.getElementById("btn-clean-all").addEventListener("click", async () => {
  const r = await window.ghostAPI.clearAllData();
  if(r.success) { fpId.textContent = r.newFingerprint.profileId.substring(0,8); showNotification("TODO limpiado"); cleanPanel.classList.add("hidden"); const wv=getActiveWebview(); if(wv) wv.reload(); }
});

document.getElementById("btn-profiles").addEventListener("click", async () => { profilesPanel.classList.toggle("hidden"); cleanPanel.classList.add("hidden"); fpPanel.classList.add("hidden"); if(!profilesPanel.classList.contains("hidden")) await renderProfiles(); });
document.getElementById("close-profiles-panel").addEventListener("click", () => { profilesPanel.classList.add("hidden"); });
document.getElementById("btn-create-profile").addEventListener("click", async () => {
  const input = document.getElementById("new-profile-name"); const name = input.value.trim();
  if(!name){showNotification("Escribe un nombre");return;}
  const r = await window.ghostAPI.createProfile(name);
  if(r.success){input.value="";showNotification("Perfil "+name+" creado");await renderProfiles();}
});
document.getElementById("new-profile-name").addEventListener("keydown",(e)=>{if(e.key==="Enter")document.getElementById("btn-create-profile").click();});

async function renderProfiles() {
  const data = await window.ghostAPI.getProfiles();
  profilesList.innerHTML = "";
  data.profiles.forEach(name => {
    const isActive = name === data.current;
    const div = document.createElement("div");
    div.className = "profile-item" + (isActive ? " active" : "");
    let html = "<span class=\"profile-name\">" + name + (isActive?" (activo)":"") + "</span><div class=\"profile-actions\">";
    if(!isActive) html += "<button class=\"profile-switch-btn\" data-name=\""+name+"\">Usar</button>";
    if(name!=="default"&&!isActive) html += "<button class=\"profile-delete-btn\" data-name=\""+name+"\">X</button>";
    html += "</div>"; div.innerHTML = html; profilesList.appendChild(div);
  });
  document.querySelectorAll(".profile-switch-btn").forEach(btn=>{
    btn.addEventListener("click", async()=>{
      const name=btn.getAttribute("data-name");
      saveAllUrls();
      const r=await window.ghostAPI.switchProfile(name);
      if(r.success){
        currentProfile=name; currentProfileName.textContent=name;
        fpId.textContent=r.fingerprint.profileId.substring(0,8);
        webviewsContainer.innerHTML=""; tabs=[]; activeTabId=null;
        const savedUrl = await window.ghostAPI.getProfileUrl(name);
        createTab(savedUrl||"https://www.google.com");
        showNotification("Perfil: "+name); profilesPanel.classList.add("hidden");
      }
    });
  });
  document.querySelectorAll(".profile-delete-btn").forEach(btn=>{
    btn.addEventListener("click",async()=>{
      const r=await window.ghostAPI.deleteProfile(btn.getAttribute("data-name"));
      if(r.success){showNotification("Perfil eliminado");await renderProfiles();}
    });
  });
}

document.getElementById("btn-fingerprint").addEventListener("click", async()=>{ fpPanel.classList.toggle("hidden"); cleanPanel.classList.add("hidden"); profilesPanel.classList.add("hidden"); if(!fpPanel.classList.contains("hidden")){const fp=await window.ghostAPI.getFingerprint();renderFP(fp);loadNet();} });
document.getElementById("close-fp-panel").addEventListener("click",()=>{fpPanel.classList.add("hidden");});
document.getElementById("fp-badge").addEventListener("click",async()=>{ fpPanel.classList.toggle("hidden"); if(!fpPanel.classList.contains("hidden")){const fp=await window.ghostAPI.getFingerprint();renderFP(fp);loadNet();} });

async function loadNet(){document.getElementById("info-ip").textContent="Cargando...";document.getElementById("info-dns").textContent="Cargando...";const i=await window.ghostAPI.getNetworkInfo();document.getElementById("info-ip").textContent=i.ip;document.getElementById("info-dns").textContent=i.dns;}

function renderFP(fp){fpInfo.innerHTML="<div class=\"fp-row\"><span class=\"fp-label\">User-Agent</span><span class=\"fp-value\">"+fp.userAgent+"</span></div><div class=\"fp-row\"><span class=\"fp-label\">Platform</span><span class=\"fp-value\">"+fp.platform+"</span></div><div class=\"fp-row\"><span class=\"fp-label\">Language</span><span class=\"fp-value\">"+fp.languages.join(", ")+"</span></div><div class=\"fp-row\"><span class=\"fp-label\">Timezone</span><span class=\"fp-value\">"+fp.timezone+"</span></div><div class=\"fp-row\"><span class=\"fp-label\">Screen</span><span class=\"fp-value\">"+fp.screen.width+"x"+fp.screen.height+"</span></div><div class=\"fp-row\"><span class=\"fp-label\">CPU Cores</span><span class=\"fp-value\">"+fp.hardwareConcurrency+"</span></div><div class=\"fp-row\"><span class=\"fp-label\">Memory</span><span class=\"fp-value\">"+fp.deviceMemory+" GB</span></div><div class=\"fp-row\"><span class=\"fp-label\">WebGL Vendor</span><span class=\"fp-value\">"+fp.webgl.vendor+"</span></div><div class=\"fp-row\"><span class=\"fp-label\">WebGL Renderer</span><span class=\"fp-value\">"+fp.webgl.renderer+"</span></div><div class=\"fp-row\"><span class=\"fp-label\">Canvas Noise</span><span class=\"fp-value\">"+(fp.canvas.noiseLevel*100).toFixed(1)+"%</span></div>";}

function updateStatus(t){statusText.textContent=t;}
function showNotification(msg){notification.textContent=msg;notification.classList.remove("hidden");setTimeout(()=>{notification.classList.add("hidden");},2500);}

window.ghostAPI.onOpenUrl((url) => { createTab(url); });

init();