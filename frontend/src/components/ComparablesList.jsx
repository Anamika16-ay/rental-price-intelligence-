function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function ComparablesList({ comparables, loading }) {
  if (loading) return <div className="loading-state">Searching nearby comparables…</div>;
  if (!comparables || comparables.length === 0) {
    return <div className="empty-state">No comparable listings found nearby yet.</div>;
  }

  return (
    <div>
      {comparables.map((c) => (
        <div className="comp-row" key={c.id}>
          <div>
            <div className="comp-address">{c.address}</div>
            <div className="comp-meta">
              {c.bedrooms} bd · {c.bathrooms} ba · {c.sqft} sqft
            </div>
          </div>
          <div style={{ fontWeight: 600 }}>{formatINR(c.listedPrice)}</div>
          <div className="similarity-pill">{c.similarityScore}% match</div>
        </div>
      ))}
    </div>
  );
}
