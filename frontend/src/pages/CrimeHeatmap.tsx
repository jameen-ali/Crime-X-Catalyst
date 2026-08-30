import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MapPin, Shield } from 'lucide-react';
import { FilterSelect, GlassCard } from '../components/ui';
import { caseApi, lookupApi } from '../lib/supabaseApi';
import { useUIStore } from '../context/uiStore';
import LeafletMap from '../components/LeafletMap';

const TIME_SLOTS = [
  { value: 'morning',   labelKn: 'ಮುಂಜಾನೆ (6–12)',   labelEn: 'Morning (6–12)',   min: 6,  max: 11 },
  { value: 'afternoon', labelKn: 'ಮಧ್ಯಾಹ್ನ (12–18)', labelEn: 'Afternoon (12–18)', min: 12, max: 17 },
  { value: 'evening',   labelKn: 'ಸಂಜೆ (18–24)',   labelEn: 'Evening (18–24)',   min: 18, max: 23 },
  { value: 'night',     labelKn: 'ರಾತ್ರಿ (0–6)',        labelEn: 'Night (0–6)',        min: 0,  max: 5  },
];

export default function CrimeHeatmap() {
  const { theme, language } = useUIStore();
  const isKn = language === 'kn';

  const [district, setDistrict] = useState('');
  const [crimeType, setCrimeType] = useState('');
  const [timeSlot, setTimeSlot] = useState('');

  // Fetch lookups
  const { data: districtsData } = useQuery({ queryKey: ['districts'], queryFn: () => lookupApi.getDistricts() });
  const { data: crimeHeadsData } = useQuery({ queryKey: ['crimeHeads'], queryFn: () => lookupApi.getCrimeHeads() });
  const { data: casesData } = useQuery({ queryKey: ['heatmap-cases'], queryFn: () => caseApi.getAll({ pageSize: 500 }) });

  const allCases = useMemo(() => casesData?.items || [], [casesData]);

  const filteredFIRs = useMemo(() => {
    const slot = TIME_SLOTS.find(t => t.value === timeSlot);
    return allCases.filter(f => {
      const inDistrict = !district || f.district === district;
      const inCrime = !crimeType || f.crimeType === crimeType;
      const dateVal = f.dateOccurred || f.dateReported;
      const hour = new Date(dateVal).getHours();
      const inTime = !slot || (hour >= slot.min && hour <= slot.max);
    });
  }, [allCases, district, crimeType, timeSlot]);

  const stats = useMemo(() => {
    let hotspotCount = Math.ceil(filteredFIRs.length / 12);
    if (hotspotCount === 0 && filteredFIRs.length > 0) hotspotCount = 1;
    
    const districtCounts: Record<string, number> = {};
    const crimeCounts: Record<string, number> = {};
    
    filteredFIRs.forEach(f => {
      if (f.district) districtCounts[f.district] = (districtCounts[f.district] || 0) + 1;
      if (f.crimeType) crimeCounts[f.crimeType] = (crimeCounts[f.crimeType] || 0) + 1;
    });

    const topDistrict = Object.keys(districtCounts).sort((a, b) => districtCounts[b] - districtCounts[a])[0] || 'N/A';
    const topCrime = Object.keys(crimeCounts).sort((a, b) => crimeCounts[b] - crimeCounts[a])[0] || 'N/A';
    
    // Recent activity (latest 5)
    const recent = [...filteredFIRs].sort((a, b) => new Date(b.dateReported || b.dateOccurred || 0).getTime() - new Date(a.dateReported || a.dateOccurred || 0).getTime()).slice(0, 5);
    
    // Top 5 districts
    const top5Districts = Object.entries(districtCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

    return { total: filteredFIRs.length, hotspotCount, topDistrict, topCrime, recent, top5Districts };
  }, [filteredFIRs]);

  return (
    <div className="space-y-4">
      {/* Title & Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-blue-500" />
            {isKn ? "ಅಪರಾಧ ಸಾಂದ್ರತೆಯ ಗುಪ್ತಚರ" : "Crime Density Intelligence"}
            <span className="ml-3 px-2 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-bold tracking-wider animate-pulse flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400"></span>
              LIVE CASE DATA
            </span>
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isKn 
              ? "ಕರ್ನಾಟಕದಾದ್ಯಂತ ದಾಖಲಾದ FIR ಗಳ ಭೌಗೋಳಿಕ ಸಾಂದ್ರತೆ" 
              : "Geographic concentration of registered FIRs across Karnataka"}
          </p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <GlassCard className="flex flex-col justify-center p-4">
          <div className="text-xs text-gray-500 font-semibold mb-1 uppercase">TOTAL FIRs</div>
          <div className="text-2xl font-bold text-white">{stats.total.toLocaleString()}</div>
        </GlassCard>
        <GlassCard className="flex flex-col justify-center p-4 border-t-2 border-t-red-500/50">
          <div className="text-xs text-gray-500 font-semibold mb-1 uppercase">ACTIVE HOTSPOTS</div>
          <div className="text-2xl font-bold text-red-400">{stats.hotspotCount}</div>
        </GlassCard>
        <GlassCard className="flex flex-col justify-center p-4">
          <div className="text-xs text-gray-500 font-semibold mb-1 uppercase">HIGHEST CRIME DISTRICT</div>
          <div className="text-lg font-bold text-blue-400 truncate" title={stats.topDistrict}>{stats.topDistrict}</div>
        </GlassCard>
        <GlassCard className="flex flex-col justify-center p-4">
          <div className="text-xs text-gray-500 font-semibold mb-1 uppercase">TOP CRIME CATEGORY</div>
          <div className="text-lg font-bold text-amber-400 truncate" title={stats.topCrime}>{stats.topCrime}</div>
        </GlassCard>
      </div>

      {/* Filter Bar */}
      <GlassCard className="flex gap-4 flex-wrap items-center bg-[#111827]/80 p-3">
        <div className="text-xs font-semibold text-gray-400 w-full sm:w-auto">INTELLIGENCE FILTERS</div>
        <div className="flex-1 flex gap-2 flex-wrap items-center">
          <div className="flex flex-col w-40">
            <span className="text-[10px] text-gray-500 font-semibold mb-1">DISTRICT</span>
            <FilterSelect value={district} onChange={setDistrict} options={(districtsData ?? []).map(d => ({ value: d.district_name, label: d.district_name }))} placeholder={isKn ? "ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು" : "All Districts"} />
          </div>
          <div className="flex flex-col w-48">
            <span className="text-[10px] text-gray-500 font-semibold mb-1">CRIME TYPE</span>
            <FilterSelect value={crimeType} onChange={setCrimeType} options={(crimeHeadsData ?? []).map(c => ({ value: c.crime_group_name, label: c.crime_group_name }))} placeholder={isKn ? "ಎಲ್ಲಾ ಅಪರಾಧಗಳು" : "All Crime Types"} />
          </div>
          <div className="flex flex-col w-40">
            <span className="text-[10px] text-gray-500 font-semibold mb-1">TIME PERIOD</span>
            <FilterSelect value={timeSlot} onChange={setTimeSlot} options={TIME_SLOTS.map(t => ({ value: t.value, label: isKn ? t.labelKn : t.labelEn }))} placeholder={isKn ? "ಎಲ್ಲಾ ಸಮಯ" : "All Time"} />
          </div>
          <div className="flex items-end h-full pb-[2px] ml-auto">
            <button onClick={() => { setDistrict(''); setCrimeType(''); setTimeSlot(''); }}
              className="px-4 py-2 text-xs font-semibold text-gray-400 bg-[#1F2D40] hover:bg-gray-700 rounded-xl transition-colors">
              Reset Filters
            </button>
          </div>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Leaflet map container - 3 columns */}
        <div className="lg:col-span-3">
          <GlassCard padding={false} className="h-full flex flex-col">
            <div className="px-5 py-3 border-b border-[#1F2D40] flex items-center justify-between bg-black/40">
              <span className="text-sm font-semibold text-white flex items-center gap-2">
                <MapPin size={14} className="text-red-500" /> 
                {isKn ? "ಅಪರಾಧ ಸಾಂದ್ರತೆ ನಕ್ಷೆ" : "Crime Density Map"}
              </span>
              <div className="flex items-center gap-4 text-[10px] font-medium bg-[#111827] px-3 py-1.5 rounded-lg border border-[#1F2D40]">
                <span className="text-gray-400 mr-2 uppercase">CRIME DENSITY:</span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'radial-gradient(circle, rgba(0,255,0,1) 0%, rgba(0,255,0,0) 70%)' }} />
                  <span className="text-gray-300">Low</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'radial-gradient(circle, rgba(255,255,0,1) 0%, rgba(255,255,0,0) 70%)' }} />
                  <span className="text-gray-300">Moderate</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'radial-gradient(circle, rgba(255,165,0,1) 0%, rgba(255,165,0,0) 70%)' }} />
                  <span className="text-gray-300">High</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded-full inline-block" style={{ background: 'radial-gradient(circle, rgba(255,0,0,1) 0%, rgba(255,0,0,0) 70%)' }} />
                  <span className="text-gray-300">Critical</span>
                </span>
              </div>
            </div>
            <div style={{ minHeight: 600 }} className="relative flex-1">
              <LeafletMap 
                mode="heatmap"
                filteredFIRs={filteredFIRs} 
                vehicles={[]} 
                isKn={isKn} 
                language={language} 
                theme={theme} 
                simulatedAlert={null} 
                onMapClick={() => {}} 
                proximityAlerts={[]}
              />
            </div>
          </GlassCard>
        </div>

        {/* Intelligence Panel - 1 column */}
        <div className="lg:col-span-1 space-y-4">
          <GlassCard className="p-4" padding={false}>
            <div className="text-xs font-bold text-white mb-3 uppercase flex items-center gap-2">
              <Shield size={14} className="text-blue-400" />
              HOTSPOT INTELLIGENCE
            </div>
            
            <div className="space-y-4">
              <div>
                <div className="text-[10px] text-gray-500 font-semibold mb-2">TOP 5 DISTRICTS</div>
                <div className="space-y-2">
                  {stats.top5Districts.length > 0 ? stats.top5Districts.map(([dist, count], i) => (
                    <div key={dist} className="flex justify-between items-center text-xs">
                      <span className="text-gray-300 truncate max-w-[120px]">{i+1}. {dist}</span>
                      <span className="font-mono text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded">{count}</span>
                    </div>
                  )) : <div className="text-xs text-gray-500">No data</div>}
                </div>
              </div>
              
              <div className="border-t border-[#1F2D40] pt-4">
                <div className="text-[10px] text-gray-500 font-semibold mb-2">RECENT INCIDENTS</div>
                <div className="space-y-3">
                  {stats.recent.length > 0 ? stats.recent.map(f => (
                    <div key={f.id} className="text-[10px]">
                      <div className="text-gray-300 font-medium truncate">{f.crimeType}</div>
                      <div className="text-gray-500 truncate">{f.location || f.district}</div>
                      <div className="text-blue-400 font-mono mt-0.5">{f.firNumber}</div>
                    </div>
                  )) : <div className="text-xs text-gray-500">No recent incidents</div>}
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
}
