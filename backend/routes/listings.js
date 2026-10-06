const express = require("express");
const router = express.Router();
const Listing = require("../models/Listing");

// GET /api/listings?city=Lucknow&limit=20&page=1&minPrice=20000&maxPrice=50000&bedrooms=2&sortBy=listedPrice&sortOrder=asc
router.get("/", async (req, res) => {
  try {
    const {
      city,
      limit = 20,
      page = 1,
      minPrice,
      maxPrice,
      bedrooms,
      sortBy = "listedDate",
      sortOrder = "desc",
    } = req.query;

    const filter = {};
    if (city) filter.city = city;
    if (bedrooms) filter.bedrooms = Number(bedrooms);
    if (minPrice || maxPrice) {
      filter.listedPrice = {};
      if (minPrice) filter.listedPrice.$gte = Number(minPrice);
      if (maxPrice) filter.listedPrice.$lte = Number(maxPrice);
    }

    const allowedSortFields = ["listedPrice", "listedDate", "sqft", "bedrooms"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "listedDate";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    const listings = await Listing.find(filter)
      .sort({ [sortField]: sortDirection })
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