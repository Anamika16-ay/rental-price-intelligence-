const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing");

// GET /api/listings?city=Lucknow&limit=20
router.get("/", async (req, res) => {
  try {
    const { city, limit = 20, page = 1 } = req.query;
    const filter = city ? { city } : {};
    const listings = await Listing.find(filter)
      .sort({ listedDate: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit));

    const total = await Listing.countDocuments(filter);
    res.json({ total, page: Number(page), limit: Number(limit), listings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/listings/:id
router.get("/:id", async (req, res) => {
  try {
    const listing = await Listing.findById(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(listing);
  } catch (err) {
    res.status(400).json({ error: "Invalid listing id" });
  }
});

// POST /api/listings
router.post("/", async (req, res) => {
  try {
    const listing = await Listing.create(req.body);
    res.status(201).json(listing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/listings/:id
router.put("/:id", async (req, res) => {
  try {
    const listing = await Listing.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json(listing);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/listings/:id
router.delete("/:id", async (req, res) => {
  try {
    const listing = await Listing.findByIdAndDelete(req.params.id);
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    res.json({ message: "Listing deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
