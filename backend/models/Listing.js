const mongoose = require("mongoose");

const ListingSchema = new mongoose.Schema(
  {
    address: { type: String, required: true },
    city: { type: String, required: true, index: true },
    zip: { type: String, required: true },
    location: {
      type: { type: String, enum: ["Point"], default: "Point" },
      coordinates: { type: [Number], required: true }, // [lng, lat]
    },
    bedrooms: { type: Number, required: true },
    bathrooms: { type: Number, required: true },
    sqft: { type: Number, required: true },
    yearBuilt: { type: Number, required: true },
    amenities: { type: [String], default: [] },
    distanceToTransitKm: { type: Number, default: 2 },
    distanceToSchoolKm: { type: Number, default: 2 },
    conditionScore: { type: Number, min: 1, max: 10, default: 6 }, // 1=poor, 10=excellent
    listedPrice: { type: Number, required: true },
    listedDate: { type: Date, default: Date.now },
    status: { type: String, enum: ["active", "rented"], default: "active" },
  },
  { timestamps: true }
);

ListingSchema.index({ location: "2dsphere" });

module.exports = mongoose.model("Listing", ListingSchema);
