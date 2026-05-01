import { MapContainer, TileLayer, Marker, Popup,  } from 'react-leaflet';
import { map, type LatLngTuple } from 'leaflet';
import { useQuery } from '@tanstack/react-query';
import { Gauge, Users, Clock, MapPin } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface TrafficData {
  speed: number;
  queueTime: string;
  queueLength: string;
  density: number;
}

const INTERSECTION_POS: LatLngTuple = [13.747549261976209, 100.5237845392636];

import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/TrafficMap')({
  component: TrafficDashboard,
})

function TrafficDashboard() {
  const { data, isLoading, isError } = useQuery<TrafficData>({
    queryKey: ['trafficData'],
    queryFn: async (): Promise<TrafficData> => {
      
      return {
        speed: 24,
        queueTime: '12 mins',
        queueLength: '450m',
        density: 75,
      };
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 font-medium">Loading Traffic Data...</div>;
  }

  if (isError || !data) {
    return <div className="p-8 text-center text-red-500 font-medium">Failed to load traffic data.</div>;
  }


  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 p-4 gap-4">
      
      <div className="flex-1 rounded-xl overflow-hidden shadow-lg border-2 border-white">
        <MapContainer 
          center={INTERSECTION_POS} 
          zoom={17} 
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer 
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" 
          />
          
          <Marker position={INTERSECTION_POS}>
            <Popup>
              <strong>Charoen Phon Intersection</strong> <br />
              Lotus's Rama 1 Area
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <MapPin size={18} />
            <span className="font-bold text-sm uppercase tracking-wider">Live Status</span>
          </div>
          
          <h2 className="text-xl font-bold mb-6">แยกเจริญผล</h2>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gauge className="text-blue-500" />
                <span className="text-slate-600 font-medium">Speed</span>
              </div>
              <span className="text-2xl font-black">
                {data.speed} <small className="text-sm font-normal text-slate-500">km/h</small>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-500" />
                <span className="text-slate-600 font-medium">Wait Time</span>
              </div>
              <span className="font-semibold">{data.queueTime}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficDashboard;