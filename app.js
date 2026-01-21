const cfg = window.DASH_CONFIG;
let feedIndex = 0;

// ---------- CLOCK ----------
function tickClock() {
  const d = new Date();
  document.getElementById("time").textContent =
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.getElementById("date").textContent =
    d.toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });
}
setInterval(tickClock, 1000);
tickClock();

// ---------- WEATHER ----------
async function loadWeather() {
  const h = cfg.home;
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${h.lat}&longitude=${h.lon}` +
    `&current=temperature_2m,apparent_temperature,wind_speed_10m` +
    `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=${h.timezone}`;

  try {
    const r = await fetch(url);
    const d = await r.json();
    document.getElementById("wxTemp").textContent =
      Math.round(d.current.temperature_2m) + "°";
    document.getElementById("wxText").textContent =
      `Feels like ${Math.round(d.current.apparent_temperature)}° • Wind ${Math.round(d.current.wind_speed_10m)} mph`;
  } catch {
    document.getElementById("wxText").textContent = "Weather unavailable";
  }
}
loadWeather();
setInterval(loadWeather, 600000);

// ---------- NOTES ----------
const notes = document.getElementById("notes");
notes.value = localStorage.getItem("notes") || "";
notes.addEventListener("input", () => {
  localStorage.setItem("notes", notes.value);
});

// ---------- FEEDS ----------
function ytEmbed(id) {
  // youtube-nocookie is often more reliable for embeds now
  const origin = encodeURIComponent(location.origin);
  return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&playsinline=1&rel=0&origin=${origin}`;
}

function renderFeed() {
  const feed = cfg.feeds[feedIndex];
  const wrap = document.getElementById("feedWrap");

  // IMPORTANT: DO NOT set referrerpolicy="no-referrer" (causes Error 153)
  wrap.innerHTML = `
    <iframe
      src="${ytEmbed(feed.id)}"
      allow="autoplay; encrypted-media; picture-in-picture"
      allowfullscreen
      referrerpolicy="strict-origin-when-cross-origin"
    ></iframe>
  `;

  document.getElementById("feedCount").textContent =
    `${feedIndex + 1} / ${cfg.feeds.length} — ${feed.name}`;
}

renderFeed();
setInterval(() => {
  feedIndex = (feedIndex + 1) % cfg.feeds.length;
  renderFeed();
}, cfg.rotateSec * 1000);
