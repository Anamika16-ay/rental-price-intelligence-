const express = require("express");
const router = express.Router();
const { getCityTrends, getCitySummary } = require("../ml/trendAnalytics");

// GET /api/trends/:city?months=12
router.get("/:city", async (req, res) => {
  try {
    const { city } = req.params;
    const months = Number(req.query.months) || 12;

    const [trends, summary] = await Promise.all([
      getCityTrends(city, { months }),
      getCitySummary(city),
    ]);

    res.json({ city, months, trends, summary });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
