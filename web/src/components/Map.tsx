import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { type LatLngTuple } from 'leaflet';

import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

export default function Map({ pos }: { pos: LatLngTuple }) {
  return (
    <MapContainer center={pos} zoom={17} style={{ height: '100%', width: '100%' }}>
      <TileLayer 
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
      />
      <Marker position={pos}>
        <Popup>Charoen Phon Intersection</Popup>
      </Marker>
    </MapContainer>
  );
}