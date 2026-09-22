import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function TrendChart({ data, loading }) {
  if (loading) return <div className="loading-state">Loading market trends…</div>;
  if (!data || data.length === 0) {
    return <div className="empty-state">No historical trend data available for this city yet.</div>;
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
        <CartesianGrid stroke="#2A343A" strokeDasharray="3 3" vertical={false} />
        <XAxis dataKey="period" stroke="#8B959A" fontSize={12} />
        <YAxis stroke="#8B959A" fontSize={12} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
        <Tooltip
          contentStyle={{ background: "#1A2226", border: "1px solid #2A343A", fontSize: 13 }}
          formatter={(value) => [`₹${value.toLocaleString("en-IN")}`, "Median rent"]}
        />
        <Line type="monotone" dataKey="medianPrice" stroke="#C9A227" strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}
