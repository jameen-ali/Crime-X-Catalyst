import { useEffect, useRef, useState } from 'react';

const SEVERITY_COLORS: Record<string, string> = {
  Critical: '#EF4444',
  High:     '#F59E0B',
  Medium:   '#3B82F6',
  Low:      '#10B981',
};

interface LeafletMapProps {
  mode: 'heatmap' | 'patrol';
  filteredFIRs: any[];
  vehicles: any[];
  isKn: boolean;
  language: string;
  theme: 'dark' | 'light';
  simulatedAlert: { lat: number; lng: number } | null;
  onMapClick: (lat: number, lng: number) => void;
  proximityAlerts: any[];
}

export default function LeafletMap({
  mode,
  filteredFIRs,
  vehicles,
  theme,
  simulatedAlert,
  onMapClick,
  proximityAlerts,
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const tileLayerRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  // key fix: state flag so the marker effect re-runs after async Leaflet init
  const [mapReady, setMapReady] = useState(false);

  // ── 1. Initialize map once ─────────────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    let cancelled = false;

    import('leaflet').then(({ default: L }) => {
      if (cancelled || !mapRef.current || mapInstance.current) return;

      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({ iconRetinaUrl: '', iconUrl: '', shadowUrl: '' });

      // Heatmap starts at Karnataka-wide zoom; patrol stays zoomed into Bangalore
      const initCenter: [number, number] = mode === 'heatmap' ? [14.5, 75.7] : [12.9716, 77.5946];
      const initZoom = mode === 'heatmap' ? 7 : 12;
      const map = L.map(mapRef.current, { center: initCenter, zoom: initZoom });

      const tileUrl = theme === 'light'
        ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
        : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
      const tileLayer = L.tileLayer(tileUrl, { attribution: '© CARTO' });
      tileLayer.addTo(map);

      map.on('click', (e: any) => onMapClick(e.latlng.lat, e.latlng.lng));

      mapInstance.current = map;
      tileLayerRef.current = tileLayer;

      setTimeout(() => {
        if (!cancelled) {
          map.invalidateSize();
          setMapReady(true); // triggers marker effect
        }
      }, 200);
    });

    return () => {
      cancelled = true;
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        tileLayerRef.current = null;
        setMapReady(false);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── 2. Swap tiles on theme change ──────────────────────────────────────────
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const url = theme === 'light'
      ? 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    tileLayerRef.current.setUrl(url);
  }, [theme]);

  // ── 3. Re-plot markers whenever data OR mapReady changes ──────────────────
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || !mapReady) return;

    import('leaflet').then(({ default: L }) => {
      if (!mapInstance.current) return;

      // Clear previous markers
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];
      const newMarkers: any[] = [];

      if (mode === 'heatmap') {
        // ── HEATMAP MODE ────────────────────────────────────────────────────
        filteredFIRs.forEach(fir => {
          const lat = Number(fir.latitude);
          const lng = Number(fir.longitude);
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

          const color = SEVERITY_COLORS[fir.severity] ?? '#3B82F6';
          const isCritical = fir.severity === 'Critical';
          const isHigh = fir.severity === 'High';

          // Outer glow ring
          const outer = L.circleMarker([lat, lng], {
            radius: isCritical ? 26 : isHigh ? 18 : 12,
            fillColor: color,
            color: 'transparent',
            fillOpacity: 0.18,
          });

          // Core dot
          const inner = L.circleMarker([lat, lng], {
            radius: isCritical ? 6 : 4,
            fillColor: color,
            color: '#ffffff',
            weight: 1.5,
            fillOpacity: 1,
          });

          const popup = `
            <div style="background:#111827;border:1px solid #1F2D40;border-radius:12px;padding:12px;color:white;min-width:220px;font-family:sans-serif;">
              <div style="font-weight:bold;font-size:12px;color:${color};">${fir.firNumber || 'FIR Details'}</div>
              <div style="font-size:10px;color:#9CA3AF;margin:2px 0;">${fir.crimeType}</div>
              <div style="font-size:10px;color:#E5E7EB;margin-top:4px;">📍 ${fir.location} · ${fir.district}</div>
              <div style="font-size:10px;color:#9CA3AF;margin-top:2px;">Severity: <span style="font-weight:bold;color:${color};">${fir.severity}</span></div>
            </div>`;

          outer.bindPopup(popup).addTo(map);
          inner.bindPopup(popup).addTo(map);
          newMarkers.push(outer, inner);
        });

        // Auto-fit map to show all plotted markers
        if (newMarkers.length > 0 && mapInstance.current) {
          try {
            const group = L.featureGroup(newMarkers);
            const bounds = group.getBounds();
            if (bounds.isValid()) {
              mapInstance.current.fitBounds(bounds.pad(0.08), { maxZoom: 14, animate: false });
            }
          } catch {
            // bounds calculation failed, leave map as-is
          }
        }

      } else {
        // ── PATROL MODE ─────────────────────────────────────────────────────

        // 1. Simulated alert spike
        if (simulatedAlert) {
          const pulseIcon = L.divIcon({
            className: 'simulated-alert-pulse-marker',
            html: `<div class="pulse-ring"></div><div class="map-pulse-dot">🚨</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });
          const alertMarker = L.marker([simulatedAlert.lat, simulatedAlert.lng], { icon: pulseIcon });
          alertMarker.bindPopup(`
            <div style="background:#111827;border:1px solid #EF4444;border-radius:10px;padding:10px;color:white;font-family:sans-serif;">
              <div style="font-weight:bold;color:#EF4444;font-size:12px;">🚨 Simulated Crime Spike</div>
              <div style="font-size:10px;color:#9CA3AF;margin-top:2px;">Coords: ${simulatedAlert.lat.toFixed(4)}, ${simulatedAlert.lng.toFixed(4)}</div>
              <div style="font-size:10px;color:#F59E0B;margin-top:4px;font-weight:600;">Intercept commands broadcasted!</div>
            </div>`).addTo(map);
          newMarkers.push(alertMarker);
        }

        // 2. Critical/High FIR incident dots
        filteredFIRs.forEach(fir => {
          if (fir.severity !== 'Critical' && fir.severity !== 'High') return;
          const lat = Number(fir.latitude);
          const lng = Number(fir.longitude);
          if (!lat || !lng || isNaN(lat) || isNaN(lng)) return;

          const color = SEVERITY_COLORS[fir.severity] ?? '#EF4444';
          const m = L.circleMarker([lat, lng], {
            radius: 5, fillColor: color, color: '#fff', weight: 1, fillOpacity: 0.9,
          });
          m.bindPopup(`
            <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:10px;color:white;min-width:200px;font-family:sans-serif;">
              <div style="font-weight:bold;font-size:12px;color:${color}">${fir.firNumber || 'Incident'}</div>
              <div style="font-size:10px;color:#94a3b8;margin-top:2px;">${fir.crimeType} · ${fir.location}</div>
              <div style="font-size:10px;color:#f43f5e;margin-top:4px;font-weight:bold;">Severity: ${fir.severity}</div>
            </div>`).addTo(map);
          newMarkers.push(m);
        });

        // 3. Vehicle markers
        vehicles.forEach(v => {
          const vLat = Number(v.latitude);
          const vLng = Number(v.longitude);
          if (!vLat || !vLng || isNaN(vLat) || isNaN(vLng)) return;

          const isAlerted = proximityAlerts.some(a => a.vehicleId === v.id);
          const icon = L.divIcon({
            className: 'custom-patrol-vehicle-icon',
            html: isAlerted
              ? `<div class="patrol-marker-alerting">🚔</div>`
              : `<div class="patrol-marker-normal">🚔</div>`,
            iconSize: [30, 30],
            iconAnchor: [15, 15],
          });
          const vm = L.marker([vLat, vLng], { icon });
          vm.bindPopup(`
            <div style="background:#111827;border:1px solid #3b82f6;border-radius:12px;padding:12px;color:white;min-width:200px;font-family:sans-serif;">
              <div style="font-weight:bold;font-size:13px;color:#3b82f6;">🚔 ${v.registration_number}</div>
              <div style="font-size:10px;color:#9ca3af;margin:4px 0;">${v.make} ${v.model} (${v.color})</div>
              <div style="font-size:11px;margin-bottom:4px;">Status: <span style="font-weight:bold;color:${isAlerted ? '#EF4444' : v.status === 'Active' ? '#10B981' : '#F59E0B'}">${isAlerted ? 'INTERCEPTING' : v.status}</span></div>
              <div style="font-size:10px;color:#9ca3af;">Speed: <strong>${Math.round(v.speed)} km/h</strong> · ${Math.round(v.heading)}°</div>
            </div>`).addTo(map);
          newMarkers.push(vm);
        });
      }

      markersRef.current = newMarkers;
    });
  }, [mapReady, mode, filteredFIRs, vehicles, simulatedAlert, proximityAlerts]);

  return <div ref={mapRef} className="w-full h-full rounded-b-2xl" style={{ minHeight: 480 }} />;
}
