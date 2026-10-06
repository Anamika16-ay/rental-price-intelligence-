import { useState, useEffect } from "react";
import { getListings } from "../api/api";

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function ListingsBrowser() {
  const [city, setCity] = useState("Lucknow");
  const [bedrooms, setBedrooms] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortBy, setSortBy] = useState("listedDate");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const limit = 10;

  const [listings, setListings] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const params = { city, limit, page, sortBy, sortOrder };
      if (bedrooms) params.bedrooms = bedrooms;
      if (minPrice) params.minPrice = minPrice;
      if (maxPrice) params.maxPrice = maxPrice;

      const result = await getListings(params);
      setListings(result.listings);
      setTotal(result.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [city, bedrooms, minPrice, maxPrice, sortBy, sortOrder, page]);

  const handleFilterChange = (setter) => (e) => {
    setPage(1);
    setter(e.target.value);
  };

  const totalPages = Math.max(1, Math.ceil(total / limit));

  return (
    <div>
      <h1 className="page-title">Browse Listings</h1>
      <p className="page-subtitle">
        Search and filter active rental listings across every city in the dataset.
      </p>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-title">Filters</div>
        <div className="form-grid">
          <div className="field">
            <label>City</label>
            <select value={city} onChange={handleFilterChange(setCity)}>
              <option>Lucknow</option>
              <option>Delhi</option>
              <option>Bengaluru</option>
              <option>Pune</option>
            </select>
          </div>

          <div className="field">
            <label>Bedrooms</label>
            <select value={bedrooms} onChange={handleFilterChange(setBedrooms)}>
              <option value="">Any</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
            </select>
          </div>

          <div className="field">
            <label>Min price (₹)</label>
            <input type="number" value={minPrice} onChange={handleFilterChange(setMinPrice)} placeholder="No minimum" />
          </div>

          <div className="field">
            <label>Max price (₹)</label>
            <input type="number" value={maxPrice} onChange={handleFilterChange(setMaxPrice)} placeholder="No maximum" />
          </div>

          <div className="field">
            <label>Sort by</label>
            <select value={sortBy} onChange={handleFilterChange(setSortBy)}>
              <option value="listedDate">Date listed</option>
              <option value="listedPrice">Price</option>
              <option value="sqft">Area (sqft)</option>
              <option value="bedrooms">Bedrooms</option>
            </select>
          </div>

          <div className="field">
            <label>Order</label>
            <select value={sortOrder} onChange={handleFilterChange(setSortOrder)}>
              <option value="desc">High to low / Newest first</option>
              <option value="asc">Low to high / Oldest first</option>
            </select>
          </div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-title">
          {loading ? "Loading…" : `${total} listing${total === 1 ? "" : "s"} found`}
        </div>

        {!loading && listings.length === 0 && (
          <div className="empty-state">No listings match these filters.</div>
        )}

        {listings.map((l) => (
          <div className="comp-row" key={l._id}>
            <div>
              <div className="comp-address">{l.address}</div>
              <div className="comp-meta">
                {l.bedrooms} bd · {l.bathrooms} ba · {l.sqft} sqft · built {l.yearBuilt}
              </div>
            </div>
            <div style={{ fontWeight: 600 }}>{formatINR(l.listedPrice)}</div>
            <div className="similarity-pill">{new Date(l.listedDate).toLocaleDateString("en-IN")}</div>
          </div>
        ))}

        {totalPages > 1 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginTop: 20 }}>
            <button
              className="btn-primary"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              ← Previous
            </button>
            <span style={{ alignSelf: "center", color: "var(--text-muted)", fontSize: 13.5 }}>
              Page {page} of {totalPages}
            </span>
            <button
              className="btn-primary"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}