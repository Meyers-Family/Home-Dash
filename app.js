(() => {
  const $ = s => document.querySelector(s);

  const cfg = window.DASH_CONFIG;
  const feedsNormal = cfg.feedsNormal || [];
  const feedsSevere = cfg.feedsSevere || [];
  let activeFeeds = feedsNormal;
  let feedIndex = 0;
  let feedTimer = null;
  let severeMode = false;

  const statusLine = $("#statusLine");
  const feedPreview = $("#feedPreview");
  const feedLabel = $("#feedLabel");
  const feedHint = $("#feedHint");
  const feedTitle = $("#feedTitle");

  const wxTemp = $("#wxTemp");
  const wxMeta = $("#wxMeta");
  const wxHint = $("#wxHint");

  const clockTime = $("#clockTime");
  const clockDate = $("#clockDate");

  const rotateMs = (cfg.rotateSec || 20) * 1000;

  // ---------------- CLOCK ----------------
  function tickClock() {
    const d = new Date();
    clockTime.textContent = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    clockDate.textContent = d.toLocaleDateString(undefined, {
      weekday: "long", month: "long", day: "numeric", year: "numeric"
    });
  }
  setInterval(tickClock, 1000);
  tickClock();

  // ---------------- WEATHER ----------------
  async function fetchWeather() {
    try {
      wxHint.textContent = "loading";
      const h = cfg.home;
      const url =
        `https://api.open-meteo.com/v1/forecast` +
        `?latitude=${h.lat}&longitude=${h.lon}` +
        `&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=${h.timezone}`;

      const res = await fetch(url);
      const data = await res.json();
      const c = data.current;

      wxTemp.textContent = Math.round(c.temperature_2m) + "°";
      wxMeta.textContent =
        `Feels like ${Math.round(c.apparent_temperature)}°\n` +
        `Wind ${Math.round(c.wind_speed_10m)} mph\n${h.label}`;
      wxHint.textContent = "live";
    } catch {
      wxMeta.textContent = "Weather unavailable";
      wxHint.textContent = "offline";
    }
  }

  // ---------------- FEEDS ----------------
  function yt(id) {
    return `https://www.youtube.com/embed/${id}?autoplay=1&mute=1&playsinline=1`;
  }

  function renderFeed(feed) {
    feedPreview.innerHTML = "";
    feedLabel.textContent = feed.name || "Live Feed";

    if (feed.type === "youtube") {
      const iframe = document.createElement("iframe");
      iframe.src = yt(feed.id);
      iframe.allow = "autoplay; encrypted-media";
      iframe.referrerPolicy = "no-referrer";
      feedPreview.appendChild(iframe);
    } else if (feed.type === "iframe") {
      const iframe = document.createElement("iframe");
      iframe.src = feed.url;
      iframe.referrerPolicy = "no-referrer";
      feedPreview.appendChild(iframe);
    }
  }

  function startFeeds() {
    if (!activeFeeds.length) return;
    renderFeed(activeFeeds[0]);
    feedHint.textContent = `1/${activeFeeds.length}`;
    if (feedTimer) clearInterval(feedTimer);
    feedTimer = setInterval(() => {
      feedIndex = (feedIndex + 1) % activeFeeds.length;
      feedHint.textContent = `${feedIndex + 1}/${activeFeeds.length}`;
      renderFeed(activeFeeds[feedIndex]);
    }, rotateMs);
  }

  // ---------------- MANUAL SEVERE TOGGLE ----------------
  document.addEventListener("keydown", e => {
    if (e.key === "s") {
      severeMode = !severeMode;
      activeFeeds = severeMode ? feedsSevere : feedsNormal;
      feedTitle.textContent = severeMode ? "Severe Weather Mode" : "Live Feeds";
      statusLine.textContent = severeMode ? "SEVERE MODE ⚠️" : "Online ✓";
      feedIndex = 0;
      startFeeds();
    }
  });

  // ---------------- INIT ----------------
  statusLine.textContent = "Online ✓";
  fetchWeather();
  setInterval(fetchWeather, 10 * 60 * 1000);

  startFeeds();
})();
