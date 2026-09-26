async function getWeather() {
  const city = document.getElementById("city").value.trim();
  const result = document.getElementById("result");
  if (!city) {
    result.innerHTML = `
      <div class="error-card">
        ❌ Please enter a city name.
      </div>
    `;
    return;
  }
  result.innerHTML = `
    <div class="loading">
      <h3>⏳ Fetching Weather...</h3>
    </div>
  `;
  try {
    const response = await fetch(
      `https://weather-aggregator-api.onrender.com/api/weather/${encodeURIComponent(city)}`
    );
    const data = await response.json();
    console.log(data);
    if (!response.ok || data.cod !== 200) {
      throw new Error(data.message || "City not found");
    }
    const icon = data.weather[0].icon;
    const sunrise = new Date(
      data.sys.sunrise * 1000
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    const sunset = new Date(
      data.sys.sunset * 1000
    ).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    result.innerHTML = `
      <div class="weather-card">
        <img
          class="weather-icon"
          src="https://openweathermap.org/img/wn/${icon}@4x.png"
          alt="Weather Icon"
        >
        <h2 class="city">
          ${data.name}, ${data.sys.country}
        </h2>
        <h1 class="temp">
          ${Math.round(data.main.temp)}°C
        </h1>
        <p class="weather-text">
          ${data.weather[0].description}
        </p>
        <div class="details">
          <div class="card">
            <h4>💧 Humidity</h4>
            <p>${data.main.humidity}%</p>
          </div>
          <div class="card">
            <h4>🌬 Wind</h4>
            <p>${data.wind.speed} km/h</p>
          </div>
          <div class="card">
            <h4>🌡 Feels Like</h4>
            <p>${Math.round(data.main.feels_like)}°C</p>
          </div>
          <div class="card">
            <h4>🌅 Sunrise</h4>
            <p>${sunrise}</p>
          </div>
          <div class="card">
            <h4>🌇 Sunset</h4>
            <p>${sunset}</p>
          </div>
          <div class="card">
            <h4>📊 Pressure</h4>
            <p>${data.main.pressure} hPa</p>
          </div>
        </div>
      </div>
    `;
    if (typeof updateBackground === "function") {
      updateBackground(data.weather[0].main);
    }
    const currentTemp = Math.round(data.main.temp);
    drawChart(
      ["Morning", "Noon", "Evening", "Night", "Tomorrow"],
      [
        currentTemp - 3,
        currentTemp,
        currentTemp - 1,
        currentTemp - 4,
        currentTemp + 1
      ]
    );
  } catch (error) {
    console.error(error);
    result.innerHTML = `
      <div class="error-card">
        ❌ ${error.message}
      </div>
    `;
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
