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

// Location: Charoen Phon Intersection
const INTERSECTION_POS: LatLngTuple = [13.747549261976209, 100.5237845392636];

const getSeverityColor = (density: number): string => {
  if (density > 80) return '#ef4444';
  if (density > 50) return '#f59e0b';
  return '#22c55e';
};

const TrafficDashboard = () => {
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

  const statusColor = getSeverityColor(data.density);

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 p-4 gap-4">
      
      {/* LEFT: Map Section */}
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

      {/* RIGHT: Data Overlay / Sidebar */}
      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <MapPin size={18} />
            <span className="font-bold text-sm uppercase tracking-wider">Live Status</span>
          </div>
          
          <h2 className="text-xl font-bold mb-6">แยกเจริญผล</h2>

          <div className="space-y-6">
            {/* Speed Display */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gauge className="text-blue-500" />
                <span className="text-slate-600 font-medium">Speed</span>
              </div>
              <span className="text-2xl font-black">
                {data.speed} <small className="text-sm font-normal text-slate-500">km/h</small>
              </span>
            </div>

            {/* Queue Metrics */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-500" />
                <span className="text-slate-600 font-medium">Wait Time</span>
              </div>
              <span className="font-semibold">{data.queueTime}</span>
            </div>

            {/* <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Users className="text-slate-500" />
                <span className="text-slate-600 font-medium">Length</span>
              </div>
              <span className="font-semibold">{data.queueLength}</span>
            </div> */}

            {/* Density & Severity Color */}
            {/* <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-slate-500">Traffic Density</span>
                <span className="text-sm font-bold" style={{ color: statusColor }}>
                  {data.density > 80 ? 'CRITICAL' : data.density > 50 ? 'HEAVY' : 'NORMAL'}
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-1000" 
                  style={{ width: `${data.density}%`, backgroundColor: statusColor }}
                ></div>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrafficDashboard;