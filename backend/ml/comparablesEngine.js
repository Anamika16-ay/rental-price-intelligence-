const Listing = require("../models/Listing");
const { amenityScore } = require("./predictionEngine");

/**
 * Finds nearby listings (geospatial) then ranks them by feature similarity
 * to the target property (bedrooms, bathrooms, sqft, amenities, age).
 */
async function findComparables(targetListing, { radiusKm = 5, limit = 8 } = {}) {
  const [lng, lat] = targetListing.location.coordinates;

  const nearby = await Listing.find({
    location: {
      $near: {
        $geometry: { type: "Point", coordinates: [lng, lat] },
        $maxDistance: radiusKm * 1000,
      },
    },
    status: "active",
    ...(targetListing._id ? { _id: { $ne: targetListing._id } } : {}),
  }).limit(50);

  const currentYear = new Date().getFullYear();
  const targetVector = {
    bedrooms: targetListing.bedrooms,
    bathrooms: targetListing.bathrooms,
    sqft: targetListing.sqft,
    age: currentYear - targetListing.yearBuilt,
    amenities: amenityScore(targetListing.amenities),
  };

  const scored = nearby.map((listing) => {
    const vector = {
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.sqft,
      age: currentYear - listing.yearBuilt,
      amenities: amenityScore(listing.amenities),
    };

    // Normalized Euclidean distance (lower = more similar)
    const distance = Math.sqrt(
      Math.pow((vector.bedrooms - targetVector.bedrooms) / 1, 2) +
        Math.pow((vector.bathrooms - targetVector.bathrooms) / 1, 2) +
        Math.pow((vector.sqft - targetVector.sqft) / 200, 2) +
        Math.pow((vector.age - targetVector.age) / 10, 2) +
        Math.pow((vector.amenities - targetVector.amenities) / 2, 2)
    );

    const similarityScore = Math.round((1 / (1 + distance)) * 100);

    return { listing, similarityScore };
  });

  return scored
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, limit)
    .map(({ listing, similarityScore }) => ({
      id: listing._id,
      address: listing.address,
      city: listing.city,
      bedrooms: listing.bedrooms,
      bathrooms: listing.bathrooms,
      sqft: listing.sqft,
      listedPrice: listing.listedPrice,
      amenities: listing.amenities,
      coordinates: listing.location.coordinates,
      similarityScore,
    }));
}

module.exports = { findComparables };
