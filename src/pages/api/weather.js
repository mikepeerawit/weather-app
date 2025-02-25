export default async function handler(req, res) {
  const { city } = req.query;

  if (!city) {
    return res.status(400).json({ error: "City parameter is required" });
  }

  try {
    // Get current weather
    const currentResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(
        city
      )}&appid=${process.env.API_KEY}&units=metric`
    );

    // Get 5-day forecast
    const forecastResponse = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
        city
      )}&appid=${process.env.API_KEY}&units=metric`
    );

    if (!currentResponse.ok || !forecastResponse.ok) {
      throw new Error("Failed to fetch weather data");
    }

    const currentData = await currentResponse.json();
    const forecastData = await forecastResponse.json();

    // Process forecast data to get daily forecasts
    const dailyForecasts = forecastData.list.reduce((acc, item) => {
      const date = new Date(item.dt * 1000).toLocaleDateString();
      if (!acc[date]) {
        acc[date] = item;
      }
      return acc;
    }, {});

    const weatherData = {
      current: {
        temp: currentData.main.temp,
        feels_like: currentData.main.feels_like,
        humidity: currentData.main.humidity,
        wind_speed: currentData.wind.speed,
        description: currentData.weather[0].description,
        icon: currentData.weather[0].icon,
      },
      forecast: Object.values(dailyForecasts)
        .slice(1, 6)
        .map((day) => ({
          date: new Date(day.dt * 1000).toLocaleDateString(),
          temp: day.main.temp,
          description: day.weather[0].description,
          icon: day.weather[0].icon,
        })),
    };

    res.status(200).json(weatherData);
  } catch (error) {
    console.error("Error fetching weather:", error);
    res.status(500).json({ error: "Failed to fetch weather data" });
  }
}
