const LABELS = {
  bedrooms: "Bedrooms",
  bathrooms: "Bathrooms",
  sqft: "Floor area",
  propertyAge: "Property age",
  amenityScore: "Amenities",
  distanceToTransitKm: "Transit distance",
  distanceToSchoolKm: "School distance",
  conditionScore: "Condition",
  base_intercept: "Market baseline",
};

function formatINR(n) {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

export default function PredictionResult({ result }) {
  if (!result) {
    return <div className="empty-state">Fill in the property details to see a fair-rent estimate.</div>;
  }

  const { predictedPrice, confidenceLow, confidenceHigh, featureContributions } = result;
  const maxAbs = Math.max(...Object.values(featureContributions).map((v) => Math.abs(v)), 1);

  return (
    <div>
      <div className="price-hero">{formatINR(predictedPrice)}</div>
      <div className="price-range">
        90% confidence range: {formatINR(confidenceLow)} – {formatINR(confidenceHigh)}
      </div>

      <hr className="divider" />
      <div className="panel-title">Why this price</div>

      {Object.entries(featureContributions).map(([key, value]) => {
        const pct = (Math.abs(value) / maxAbs) * 100;
        const positive = value >= 0;
        return (
          <div className="contribution-row" key={key}>
            <span style={{ width: 140 }}>{LABELS[key] || key}</span>
            <div className="contribution-bar-track">
              <div
                className="contribution-bar-fill"
                style={{
                  width: `${pct}%`,
                  background: positive ? "var(--good)" : "var(--bad)",
                  marginLeft: positive ? "0" : "auto",
                }}
              />
            </div>
            <span style={{ color: positive ? "var(--good)" : "var(--bad)", minWidth: 70, textAlign: "right" }}>
              {positive ? "+" : ""}
              {formatINR(value)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
