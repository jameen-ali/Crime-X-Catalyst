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
      return inDistrict && inCrime && inTime;
    });
  }, [allCases, district, crimeType, timeSlot]);

  return (
    <div className="space-y-4">
      {/* Title & Filters */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Shield className="text-blue-500" />
            {isKn ? "ಅಪರಾಧ ಸಾಂದ್ರತೆಯ ಹೀಟ್‌ಮ್ಯಾಪ್" : "Crime Density Heatmap"}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {isKn 
              ? "ಹೀಟ್‌ಮ್ಯಾಪ್ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಸಂವಾದಾತ್ಮಕ ಅಪರಾಧ ಹಾಟ್‌ಸ್ಪಾಟ್ ವಿಶ್ಲೇಷಣೆ" 
              : "Interactive crime density hotspots and cluster analysis based on registered FIRs"}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <FilterSelect value={district} onChange={setDistrict} options={(districtsData ?? []).map(d => ({ value: d.district_name, label: d.district_name }))} placeholder={isKn ? "ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು" : "All Districts"} />
          <FilterSelect value={crimeType} onChange={setCrimeType} options={(crimeHeadsData ?? []).map(c => ({ value: c.crime_group_name, label: c.crime_group_name }))} placeholder={isKn ? "ಎಲ್ಲಾ ಅಪರಾಧಗಳು" : "All Crimes"} />
          <FilterSelect value={timeSlot} onChange={setTimeSlot} options={TIME_SLOTS.map(t => ({ value: t.value, label: isKn ? t.labelKn : t.labelEn }))} placeholder={isKn ? "ಎಲ್ಲಾ ಸಮಯ" : "All Times"} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {/* Leaflet map container */}
        <GlassCard padding={false}>
          <div className="px-5 py-3 border-b border-[#1F2D40] flex items-center justify-between">
            <span className="text-sm font-semibold text-white flex items-center gap-2">
              <MapPin size={14} className="text-blue-500" /> 
              {isKn ? "ಅಪರಾಧ ಹರಡುವಿಕೆ ನಕ್ಷೆ" : "Crime Distribution Hotspot Map"}
            </span>
            <div className="flex items-center gap-4 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#EF4444]" />
                <span className="text-gray-400">{isKn ? 'ಅತಿ ಗಂಭೀರ' : 'Critical'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#F59E0B]" />
                <span className="text-gray-400">{isKn ? 'ಹೆಚ್ಚು' : 'High'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#3B82F6]" />
                <span className="text-gray-400">{isKn ? 'ಮಧ್ಯಮ' : 'Medium'}</span>
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full inline-block bg-[#10B981]" />
                <span className="text-gray-400">{isKn ? 'ಕಡಿಮೆ' : 'Low'}</span>
              </span>
            </div>
          </div>
          <div style={{ height: 550 }} className="relative">
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
    </div>
  );
}
