const Listing = require("../models/Listing");
const { model } = require("./predictionEngine");

const DEFAULT_THRESHOLD = Number(process.env.ALERT_THRESHOLD_PERCENT || 12);

/**
 * Compares a listing's actual price against the model's predicted price
 * and flags it if the deviation exceeds the threshold percentage.
 */
function evaluateListing(listing, thresholdPercent = DEFAULT_THRESHOLD) {
  const prediction = model.predict(listing);
  const deviationPercent =
    ((listing.listedPrice - prediction.predictedPrice) / prediction.predictedPrice) * 100;

  let status = "fair";
  if (deviationPercent > thresholdPercent) status = "overpriced";
  else if (deviationPercent < -thresholdPercent) status = "underpriced";

  return {
    listingId: listing._id,
    address: listing.address,
    listedPrice: listing.listedPrice,
    predictedPrice: prediction.predictedPrice,
    deviationPercent: Math.round(deviationPercent * 10) / 10,
    status,
  };
}

async function scanCityForAlerts(city, thresholdPercent = DEFAULT_THRESHOLD) {
  const listings = await Listing.find({ city, status: "active" });
  return listings
    .map((listing) => evaluateListing(listing, thresholdPercent))
    .filter((result) => result.status !== "fair")
    .sort((a, b) => Math.abs(b.deviationPercent) - Math.abs(a.deviationPercent));
}

module.exports = { evaluateListing, scanCityForAlerts };
