export const fetchWeather = async (city) => {
  const response = await fetch(`/api/weather?city=${encodeURIComponent(city)}`);
  if (!response.ok) {
    throw new Error("Weather data could not be retrieved");
  }
  return await response.json();
};

// Cache object to store previous search results
const citySearchCache = {
  data: new Map(),
  timeouts: new Map(),
  // Cache results for 1 hour
  TTL: 60 * 60 * 1000,
  MAX_ENTRIES: 100, // Maximum number of cached queries
};

const cleanupOldestCache = () => {
  if (citySearchCache.data.size >= citySearchCache.MAX_ENTRIES) {
    const oldestKey = citySearchCache.data.keys().next().value;
    citySearchCache.data.delete(oldestKey);
    if (citySearchCache.timeouts.has(oldestKey)) {
      clearTimeout(citySearchCache.timeouts.get(oldestKey));
      citySearchCache.timeouts.delete(oldestKey);
    }
  }
};

export const searchCities = async (query) => {
  try {
    const response = await fetch(
      `/api/cities?query=${encodeURIComponent(query)}`
    );
    if (!response.ok) {
      throw new Error("Failed to fetch cities");
    }
    const data = await response.json();
    return (
      data.data?.map((city) => ({
        name: city.city,
        country: city.country,
        state: city.region,
        population: city.population,
        latitude: city.latitude,
        longitude: city.longitude,
      })) || []
    );
  } catch (error) {
    console.error("Error fetching cities:", error);
    throw error;
  }
};

// Optional: Add a function to clear the cache if needed
export const clearCitySearchCache = () => {
  citySearchCache.data.clear();
  citySearchCache.timeouts.forEach((timeout) => clearTimeout(timeout));
  citySearchCache.timeouts.clear();
};
