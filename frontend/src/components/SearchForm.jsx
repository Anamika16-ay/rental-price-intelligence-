import { useState } from "react";

const AMENITY_OPTIONS = [
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

export default function SearchForm({ onSubmit, loading }) {
  const [form, setForm] = useState({
    city: "Lucknow",
    lat: 26.8467,
    lng: 80.9462,
    bedrooms: 2,
    bathrooms: 2,
    sqft: 950,
    yearBuilt: 2015,
    distanceToTransitKm: 1.2,
    distanceToSchoolKm: 1.5,
    conditionScore: 7,
    amenities: ["parking", "ac"],
  });

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const toggleAmenity = (amenity) => {
    setForm((f) => ({
      ...f,
      amenities: f.amenities.includes(amenity)
        ? f.amenities.filter((a) => a !== amenity)
        : [...f.amenities, amenity],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="form-grid">
      <div className="field">
        <label>City</label>
        <select value={form.city} onChange={(e) => update("city", e.target.value)}>
          <option>Lucknow</option>
          <option>Delhi</option>
          <option>Bengaluru</option>
          <option>Pune</option>
        </select>
      </div>

      <div className="field">
        <label>Condition (1–10)</label>
        <input
          type="number"
          min="1"
          max="10"
          value={form.conditionScore}
          onChange={(e) => update("conditionScore", Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label>Bedrooms</label>
        <input
          type="number"
          min="1"
          value={form.bedrooms}
          onChange={(e) => update("bedrooms", Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label>Bathrooms</label>
        <input
          type="number"
          min="1"
          value={form.bathrooms}
          onChange={(e) => update("bathrooms", Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label>Area (sqft)</label>
        <input
          type="number"
          min="100"
          value={form.sqft}
          onChange={(e) => update("sqft", Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label>Year built</label>
        <input
          type="number"
          min="1950"
          max="2026"
          value={form.yearBuilt}
          onChange={(e) => update("yearBuilt", Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label>Distance to transit (km)</label>
        <input
          type="number"
          step="0.1"
          value={form.distanceToTransitKm}
          onChange={(e) => update("distanceToTransitKm", Number(e.target.value))}
        />
      </div>

      <div className="field">
        <label>Distance to school (km)</label>
        <input
          type="number"
          step="0.1"
          value={form.distanceToSchoolKm}
          onChange={(e) => update("distanceToSchoolKm", Number(e.target.value))}
        />
      </div>

      <div className="field full">
        <label>Amenities</label>
        <div className="amenity-row">
          {AMENITY_OPTIONS.map((a) => (
            <span
              key={a}
              className={`amenity-toggle ${form.amenities.includes(a) ? "selected" : ""}`}
              onClick={() => toggleAmenity(a)}
            >
              {a.replace("_", " ")}
            </span>
          ))}
        </div>
      </div>

      <div className="field full">
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Calculating…" : "Estimate fair rent"}
        </button>
      </div>
    </form>
  );
}
