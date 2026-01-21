// app.js
(() => {
  const $ = (id) => document.getElementById(id);

  const DEFAULTS = window.DASH_CONFIG || {};
  const STORE_KEY = "homeDash_settings_v1";

  function loadSettings() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function saveSettings(obj) {
    localStorage.setItem(STORE_KEY, JSON.stringify(obj));
  }

  function mergedConfig() {
    const saved = loadSettings();
    // Deep-ish merge for our simple structure
    const cfg = JSON.parse(JSON.stringify(DEFAULTS));

    if (saved?.home) cfg.home = { ...cfg.home, ...saved.home };
    if (saved?.feeds) cfg.feeds = { ...cfg.feeds, ...saved.feeds };

    return cfg;
  }

  let CFG = mergedConfig();

  function setStatus(text) {
    $("statusText").textContent = text;
  }

  // ---------------------------
  // Clock
  // ---------------------------
  function startClock() {
    const tz = CFG.home?.timezone || "America/Chicago";
    const tick = () => {
      const now = new Date();
      const time = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const date = now.toLocaleDateString([], { weekday: "long", year: "numeric", month: "long", day: "numeric", timeZone: tz });
      $("clockTime").textContent = time;
      $("clockDate").textContent = date;
    };
    tick();
    setInterval(tick, 1000);
  }

  // ---------------------------
  // Notes
  // ---------------------------
  function initNotes() {
    const key = CFG.notes?.storageKey || "homeDash_notes_v1";
    const box = $("notesBox");
    try {
      box.value = localStorage.getItem(key) || "";
    } catch {}
    let t = null;
    box.addEventListener("input", () => {
      $("notesPill").textContent = "saving";
      clearTimeout(t);
      t = setTimeout(() => {
        try {
          localStorage.setItem(key, box.value);
          $("notesPill").textContent = "saved";
        } catch {
          $("notesPill").textContent = "error";
        }
      }, 250);
    });
  }

  // ---------------------------
  // Weather (Open-Meteo)
  // ---------------------------
  async function loadWeather() {
    const { lat, lon, label } = CFG.home;
    $("weatherPill").textContent = "loading";
    $("wxLoc").textContent = label || "Home";

    // Open-Meteo: simple, no key.
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}` +
      `&longitude=${encodeURIComponent(lon)}` +
      `&current=temperature_2m,apparent_temperature,wind_speed_10m` +
      `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto`;

    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) throw new Error("wx http " + res.status);
      const data = await res.json();

      const c = data.current;
      const temp = Math.round(c.temperature_2m);
      const feels = Math.round(c.apparent_temperature);
      const wind = Math.round(c.wind_speed_10m);

      $("wxTemp").textContent = `${temp}°`;
      $("wxMeta").textContent = `Feels like ${feels}° • Wind ${wind} mph`;
      $("weatherPill").textContent = "live";
      setStatus("Online ✓");
    } catch (e) {
      $("wxTemp").textContent = "--°";
      $("wxMeta").textContent = "Weather failed. (Welcome to networking.)";
      $("weatherPill").textContent = "error";
      console.error(e);
    }
  }

  // ---------------------------
  // Alerts (NWS)
  // ---------------------------
  async function loadAlerts() {
    if (!CFG.alerts?.enabled) {
      $("alertsPill").textContent = "off";
      $("alertsText").textContent = "Alerts disabled.";
      return;
    }

    const { lat, lon } = CFG.home;
    $("alertsPill").textContent = "checking";

    // NWS API endpoint by point
    const url = `https://api.weather.gov/alerts/active?point=${encodeURIComponent(lat)},${encodeURIComponent(lon)}`;

    try {
      const res = await fetch(url, {
        cache: "no-store",
        headers: {
          // NWS asks for a user agent; browsers don’t let us set it fully,
          // but this is still fine.
          "Accept": "application/geo+json"
        }
      });
      if (!res.ok) throw new Error("nws http " + res.status);
      const data = await res.json();

      const feats = data.features || [];
      if (!feats.length) {
        $("alertsText").textContent = "No alerts.";
        $("alertsPill").textContent = "clear";
        return;
      }

      // Show most urgent first-ish
      const top = feats[0].properties;
      const headline = top.headline || top.event || "Alert";
      const area = top.areaDesc ? `\n${top.areaDesc}` : "";
      $("alertsText").textContent = `${headline}${area}`;
      $("alertsPill").textContent = "ALERT";
    } catch (e) {
      $("alertsText").textContent = "Alerts failed (NWS blocked/slow).";
      $("alertsPill").textContent = "error";
      console.error(e);
    }
  }

  // ---------------------------
  // FEEDS (fix YouTube 153 + rotate)
  // ---------------------------
  let feedIndex = 0;
  let feedTimer = null;

  function buildYouTubeEmbed(videoId) {
    // This origin param is the big “stop Error 153” piece on a lot of embeds.
    const origin = encodeURIComponent(window.location.origin);

    // mute=1 to allow autoplay in most browsers
    return `https://www.youtube.com/embed/${encodeURIComponent(videoId)}?autoplay=1&mute=1&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3&origin=${origin}`;
  }

  function showFeed(i) {
    const items = CFG.feeds?.items || [];
    if (!items.length) {
      $("feedName").textContent = "No feeds configured";
      $("feedCount").textContent = "";
      return;
    }

    const item = items[i % items.length];
    $("feedName").textContent = item.name || "Feed";
    $("feedCount").textContent = `${(i % items.length) + 1}/${items.length}`;

    const frame = $("feedFrame");
    const fallback = $("feedFallback");
    const link = $("fallbackLink");
    const title = $("fallbackTitle");

    fallback.hidden = true;

    if (item.kind === "youtube_video") {
      const embed = buildYouTubeEmbed(item.id);
      frame.src = embed;

      // Fallback link
      link.href = `https://www.youtube.com/watch?v=${encodeURIComponent(item.id)}`;
      title.textContent = "This feed won’t embed here.";
    } else if (item.kind === "url") {
      frame.src = item.url;
      link.href = item.url;
      title.textContent = "This feed refused to load.";
    } else {
      frame.src = "about:blank";
      link.href = "#";
      title.textContent = "Unknown feed type.";
    }

    // If iframe errors, show fallback message (limited, but better than nothing)
    frame.onerror = () => {
      fallback.hidden = false;
    };
  }

  function startFeedRotation() {
    const sec = Math.max(10, Number(CFG.feeds?.rotateSec || 45));
    $("feedsPill").textContent = `rotating`;

    showFeed(feedIndex);

    if (feedTimer) clearInterval(feedTimer);
    feedTimer = setInterval(() => {
      feedIndex = (feedIndex + 1) % (CFG.feeds.items.length || 1);
      showFeed(feedIndex);
    }, sec * 1000);
  }

  // ---------------------------
  // Settings modal
  // ---------------------------
  function openSettings() {
    const modal = $("settingsModal");
    modal.hidden = false;

    $("setLabel").value = CFG.home?.label ?? "Smithland, KY";
    $("setLat").value = CFG.home?.lat ?? 0;
    $("setLon").value = CFG.home?.lon ?? 0;
    $("setRotateSec").value = CFG.feeds?.rotateSec ?? 45;
  }

  function closeSettings() {
    $("settingsModal").hidden = true;
  }

  function applySettingsFromUI() {
    const label = $("setLabel").value.trim() || "Home";
    const lat = Number($("setLat").value);
    const lon = Number($("setLon").value);
    const rotateSec = Number($("setRotateSec").value);

    const next = loadSettings() || {};
    next.home = { ...(next.home || {}), label, lat, lon };
    next.feeds = { ...(next.feeds || {}), rotateSec };

    saveSettings(next);

    // Reload runtime config
    CFG = mergedConfig();

    // Refresh everything
    loadWeather();
    loadAlerts();
    startFeedRotation();
  }

  function resetSettings() {
    localStorage.removeItem(STORE_KEY);
    CFG = mergedConfig();
    closeSettings();
    loadWeather();
    loadAlerts();
    startFeedRotation();
  }

  function wireUI() {
    $("btnReload").addEventListener("click", () => location.reload());

    $("btnSettings").addEventListener("click", openSettings);
    $("btnCloseSettings").addEventListener("click", closeSettings);

    $("btnSaveSettings").addEventListener("click", () => {
      applySettingsFromUI();
      closeSettings();
    });

    $("btnResetSettings").addEventListener("click", resetSettings);

    // Click outside modal card closes it
    $("settingsModal").addEventListener("click", (e) => {
      if (e.target === $("settingsModal")) closeSettings();
    });

    // Photos toggle placeholder
    $("photosToggle").addEventListener("click", () => {
      const tile = $("tilePhotos");
      const body = tile.querySelector(".tile-body");
      const isHidden = body.style.display === "none";
      body.style.display = isHidden ? "" : "none";
      $("photosToggle").textContent = isHidden ? "—" : "+";
    });
  }

  // ---------------------------
  // Boot
  // ---------------------------
  function boot() {
    wireUI();
    startClock();
    initNotes();

    loadWeather();
    loadAlerts();
    startFeedRotation();

    setStatus("Online ✓");
  }

  boot();
})();
