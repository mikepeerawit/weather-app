import { FiDroplet, FiThermometer, FiWind } from "react-icons/fi";

const WeatherCard = ({ label, value, icon: Icon }) => (
  <div className="bg-gray-800/50 p-4 rounded-xl backdrop-blur-md border border-gray-700/50 hover:bg-gray-700/50 transition-all duration-300">
    <div className="flex items-center gap-3">
      <div className="p-2 bg-gray-700/50 rounded-lg">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-xl font-semibold text-gray-100">{value}</p>
      </div>
    </div>
  </div>
);

const WeatherDisplay = ({ weatherData, isLoading }) => {
  if (isLoading) {
    return (
      <div className="relative mt-16 z-0 text-center">
        <div className="animate-spin w-8 h-8 border-4 border-gray-700 border-t-gray-300 rounded-full mx-auto"></div>
      </div>
    );
  }

  if (!weatherData) return null;

  return (
    <div className="relative mt-16 z-0">
      {/* Current Weather */}
      <div className="text-center mb-12">
        <h2 className="text-6xl font-light mb-4 text-gray-100">
          {Math.round(weatherData.current.temp)}°
        </h2>
        <div className="flex items-center justify-center gap-4 mb-4">
          <img
            src={`http://openweathermap.org/img/wn/${weatherData.current.icon}@2x.png`}
            alt={weatherData.current.description}
            className="w-16 h-16"
          />
          <div className="text-xl capitalize text-gray-200">
            {weatherData.current.description}
          </div>
        </div>
        <div className="flex justify-center gap-8 text-gray-300">
          <div>Feels like: {Math.round(weatherData.current.feels_like)}°</div>
          <div>Humidity: {weatherData.current.humidity}%</div>
          <div>Wind: {weatherData.current.wind_speed} m/s</div>
        </div>
      </div>

      {/* 5-Day Forecast */}
      <div className="grid grid-cols-5 gap-4 px-4">
        {weatherData.forecast.map((day, index) => (
          <div key={index} className="text-center">
            <div className="text-sm text-gray-400 mb-2">
              {new Date(day.date).toLocaleDateString("en-US", {
                weekday: "short",
              })}
            </div>
            <img
              src={`http://openweathermap.org/img/wn/${day.icon}.png`}
              alt={day.description}
              className="w-12 h-12 mx-auto"
            />
            <div className="text-2xl font-light text-gray-200">
              {Math.round(day.temp)}°
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeatherDisplay;
