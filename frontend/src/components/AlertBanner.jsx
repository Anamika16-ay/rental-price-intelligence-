export default function AlertBanner({ alerts, loading }) {
  if (loading) return <div className="loading-state">Scanning market for pricing outliers…</div>;
  if (!alerts || alerts.length === 0) {
    return <div className="empty-state">No pricing outliers detected in this city right now.</div>;
  }

  return (
    <div>
      {alerts.slice(0, 6).map((a) => (
        <div className={`alert-banner ${a.status}`} key={a.listingId}>
          <div>
            <strong>{a.address}</strong>
            <div style={{ fontSize: 12.5, opacity: 0.85 }}>
              Listed ₹{a.listedPrice.toLocaleString("en-IN")} vs predicted ₹
              {a.predictedPrice.toLocaleString("en-IN")}
            </div>
          </div>
          <span className={`status-tag ${a.status}`}>
            {a.status === "overpriced" ? "+" : ""}
            {a.deviationPercent}%
          </span>
        </div>
      ))}
    </div>
  );
}
