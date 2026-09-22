# Smart Rental Price Intelligence (MERN Stack)

A full-stack rental price intelligence platform: predicts fair market rent, surfaces
comparable listings, tracks neighborhood price trends, and flags over/under-priced
listings — built entirely on **MongoDB, Express, React, and Node.js**.

## Architecture

```
rental-price-intelligence/
├── backend/                  Express API + ML engine
│   ├── config/db.js          MongoDB connection
│   ├── models/               Mongoose schemas (Listing, Prediction)
│   ├── ml/
│   │   ├── predictionEngine.js   Multiple linear regression (Normal Equation), trained
│   │   │                         in pure JS + per-feature explainability
│   │   ├── comparablesEngine.js  Geospatial + similarity nearest-neighbor search
│   │   ├── trendAnalytics.js     MongoDB aggregation pipelines for price trends
│   │   └── alertEngine.js        Over/under-priced detection
│   ├── routes/                REST endpoints
│   ├── seed/seedData.js       Synthetic listing generator (MVP data)
│   └── server.js              App entry point
├── frontend/                 React (Vite) dashboard
│   └── src/
│       ├── api/api.js         Axios client
│       ├── components/        SearchForm, PredictionResult, ComparablesList,
│       │                      TrendChart, MapView, AlertBanner
│       └── App.jsx            Dashboard layout
├── docker-compose.yml         Mongo + backend + frontend orchestration
└── README.md
```

## Why a hand-rolled ML engine?

This is a pure Node.js/MERN stack (no Python runtime), so the prediction model is a
**multiple linear regression** trained via the Normal Equation, implemented natively in
JavaScript (`backend/ml/predictionEngine.js`) — no external ML service required. It
outputs a predicted price, a 90% confidence interval, and a per-feature contribution
breakdown (a simplified SHAP-style explainability layer). The architecture is designed
so this module can later be swapped for a hosted Python (XGBoost) microservice without
touching the API contract.

## Getting Started (local, without Docker)

### 1. Backend

```bash
cd backend
cp .env.example .env
npm install
npm run seed        # generates ~600 synthetic listings across 4 cities
npm run dev          # starts on http://localhost:5000, auto-trains model on boot
```

### 2. Frontend

```bash
cd frontend
npm install
npm run dev          # starts on http://localhost:5173
```

Open **http://localhost:5173** — the dashboard proxies `/api/*` calls to the backend.

## Getting Started (Docker)

```bash
docker compose up --build
```

Then run the seed script once inside the backend container:

```bash
docker exec -it rpi-backend npm run seed
docker restart rpi-backend   # re-trains model on boot with seeded data
```

Frontend: http://localhost:5173 · Backend: http://localhost:5000

## API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | Health check + model training status |
| GET | `/api/listings` | List/paginate listings (filter by `city`) |
| POST | `/api/listings` | Create a listing |
| POST | `/api/predict` | Predict fair rent for a property (see body below) |
| POST | `/api/predict/train` | Retrain the model on current DB listings |
| GET | `/api/comps/:listingId` | Comparables for a saved listing |
| POST | `/api/comps` | Comparables for an ad-hoc (unsaved) property |
| GET | `/api/trends/:city` | Monthly median/average rent trend + summary |
| GET | `/api/alerts/:city` | Over/under-priced listings in a city |
| GET | `/api/alerts/listing/:id` | Pricing check for one listing |

### `POST /api/predict` request body

```json
{
  "bedrooms": 2,
  "bathrooms": 2,
  "sqft": 950,
  "yearBuilt": 2015,
  "amenities": ["parking", "ac"],
  "distanceToTransitKm": 1.2,
  "distanceToSchoolKm": 1.5,
  "conditionScore": 7
}
```

## Success Metric

Model reports **MAE / RMSE / MAPE** after each training run (`stats` field returned
from `/api/predict/train`). Target: prediction MAPE within 8–10% on synthetic/real data.

## Next Steps for Production

- Swap `predictionEngine.js` for a hosted Python/XGBoost service if higher accuracy is needed.
- Add scheduled retraining (cron job / Agenda.js) instead of boot-time-only training.
- Add authentication (JWT) for listing management endpoints.
- Add drift monitoring by logging prediction vs. actual outcomes over time.
- Replace synthetic seed data with a real listings ingestion pipeline (scraper or API).
