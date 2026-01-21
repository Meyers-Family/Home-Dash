(() => {
  const $ = (sel) => document.querySelector(sel);

  const cfg = window.DASH_CONFIG || {};
  const home = cfg.home || { lat: 37.1394, lon: -88.4028, timezone: "America/Chicago", label: "Home" };
  const rotateMs = Math.max(10, Number(cfg.rotateSec || 22)) * 1000;

  const photos = (window.DASH_PHOTOS || []).map(p => `photos/${p}`);

  // UI
  const statusLine = $("#statusLine");
  const dot = $("#dot");
  const btnRefresh = $("#btnRefresh");

  const clockTime = $("#clockTime");
  const clockDate = $("#clockDate");

  const wxTemp = $("#wxTemp");
  const wxMeta = $("#wxMeta");
  const wxHint = $("#wxHint");

  const alertList = $("#alertList");
  const alertHint = $("#alertHint");

  const notesPreview = $("#notesPreview");

  const feedTitle = $("#feedTitle");
  const feedPreview = $("#feedPreview");
  const feedHint = $("#feedHint");
  const feedLabel = $("#feedLabel");

  const photoImg = $("#photoImg");
  const photoHint = $("#photoHint");

  const overlay = $("#overlay");
  const panelTitle = $("#panelTitle");
  const panelBody = $("#panelBody");
  const btnClose = $("#btnClose");

  function setStatus(msg){ statusLine.textContent = msg; }
  function setDot(color){
    dot.style.background = color;
    dot.style.boxShadow = `0 0 18px ${color}88`;
  }

  // Overlay
  function openPanel(title, nodeOrHtml){
    panelTitle.textContent = title;
    panelBody.innerHTML = "";
    if (typeof nodeOrHtml === "string") panelBody.innerHTML = nodeOrHtml;
    else panelBody.appendChild(nodeOrHtml);
    overlay.classList.remove("hidden");
  }
  function closePanel(){ overlay.classList.add("hidden"); }
  btnClose.addEventListener("click", closePanel);
  overlay.addEventListener("click", (e) => { if (e.target === overlay) closePanel(); });

  // Clock
  function pad2(n){ return String(n).padStart(2,"0"); }
  function formatTime(d){
    let h = d.getHours();
    const m = d.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12; if (h === 0) h = 12;
    return `${h}:${pad2(m)} ${ampm}`;
  }
  function tickClock(){
    const now = new Date();
    clockTime.textContent = formatTime(now);
    clockDate.textContent = now.toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric",year:"numeric"});
  }

  // Notes (saved locally)
  const NOTES_KEY = "homeDashNotesV2";
  function loadNotes(){ return localStorage.getItem(NOTES_KEY) || ""; }
  function saveNotes(t){ localStorage.setItem(NOTES_KEY, t); renderNotesPreview(); }
  function renderNotesPreview(){
    const txt = loadNotes().trim();
    notesPreview.textContent = txt ? txt.split(/\r?\n/).slice(0,12).join("\n") : "Tap to edit…";
  }
  function openNotes(){
    const wrap = document.createElement("div");
    const ta = document.createElement("textarea");
    ta.value = loadNotes();
    ta.placeholder = "- Trash\n- Laundry\n- Call dentist\n";
    ta.addEventListener("input", () => saveNotes(ta.value));
    wrap.appendChild(ta);
    openPanel("Notes", wrap);
    setTimeout(() => ta.focus(), 80);
  }

  // Weather (Open-Meteo)
  const WMO = {
    0:"Clear",1:"Mainly clear",2:"Partly cloudy",3:"Overcast",
    45:"Fog",48:"Rime fog",
    51:"Light drizzle",53:"Drizzle",55:"Dense drizzle",
    61:"Rain (slight)",63:"Rain",65:"Heavy rain",
    71:"Snow (slight)",73:"Snow",75:"Heavy snow",
    80:"Rain showers (slight)",81:"Rain showers",82:"Violent showers",
    95:"Thunderstorm",96:"Thunderstorm w/ hail",99:"Thunderstorm w/ heavy hail"
  };

  async function fetchWeather(){
    try{
      wxHint.textContent = "updating";
      const tz = encodeURIComponent(home.timezone || "America/Chicago");
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${encodeURIComponent(home.lat)}` +
        `&longitude=${encodeURIComponent(home.lon)}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m,wind_direction_10m` +
        `&temperature_unit=fahrenheit` +
        `&wind_speed_unit=mph` +
        `&timezone=${tz}`;

      const res = await fetch(url, { cache:"no-store" });
      if(!res.ok) throw new Error("wx http " + res.status);
      const data = await res.json();
      const cur = data.current;

      const temp = Math.round(cur.temperature_2m);
      const feels = Math.round(cur.apparent_temperature);
      const desc = WMO[cur.weather_code] || ("Code " + cur.weather_code);
      const wind = Math.round(cur.wind_speed_10m);

      wxTemp.textContent = `${temp}°`;
      wxMeta.textContent = `${desc}\nFeels like ${feels}° • Wind ${wind} mph\n${home.label || "Home"}`;
      wxHint.textContent = "live";
    }catch{
      wxHint.textContent = "offline";
      wxMeta.textContent = "Weather unavailable.";
    }
  }

  // NWS Alerts (switch feeds when alerts exist)
  let severeMode = false;
  let lastAlerts = [];

  function isSevereEventName(name){
    const s = String(name || "").toLowerCase();
    return (
      s.includes("tornado") ||
      s.includes("severe thunderstorm") ||
      s.includes("flash flood") ||
      s.includes("flood") ||
      s.includes("winter storm") ||
      s.includes("ice storm") ||
      s.includes("blizzard") ||
      s.includes("high wind")
    );
  }

  async function fetchAlerts(){
    try{
      alertHint.textContent = "checking";
      const url = `https://api.weather.gov/alerts/active?point=${home.lat},${home.lon}`;
      const res = await fetch(url, { cache:"no-store" });
      if(!res.ok) throw new Error("nws http " + res.status);
      const data = await res.json();

      const feats = Array.isArray(data.features) ? data.features : [];
      const alerts = feats
        .map(f => f && f.properties ? f.properties : null)
        .filter(Boolean)
        .map(p => ({
          event: p.event || "Alert",
          severity: p.severity || "",
          headline: p.headline || "",
          ends: p.ends || p.expires || ""
        }));

      lastAlerts = alerts;

      // Decide mode
      const hasAny = alerts.length > 0;
      const hasSevere = alerts.some(a => isSevereEventName(a.event) || String(a.severity).toLowerCase() === "severe");
      severeMode = hasAny || hasSevere;

      renderAlerts();
      applyFeedMode();
      alertHint.textContent = alerts.length ? "active" : "clear";
    }catch{
      alertHint.textContent = "offline";
      // Don’t flip modes if NWS is unreachable; keep last known state.
    }
  }

  function renderAlerts(){
    if(!lastAlerts.length){
      alertList.innerHTML = `<div class="smallmuted">No active NWS alerts near ${home.label || "home"}.</div>`;
      return;
    }
    const html = lastAlerts.slice(0, 8).map(a => {
      const sev = String(a.severity || "").toUpperCase();
      const badge = sev ? `<span class="badge">${sev}</span>` : `<span class="badge">ALERT</span>`;
      const line = (a.headline || a.event || "").replace(/</g,"&lt;");
      return `<div style="margin-bottom:10px;">${badge}${line}</div>`;
    }).join("");
    alertList.innerHTML = html;
  }

  // Feeds rotation
  let feedIndex = 0;
  let feedTimer = null;
  let activeFeeds = [];

  function ytEmbedUrl(id){
    // Modest branding, autoplay allowed (some browsers block sound; that’s normal)
    const u = new URL(`https://www.youtube.com/embed/${id}`);
    u.searchParams.set("autoplay","1");
    u.searchParams.set("mute","1");
    u.searchParams.set("playsinline","1");
    u.searchParams.set("controls","1");
    u.searchParams.set("rel","0");
    return u.toString();
  }

  function renderFeed(feed){
    feedPreview.innerHTML = "";
    if(!feed){
      feedPreview.innerHTML = `<div class="smallmuted" style="padding:12px;">No feeds configured.</div>`;
      feedLabel.textContent = "—";
      feedHint.textContent = "none";
      return;
    }

    feedLabel.textContent = feed.name || "Live Feed";

    if(feed.type === "youtube" && feed.id){
      const iframe = document.createElement("iframe");
      iframe.src = ytEmbedUrl(feed.id);
      iframe.allow = "autoplay; encrypted-media; picture-in-picture";
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer";
      feedPreview.appendChild(iframe);
      return;
    }

    if(feed.type === "iframe" && feed.url){
      const iframe = document.createElement("iframe");
      iframe.src = feed.url;
      iframe.loading = "lazy";
      iframe.referrerPolicy = "no-referrer";
      feedPreview.appendChild(iframe);
      return;
    }

    feedPreview.innerHTML = `<div class="smallmuted" style="padding:12px;">Unsupported feed type.</div>`;
  }

  function setFeed(i){
    if(!activeFeeds.length){
      renderFeed(null);
      return;
    }
    feedIndex = (i + activeFeeds.length) % activeFeeds.length;
    feedHint.textContent = `${feedIndex + 1}/${activeFeeds.length}`;
    renderFeed(activeFeeds[feedIndex]);
  }

  function startFeedLoop(){
    setFeed(0);
    if(feedTimer) clearInterval(feedTimer);
    feedTimer = setInterval(() => setFeed(feedIndex + 1), rotateMs);
  }

  function applyFeedMode(){
    const normal = Array.isArray(cfg.feedsNormal) ? cfg.feedsNormal : [];
    const severe = Array.isArray(cfg.feedsSevere) ? cfg.feedsSevere : [];

    const nextFeeds = (severeMode && severe.length) ? severe : normal;

    const modeName = (severeMode && severe.length) ? "Severe Weather Mode" : "Normal Mode";
    feedTitle.textContent = modeName;

    // Dot color + status
    if(severeMode && severe.length){
      setDot("var(--warn)");
      setStatus("Alerts active: switching to severe feeds ⚠️");
    }else{
      setDot("var(--good)");
      setStatus("Online ✅");
    }

    // If the list actually changed, restart rotation
    const changed = JSON.stringify(nextFeeds) !== JSON.stringify(activeFeeds);
    if(changed){
      activeFeeds = nextFeeds;
      startFeedLoop();
    }
  }

  function openFeeds(){
    const wrap = document.createElement("div");
    const title = document.createElement("div");
    title.className = "smallmuted";
    title.textContent = `Now showing: ${severeMode ? "Severe weather feeds (alerts active)." : "Normal feeds (animals/weather)."} Tap next/prev.`;
    wrap.appendChild(title);

    const box = document.createElement("div");
    box.style.marginTop = "12px";
    box.style.border = "1px solid var(--line)";
    box.style.borderRadius = "16px";
    box.style.overflow = "hidden";
    box.style.height = "70vh";
    box.style.background = "rgba(255,255,255,.02)";
    wrap.appendChild(box);

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.gap = "10px";
    controls.style.marginTop = "12px";

    const prev = document.createElement("button");
    prev.textContent = "◀ Prev";
    prev.onclick = () => { setFeed(feedIndex - 1); box.innerHTML = ""; box.appendChild(feedPreview.firstChild.cloneNode(true)); };

    const next = document.createElement("button");
    next.textContent = "Next ▶";
    next.onclick = () => { setFeed(feedIndex + 1); box.innerHTML = ""; box.appendChild(feedPreview.firstChild.cloneNode(true)); };

    controls.appendChild(prev);
    controls.appendChild(next);
    wrap.appendChild(controls);

    // Render current feed into the big box
    const current = activeFeeds[feedIndex] || null;
    if(current){
      if(current.type === "youtube" && current.id){
        const iframe = document.createElement("iframe");
        iframe.src = ytEmbedUrl(current.id);
        iframe.allow = "autoplay; encrypted-media; picture-in-picture";
        iframe.referrerPolicy = "no-referrer";
        box.appendChild(iframe);
      }else if(current.type === "iframe" && current.url){
        const iframe = document.createElement("iframe");
        iframe.src = current.url;
        iframe.referrerPolicy = "no-referrer";
        box.appendChild(iframe);
      }else{
        box.innerHTML = `<div class="smallmuted" style="padding:12px;">Unsupported feed.</div>`;
      }
    }else{
      box.innerHTML = `<div class="smallmuted" style="padding:12px;">No feeds configured.</div>`;
    }

    openPanel("Live Feeds", wrap);
  }

  // Photos
  let photoIndex = 0;
  let photoTimer = null;
  function startPhotoLoop(){
    if(!photos.length){
      photoHint.textContent = "none";
      photoImg.removeAttribute("src");
      return;
    }
    photoHint.textContent = `${photos.length} pics`;
    photoImg.src = photos[0];
    const interval = Math.max(3, Number((cfg.photos && cfg.photos.intervalSec) || 12)) * 1000;
    if(photoTimer) clearInterval(photoTimer);
    photoTimer = setInterval(() => {
      photoIndex = (photoIndex + 1) % photos.length;
      photoImg.src = photos[photoIndex];
    }, interval);
  }

  // Tiles
  function bindTiles(){
    document.querySelectorAll(".tile").forEach(tile => {
      tile.addEventListener("click", () => {
        const which = tile.getAttribute("data-open");
        if(which === "notes") openNotes();
        if(which === "feeds") openFeeds();
        if(which === "alerts") openPanel("Alerts", alertList.cloneNode(true).outerHTML);
      });
    });
  }

  // Refresh
  btnRefresh.addEventListener("click", async () => {
    setStatus("Refreshing…");
    await Promise.allSettled([fetchWeather(), fetchAlerts()]);
    applyFeedMode();
    setStatus("Online ✅");
  });

  // Init
  function init(){
    setStatus("Booting…");
    setDot("var(--good)");

    bindTiles();

    tickClock();
    setInterval(tickClock, 1000);

    renderNotesPreview();
    startPhotoLoop();

    // Start in normal mode, then let alerts decide
    activeFeeds = Array.isArray(cfg.feedsNormal) ? cfg.feedsNormal : [];
    startFeedLoop();

    fetchWeather();
    fetchAlerts();

    setInterval(fetchWeather, 10 * 60 * 1000);
    setInterval(fetchAlerts, 5 * 60 * 1000);

    setStatus("Online ✅");
  }

  init();
})();
