const express = require("express");
const router = express.Router();
const { findComparables } = require("../ml/comparablesEngine");
const Listing = require("../models/Listing");

// GET /api/comps/:listingId
router.get("/:listingId", async (req, res) => {
  try {
    const target = await Listing.findById(req.params.listingId);
    if (!target) return res.status(404).json({ error: "Listing not found" });

    const comparables = await findComparables(target);
    res.json({ target: target._id, comparables });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/comps  (for ad-hoc, not-yet-saved properties)
// Body: { lat, lng, bedrooms, bathrooms, sqft, yearBuilt, amenities }
router.post("/", async (req, res) => {
  try {
    const { lat, lng, bedrooms, bathrooms, sqft, yearBuilt, amenities = [] } = req.body;
    if (lat === undefined || lng === undefined) {
      return res.status(400).json({ error: "lat and lng are required." });
    }

    const pseudoListing = {
      location: { coordinates: [lng, lat] },
      bedrooms,
      bathrooms,
      sqft,
      yearBuilt,
      amenities,
    };

    const comparables = await findComparables(pseudoListing);
    res.json({ comparables });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
