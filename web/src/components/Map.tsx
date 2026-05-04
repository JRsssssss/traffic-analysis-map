import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { type LatLngTuple } from "leaflet";

import L from "leaflet";
import icon from "leaflet/dist/images/marker-icon.png";
import iconShadow from "leaflet/dist/images/marker-shadow.png";

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

L.Marker.prototype.options.icon = DefaultIcon;

const intersectionRoutes: LatLngTuple[][] = [
  [
    [13.747467077542908, 100.52376413150034],
    [13.749173791799137, 100.52411554261857],
    [13.749776827861524, 100.52447281058829],
  ],
  [
    [13.747474386642736, 100.52376569394579],
    [13.746557500517312, 100.5235969475076],
  ],
  [
    [13.747469264384264, 100.52376569394579],
    [13.747223395825117, 100.52503656556149],
  ],
  [
    [13.747474386642736, 100.52376569394579],
    [13.747643421123655, 100.5226688420974],
  ],
];

export default function Map({
  pos,
  trafficColor,
  frame,
}: {
  pos: LatLngTuple;
  trafficColor?: [number, number, number];
  frame?: string;
}) {
  const polylineColor = `rgb(${trafficColor?.[0] || 0}, ${trafficColor?.[1] || 0}, ${trafficColor?.[2] || 0})`;

  return (
    <MapContainer
      center={pos}
      zoom={17}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={pos}>
        <Popup maxWidth={650} minWidth={640} className="video-popup">
          <div className="font-bold text-base mb-2 text-center">
            Charoen Phon Intersection
          </div>
          {frame ? (
            <img
              src={`data:image/jpeg;base64,${frame}`}
              alt="Live Camera Feed"
              style={{ 
                minWidth: "640px", 
                width: "100%", 
                height: "auto", 
                borderRadius: "8px", 
                display: "block" 
              }}
            />
          ) : (
            <div style={{ width: "640px", height: "360px", display: "flex", alignItems: "center", justifyContent: "center", color: "#666" }}>
              Loading feed...
            </div>
          )}
        </Popup>
      </Marker>

      <Polyline
        pathOptions={{ color: polylineColor, weight: 6 }}
        positions={intersectionRoutes}
      />
    </MapContainer>
  );
}
