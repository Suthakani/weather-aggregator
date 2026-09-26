async function getWeather() {
  const city = document.getElementById("city").value.trim();
  const result = document.getElementById("result");
  if (!city) {
    result.innerHTML = '<div class="error-card">Please enter a city name.</div>';
    return;
  }
  result.innerHTML = '<div class="loading"><h3>Fetching Weather...</h3></div>';
  try {
    const geoResponse = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`);
    if (!geoResponse.ok) throw new Error("Unable to find this city.");
    const location = (await geoResponse.json()).results?.[0];
    if (!location) throw new Error("City not found.");
    const params = new URLSearchParams({ latitude: location.latitude, longitude: location.longitude, current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure", daily: "sunrise,sunset", timezone: "auto", forecast_days: "1" });
    const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`);
    if (!weatherResponse.ok) throw new Error("Unable to load weather right now.");
    const forecast = await weatherResponse.json();
    const current = forecast.current;
    const conditions = {
      0: ["Clear sky", "Clear", "01"], 1: ["Mainly clear", "Clear", "02"], 2: ["Partly cloudy", "Clouds", "03"], 3: ["Overcast", "Clouds", "04"],
      45: ["Fog", "Mist", "50"], 48: ["Fog", "Mist", "50"], 51: ["Light drizzle", "Drizzle", "09"], 53: ["Drizzle", "Drizzle", "09"], 55: ["Dense drizzle", "Drizzle", "09"],
      61: ["Light rain", "Rain", "10"], 63: ["Rain", "Rain", "10"], 65: ["Heavy rain", "Rain", "10"], 71: ["Light snow", "Snow", "13"], 73: ["Snow", "Snow", "13"], 75: ["Heavy snow", "Snow", "13"],
      80: ["Rain showers", "Rain", "09"], 81: ["Rain showers", "Rain", "09"], 82: ["Heavy rain showers", "Rain", "09"], 95: ["Thunderstorm", "Thunderstorm", "11"], 96: ["Thunderstorm", "Thunderstorm", "11"], 99: ["Thunderstorm", "Thunderstorm", "11"],
    };
    const [description, main, icon] = conditions[current.weather_code] || ["Unknown", "Clear", "01"];
    const offset = forecast.utc_offset_seconds || 0;
    const unix = (time) => Math.floor(Date.parse(time + "Z") / 1000) - offset;
    const data = { name: location.name, sys: { country: location.country_code, sunrise: unix(forecast.daily.sunrise[0]), sunset: unix(forecast.daily.sunset[0]) }, main: { temp: current.temperature_2m, feels_like: current.apparent_temperature, humidity: current.relative_humidity_2m, pressure: current.surface_pressure }, wind: { speed: current.wind_speed_10m }, weather: [{ main, description, icon: icon + (current.is_day ? "d" : "n") }] };
    const sunrise = new Date(data.sys.sunrise * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const sunset = new Date(data.sys.sunset * 1000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    result.innerHTML = `<div class="weather-card"><img class="weather-icon" src="https://openweathermap.org/img/wn/${data.weather[0].icon}@4x.png" alt="Weather icon"><h2 class="city">${data.name}, ${data.sys.country}</h2><h1 class="temp">${Math.round(data.main.temp)}°C</h1><p class="weather-text">${data.weather[0].description}</p><div class="details"><div class="card"><h4>💧 Humidity</h4><p>${data.main.humidity}%</p></div><div class="card"><h4>🌬 Wind</h4><p>${data.wind.speed} km/h</p></div><div class="card"><h4>🌡 Feels Like</h4><p>${Math.round(data.main.feels_like)}°C</p></div><div class="card"><h4>🌅 Sunrise</h4><p>${sunrise}</p></div><div class="card"><h4>🌇 Sunset</h4><p>${sunset}</p></div><div class="card"><h4>📊 Pressure</h4><p>${data.main.pressure} hPa</p></div></div></div>`;
    if (typeof updateBackground === "function") updateBackground(data.weather[0].main);
    const temp = Math.round(data.main.temp);
    drawChart(["Morning", "Noon", "Evening", "Night", "Tomorrow"], [temp - 3, temp, temp - 1, temp - 4, temp + 1]);
  } catch (error) {
    console.error(error);
    result.innerHTML = `<div class="error-card">❌ ${error.message}</div>`;
  }
}

let weatherChart;
function drawChart(labels, temps) {
  const canvas = document.getElementById("chart");
  if (!canvas) {
    console.log("Chart canvas not found");
    return;
  }
  const ctx = canvas.getContext("2d");
  if (weatherChart) {
    weatherChart.destroy();
  }
  weatherChart = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [{
      label: "Temperature (°C)",
      data: temps,
      fill: true,
      tension: 0.4,
      borderWidth: 3,
      pointRadius: 6,
      pointHoverRadius: 8
    }]
  },
  options: {
    responsive: true,
    plugins: {
      tooltip: {
        enabled: true
      }
    },
    scales: {
      y: {
        title: {
          display: true,
          text: "Temperature °C"
        }
      }
    }
  }
});
}
async function getCurrentLocation() {
  if (!navigator.geolocation) {
    alert("Geolocation is not supported.");
    return;
  }
  navigator.geolocation.getCurrentPosition(async (position) => {
    const lat = position.coords.latitude;
    const lon = position.coords.longitude;
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lon}&zoom=10`
      );
      const data = await response.json();
      document.getElementById("city").value = data.address?.city || data.address?.town || data.address?.village || data.address?.county || "";
      getWeather();
    } catch (err) {
      alert("Unable to get location.");
    }
  });
}
const themeBtn = document.getElementById("themeBtn");
themeBtn.addEventListener("click", () => {
  document.body.classList.toggle("light-mode");

  if (document.body.classList.contains("light-mode")) {
    themeBtn.innerHTML = "☀️ Light Mode";
  } else {
    themeBtn.innerHTML = "🌙 Dark Mode";
  }
});
const favBtn = document.getElementById("favBtn");
favBtn.addEventListener("click", () => {
  const city = document.getElementById("city").value.trim();
  if (!city) return;
  let favs = JSON.parse(
    localStorage.getItem("favourites")
  ) || [];
  if (!favs.includes(city)) {
    favs.push(city);
    localStorage.setItem(
      "favourites",
      JSON.stringify(favs)
    );
    loadFavourites();
  }
});
function loadFavourites() {
  const favouritesDiv = document.getElementById("favourites");
  let favs = JSON.parse(
    localStorage.getItem("favourites")
  ) || [];
  favouritesDiv.innerHTML = "";
  favs.forEach(city => {
    favouritesDiv.innerHTML += `
      <button class="fav-city"
        onclick="selectFavourite('${city}')">
        ${city}
      </button>
    `;
  });
}
function selectFavourite(city) {
  document.getElementById("city").value = city;
  getWeather();
}
window.onload = () => {
  loadFavourites();
};
