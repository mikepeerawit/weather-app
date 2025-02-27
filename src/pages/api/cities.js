// Simple in-memory cache
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  // Check cache first
  const cacheKey = query.toLowerCase();
  const cachedData = cache.get(cacheKey);

  if (cachedData && Date.now() - cachedData.timestamp < CACHE_TTL) {
    return res.status(200).json(cachedData.data);
  }

  const options = {
    method: "GET",
    headers: {
      "X-RapidAPI-Key": process.env.RAPID_API_KEY,
      "X-RapidAPI-Host": "wft-geo-db.p.rapidapi.com",
    },
  };

  try {
    const response = await fetch(
      `https://wft-geo-db.p.rapidapi.com/v1/geo/cities?namePrefix=${encodeURIComponent(
        query
      )}&limit=5&sort=-population`,
      options
    );

    // Check for rate limiting response
    if (response.status === 429) {
      return res.status(429).json({
        error: "rate limit exceeded",
        message: "Too many requests. Please try again in a moment.",
      });
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || "Failed to fetch cities");
    }

    const data = await response.json();

    // Store in cache
    cache.set(cacheKey, {
      data,
      timestamp: Date.now(),
    });

    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching cities:", error);

    // Determine if it's a rate limit error from the error message
    if (error.message && error.message.toLowerCase().includes("rate limit")) {
      return res.status(429).json({
        error: "rate limit exceeded",
        message: "Too many requests. Please try again in a moment.",
      });
    }

    res.status(500).json({ error: "Failed to fetch cities" });
  }
}
