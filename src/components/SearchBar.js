import { useState, useEffect, useRef, useCallback } from "react";
import { FiSearch, FiMapPin } from "react-icons/fi";
import { searchCities } from "../utils/api";

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

const SearchBar = ({ onSearch, isLoading: searchLoading }) => {
  const [city, setCity] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [hasResults, setHasResults] = useState(false);
  const searchContainerRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastQuery, setLastQuery] = useState("");

  // Debounce the search input
  const debouncedSearchTerm = useDebounce(city, 300);

  useEffect(() => {
    // Handle clicks outside of the search container
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Effect to fetch cities when debounced value changes
  useEffect(() => {
    const fetchCities = async () => {
      if (debouncedSearchTerm && debouncedSearchTerm.trim()) {
        setIsSearching(true);
        try {
          const cities = await searchCities(debouncedSearchTerm);
          setSuggestions(cities);
          setHasResults(cities.length > 0);
          setShowSuggestions(true);
          setRetryCount(0); // Reset retry count on success
        } catch (error) {
          console.error("Error fetching cities:", error);
          if (error.message.includes("rate limit")) {
            // If rate limited, retry after 1 second
            setTimeout(() => {
              setRetryCount((prev) => prev + 1);
              handleRetry(debouncedSearchTerm);
            }, 1000);
          }
          setSuggestions([]);
        } finally {
          setIsSearching(false);
        }
      }
    };

    fetchCities();
  }, [debouncedSearchTerm]);

  const handleInputChange = (event) => {
    const value = event.target.value;
    setCity(value);
    setLastQuery(value);
    setHighlightedIndex(-1);

    if (!value || !value.trim()) {
      setSuggestions([]);
      setShowSuggestions(false);
      setHasResults(false);
    }
  };

  const handleRetry = async (value) => {
    if (retryCount > 3) return; // Max 3 retries

    setIsSearching(true);
    try {
      const cities = await searchCities(value);
      setSuggestions(cities);
      setHasResults(cities.length > 0);
      setShowSuggestions(true);
      setRetryCount(0); // Reset on success
    } catch (error) {
      console.error("Retry failed:", error);
      if (error.message.includes("rate limit")) {
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          handleRetry(value);
        }, 1000);
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleChange = (e) => {
    handleInputChange(e);
  };

  const highlightMatch = (text, query) => {
    if (!query) return text;
    const parts = text.split(new RegExp(`(${query})`, "gi"));
    return parts.map((part, i) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <span key={i} className="bg-blue-500/30 px-0.5 rounded">
          {part}
        </span>
      ) : (
        part
      )
    );
  };

  const handleKeyDown = (e) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case "Enter":
        if (highlightedIndex >= 0) {
          e.preventDefault();
          handleSuggestionClick(suggestions[highlightedIndex]);
        }
        break;
      case "Escape":
        setShowSuggestions(false);
        setHighlightedIndex(-1);
        break;
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setCity(suggestion);
    setShowSuggestions(false);
    setHighlightedIndex(-1);
    onSearch(suggestion);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (city.trim()) {
      onSearch(city);
      setShowSuggestions(false);
      setHighlightedIndex(-1);
    }
  };

  const renderSuggestions = () => {
    if (!showSuggestions) return null;

    return (
      <div className="absolute w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-[60] max-h-[300px] overflow-y-auto">
        {isSearching ? (
          <div className="p-4 text-center text-gray-500">Loading...</div>
        ) : suggestions.length > 0 ? (
          suggestions.map((suggestion, index) => (
            <div
              key={`${suggestion.name}-${suggestion.country}-${index}`}
              className={`p-3 cursor-pointer hover:bg-gray-100 ${
                index === highlightedIndex ? "bg-gray-100" : ""
              }`}
              onClick={() => handleSuggestionClick(suggestion.name)}
              onMouseEnter={() => setHighlightedIndex(index)}
            >
              <div className="flex items-center gap-2">
                <FiMapPin className="flex-shrink-0 text-gray-400" />
                <div className="flex flex-col">
                  <span className="font-medium">{suggestion.name}</span>
                  <span className="text-sm text-gray-500">
                    {suggestion.state && `${suggestion.state}, `}
                    {suggestion.country}
                    {suggestion.population > 0 && (
                      <span className="ml-2 text-xs text-gray-400">
                        Pop: {suggestion.population.toLocaleString()}
                      </span>
                    )}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="p-4 text-center text-gray-500">No cities found</div>
        )}
      </div>
    );
  };

  return (
    <div className="relative w-full max-w-md mx-auto mb-8">
      <div className="relative">
        <input
          type="text"
          value={city}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setTimeout(() => setIsFocused(false), 200);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Enter city name..."
          className="w-full h-14 px-5 py-3 pl-12 text-lg bg-gray-800/50 backdrop-blur-md
                   border border-gray-700/50 rounded-2xl shadow-lg
                   text-gray-100 placeholder-gray-500
                   focus:outline-none focus:border-gray-600 focus:bg-gray-700/50
                   transition-all duration-300"
          disabled={searchLoading}
        />
        <div className="absolute left-4 top-1/2 -translate-y-1/2">
          <FiSearch
            className={`w-5 h-5 text-gray-400 ${
              isSearching ? "animate-spin" : ""
            }`}
          />
        </div>
      </div>

      {/* Suggestions Container */}
      {isFocused && (
        <div
          className="absolute w-full mt-2 bg-gray-800/90 backdrop-blur-md 
                      border border-gray-700/50 rounded-xl shadow-lg overflow-hidden
                      z-[9999]"
        >
          {isSearching ? (
            <div className="px-4 py-8 text-gray-400 text-center">
              <div className="flex flex-col items-center gap-3">
                <div
                  className="w-6 h-6 border-2 border-gray-700 border-t-gray-400 
                              rounded-full animate-spin"
                />
                <span>
                  {retryCount > 0
                    ? `Retrying... (Attempt ${retryCount}/3)`
                    : "Searching cities..."}
                </span>
              </div>
            </div>
          ) : suggestions.length > 0 ? (
            <div className="max-h-[280px] overflow-y-auto">
              {suggestions.map((suggestion, index) => (
                <div
                  key={`${suggestion.name}-${suggestion.country}-${index}`}
                  className={`px-4 py-3 cursor-pointer transition-all duration-200
                            ${
                              index === highlightedIndex
                                ? "bg-gray-700/80"
                                : "hover:bg-gray-700/50"
                            }`}
                  onClick={() => handleSuggestionClick(suggestion.name)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                >
                  <div className="flex items-center gap-3">
                    <FiMapPin className="text-gray-400" />
                    <div>
                      <div className="text-gray-100 font-medium">
                        {suggestion.name}
                      </div>
                      <div className="text-sm text-gray-400">
                        {suggestion.state && `${suggestion.state}, `}
                        {suggestion.country}
                        {suggestion.population > 0 && (
                          <span className="ml-2 text-gray-500">
                            • {suggestion.population.toLocaleString()} residents
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-4 py-3 text-gray-400 text-center">
              {hasResults ? "No cities found" : "Type to search cities"}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
