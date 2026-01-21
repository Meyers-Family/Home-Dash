// config.js
window.DASH_CONFIG = {
  home: {
    label: "Smithland, KY",
    // Smithland KY-ish (you can change in Settings)
    lat: 37.1356,
    lon: -88.4031,
    timezone: "America/Chicago"
  },

  notes: {
    storageKey: "homeDash_notes_v1"
  },

  feeds: {
    rotateSec: 45,
    // We embed YouTube with correct origin param in app.js
    items: [
      {
        name: "Bear Cam (Benji & Balu) – Wildheart",
        kind: "youtube_video",
        id: "t_HT6bddMIg" // YouTube watch?v=t_HT6bddMIg :contentReference[oaicite:4]{index=4}
      },
      {
        name: "Bear Cam (Benji & Balu) – Wildheart (Alt)",
        kind: "youtube_video",
        id: "NX5J05GBHcI" // YouTube watch?v=NX5J05GBHcI :contentReference[oaicite:5]{index=5}
      },
      {
        name: "Shark Cam – Monterey Bay Aquarium (often live)",
        kind: "youtube_video",
        id: "2g6NZQG_jT4" // Monterey Bay Aquarium live cam video :contentReference[oaicite:6]{index=6}
      },
      {
        name: "Big Bear Lake Town Cam (backup scenery cam)",
        kind: "youtube_video",
        id: "h-VYt80J0yM" // Big Bear Lake Live stream :contentReference[oaicite:7]{index=7}
      }
    ]
  },

  weather: {
    // Open-Meteo (no API key) used in app.js
    unit: "fahrenheit"
  },

  alerts: {
    // Lightweight: if there’s a severe alert, we’ll show it.
    // (We use NWS API for your lat/lon in app.js)
    enabled: true
  }
};
