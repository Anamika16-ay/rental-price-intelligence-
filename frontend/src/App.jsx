import { useState, useEffect } from "react";
import SearchForm from "./components/SearchForm";
import PredictionResult from "./components/PredictionResult";
import ComparablesList from "./components/ComparablesList";
import TrendChart from "./components/TrendChart";
import MapView from "./components/MapView";
import AlertBanner from "./components/AlertBanner";
import { predictPrice, getComparablesAdHoc, getTrends, getAlerts } from "./api/api";

export default function App() {
  const [prediction, setPrediction] = useState(null);
  const [comparables, setComparables] = useState([]);
  const [trends, setTrends] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [center, setCenter] = useState({ lat: 26.8467, lng: 80.9462 });
  const [city, setCity] = useState("Lucknow");

  const [loadingPrediction, setLoadingPrediction] = useState(false);
  const [loadingComps, setLoadingComps] = useState(false);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [error, setError] = useState(null);

  const loadCityData = async (cityName) => {
    setLoadingTrends(true);
    setLoadingAlerts(true);
    try {
      const [trendData, alertData] = await Promise.all([
        getTrends(cityName),
        getAlerts(cityName),
      ]);
      setTrends(trendData.trends);
      setAlerts(alertData.alerts);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingTrends(false);
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    loadCityData(city);
  }, [city]);

  const handleSearch = async (form) => {
    setError(null);
    setCity(form.city);
    setCenter({ lat: form.lat, lng: form.lng });
    setLoadingPrediction(true);
    setLoadingComps(true);

    try {
      const predictionResult = await predictPrice(form);
      setPrediction(predictionResult);
    } catch (err) {
      setError(err?.response?.data?.error || "Prediction failed. Is the backend running & model trained?");
    } finally {
      setLoadingPrediction(false);
    }

    try {
      const compsResult = await getComparablesAdHoc(form);
      setComparables(compsResult.comparables);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingComps(false);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">Rental Price Intelligence</div>
        <div className="brand-sub">Smart valuation & market signals</div>
        <nav>
          <span className="nav-item active">Valuation</span>
          <span className="nav-item">Comparables</span>
          <span className="nav-item">Trends</span>
          <span className="nav-item">Alerts</span>
        </nav>
      </aside>

      <main className="main">
        <h1 className="page-title">What should this property rent for?</h1>
        <p className="page-subtitle">
          Enter the property details below to get a data-backed fair-rent estimate, comparable
          listings nearby, and market context for the surrounding area.
        </p>

        {error && (
          <div className="alert-banner overpriced" style={{ marginBottom: 20 }}>
            {error}
          </div>
        )}

        <div className="grid-2">
          <div className="panel">
            <div className="panel-title">Property details</div>
            <SearchForm onSubmit={handleSearch} loading={loadingPrediction} />
          </div>

          <div className="panel">
            <div className="panel-title">Estimated fair rent</div>
            <PredictionResult result={prediction} />
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 28 }}>
          <div className="panel">
            <div className="panel-title">Nearby comparables</div>
            <ComparablesList comparables={comparables} loading={loadingComps} />
          </div>

          <div className="panel">
            <div className="panel-title">Property location & comps</div>
            <MapView center={center} comparables={comparables} />
          </div>
        </div>

        <div className="grid-2" style={{ marginTop: 28 }}>
          <div className="panel">
            <div className="panel-title">{city} — median rent trend (last 12 months)</div>
            <TrendChart data={trends} loading={loadingTrends} />
          </div>

          <div className="panel">
            <div className="panel-title">{city} — pricing outliers</div>
            <AlertBanner alerts={alerts} loading={loadingAlerts} />
          </div>
        </div>
      </main>
    </div>
  );
}
