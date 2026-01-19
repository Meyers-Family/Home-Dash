(() => {
  const $ = (s) => document.querySelector(s);

  const SETTINGS_KEY = "dashboardSettingsV1";

  // Merge saved settings over config.js defaults
  function loadConfig() {
    let saved = {};
    try {
      saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    } catch {
      saved = {};
    }

    // Deep-ish merge (enough for our structure)
    const base = window.DASH_CONFIG || {};
    return {
      weather: { ...(base.weather || {}), ...(saved.weather || {}) },
      calendar: { ...(base.calendar || {}), ...(saved.calendar || {}) },
      youtube: { ...(base.youtube || {}), ...(saved.youtube || {}) },
      photos: { ...(base.photos || {}), ...(saved.photos || {}) },
    };
  }

  let cfg = loadConfig();

  function setStatus(t) {
    const el = $("#statusLine");
    if (el) el.textContent = t;
  }

  // ---------- Overlay panel ----------
  function openPanel(title, html) {
    $("#panelTitle").textContent = title;
    $("#panelBody").innerHTML = html;
    $("#overlay").classList.remove("hidden");
  }

  function closePanel() {
    $("#overlay").classList.add("hidden");
  }

  // Close button + clicking outside panel closes it
  $("#btnClose").addEventListener("click", closePanel);
  $("#overlay").addEventListener("click", (e) => {
    if (e.target.id === "overlay") closePanel();
  });

  // ---------- Clock ----------
  function tickClock() {
    const d = new Date();
    $("#clockTime").textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    $("#clockDate").textContent = d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
  tickClock();
  setInterval(tickClock, 1000);

  // ---------- Notes (simple) ----------
  const NOTES_KEY = "dashboardNotesV1";
  function renderNotesPreview() {
    const txt = (localStorage.getItem(NOTES_KEY) || "").trim();
    $("#notesPreview").textContent = txt ? txt : "Tap to edit…";
  }
  renderNotesPreview();

  // ---------- Settings Panel ----------
  function openSettingsPanel() {
    openPanel(
      "Settings",
      `
      <div style="color:#9bb0c8; margin-bottom:10px; line-height:1.3;">
        These save on this device/browser. No account. No cloud. No drama.
      </div>

      <label style="color:#9bb0c8;">Latitude</label>
      <input id="setLat" placeholder="37.0834" value="${cfg.weather.lat ?? ""}">

      <label style="color:#9bb0c8;">Longitude</label>
      <input id="setLon" placeholder="-88.6000" value="${cfg.weather.lon ?? ""}">

      <label style="color:#9bb0c8;">Timezone</label>
      <input id="setTz" placeholder="America/Chicago" value="${cfg.weather.timezone ?? "America/Chicago"}">

      <label style="color:#9bb0c8;">Calendar ICS URL</label>
      <input id="setIcs" placeholder="https://... .ics" value="${cfg.calendar.icsUrl ?? ""}">

      <label style="color:#9bb0c8;">YouTube Video ID</label>
      <input id="setYt" placeholder="5qap5aO4i9A" value="${cfg.youtube.videoId ?? ""}">

      <label style="color:#9bb0c8;">Photo interval (seconds)</label>
      <input id="setPhotoInt" placeholder="10" value="${cfg.photos.intervalSec ?? 10}">

      <div style="display:flex; gap:10px; margin-top:12px; flex-wrap:wrap;">
        <button id="btnSaveSettings">Save</button>
        <button id="btnResetSettings">Reset</button>
      </div>
      `
    );

    // Attach listeners AFTER the HTML exists
    $("#btnSaveSettings").addEventListener("click", () => {
      const lat = parseFloat($("#setLat").value);
      const lon = parseFloat($("#setLon").value);
      const tz = ($("#setTz").value || "America/Chicago").trim();
      const ics = ($("#setIcs").value || "").trim();
      const yt = ($("#setYt").value || "").trim();
      const interval = parseInt($("#setPhotoInt").value || "10", 10);

      const toSave = {
        weather: {
          lat: Number.isFinite(lat) ? lat : cfg.weather.lat,
          lon: Number.isFinite(lon) ? lon : cfg.weather.lon,
          timezone: tz,
          label: cfg.weather.label ?? "Home",
        },
        calendar: {
          icsUrl: ics,
          maxItemsToday: cfg.calendar.maxItemsToday ?? 6,
        },
        youtube: {
          videoId: yt,
        },
        photos: {
          intervalSec: Number.isFinite(interval) ? interval : 10,
        },
      };

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(toSave));
      cfg = loadConfig();
      setStatus("Saved ✓");
      closePanel();
    });

    $("#btnResetSettings").addEventListener("click", () => {
      localStorage.removeItem(SETTINGS_KEY);
      cfg = loadConfig();
      setStatus("Reset ✓");
      closePanel();
    });
  }

  // Settings button
  const settingsBtn = $("#btnSettings");
  settingsBtn.addEventListener("click", (e) => {
    e.preventDefault();
    openSettingsPanel();
  });

  // Refresh button (just status for now)
  $("#btnRefresh").addEventListener("click", () => {
    setStatus("Refreshed ✓");
    tickClock();
  });

  // Tile taps (basic)
  document.querySelectorAll(".tile").forEach((tile) => {
    tile.addEventListener("click", () => {
      const which = tile.getAttribute("data-open");
      if (which === "notes") {
        const current = localStorage.getItem(NOTES_KEY) || "";
        openPanel(
          "Notes",
          `<textarea id="notesBox" placeholder="- Trash\n- Laundry\n- Call dentist\n" style="height:45vh;">${current}</textarea>
           <div style="margin-top:10px;"><button id="btnSaveNotes">Save Notes</button></div>`
        );
        $("#btnSaveNotes").addEventListener("click", () => {
          localStorage.setItem(NOTES_KEY, $("#notesBox").value);
          renderNotesPreview();
          setStatus("Notes saved ✓");
          closePanel();
        });
      }
    });
  });

  setStatus("Online ✓");
})();
