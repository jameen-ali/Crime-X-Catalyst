import { useState, useMemo } from 'react';
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  AreaChart, Area
} from 'recharts';
import { GlassCard, FilterSelect, SectionHeader } from '../components/ui';
import { useUIStore } from '../context/uiStore';
import {
  DISTRICTS_LIST, CRIME_TYPES_LIST, MOCK_FIRS
} from '../mockApi/mockData';

const COLORS = ['#3B82F6','#10B981','#EF4444','#F59E0B','#8B5CF6','#EC4899','#14B8A6','#F97316'];
const TT = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 12 },
  itemStyle: { color: 'var(--text-muted)' },
};

export default function CrimeAnalytics() {
  const { language } = useUIStore();
  const isKn = language === 'kn';

  const DATE_RANGES = [
    { value: '7', label: isKn ? 'ಕಳೆದ ೭ ದಿನಗಳು' : 'Last 7 Days' },
    { value: '30', label: isKn ? 'ಕಳೆದ ೩೦ ದಿನಗಳು' : 'Last 30 Days' },
    { value: '90', label: isKn ? 'ಕಳೆದ ೯೦ ದಿನಗಳು' : 'Last 90 Days' },
    { value: '365', label: isKn ? 'ಕಳೆದ ವರ್ಷ' : 'Last Year' },
  ];

  const [district, setDistrict] = useState('');
  const [crimeCategory, setCrimeCategory] = useState('');
  const [dateRange, setDateRange] = useState('365');

  /* ── Filter MOCK_FIRS to match all active filters ─── */
  const filtered = useMemo(() => {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - Number(dateRange));
    return MOCK_FIRS.filter(f => {
      const inDistrict  = !district      || f.district  === district;
      const inCategory  = !crimeCategory || f.crimeType === crimeCategory;
      const inDate      = new Date(f.dateReported) >= cutoff;
      return inDistrict && inCategory && inDate;
    });
  }, [district, crimeCategory, dateRange]);

  /* ── Derived analytics from filtered dataset ─────── */
  const monthlyTrend = useMemo(() => {
    const months = isKn 
      ? ['ಜನವರಿ', 'ಫೆಬ್ರವರಿ', 'ಮಾರ್ಚ್', 'ಏಪ್ರಿಲ್', 'ಮೇ', 'ಜೂನ್', 'ಜುಲೈ', 'ಆಗಸ್ಟ್', 'ಸೆಪ್ಟೆಂಬರ್', 'ಅಕ್ಟೋಬರ್', 'ನವೆಂಬರ್', 'ಡಿಸೆಂಬರ್']
      : ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const buckets: Record<string, { crimes: number; arrests: number; solved: number }> = {};
    months.forEach(m => { buckets[m] = { crimes: 0, arrests: 0, solved: 0 }; });
    filtered.forEach(f => {
      const m = months[new Date(f.dateReported).getMonth()];
      buckets[m].crimes++;
      if (f.status === 'Closed') buckets[m].solved++;
      if (f.status === 'Under Investigation') buckets[m].arrests++;
    });
    return months.map(m => ({ name: m, ...buckets[m] }));
  }, [filtered, isKn]);

  const hourlyTrend = useMemo(() => {
    const buckets: number[] = Array(24).fill(0);
    filtered.forEach(f => {
      const h = new Date(f.dateReported).getHours();
      buckets[h]++;
    });
    return buckets.map((crimes, h) => ({ name: `${String(h).padStart(2,'0')}:00`, crimes }));
  }, [filtered]);

  const crimeDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(f => { counts[f.crimeType] = (counts[f.crimeType] ?? 0) + 1; });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }));
  }, [filtered]);

  const districtComparison = useMemo(() => {
    const counts: Record<string, { crimes: number; solved: number; arrests: number }> = {};
    filtered.forEach(f => {
      if (!counts[f.district]) counts[f.district] = { crimes: 0, solved: 0, arrests: 0 };
      counts[f.district].crimes++;
      if (f.status === 'Closed') counts[f.district].solved++;
      if (f.status === 'Under Investigation') counts[f.district].arrests++;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1].crimes - a[1].crimes)
      .map(([d, v]) => ({ name: d.split('-')[0].trim(), ...v }));
  }, [filtered]);

  const weaponAnalysis = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach(f => {
      const w = f.weaponUsed ?? (isKn ? 'ಯಾವುದೂ ಇಲ್ಲ' : 'None');
      counts[w] = (counts[w] ?? 0) + 1;
    });
    return Object.entries(counts)
      .filter(([n]) => n !== 'Unknown')
      .sort((a, b) => b[1] - a[1])
      .slice(0, 7)
      .map(([name, value]) => ({ name, value }));
  }, [filtered, isKn]);

  const ageData = useMemo(() => {
    const bands = [
      { name: '18-25', min: 18, max: 25 },
      { name: '26-35', min: 26, max: 35 },
      { name: '36-45', min: 36, max: 45 },
      { name: '46-55', min: 46, max: 55 },
      { name: '55+',   min: 56, max: 200 },
    ];
    return bands.map(b => ({
      name: b.name,
      value: filtered.filter(f => f.suspectAge !== undefined && f.suspectAge >= b.min && f.suspectAge <= b.max).length,
    }));
  }, [filtered]);

  const genderData = useMemo(() => {
    const m = filtered.filter(f => f.victimGender === 'Male').length;
    const fe = filtered.filter(f => f.victimGender === 'Female').length;
    const o = filtered.filter(f => f.victimGender === 'Other').length;
    return [
      { name: isKn ? 'ಪುರುಷ' : 'Male', value: m },
      { name: isKn ? 'ಮಹಿಳೆ' : 'Female', value: fe },
      { name: isKn ? 'ಇತರೆ' : 'Other', value: o }
    ];
  }, [filtered, isKn]);

  const kpis = useMemo(() => {
    const topCrime = crimeDistribution[0]?.name ?? '—';
    const peakHour = hourlyTrend.reduce((a, b) => (b.crimes > a.crimes ? b : a), hourlyTrend[0]);
    const topDistrict = districtComparison[0]?.name ?? '—';
    const total = filtered.length;
    const repeats = total > 0 ? ((filtered.filter(f => f.status === 'Under Investigation').length / total) * 100).toFixed(1) : '0.0';
    return { topCrime, peakHour: peakHour?.name ?? '—', topDistrict, repeats };
  }, [filtered, crimeDistribution, hourlyTrend, districtComparison]);

  return (
    <div className="space-y-5">
      <SectionHeader
        title={isKn ? 'ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ' : 'Crime Analytics'}
        subtitle={isKn ? `ಅಂಕಿಅಂಶಗಳ ವಿಶ್ಲೇಷಣೆ — ಪ್ರಸ್ತುತ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಹೊಂದಿಕೆಯಾಗುವ ${filtered.length.toLocaleString()} FIR ಗಳು` : `Statistical analysis — ${filtered.length.toLocaleString()} FIRs match current filters`}
        right={
          <div className="flex gap-2 items-center flex-wrap">
            <FilterSelect value={district} onChange={setDistrict}
              options={DISTRICTS_LIST.map(d => ({ value: d, label: d }))} placeholder={isKn ? 'ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು' : 'All Districts'} className="w-44" />
            <FilterSelect value={crimeCategory} onChange={setCrimeCategory}
              options={CRIME_TYPES_LIST.map(c => ({ value: c, label: c }))} placeholder={isKn ? 'ಎಲ್ಲಾ ಅಪರಾಧಗಳು' : 'All Crime Types'} className="w-44" />
            <FilterSelect value={dateRange} onChange={setDateRange}
              options={DATE_RANGES} placeholder={isKn ? 'ಸಮಯ ಶ್ರೇಣಿ' : 'Time Range'} className="w-36" />
          </div>
        }
      />

      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: isKn ? 'ಹೆಚ್ಚು ಸಾಮಾನ್ಯ ಅಪರಾಧ' : 'Most Common Crime', value: kpis.topCrime, sub: isKn ? `ಒಟ್ಟು ${filtered.length} FIR ಗಳು` : `Total ${filtered.length} FIRs`, color: 'text-red-400' },
          { label: isKn ? 'ಪೀಕ್ ಸಮಯ' : 'Peak Hour', value: kpis.peakHour, sub: isKn ? 'ಅತಿ ಹೆಚ್ಚು ಅಪರಾಧ ಪ್ರಮಾಣ' : 'Highest crime volume', color: 'text-amber-400' },
          { label: isKn ? 'ಹೆಚ್ಚು ಸಕ್ರಿಯ ಜಿಲ್ಲೆ' : 'Most Active District', value: kpis.topDistrict, sub: isKn ? `${districtComparison[0]?.crimes ?? 0} ಅಪರಾಧಗಳು` : `${districtComparison[0]?.crimes ?? 0} crimes`, color: 'text-blue-400' },
          { label: isKn ? 'ತನಿಖಾ ದರ' : 'Investigation Rate', value: `${kpis.repeats}%`, sub: isKn ? 'ತನಿಖೆಯಲ್ಲಿದೆ' : 'Under investigation', color: 'text-purple-400' },
        ].map(s => (
          <GlassCard key={s.label}>
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-lg font-bold ${s.color} truncate`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-0.5">{s.sub}</div>
          </GlassCard>
        ))}
      </div>

      {/* Monthly + Hourly trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <GlassCard title={isKn ? 'ಮಾಸಿಕ ಅಪರಾಧ ಪ್ರವೃತ್ತಿ' : 'Monthly Crime Trend'} padding={false}>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="crimesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#EF4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="arrestsGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#3B82F6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2D40" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Tooltip {...TT} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                <Area type="monotone" dataKey="crimes"  stroke="#EF4444" fill="url(#crimesGrad)"  strokeWidth={2} name={isKn ? 'ಅಪರಾಧಗಳು' : 'Crimes'} />
                <Area type="monotone" dataKey="arrests" stroke="#3B82F6" fill="url(#arrestsGrad)" strokeWidth={2} name={isKn ? 'ಸಕ್ರಿಯ ತನಿಖೆಗಳು' : 'Active Investigations'} />
                <Area type="monotone" dataKey="solved"  stroke="#10B981" fill="none"              strokeWidth={2} name={isKn ? 'ಪರಿಹರಿಸಿದವು' : 'Solved'} strokeDasharray="5 3" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title={isKn ? 'ಗಂಟಾವಾರು ಅಪರಾಧ ವಿತರಣೆ' : 'Hourly Crime Distribution'} padding={false}>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={hourlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2D40" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 9 }} interval={3} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Tooltip {...TT} />
                <Bar dataKey="crimes" fill="#8B5CF6" radius={[3,3,0,0]} name={isKn ? 'ಅಪರಾಧಗಳು' : 'Crimes'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Crime Distribution + Weapon Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard title={isKn ? 'ಅಪರಾಧ ವರ್ಗದ ವಿಂಗಡಣೆ' : 'Crime Category Split'} padding={false} className="lg:col-span-2">
          <div className="p-5">
            {crimeDistribution.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
                {isKn ? 'ಆಯ್ದ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಯಾವುದೇ ಡೇಟಾ ಇಲ್ಲ' : 'No data available for selected filters'}
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={crimeDistribution} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2D40" />
                  <XAxis type="number" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis type="category" dataKey="name" tick={{ fill: '#9CA3AF', fontSize: 11 }} width={110} />
                  <Tooltip {...TT} />
                  <Bar dataKey="value" radius={[0,4,4,0]} name={isKn ? 'ಪ್ರಕರಣಗಳು' : 'Cases'}>
                    {crimeDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard title={isKn ? 'ಬಳಸಿದ ಆಯುಧಗಳ ವಿವರ' : 'Weapon Usage Analysis'} padding={false}>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={weaponAnalysis} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} innerRadius={50}>
                  {weaponAnalysis.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip {...TT} />
                <Legend wrapperStyle={{ fontSize: 10, color: '#9CA3AF' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* District comparison */}
      <GlassCard title={isKn ? 'ಜಿಲ್ಲಾವಾರು ಹೋಲಿಕೆ' : 'District Comparison'} padding={false}>
        <div className="p-5">
          {districtComparison.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-gray-500 text-sm">
              {isKn ? 'ಆಯ್ದ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಯಾವುದೇ ಡೇಟಾ ಇಲ್ಲ' : 'No data available for selected filters'}
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={districtComparison}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2D40" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 10 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Tooltip {...TT} />
                <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                <Bar dataKey="crimes"  fill="#EF4444" radius={[4,4,0,0]} name={isKn ? 'ಅಪರಾಧಗಳು' : 'Crimes'} />
                <Bar dataKey="arrests" fill="#3B82F6" radius={[4,4,0,0]} name={isKn ? 'ತನಿಖೆಗಳು' : 'Investigations'} />
                <Bar dataKey="solved"  fill="#10B981" radius={[4,4,0,0]} name={isKn ? 'ಪರಿಹರಿಸಿದವು' : 'Solved'} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </GlassCard>

      {/* Age + Gender */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <GlassCard title={isKn ? 'ಆರೋಪಿಗಳ ವಯಸ್ಸಿನ ವಿತರಣೆ' : 'Suspect Age Distribution'} padding={false}>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={ageData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1F2D40" />
                <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} />
                <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                <Tooltip {...TT} />
                <Bar dataKey="value" fill="#3B82F6" radius={[4,4,0,0]} name={isKn ? 'ಸಂಖ್ಯೆ' : 'Count'} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard title={isKn ? 'ಸಂತ್ರಸ್ತರ ಲಿಂಗ ವಿತರಣೆ' : 'Victim Gender Distribution'} padding={false}>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={genderData} dataKey="value" nameKey="name" cx="50%" cy="50%"
                  outerRadius={80} innerRadius={45}
                  label={({ name, percent }: any) => `${name} ${((percent ?? 0)*100).toFixed(0)}%`}>
                  {genderData.map((_, i) => <Cell key={i} fill={['#3B82F6','#EC4899','#8B5CF6'][i]} />)}
                </Pie>
                <Tooltip {...TT} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
