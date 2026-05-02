import { useQuery } from "@tanstack/react-query";
import { Gauge, Users, Clock, MapPin } from "lucide-react";
import "leaflet/dist/leaflet.css";
import { lazy, Suspense, useState, useEffect } from "react";
const LazyMap = lazy(() => import("../components/Map"));

interface LOSData {
  grade: string;
  color: [number, number, number];
}

interface cumulativeData {
  motorcycle: number;
  car: number;
  tuktuk: number;
  truck: number;
  bus: number;
}

interface TrafficData {
  current_flow: number;
  sat_flow: number;
  capacity: number;
  vc_ratio: number;
  los_data: LOSData;
  cumulative_counts: cumulativeData;
}

const INTERSECTION_POS: [number, number] = [
  13.747549261976209, 100.5237845392636,
];

import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/TrafficMap")({
  component: TrafficDashboard,
});

function TrafficDashboard() {
  const [data, setData] = useState<TrafficData | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/traffic-data");

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      console.log(event.data);
      const trafficData = JSON.parse(event.data) as TrafficData;
      setData(trafficData);
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    return () => {
      ws.close();
    };
  }, []);

  if (!data && !isConnected) {
    return (
      <div className="p-8 text-center text-slate-500 font-medium">
        Loading Traffic Data...
      </div>
    );
  }

  if (!data && isConnected) {
    return (
      <div className="p-8 text-center text-red-500 font-medium">
        Failed to load traffic data.
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-full bg-slate-50 p-4 gap-4">
      <div className="flex-1 rounded-xl overflow-hidden shadow-lg border-2 border-white">
        <LazyMap pos={INTERSECTION_POS} />
      </div>

      <div className="w-full md:w-80 flex flex-col gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center gap-2 mb-4 text-slate-500">
            <MapPin size={18} />
            <span className="font-bold text-sm uppercase tracking-wider">
              Live Status
            </span>
          </div>

          <h2 className="text-xl font-bold mb-3">แยกเจริญผล</h2>

          <div className="space-y-6">
            <span>
              <h3 className="text-l font-semibold my-3">
                Analysis Results (PCU/hr)
              </h3>
            </span>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gauge className="text-blue-500" />
                <span className="text-slate-600 font-medium">V (Flow)</span>
              </div>
              <span className="text-2xl font-black">
                {Math.round(data?.current_flow || 0)}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-500" />
                <span className="text-slate-600 font-medium">S (Sat Flow)</span>
              </div>
              <span className="font-semibold">{data?.sat_flow}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-500" />
                <span className="text-slate-600 font-medium">LOS</span>
              </div>
              <span className="font-semibold">{data?.los_data.grade}</span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-500" />
                <span className="text-slate-600 font-medium">VC Ratio</span>
              </div>
              <span className="font-semibold">
                {data?.vc_ratio?.toFixed(2) || "0.00"}
              </span>
            </div>

            <hr />

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-500" />
                <span className="text-slate-600 font-medium">Motorcycle</span>
              </div>
              <span className="font-semibold">
                {data?.cumulative_counts.motorcycle}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-500" />
                <span className="text-slate-600 font-medium">Car</span>
              </div>
              <span className="font-semibold">
                {data?.cumulative_counts.car || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-500" />
                <span className="text-slate-600 font-medium">TukTuk</span>
              </div>
              <span className="font-semibold">
                {data?.cumulative_counts.tuktuk || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-500" />
                <span className="text-slate-600 font-medium">Truck</span>
              </div>
              <span className="font-semibold">
                {data?.cumulative_counts.truck || 0}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="text-purple-500" />
                <span className="text-slate-600 font-medium">Bus</span>
              </div>
              <span className="font-semibold">
                {data?.cumulative_counts.bus || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
