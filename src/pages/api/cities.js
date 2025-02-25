export default async function handler(req, res) {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
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

    if (!response.ok) {
      throw new Error("Failed to fetch cities");
    }

    const data = await response.json();
    res.status(200).json(data);
  } catch (error) {
    console.error("Error fetching cities:", error);
    res.status(500).json({ error: "Failed to fetch cities" });
  }
}
