require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("../config/db");
const Listing = require("../models/Listing");

const CITIES = [
  { name: "Lucknow", lat: 26.8467, lng: 80.9462 },
  { name: "Delhi", lat: 28.6139, lng: 77.209 },
  { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
  { name: "Pune", lat: 18.5204, lng: 73.8567 },
];

const AMENITY_POOL = [
  "parking",
  "gym",
  "pool",
  "balcony",
  "furnished",
  "pet_friendly",
  "security",
  "elevator",
  "ac",
  "laundry",
];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomChoice(arr, count) {
  const shuffled = [...arr].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

function randomDateWithinMonths(months) {
  const now = new Date();
  const past = new Date();
  past.setMonth(now.getMonth() - months);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

function generateListing(city, index) {
  const bedrooms = randomInt(1, 4);
  const bathrooms = Math.min(bedrooms, randomInt(1, 3));
  const sqft = bedrooms * randomInt(280, 420) + randomInt(-100, 150);
  const yearBuilt = randomInt(1985, 2024);
  const amenities = randomChoice(AMENITY_POOL, randomInt(1, 5));
  const distanceToTransitKm = +(Math.random() * 4).toFixed(2);
  const distanceToSchoolKm = +(Math.random() * 5).toFixed(2);
  const conditionScore = randomInt(4, 10);

  // Base price formula (used only to generate believable synthetic ground truth)
  const currentYear = new Date().getFullYear();
  const age = currentYear - yearBuilt;
  const amenityBonus = amenities.length * 800;
  const basePrice =
    8000 +
    bedrooms * 4500 +
    bathrooms * 2000 +
    sqft * 12 -
    age * 60 +
    amenityBonus -
    distanceToTransitKm * 500 -
    distanceToSchoolKm * 300 +
    conditionScore * 900;

  const noise = basePrice * (Math.random() * 0.14 - 0.07); // +/-7% market noise
  const listedPrice = Math.max(5000, Math.round(basePrice + noise));

  const jitterLat = city.lat + (Math.random() - 0.5) * 0.15;
  const jitterLng = city.lng + (Math.random() - 0.5) * 0.15;

  return {
    address: `${randomInt(1, 999)} ${city.name} Sector ${randomInt(1, 40)}`,
    city: city.name,
    zip: String(randomInt(100000, 999999)),
    location: { type: "Point", coordinates: [jitterLng, jitterLat] },
    bedrooms,
    bathrooms,
    sqft,
    yearBuilt,
    amenities,
    distanceToTransitKm,
    distanceToSchoolKm,
    conditionScore,
    listedPrice,
    listedDate: randomDateWithinMonths(12),
    status: "active",
  };
}

async function seed() {
  await connectDB();
  await Listing.deleteMany({});
  console.log("[SEED] Cleared existing listings.");

  const listings = [];
  CITIES.forEach((city) => {
    for (let i = 0; i < 150; i++) listings.push(generateListing(city, i));
  });

  await Listing.insertMany(listings);
  console.log(`[SEED] Inserted ${listings.length} synthetic listings across ${CITIES.length} cities.`);

  await mongoose.connection.close();
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
