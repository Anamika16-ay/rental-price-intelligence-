const express = require("express");
const router = express.Router();
const { model } = require("../ml/predictionEngine");
const Prediction = require("../models/Prediction");
const Listing = require("../models/Listing");

/**
 * POST /api/predict
 * Body: { bedrooms, bathrooms, sqft, yearBuilt, amenities, distanceToTransitKm,
 *         distanceToSchoolKm, conditionScore, listingId? (optional, to persist link) }
 */
router.post("/", async (req, res) => {
  try {
    if (!model.trained) {
      return res.status(503).json({ error: "Model not trained yet. Run training first via /api/train." });
    }

    const {
      bedrooms,
      bathrooms,
      sqft,
      yearBuilt,
      amenities = [],
      distanceToTransitKm = 2,
      distanceToSchoolKm = 2,
      conditionScore = 6,
      listingId,
    } = req.body;

    if (!bedrooms || !bathrooms || !sqft || !yearBuilt) {
      return res.status(400).json({
        error: "bedrooms, bathrooms, sqft, and yearBuilt are required.",
      });
    }

    const pseudoListing = {
      bedrooms,
      bathrooms,
      sqft,
      yearBuilt,
      amenities,
      distanceToTransitKm,
      distanceToSchoolKm,
      conditionScore,
    };

    const result = model.predict(pseudoListing);

    const predictionDoc = await Prediction.create({
      listing: listingId || undefined,
      inputFeatures: result.inputFeatures,
      predictedPrice: result.predictedPrice,
      confidenceLow: result.confidenceLow,
      confidenceHigh: result.confidenceHigh,
      featureContributions: result.featureContributions,
    });

    res.json({
      predictedPrice: result.predictedPrice,
      confidenceLow: result.confidenceLow,
      confidenceHigh: result.confidenceHigh,
      featureContributions: result.featureContributions,
      predictionId: predictionDoc._id,
      modelStats: model.stats,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/predict/train - (re)trains the model on current DB listings
router.post("/train", async (req, res) => {
  try {
    const listings = await Listing.find({});
    if (listings.length < 20) {
      return res.status(400).json({ error: "Not enough listings to train on (need >= 20). Seed the DB first." });
    }
    const stats = model.train(listings);
    res.json({ message: "Model trained successfully.", stats });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
