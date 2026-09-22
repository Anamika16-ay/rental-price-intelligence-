const express = require("express");
const router = express.Router();
const { scanCityForAlerts, evaluateListing } = require("../ml/alertEngine");
const Listing = require("../models/Listing");

// GET /api/alerts/listing/:id - single listing check (must precede /:city wildcard)
router.get("/listing/:id", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    const result = evaluateListing(listing);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/alerts/:city?threshold=12
router.get("/:city", async (req, res) => {
  try {
    const { city } = req.params;
    const threshold = req.query.threshold ? Number(req.query.threshold) : undefined;

    const alerts = await scanCityForAlerts(city, threshold);
    res.json({ city, threshold: threshold || Number(process.env.ALERT_THRESHOLD_PERCENT || 12), alerts });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
