const express = require("express");
const cors = require("cors");
require("dotenv").config();
const app = express();
app.use(cors());
const weatherRoutes = require("./routes/weather");
app.use("/api/weather", weatherRoutes);
app.listen(5000, () => {
  console.log("Server Running");
});
app.get("/api/weather/:city", async (req, res) => {
  try {
    const city = req.params.city;
    const geo = await axios.get(
      "https://api.openweathermap.org/geo/1.0/direct",
      {
        params: {
          q: city,
          limit: 1,
          appid: process.env.API_KEY
        }
      }
    );
    if (geo.data.length === 0) {
      return res.status(404).json({
        message: "City not found"
      });
    }
    const { lat, lon } = geo.data[0];
    const weather = await axios.get(
      "https://api.openweathermap.org/data/2.5/weather",
      {
        params: {
          lat,
          lon,
          appid: process.env.API_KEY,
          units: "metric"
        }
      }
    );
    res.json(weather.data);
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.status(500).json({
      message: "Weather not found"
    });
  }
});