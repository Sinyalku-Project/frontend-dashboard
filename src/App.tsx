import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer, useMap, useMapEvents } from "react-leaflet";
import * as L from "leaflet";
import type { GeoJsonObject } from "geojson";
import "leaflet/dist/leaflet.css";
import "leaflet.heat/dist/leaflet-heat.js";
import axios from "axios";

interface SignalReading {
  id: number;
  latitude: number;
  longitude: number;
  signal_strength: number;
  operator: string;
  country?: string;
}

// const API_BASE_URL = import.meta.env.VITE_API_BASE_URL as string;
const API_BASE_URL = "https://backend-api-x0h2.onrender.com";

// Dynamic country bbox store
const HARDCODED_COUNTRY_BBOX: Record<string, [number, number, number, number]> = {};

// Map signal strength to exact spectrum color
function getSpectrumColor(signal: number) {
  // Daftar warna RGB untuk setiap level
  const colors = [
    [255, 0, 0],     // merah (low signal)
    [255, 165, 0],   // oranye
    [255, 255, 0],   // kuning
    [0, 128, 0],     // hijau
    [0, 0, 255]      // biru (strong signal)
  ];

  const minSignal = -110;
  const maxSignal = -84;

  // Normalisasi ke 0..1
  let ratio = (signal - minSignal) / (maxSignal - minSignal);
  ratio = Math.max(0, Math.min(1, ratio));

  // Bagi jadi 4 segmen
  const segments = colors.length - 1;
  const seg = Math.floor(ratio * segments);
  const segRatio = (ratio - seg / segments) * segments;

  // Ambil warna awal & akhir segmen
  const startColor = colors[seg];
  const endColor = colors[Math.min(seg + 1, colors.length - 1)];

  // Interpolasi linear antara warna awal & akhir
  const r = Math.round(startColor[0] + segRatio * (endColor[0] - startColor[0]));
  const g = Math.round(startColor[1] + segRatio * (endColor[1] - startColor[1]));
  const b = Math.round(startColor[2] + segRatio * (endColor[2] - startColor[2]));

  return `rgb(${r}, ${g}, ${b})`;
}

const SpectrumBar: React.FC<{ avg: number | null }> = ({ avg }) => {
  return (
    <div style={{ marginTop: 6 }}>
      <div style={{
        background: "linear-gradient(to right, red, orange, yellow, green, blue)",
        height: 14,
        borderRadius: 7,
        position: "relative"
      }}>
        {avg !== null && (
          <div style={{
            position: "absolute",
            top: -3,
            left: `${((avg + 110) / 26) * 100}%`,
            transform: "translateX(-50%)",
            width: 2,
            height: 20,
            background: "#000"
          }} />
        )}
      </div>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        fontSize: 12,
        marginTop: 2
      }}>
        <span>-110 dBm (Weak)</span>
        <span>-84 dBm (Strong)</span>
      </div>
    </div>
  );
};

const Dashboard: React.FC<{
  data: SignalReading[];
  center: { lat: number; lng: number } | null;
  operators: string[];
  selectedOperator: string;
  onOperatorChange: (op: string) => void;
  countries: string[];
  selectedCountry: string;
  onCountryChange: (c: string) => void;
  isLoading: boolean;
  bestSignal: SignalReading | null;
  onBestClick: () => void;
  viewMode: string;
  onToggleView: () => void;
}> = ({
  data, center, operators, selectedOperator, onOperatorChange,
  countries, selectedCountry, onCountryChange, isLoading,
  bestSignal, onBestClick, viewMode, onToggleView
}) => {
  const avg = data.length ? data.reduce((a, b) => a + b.signal_strength, 0) / data.length : null;
  return (
    <div style={{
      position: "absolute", top: 12, right: 12, width: 320,
      background: "#fff", padding: 14, borderRadius: 10, zIndex: 1000,
      boxShadow: "0 4px 12px rgba(0,0,0,0.15)", fontFamily: "sans-serif"
    }}>
      <h3
        style={{
          margin: 0,
          textAlign: "center",
          borderBottom: "1px solid #eee",
          paddingBottom: 8,
          fontFamily: '"Segoe UI", Tahoma, sans-serif',
          fontWeight: 700,
          fontSize: "18px",
          letterSpacing: "0.5px"
        }}
      >
        Signal Panel
      </h3>

      <p style={{ marginTop: 8 }}><strong>Total Points:</strong> {isLoading ? "Loading..." : data.length}</p>

      <div style={{ marginBottom: 8 }}>
        <label><strong>Country</strong></label>
        <select
          value={selectedCountry}
          onChange={e => onCountryChange(e.target.value)}
          style={{ width: "100%", marginTop: 6, border: "1px solid #ccc" }} // ✅ Add thin border here
        >
          <option value="All Countries">All Countries</option>
          {countries.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 8 }}>
        <label><strong>Operator</strong></label>
        <select
          value={selectedOperator}
          onChange={e => onOperatorChange(e.target.value)}
          style={{ width: "100%", marginTop: 6, border: "1px solid #ccc" }} // ✅ Add thin border here
        >
          <option value="">All Operators</option>
          {operators.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      {center && <p style={{ margin: "6px 0" }}><strong>Center:</strong> {center.lat.toFixed(4)}, {center.lng.toFixed(4)}</p>}

      <div style={{ marginTop: 10 }}>
        <strong>Spectrum</strong>
        <SpectrumBar avg={avg} />
      </div>

      <div onClick={onBestClick} style={{
        marginTop: 10, padding: 8, border: "1px solid #eee", borderRadius: 6,
        cursor: bestSignal ? "pointer" : "default", background: bestSignal ? "#f9f9f9" : "#fafafa"
      }}>
        <div style={{ fontWeight: 600 }}>Best Signal (view)</div>
        {bestSignal ? (
          <>
            <div>Strength: {bestSignal.signal_strength} dBm</div>
            <div>Operator: {bestSignal.operator}</div>
            <div>Lat: {bestSignal.latitude.toFixed(5)}, Lng: {bestSignal.longitude.toFixed(5)}</div>
          </>
        ) : <div style={{ color: "#666" }}>No signal</div>}
      </div>

      {/* Toggle Switch */}
      <div style={{ marginTop: 14, display: "flex", justifyContent: "center" }}>
        <label style={{ display: "flex", alignItems: "center", cursor: "pointer" }}>
          <span style={{ marginRight: 8 }}>Coverage</span>
          <div
            onClick={onToggleView}
            style={{
              width: 50,
              height: 24,
              background: viewMode === "exact" ? "#4caf50" : "#ccc",
              borderRadius: 12,
              position: "relative",
              transition: "background 0.3s"
            }}
          >
            <div
              style={{
                width: 20,
                height: 20,
                background: "#fff",
                borderRadius: "50%",
                position: "absolute",
                top: 2,
                left: viewMode === "exact" ? 28 : 2,
                transition: "left 0.3s"
              }}
            />
          </div>
          <span style={{ marginLeft: 8 }}>Exact</span>
        </label>
      </div>
    </div>
  );
};

function MapEventHandler({ onBoundsChange, onCenterChange }: { onBoundsChange: (b: L.LatLngBounds) => void; onCenterChange: (c: { lat: number; lng: number }) => void; }) {
  const map = useMap();
  useMapEvents({
    moveend: () => {
      onBoundsChange(map.getBounds());
      const c = map.getCenter();
      onCenterChange({ lat: c.lat, lng: c.lng });
    }
  });
  return null;
}

function InitMap({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap();
  useEffect(() => { onReady(map); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, []);
  return null;
}

export default function App(): JSX.Element {
  const [heatData, setHeatData] = useState<SignalReading[]>([]);
  const [bounds, setBounds] = useState<L.LatLngBounds | null>(null);
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [operators, setOperators] = useState<string[]>([]);
  const [countries, setCountries] = useState<string[]>([]);
  const [selectedOperator, setSelectedOperator] = useState<string>("");
  const [selectedCountry, setSelectedCountry] = useState<string>("All Countries");
  const [countryGeoJSON, setCountryGeoJSON] = useState<GeoJsonObject | null>(null);
  const [countryLayer, setCountryLayer] = useState<L.GeoJSON | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [bestSignal, setBestSignal] = useState<SignalReading | null>(null);
  const [viewMode, setViewMode] = useState<"coverage" | "exact">("coverage");

  const mapRef = useRef<L.Map | null>(null);
  const heatLayerRef = useRef<L.Layer | null>(null);

  const mapCenter: L.LatLngExpression = [-6.2, 106.8];
  const zoom = 12;

  useEffect(() => {
    axios.get<string[]>(`${API_BASE_URL}/api/operators/`)
      .then(r => setOperators(r.data))
      .catch(() => {});

    axios.get<string[]>(`${API_BASE_URL}/api/countries/`)
      .then(async r => {
        setCountries(r.data);
        for (const country of r.data) {
          try {
            const res = await axios.get(`${API_BASE_URL}/api/geocode-country/`, { params: { country } });
            const arr = Array.isArray(res.data) ? res.data : [];
            const chosen = arr.find((d: any) => d.type === "country") ?? arr[0];
            if (chosen?.bbox && Array.isArray(chosen.bbox) && chosen.bbox.length === 4) {
              const [minLon, minLat, maxLon, maxLat] = chosen.bbox;
              HARDCODED_COUNTRY_BBOX[country] = [minLat, maxLat, minLon, maxLon];
            }
          } catch {}
        }
      })
      .catch(() => {});
  }, []);

  const buildParams = useCallback((b?: L.LatLngBounds | null) => {
    const p: Record<string, unknown> = {};
    if (b) {
      const sw = b.getSouthWest(), ne = b.getNorthEast();
      p.min_lat = sw.lat; p.max_lat = ne.lat; p.min_lon = sw.lng; p.max_lon = ne.lng;
    }
    if (selectedOperator) p.operator = selectedOperator;
    if (selectedCountry !== "All Countries") p.country = selectedCountry;
    return p;
  }, [selectedOperator, selectedCountry]);

  useEffect(() => {
    if (!bounds) return;
    setIsLoading(true);
    const params = buildParams(bounds);
    axios.get<SignalReading[]>(`${API_BASE_URL}/api/readings/`, { params })
      .then(r => { setHeatData(r.data); setIsLoading(false); })
      .catch(() => { setHeatData([]); setIsLoading(false); });
    axios.get<SignalReading | null>(`${API_BASE_URL}/api/readings/best`, { params })
      .then(r => setBestSignal(r.data ?? null))
      .catch(() => setBestSignal(null));
  }, [bounds, buildParams]);

  useEffect(() => {
    axios.get<SignalReading | null>(`${API_BASE_URL}/api/readings/best`)
      .then(r => setBestSignal(curr => curr ?? r.data ?? null))
      .catch(() => {});
  }, []);

  const filteredData = useMemo(() => {
    const latestMap = new Map<string, SignalReading>();

    heatData.forEach(p => {
      const key = `${p.latitude.toFixed(3)},${p.longitude.toFixed(3)}`; // bundarkan agar tidak beda-beda tipis
      const existing = latestMap.get(key);
      if (!existing || p.id > existing.id) {
        latestMap.set(key, p);
      }
    });

    // Filter berdasarkan operator dan negara
    return Array.from(latestMap.values()).filter(p =>
      (selectedCountry === "All Countries" || p.country === selectedCountry) &&
      (!selectedOperator || p.operator === selectedOperator)
    );
  }, [heatData, selectedCountry, selectedOperator]);


  // Rendering Layer depending on mode
  useEffect(() => {
    const m = mapRef.current;
    if (!m) return;
    if (heatLayerRef.current) {
      try { if (m.hasLayer(heatLayerRef.current)) m.removeLayer(heatLayerRef.current); } catch {}
      heatLayerRef.current = null;
    }

    if (!filteredData.length) return;

    if (viewMode === "coverage") {
      const heatLayerFactory = (L as unknown as { heatLayer?: any }).heatLayer;
      if (typeof heatLayerFactory === "function") {
        const minSignal = -110;
        const maxSignal = -84;
        const heatLayerData = filteredData.map(pt => {
          // Normalize signal_strength to [0..1] where -110 = 0, -84 = 1
          const intensity = (pt.signal_strength - minSignal) / (maxSignal - minSignal); 
          console.log(`Heat Layer Data: ${pt.latitude}, ${pt.longitude}, ${pt.signal_strength} , ${intensity}`);
          return [pt.latitude, pt.longitude, intensity] as [number, number, number];
        });
        const hl = heatLayerFactory(heatLayerData, {
          radius: 25,
          blur: 10,
          minOpacity: 0.8,
          max: 1,
          gradient: { 0.0: "red", 0.35: "orange", 0.5: "yellow", 0.65: "green", 1.0: "blue" }
        });
        hl.addTo(mapRef.current!);
        heatLayerRef.current = hl;
      }
    } else {
      const group = L.layerGroup();
      filteredData.forEach(pt => {
        const color = getSpectrumColor(pt.signal_strength);
        const circle = L.circleMarker([pt.latitude, pt.longitude], {
          radius: 20,
          color: color,
          fillColor: color,
          fillOpacity: 0.4,
          weight: 0
        });
        group.addLayer(circle);
        const glow = L.circleMarker([pt.latitude, pt.longitude], {
          radius: 25,
          color: color,
          fillColor: color,
          fillOpacity: 0.25,
          weight: 0
        });
        group.addLayer(glow);
      });
      group.addTo(m);
      heatLayerRef.current = group;
    }

    return () => {
      if (heatLayerRef.current && m.hasLayer(heatLayerRef.current)) {
        try { m.removeLayer(heatLayerRef.current); } catch {}
        heatLayerRef.current = null;
      }
    };
  }, [filteredData, viewMode]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (countryLayer) { try { mapRef.current.removeLayer(countryLayer); } catch {} setCountryLayer(null); }
    if (!countryGeoJSON) return;
    const layer = L.geoJSON(countryGeoJSON, { style: { color: "#3388ff", weight: 2, dashArray: "6,6", fillOpacity: 0.05 } });
    layer.addTo(mapRef.current); setCountryLayer(layer);
    const b = layer.getBounds(); if (b.isValid()) mapRef.current.fitBounds(b, { padding: [40, 40], maxZoom: 8 });
  }, [countryGeoJSON]);

  useEffect(() => {
    const fetchCountryGeo = async () => {
      const m = mapRef.current;
      if (!m) return;
      if (countryLayer) { try { m.removeLayer(countryLayer); } catch {} setCountryLayer(null); }
      setCountryGeoJSON(null);
      if (selectedCountry === "All Countries") return;

      try {
        const res = await axios.get(`${API_BASE_URL}/api/geocode-country/`, { params: { country: selectedCountry } });
        const arr = Array.isArray(res.data) ? res.data : [];
        const chosen = arr.find((d: any) => d.type === "country") ?? arr[0];
        if (chosen && chosen.geojson) { setCountryGeoJSON(chosen.geojson); return; }
        const box = HARDCODED_COUNTRY_BBOX[selectedCountry];
        if (box) {
          const [minLat, maxLat, minLon, maxLon] = box;
          const b = L.latLngBounds(L.latLng(minLat, minLon), L.latLng(maxLat, maxLon));
          m.fitBounds(b, { padding: [40, 40], maxZoom: 8 });
        }
      } catch {
        const box = HARDCODED_COUNTRY_BBOX[selectedCountry];
        if (box && m) {
          const [minLat, maxLat, minLon, maxLon] = box;
          const b = L.latLngBounds(L.latLng(minLat, minLon), L.latLng(maxLat, maxLon));
          m.fitBounds(b, { padding: [40, 40], maxZoom: 8 });
        }
      }
    };

    fetchCountryGeo();
  }, [selectedCountry]);

  const handleBestClick = () => {
    if (!bestSignal || !mapRef.current) return;
    mapRef.current.flyTo([bestSignal.latitude, bestSignal.longitude], 16, { duration: 1.2 });
  };

  return (
    <div style={{ position: "relative" }}>
      <MapContainer center={mapCenter} zoom={zoom} style={{ height: "100vh", width: "100%" }}>
        <InitMap onReady={(m) => { mapRef.current = m; setBounds(m.getBounds()); const c = m.getCenter(); setCenter({ lat: c.lat, lng: c.lng }); }} />
        <MapEventHandler onBoundsChange={setBounds} onCenterChange={setCenter} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap contributors' />
      </MapContainer>

      <Dashboard
        data={filteredData}
        center={center}
        operators={operators}
        selectedOperator={selectedOperator}
        onOperatorChange={setSelectedOperator}
        countries={countries}
        selectedCountry={selectedCountry}
        onCountryChange={setSelectedCountry}
        isLoading={isLoading}
        bestSignal={bestSignal}
        onBestClick={handleBestClick}
        viewMode={viewMode}
        onToggleView={() => setViewMode(viewMode === "coverage" ? "exact" : "coverage")}
      />
    </div>
  );
}
