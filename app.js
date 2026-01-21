const cfg = window.CONFIG;

// CLOCK
function updateClock() {
  const d = new Date();
  document.getElementById("time").textContent =
    d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  document.getElementById("date").textContent =
    d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}
setInterval(updateClock, 1000);
updateClock();

// WEATHER
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
    document.getElementById("temp").textContent =
      Math.round(d.current.temperature_2m) + "°";
    document.getElementById("wx").textContent =
      `Feels like ${Math.round(d.current.apparent_temperature)}° • Wind ${Math.round(d.current.wind_speed_10m)} mph`;
  } catch {
    document.getElementById("wx").textContent = "Weather unavailable";
  }
}
loadWeather();
setInterval(loadWeather, 10 * 60 * 1000);

// NOTES
const notes = document.getElementById("notes");
notes.value = localStorage.getItem("notes") || "";
notes.addEventListener("input", () => {
  localStorage.setItem("notes", notes.value);
});
