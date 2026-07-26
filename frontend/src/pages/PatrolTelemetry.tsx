import { useEffect, useState, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Shield, AlertTriangle, Play, Pause, Bell, Compass } from 'lucide-react';
import { GlassCard } from '../components/ui';
import { caseApi, patrolApi } from '../lib/supabaseApi';
import { useUIStore } from '../context/uiStore';
import LeafletMap from '../components/LeafletMap';

function getDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI/180;
  const phi2 = lat2 * Math.PI/180;
  const deltaPhi = (lat2-lat1) * Math.PI/180;
  const deltaLambda = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(deltaPhi/2) * Math.sin(deltaPhi/2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda/2) * Math.sin(deltaLambda/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c;
}

export default function PatrolTelemetry() {
  const { theme, language } = useUIStore();
  const isKn = language === 'kn';
  const queryClient = useQueryClient();

  // Simulation controls
  const [simActive, setSimActive] = useState(true);
  const [simulatedAlert, setSimulatedAlert] = useState<{ lat: number; lng: number } | null>(null);
  const [toast, setToast] = useState('');

  const { data: casesData } = useQuery({ queryKey: ['patrol-cases'], queryFn: () => caseApi.getAll({ pageSize: 500 }) });

  // Fetch real Supabase vehicles
  const { data: vehicles = [] } = useQuery({
    queryKey: ['patrol-vehicles'],
    queryFn: () => patrolApi.getVehicles(),
    refetchInterval: simActive ? 4000 : undefined
  });

  const filteredFIRs = useMemo(() => casesData?.items || [], [casesData]);

  // Telemetry loop: shift positions slightly & save back to database
  useEffect(() => {
    if (!simActive || vehicles.length === 0) return;

    const interval = setInterval(async () => {
      // Pick a random active vehicle to shift
      const activeVehicles = vehicles.filter(v => v.status === 'Active');
      if (activeVehicles.length === 0) return;

      const randomVehicle = activeVehicles[Math.floor(Math.random() * activeVehicles.length)];
      
      // Shift coordinate slightly (simulating telemetry pathing)
      const latShift = (Math.random() - 0.5) * 0.0012;
      const lngShift = (Math.random() - 0.5) * 0.0012;
      const nextLat = Number(randomVehicle.latitude) + latShift;
      const nextLng = Number(randomVehicle.longitude) + lngShift;
      const nextSpeed = Math.max(10, Math.min(80, Number(randomVehicle.speed) + (Math.random() - 0.5) * 10));
      const nextHeading = (Number(randomVehicle.heading) + (Math.random() - 0.5) * 45 + 360) % 360;

      try {
        await patrolApi.updateVehiclePosition(randomVehicle.id, nextLat, nextLng, nextSpeed, nextHeading);
        queryClient.invalidateQueries({ queryKey: ['patrol-vehicles'] });
      } catch (err) {
        console.error("Telemetry update fail:", err);
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [simActive, vehicles, queryClient]);

  // Compute proximity alerts dynamically
  const proximityAlerts = useMemo(() => {
    const alerts: any[] = [];
    const criticalFirs = filteredFIRs.filter(f => f.severity === 'Critical');

    vehicles.forEach(v => {
      if (!v.latitude || !v.longitude) return;

      // 1. Check proximity to simulated alert
      if (simulatedAlert) {
        const dist = getDistanceMeters(Number(v.latitude), Number(v.longitude), simulatedAlert.lat, simulatedAlert.lng);
        if (dist <= 600) {
          alerts.push({
            id: `sim-${v.id}`,
            vehicleId: v.id,
            reg: v.registration_number,
            distance: Math.round(dist),
            type: isKn ? 'ಸಂಚಾಲಿತ ಅಪರಾಧ ಸ್ಪೈಕ್ ಘಟನೆ' : 'Simulated Crime Spike Incident'
          });
        }
      }

      // 2. Check proximity to critical crimes
      criticalFirs.forEach(f => {
        const dist = getDistanceMeters(Number(v.latitude), Number(v.longitude), Number(f.latitude), Number(f.longitude));
        if (dist <= 500) {
          alerts.push({
            id: `${f.id}-${v.id}`,
            vehicleId: v.id,
            reg: v.registration_number,
            distance: Math.round(dist),
            type: isKn ? `ಗಂಭೀರ ಹಾಟ್‌ಸ್ಪಾಟ್ (FIR: ${f.firNumber})` : `Critical Hotspot (FIR: ${f.firNumber})`
          });
        }
      });
    });

    return alerts;
  }, [vehicles, filteredFIRs, simulatedAlert, isKn]);

  // Trigger browser notifications when proximity alerts change
  useEffect(() => {
    if (proximityAlerts.length > 0 && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        const first = proximityAlerts[0];
        new Notification(isKn ? "🚨 ಗಸ್ತು ಸಾಮೀಪ್ಯ ಎಚ್ಚರಿಕೆ" : "🚨 Patrol Proximity Warning", {
          body: isKn 
            ? `ವಾಹನ ${first.reg} ಯು ${first.distance}ಮೀ ವ್ಯಾಪ್ತಿಯಲ್ಲಿ ${first.type} ಹೊಂದಿಕೊಂಡಿದೆ!`
            : `Vehicle ${first.reg} is within ${first.distance}m of a ${first.type}!`,
          icon: "/favicon.ico"
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission();
      }
    }
  }, [proximityAlerts, isKn]);

  const handleMapClick = (lat: number, lng: number) => {
    setSimulatedAlert({ lat, lng });
    setToast(isKn ? `ಅಪರಾಧ ಸ್ಪೈಕ್ ಸಿಮ್ಯುಲೇಶನ್ ಇರಿಸಲಾಗಿದೆ` : `Crime Spike alert simulated at coordinate`);
    setTimeout(() => setToast(''), 3000);
  };

  const clearSimulatedAlert = () => {
    setSimulatedAlert(null);
  };

  return (
    <div className="space-y-4">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#111827] border border-blue-500/30 rounded-2xl text-xs text-blue-400 font-semibold shadow-2xl">
            <Bell size={14} className="animate-bounce" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Title & Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-blue-500" />
            {isKn ? "ಲೈವ್ ಗಸ್ತು ಟೆಲಿಮೆಟ್ರಿ ವ್ಯವಸ್ಥೆ" : "Live Patrol Telemetry System"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isKn 
              ? "ನೈಜ-ಸಮಯದ ಪೊಲೀಸ್ ವಾಹನ ಗಸ್ತು ಮತ್ತು ಸಾಮೀಪ್ಯ ಭದ್ರತಾ ಅಲರ್ಟ್‌ಗಳು" 
              : "Real-time police vehicle positioning, dispatch simulation, and proximity warnings"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <button onClick={() => setSimActive(!simActive)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-all ${simActive ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-gray-800 border-gray-700 text-gray-400'}`}>
            {simActive ? <Pause size={12} /> : <Play size={12} />}
            {simActive ? (isKn ? 'ಟೆಲಿಮೆಟ್ರಿ ಲೈವ್ ಆಗಿದೆ' : 'Telemetry Live') : (isKn ? 'ಟೆಲಿಮೆಟ್ರಿ ನಿಲ್ಲಿಸಲಾಗಿದೆ' : 'Telemetry Paused')}
          </button>
        </div>
      </div>

      {/* Proximity Warning Banner */}
      <AnimatePresence>
        {proximityAlerts.length > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 flex items-start gap-2.5">
            <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5 animate-pulse" size={16} />
            <div className="flex-1 min-w-0">
              <span className="text-xs text-red-300 font-bold">{isKn ? 'ಸಾಮೀಪ್ಯ ಅಲರ್ಟ್ ಪತ್ತೆಯಾಗಿದೆ!' : 'Patrol Proximity Alarm Active!'}</span>
              <div className="flex flex-col gap-1 mt-1">
                {proximityAlerts.map(a => (
                  <div key={a.id} className="text-xs text-red-400/90 font-mono">
                    ⚠️ {a.reg} is within <span className="font-bold underline">{a.distance}m</span> of a {a.type}
                  </div>
                ))}
              </div>
            </div>
            {simulatedAlert && (
              <button onClick={clearSimulatedAlert} className="text-xs font-semibold text-red-400 hover:underline">
                {isKn ? 'ಸ್ಪೈಕ್ ಅಲರ್ಟ್ ತೆರವುಗೊಳಿಸಿ' : 'Clear Spike Alert'}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Leaflet map container */}
        <GlassCard className="lg:col-span-3" padding={false}>
          <div className="px-5 py-3 border-b border-[#1F2D40] flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <MapPin size={14} className="text-blue-500" /> 
              {isKn ? "ಗಸ್ತು ನಕ್ಷೆ (ಸ್ಪೈಕ್ ಸಿಮ್ಯುಲೇಶನ್‌ಗಾಗಿ ನಕ್ಷೆಯ ಮೇಲೆ ಕ್ಲಿಕ್ ಮಾಡಿ)" : "Patrol Map (Click map to simulate custom crime spike)"}
            </span>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block bg-blue-500 animate-pulse" />
                <span className="text-gray-400">{isKn ? 'ಗಸ್ತು ವಾಹನ' : 'Patrol Vehicle'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block bg-red-500 animate-ping" />
                <span className="text-gray-400">{isKn ? 'ಸಂಚಾಲಿತ ಅಲರ್ಟ್' : 'Active Alert'}</span>
              </span>
            </div>
          </div>
          <div style={{ height: 500 }} className="relative">
            <LeafletMap 
              mode="patrol"
              filteredFIRs={filteredFIRs} 
              vehicles={vehicles} 
              isKn={isKn} 
              language={language} 
              theme={theme} 
              simulatedAlert={simulatedAlert} 
              onMapClick={handleMapClick} 
              proximityAlerts={proximityAlerts}
            />
          </div>
        </GlassCard>

        {/* Patrol Details Panel */}
        <div className="space-y-3">
          <GlassCard title={isKn ? "ಸಕ್ರಿಯ ಗಸ್ತು ಟೆಲಿಮೆಟ್ರಿ" : "Active Patrol Telemetry"} padding={false}>
            <div className="divide-y divide-[#1F2D40] max-h-[500px] overflow-y-auto">
              {vehicles.length === 0 ? (
                <div className="p-4 text-xs text-gray-500 text-center">
                  {isKn ? 'ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Connecting to GPS...'}
                </div>
              ) : (
                vehicles.map((v: any) => {
                  const isAlerted = proximityAlerts.some(a => a.vehicleId === v.id);
                  return (
                    <div key={v.id} className="p-3.5 hover:bg-white/5 transition-colors flex items-center justify-between">
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="text-xs font-bold text-white flex items-center gap-1.5">
                          <span className={`w-2 h-2 rounded-full ${isAlerted ? 'bg-red-500 animate-ping' : v.status === 'Active' ? 'bg-green-500' : 'bg-amber-500'}`} />
                          <span className="truncate">{v.registration_number}</span>
                        </div>
                        <div className="text-[10px] text-gray-500 mt-0.5 truncate">{v.make} {v.model}</div>
                        <div className="text-[10px] text-gray-400 mt-1 font-mono flex items-center gap-1">
                          <Compass size={10} className="text-blue-500" />
                          {Math.round(v.speed)} km/h · {Math.round(v.heading)}°
                        </div>
                      </div>
                      
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold flex-shrink-0 ${isAlerted ? 'bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse' : v.status === 'Active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                        {isAlerted ? (isKn ? 'ಅಲರ್ಟ್' : 'ALERT') : v.status}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
