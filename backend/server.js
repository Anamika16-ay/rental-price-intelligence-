require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const connectDB = require("./config/db");
const Listing = require("./models/Listing");
const { model } = require("./ml/predictionEngine");

const listingsRoutes = require("./routes/listings");
const predictRoutes = require("./routes/predict");
const compsRoutes = require("./routes/comps");
const trendsRoutes = require("./routes/trends");
const alertsRoutes = require("./routes/alerts");

const app = express();
const PORT = process.env.PORT || 5000;

// --- Middleware ---
app.use(helmet());
// CLIENT_ORIGIN can be a single URL or a comma-separated list, e.g.
// "https://your-app.vercel.app,http://localhost:5173"
const allowedOrigins = (process.env.CLIENT_ORIGIN || "*")
  .split(",")
  .map((o) => o.trim());
app.use(
  cors({
    origin: allowedOrigins.includes("*") ? "*" : allowedOrigins,
  })
);
app.use(express.json());
app.use(morgan("dev"));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 120 }); // 120 req/min
app.use("/api/", limiter);

// --- Routes ---
app.use("/api/listings", listingsRoutes);
app.use("/api/predict", predictRoutes);
app.use("/api/comps", compsRoutes);
app.use("/api/trends", trendsRoutes);
app.use("/api/alerts", alertsRoutes);

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", modelTrained: model.trained, uptime: process.uptime() });
});

app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// Centralized error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Internal server error" });
});

// --- Startup sequence ---
async function start() {
  await connectDB();

  // Auto-train model on boot if enough data exists
  try {
    const listings = await Listing.find({});
    if (listings.length >= 20) {
      const stats = model.train(listings);
      console.log(`[ML] Model auto-trained on boot. MAPE: ${stats.mapePercent.toFixed(2)}%`);
    } else {
      console.warn("[ML] Not enough listings to auto-train. Run `npm run seed` then POST /api/predict/train.");
    }
  } catch (err) {
    console.error("[ML] Auto-train failed:", err.message);
  }

  app.listen(PORT, () => console.log(`[SERVER] Running on http://localhost:${PORT}`));
}

start();

module.exports = app;
