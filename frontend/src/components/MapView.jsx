import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";

// Fix default marker icon paths under bundlers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

export default function MapView({ center, comparables = [] }) {
  return (
    <div className="map-container">
      <MapContainer center={[center.lat, center.lng]} zoom={13} style={{ height: "100%", width: "100%" }}>
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />
        <Marker position={[center.lat, center.lng]}>
          <Popup>Your property</Popup>
        </Marker>
        {comparables.map((c) => (
          <Marker key={c.id} position={[c.coordinates[1], c.coordinates[0]]}>
            <Popup>
              {c.address}
              <br />₹{c.listedPrice.toLocaleString("en-IN")}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
