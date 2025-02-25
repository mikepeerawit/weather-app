import { useState } from "react";
import SearchBar from "../components/SearchBar";
import WeatherDisplay from "../components/WeatherDisplay";
import { fetchWeather } from "../utils/api";

export default function Home() {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async (city) => {
    setIsLoading(true);
    try {
      const data = await fetchWeather(city);
      setWeatherData(data);
    } catch (error) {
      console.error("Error fetching weather:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-8">
      <div className="max-w-2xl mx-auto pt-16">
        <h1 className="text-4xl font-bold text-center text-gray-100 mb-8">
          Weather Forecast
        </h1>
        <SearchBar onSearch={handleSearch} isLoading={isLoading} />
        <WeatherDisplay weatherData={weatherData} isLoading={isLoading} />
      </div>
    </main>
  );
}
