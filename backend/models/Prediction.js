const mongoose = require("mongoose");

const PredictionSchema = new mongoose.Schema(
  {
    listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing" },
    inputFeatures: { type: Object, required: true },
    predictedPrice: { type: Number, required: true },
    confidenceLow: { type: Number, required: true },
    confidenceHigh: { type: Number, required: true },
    featureContributions: { type: Object, default: {} }, // explainability
    modelVersion: { type: String, default: "linreg-v1" },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prediction", PredictionSchema);
