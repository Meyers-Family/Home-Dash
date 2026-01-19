// config.js
window.DASH_CONFIG = {
  // Weather: pick your home location
  weather: {
    // Example: Paducah-ish
    lat: 37.0834,
    lon: -88.6000,
    timezone: "America/Chicago",
    // Optional: label shown in expanded view
    label: "Home"
  },

  // Calendar: paste an ICS URL (read-only)
  // - If you use Google Calendar: Settings -> (your calendar) -> Integrate calendar -> Secret address in iCal format
  // - If you don't want it public-ish: host an .ics locally and point to it
  calendar: {
    icsUrl: "",   // <-- paste your ICS feed URL here
    maxItemsToday: 6
  },

  // YouTube: pick one
  youtube: {
    // Use one of:
    // videoId: "dQw4w9WgXcQ",
    // playlistId: "PL....",
    // channelUrl: "https://www.youtube.com/@YourChannel"
    videoId: "5qap5aO4i9A" // lofi stream-style example; swap it
  },

  photos: {
    // seconds per photo in the tile preview
    intervalSec: 12
  }
};
