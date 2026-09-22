/**
 * Smart Rental Price Intelligence — Prediction Engine
 * ----------------------------------------------------
 * A lightweight, dependency-free multiple linear regression model
 * (trained via the Normal Equation) with per-feature contribution
 * breakdown (a simplified, SHAP-style explainability layer).
 *
 * Why hand-rolled instead of a Python ML lib?
 * This is a pure MERN (Node.js) stack — no Python runtime — so the
 * model is implemented natively in JS using linear algebra utilities
 * below. It's swappable later for a hosted ML microservice if needed.
 */

const FEATURE_KEYS = [
  "bedrooms",
  "bathrooms",
  "sqft",
  "propertyAge",
  "amenityScore",
  "distanceToTransitKm",
  "distanceToSchoolKm",
  "conditionScore",
];

// ---------- Linear algebra helpers ----------

function transpose(matrix) {
  return matrix[0].map((_, colIndex) => matrix.map((row) => row[colIndex]));
}

function multiply(a, b) {
  const result = Array.from({ length: a.length }, () => new Array(b[0].length).fill(0));
  for (let i = 0; i < a.length; i++) {
    for (let j = 0; j < b[0].length; j++) {
      let sum = 0;
      for (let k = 0; k < b.length; k++) sum += a[i][k] * b[k][j];
      result[i][j] = sum;
    }
  }
  return result;
}

function invert(matrix) {
  const n = matrix.length;
  const identity = Array.from({ length: n }, (_, i) =>
    Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))
  );
  const augmented = matrix.map((row, i) => [...row, ...identity[i]]);

  for (let col = 0; col < n; col++) {
    let pivotRow = col;
    for (let row = col + 1; row < n; row++) {
      if (Math.abs(augmented[row][col]) > Math.abs(augmented[pivotRow][col])) pivotRow = row;
    }
    [augmented[col], augmented[pivotRow]] = [augmented[pivotRow], augmented[col]];

    const pivot = augmented[col][col] || 1e-8; // guard against singular matrix
    for (let j = 0; j < 2 * n; j++) augmented[col][j] /= pivot;

    for (let row = 0; row < n; row++) {
      if (row === col) continue;
      const factor = augmented[row][col];
      for (let j = 0; j < 2 * n; j++) augmented[row][j] -= factor * augmented[col][j];
    }
  }
  return augmented.map((row) => row.slice(n));
}

// ---------- Feature engineering ----------

function amenityScore(amenities = []) {
  const weights = {
    parking: 1.2,
    gym: 1.0,
    pool: 1.5,
    balcony: 0.8,
    furnished: 1.3,
    pet_friendly: 0.7,
    security: 1.1,
    elevator: 0.6,
    ac: 0.9,
    laundry: 0.8,
  };
  return amenities.reduce((sum, a) => sum + (weights[a] || 0.5), 0);
}

function toFeatureVector(listing) {
  const currentYear = new Date().getFullYear();
  return {
    bedrooms: listing.bedrooms,
    bathrooms: listing.bathrooms,
    sqft: listing.sqft,
    propertyAge: Math.max(0, currentYear - listing.yearBuilt),
    amenityScore: amenityScore(listing.amenities),
    distanceToTransitKm: listing.distanceToTransitKm ?? 2,
    distanceToSchoolKm: listing.distanceToSchoolKm ?? 2,
    conditionScore: listing.conditionScore ?? 6,
  };
}

// ---------- Model class ----------

class RentPredictionModel {
  constructor() {
    this.coefficients = null; // [intercept, b1, b2, ...]
    this.featureMeans = null;
    this.featureStds = null;
    this.residualStd = 0;
    this.trained = false;
  }

  _standardize(X) {
    const n = X.length;
    const k = X[0].length;
    const means = new Array(k).fill(0);
    const stds = new Array(k).fill(1);

    for (let j = 0; j < k; j++) {
      let sum = 0;
      for (let i = 0; i < n; i++) sum += X[i][j];
      means[j] = sum / n;
    }
    for (let j = 0; j < k; j++) {
      let variance = 0;
      for (let i = 0; i < n; i++) variance += Math.pow(X[i][j] - means[j], 2);
      stds[j] = Math.sqrt(variance / n) || 1;
    }
    const standardized = X.map((row) => row.map((val, j) => (val - means[j]) / stds[j]));
    return { standardized, means, stds };
  }

  train(trainingListings) {
    const X = trainingListings.map((listing) => {
      const fv = toFeatureVector(listing);
      return FEATURE_KEYS.map((k) => fv[k]);
    });
    const y = trainingListings.map((l) => [l.listedPrice]);

    const { standardized, means, stds } = this._standardize(X);
    this.featureMeans = means;
    this.featureStds = stds;

    // Add intercept column
    const XWithIntercept = standardized.map((row) => [1, ...row]);

    // Normal equation: theta = (X^T X)^-1 X^T y
    const Xt = transpose(XWithIntercept);
    const XtX = multiply(Xt, XWithIntercept);
    const XtXInv = invert(XtX);
    const XtY = multiply(Xt, y);
    const theta = multiply(XtXInv, XtY).map((row) => row[0]);

    this.coefficients = theta;

    // Compute residual std for confidence intervals
    const predictions = XWithIntercept.map((row) =>
      row.reduce((sum, val, idx) => sum + val * theta[idx], 0)
    );
    const residuals = predictions.map((p, i) => y[i][0] - p);
    const mse = residuals.reduce((sum, r) => sum + r * r, 0) / residuals.length;
    this.residualStd = Math.sqrt(mse);

    // Basic accuracy stats
    const mae = residuals.reduce((sum, r) => sum + Math.abs(r), 0) / residuals.length;
    const meanActual = y.reduce((s, v) => s + v[0], 0) / y.length;
    const mapePercent =
      (residuals.reduce((sum, r, i) => sum + Math.abs(r / y[i][0]), 0) / residuals.length) * 100;

    this.trained = true;
    this.stats = { mae, rmse: this.residualStd, mapePercent, meanActual, trainedOn: trainingListings.length };
    return this.stats;
  }

  predict(listing) {
    if (!this.trained) throw new Error("Model not trained yet.");

    const fv = toFeatureVector(listing);
    const rawVector = FEATURE_KEYS.map((k) => fv[k]);
    const standardizedVector = rawVector.map(
      (val, j) => (val - this.featureMeans[j]) / this.featureStds[j]
    );
    const vectorWithIntercept = [1, ...standardizedVector];

    const predictedPrice = vectorWithIntercept.reduce(
      (sum, val, idx) => sum + val * this.coefficients[idx],
      0
    );

    // 90% confidence interval (~1.645 * residual std)
    const margin = 1.645 * this.residualStd;

    // Feature contribution breakdown (explainability)
    const featureContributions = {};
    FEATURE_KEYS.forEach((key, idx) => {
      const contribution = standardizedVector[idx] * this.coefficients[idx + 1];
      featureContributions[key] = Math.round(contribution);
    });
    featureContributions["base_intercept"] = Math.round(this.coefficients[0]);

    return {
      predictedPrice: Math.max(0, Math.round(predictedPrice)),
      confidenceLow: Math.max(0, Math.round(predictedPrice - margin)),
      confidenceHigh: Math.round(predictedPrice + margin),
      featureContributions,
      inputFeatures: fv,
    };
  }
}

// Singleton instance shared across the app
const model = new RentPredictionModel();

module.exports = { model, RentPredictionModel, toFeatureVector, amenityScore, FEATURE_KEYS };
