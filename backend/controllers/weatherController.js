const axios = require("axios");

const weatherConditions = {
  0: ["Clear sky", "Clear", "01"], 1: ["Mainly clear", "Clear", "02"],
  2: ["Partly cloudy", "Clouds", "03"], 3: ["Overcast", "Clouds", "04"],
  45: ["Fog", "Mist", "50"], 48: ["Depositing rime fog", "Mist", "50"],
  51: ["Light drizzle", "Drizzle", "09"], 53: ["Drizzle", "Drizzle", "09"],
  55: ["Dense drizzle", "Drizzle", "09"], 56: ["Freezing drizzle", "Drizzle", "09"], 57: ["Heavy freezing drizzle", "Drizzle", "09"],
  61: ["Light rain", "Rain", "10"], 63: ["Rain", "Rain", "10"], 65: ["Heavy rain", "Rain", "10"],
  66: ["Freezing rain", "Rain", "13"], 67: ["Heavy freezing rain", "Rain", "13"],
  71: ["Light snow", "Snow", "13"], 73: ["Snow", "Snow", "13"], 75: ["Heavy snow", "Snow", "13"], 77: ["Snow grains", "Snow", "13"],
  80: ["Rain showers", "Rain", "09"], 81: ["Rain showers", "Rain", "09"], 82: ["Heavy rain showers", "Rain", "09"],
  85: ["Snow showers", "Snow", "13"], 86: ["Heavy snow showers", "Snow", "13"],
  95: ["Thunderstorm", "Thunderstorm", "11"], 96: ["Thunderstorm with hail", "Thunderstorm", "11"], 99: ["Heavy thunderstorm with hail", "Thunderstorm", "11"],
};

exports.getWeather = async (req, res) => {
  try {
    const city = req.params.city;
    const locationResponse = await axios.get("https://geocoding-api.open-meteo.com/v1/search", {
      params: { name: city, count: 1, language: "en", format: "json" },
    });
    const location = locationResponse.data.results?.[0];
    if (!location) return res.status(404).json({ message: "City not found" });

    const weatherResponse = await axios.get("https://api.open-meteo.com/v1/forecast", {
      params: {
        latitude: location.latitude,
        longitude: location.longitude,
        current: "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m,surface_pressure",
        daily: "sunrise,sunset",
        timezone: "auto",
        forecast_days: 1,
      },
    });
    const { current, daily, utc_offset_seconds: offset = 0 } = weatherResponse.data;
    const [description, main, icon] = weatherConditions[current.weather_code] || ["Unknown", "Clear", "01"];
    const toUnixTime = (value) => Math.floor(Date.parse(value + "Z") / 1000) - offset;

    res.json({
      cod: 200,
      name: location.name,
      sys: { country: location.country_code, sunrise: toUnixTime(daily.sunrise[0]), sunset: toUnixTime(daily.sunset[0]) },
      main: { temp: current.temperature_2m, feels_like: current.apparent_temperature, humidity: current.relative_humidity_2m, pressure: current.surface_pressure },
      wind: { speed: current.wind_speed_10m },
      weather: [{ main, description, icon: icon + (current.is_day ? "d" : "n") }],
    });
  } catch (error) {
    console.error("Weather request failed:", error.response?.data || error.message);
    res.status(502).json({ message: "Weather service is temporarily unavailable", stage, error: error.message, code: error.name, status: error.status || null });
  }
};
