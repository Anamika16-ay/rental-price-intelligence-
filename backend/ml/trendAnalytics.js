const Listing = require("../models/Listing");

/**
 * Aggregates listings into monthly median/average rent trends,
 * grouped by city (and optionally by bedroom count).
 */
async function getCityTrends(city, { months = 12 } = {}) {
  const since = new Date();
  since.setMonth(since.getMonth() - months);

  const pipeline = [
    { $match: { city, listedDate: { $gte: since } } },
    {
      $group: {
        _id: {
          year: { $year: "$listedDate" },
          month: { $month: "$listedDate" },
        },
        avgPrice: { $avg: "$listedPrice" },
        prices: { $push: "$listedPrice" },
        count: { $sum: 1 },
      },
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } },
  ];

  const results = await Listing.aggregate(pipeline);

  return results.map((r) => {
    const sorted = [...r.prices].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    const median =
      sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;

    return {
      period: `${r._id.year}-${String(r._id.month).padStart(2, "0")}`,
      averagePrice: Math.round(r.avgPrice),
      medianPrice: Math.round(median),
      listingCount: r.count,
    };
  });
}

async function getCitySummary(city) {
  const [summary] = await Listing.aggregate([
    { $match: { city } },
    {
      $group: {
        _id: null,
        avgPrice: { $avg: "$listedPrice" },
        minPrice: { $min: "$listedPrice" },
        maxPrice: { $max: "$listedPrice" },
        totalListings: { $sum: 1 },
        avgSqft: { $avg: "$sqft" },
      },
    },
  ]);
  return summary || null;
}

module.exports = { getCityTrends, getCitySummary };
