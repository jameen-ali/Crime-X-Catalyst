import { useEffect, useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  FileText, FolderOpen, CheckCircle, Search, Zap, Shield,
  MapPin, Users, Gavel, AlertTriangle, Archive, Eye
} from 'lucide-react';
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { kn } from 'date-fns/locale';
import { kpiApi, caseApi, evidenceApi } from '../lib/supabaseApi';
import { KPICard, KPICardSkeleton, GlassCard, StatusBadge, SkeletonPanel } from '../components/ui';
import { useUIStore } from '../context/uiStore';
import { supabase } from '../lib/supabase';

const CHART_COLORS = ['#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#EC4899', '#14B8A6', '#F97316'];

const CUSTOM_TOOLTIP_STYLE = {
  contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 12 },
  itemStyle: { color: 'var(--text-muted)' },
};

// Activity feed built from real recent cases
function buildActivityFromCases(cases: any[], isKn: boolean) {
  return cases.slice(0, 10).map((c, _i) => ({
    id: `act-${c.case_master_id}`,
    icon: '📋',
    message: `${isKn ? 'FIR ದಾಖಲಾಗಿದೆ' : 'FIR Registered'}: ${c.crime_no} — ${c.crime_head?.crime_group_name ?? 'Case'}`,
    officer: c.employee?.first_name ?? 'Officer',
    timestamp: c.crime_registered_date,
    severity: 'Medium',
  }));
}

const STATUS_LABEL: Record<number, string> = {
  1: 'Open',
  2: 'Under Investigation',
  3: 'Closed',
  4: 'Pending',
};

const STATUS_LABEL_KN: Record<number, string> = {
  1: 'ತೆರೆದಿದೆ',
  2: 'ತನಿಖೆಯಲ್ಲಿದೆ',
  3: 'ಮುಚ್ಚಲಾಗಿದೆ',
  4: 'ಬಾಕಿ ಇದೆ',
};

export default function Dashboard() {
  const { language } = useUIStore();
  const isKn = language === 'kn';
  const [realtimeConnected, setRealtimeConnected] = useState(true);

  useEffect(() => {
    let active = true;
    const checkConnection = async () => {
      try {
        const { error } = await supabase.from('case_master').select('case_master_id').limit(1);
        if (active) setRealtimeConnected(!error);
      } catch {
        if (active) setRealtimeConnected(false);
      }
    };
    checkConnection();
    const interval = setInterval(checkConnection, 10000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  // ── Live Supabase queries ────────────────────────────────────────────────
  const { data: kpis, isLoading: kpisLoading } = useQuery({
    queryKey: ['supabase-kpis'],
    queryFn: () => kpiApi.getKPIs(),
    staleTime: 1000 * 60 * 2,
  });

  const { data: recentCases, isLoading: casesLoading } = useQuery({
    queryKey: ['supabase-recent-cases'],
    queryFn: () => caseApi.getRecentCases(8),
    staleTime: 1000 * 60 * 2,
  });

  const { data: trend, isLoading: trendLoading } = useQuery({
    queryKey: ['supabase-crime-trend'],
    queryFn: () => caseApi.getCrimeTrend(),
    staleTime: 1000 * 60 * 5,
  });

  const { data: distribution } = useQuery({
    queryKey: ['supabase-crime-dist'],
    queryFn: () => caseApi.getCrimeDistribution(),
    staleTime: 1000 * 60 * 5,
  });

  // ── Activity feed (from real cases) ──────────────────────────────────────
  const [activityIdx, setActivityIdx] = useState(0);
  const activityRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const activityItems = buildActivityFromCases(recentCases ?? [], isKn);

  useEffect(() => {
    if (activityItems.length > 0) {
      activityRef.current = setInterval(() => {
        setActivityIdx(i => (i + 1) % Math.max(activityItems.length - 3, 1));
      }, 2500);
    }
    return () => clearInterval(activityRef.current!);
  }, [activityItems.length]);

  const visibleActivity = activityItems.slice(activityIdx, activityIdx + 5);

  const { data: recentEvidence } = useQuery({
    queryKey: ['evidence-recent'],
    queryFn: () => evidenceApi.getRecent(10),
    staleTime: 60000,
  });

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {isKn ? 'ಗುಪ್ತಚರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' : 'Intelligence Dashboard'}
          </h1>
          <p className="text-sm text-gray-400 mt-0.5 flex items-center gap-2">
            {isKn ? 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ — ನೈಜ ಸುಪಾಬೇಸ್ ಡೇಟಾ' : 'Karnataka State Police — Live Supabase Data'}
            <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${realtimeConnected ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${realtimeConnected ? 'bg-green-400' : 'bg-red-400'}`} />
              {realtimeConnected ? (isKn ? 'ನೈಜ-ಸಮಯ ಸಿಂಕ್' : 'Real-time Sync') : (isKn ? 'ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ' : 'Disconnected')}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <span className={`w-2 h-2 rounded-full ${realtimeConnected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="font-medium">
            {realtimeConnected 
              ? (isKn ? 'ಸಂಪರ್ಕಿಸಲಾಗಿದೆ' : 'Connected') 
              : (isKn ? 'ಸಂಪರ್ಕ ಕಡಿತಗೊಂಡಿದೆ' : 'Disconnected')}
          </span>
          <span className="text-gray-600">·</span>
          <span>{isKn ? 'ಕೊನೆಯದಾಗಿ ಸಿಂಕ್ ಮಾಡಲಾಗಿದೆ: ಈಗಷ್ಟೇ' : 'Last Synced: Just now'}</span>
          <span className="text-gray-600">·</span>
          <span>{new Date().toLocaleDateString(isKn ? 'kn-IN' : 'en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
        </div>
      </div>

      {/* KPI Grid — real counts from Supabase */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpisLoading ? (
          Array.from({ length: 8 }).map((_, i) => <KPICardSkeleton key={i} />)
        ) : kpis && (
          <>
            <KPICard title={isKn ? 'ಒಟ್ಟು ಪ್ರಕರಣಗಳು' : 'Total Cases'} value={kpis.totalCases} icon={FileText} color="blue" change={8} delay={0} />
            <KPICard title={isKn ? 'ತೆರೆದ ಪ್ರಕರಣಗಳು' : 'Open Cases'} value={kpis.openCases} icon={FolderOpen} color="amber" change={-3} delay={0.05} />
            <KPICard title={isKn ? 'ಮುಚ್ಚಿದ ಪ್ರಕರಣಗಳು' : 'Closed Cases'} value={kpis.closedCases} icon={CheckCircle} color="green" change={12} delay={0.1} />
            <KPICard title={isKn ? 'ತನಿಖೆಯಲ್ಲಿ' : 'Under Investigation'} value={kpis.underInvestigation} icon={Search} color="blue" change={-2} delay={0.15} />
            <KPICard title={isKn ? 'ಒಟ್ಟು ಅಧಿಕಾರಿಗಳು' : 'Total Officers'} value={kpis.totalOfficers} icon={Shield} color="purple" change={0} delay={0.2} />
            <KPICard title={isKn ? 'ಒಟ್ಟು ಆರೋಪಿಗಳು' : 'Total Accused'} value={kpis.totalAccused} icon={Users} color="red" change={7} delay={0.25} />
            <KPICard title={isKn ? 'ಬಂಧನಗಳು' : 'Arrests'} value={kpis.totalArrests} icon={AlertTriangle} color="amber" change={15} delay={0.3} />
            <KPICard title={isKn ? 'ದೋಷಾರೋಪಣೆಗಳು' : 'Chargesheets'} value={kpis.totalChargesheets} icon={Gavel} color="green" change={4} delay={0.35} />
          </>
        )}
      </div>

      {/* Chart Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <GlassCard title={isKn ? 'ಅಪರಾಧ ಪ್ರವೃತ್ತಿ (ತಿಂಗಳು)' : 'Crime Trend by Month'} className="lg:col-span-2" padding={false}>
          <div className="p-5">
            {trendLoading ? <SkeletonPanel rows={6} /> : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={trend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1F2D40" />
                  <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                  <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                  <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                  <Line type="monotone" dataKey="crimes" stroke="#EF4444" strokeWidth={2} dot={{ r: 3, fill: '#EF4444' }} name={isKn ? 'ಪ್ರಕರಣಗಳು' : 'Cases'} />
                  <Line type="monotone" dataKey="solved" stroke="#10B981" strokeWidth={2} dot={{ r: 3, fill: '#10B981' }} name={isKn ? 'ಮುಚ್ಚಿದವು' : 'Closed'} />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        <GlassCard title={isKn ? 'ಅಪರಾಧ ವಿತರಣೆ' : 'Crime Distribution'} padding={false}>
          <div className="p-5 flex flex-col gap-3">
            {!distribution ? <SkeletonPanel rows={5} /> : (
              <>
                <ResponsiveContainer width="100%" height={175}>
                  <PieChart>
                    <Pie data={distribution} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} innerRadius={44}>
                      {distribution.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...CUSTOM_TOOLTIP_STYLE} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                  {distribution.map((entry: any, i: number) => (
                    <div key={entry.name} className="flex items-center gap-1.5 min-w-0">
                      <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-[10px] text-gray-400 truncate">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Recent Cases table — from Supabase */}
        <GlassCard
          title={isKn ? 'ಇತ್ತೀಚಿನ ಪ್ರಕರಣಗಳು' : 'Recent Cases'}
          className="lg:col-span-2"
          padding={false}
          headerRight={<Link to="/fir" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">{isKn ? 'ಎಲ್ಲವನ್ನೂ ನೋಡಿ →' : 'View All →'}</Link>}
        >
          <div className="overflow-x-auto">
            {casesLoading ? <SkeletonPanel rows={5} /> : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1F2D40]">
                    {(isKn
                      ? ['ಕ್ರಮ ಸಂ.', 'ಅಪರಾಧ ವರ್ಗ', 'ಠಾಣೆ', 'ಅಧಿಕಾರಿ', 'ದಿನಾಂಕ', 'ಸ್ಥಿತಿ']
                      : ['Case No.', 'Crime Category', 'Station', 'Officer', 'Date', 'Status']
                    ).map(h => (
                      <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {(recentCases ?? []).map((c: any) => (
                    <tr key={c.case_master_id} className="border-b border-[#1F2D40]/50 table-row-hover transition-colors">
                      <td className="px-4 py-3 font-mono text-blue-400 font-medium">{c.case_no ?? c.crime_no}</td>
                      <td className="px-4 py-3 text-gray-300">{c.crime_head?.crime_group_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 max-w-[100px] truncate">{c.unit?.unit_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{c.employee?.first_name ?? '—'}</td>
                      <td className="px-4 py-3 text-gray-500">{c.crime_registered_date ? new Date(c.crime_registered_date).toLocaleDateString('en-IN') : '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={(isKn ? STATUS_LABEL_KN : STATUS_LABEL)[c.case_status_id] ?? 'Unknown'} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </GlassCard>

        {/* Right column */}
        <div className="space-y-4">
          {/* Live Activity Feed */}
          <GlassCard
            title={isKn ? 'ಲೈವ್ ಚಟುವಟಿಕೆ' : 'Live Activity'}
            headerRight={<span className="text-xs text-green-400">{isKn ? 'ಸಂಪರ್ಕಿಸಲಾಗಿದೆ' : 'Connected'}</span>}
            padding={false}
          >
            <div className="p-3 space-y-1 min-h-[160px]">
              {casesLoading ? <SkeletonPanel rows={4} /> : visibleActivity.map((item, i) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="flex items-start gap-2 px-2 py-2 rounded-xl hover:bg-white/5 transition-colors"
                >
                  <span className="text-sm mt-0.5 flex-shrink-0">{item.icon}</span>
                  <div className="min-w-0">
                    <div className="text-xs text-gray-300 line-clamp-1">{item.message}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">
                      {item.timestamp
                        ? formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: isKn ? kn : undefined })
                        : '—'
                      } · {item.officer}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </GlassCard>

          {/* AI Recommendation + Risk Score */}
          <GlassCard title={isKn ? 'AI ಶಿಫಾರಸು' : 'AI Recommendation'} padding={false}
            headerRight={<Link to="/ai-assistant" className="text-xs text-blue-400 hover:text-blue-300">{isKn ? 'AI ತೆರೆಯಿರಿ' : 'Open AI'}</Link>}
          >
            <div className="p-4 space-y-3">
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Zap size={14} className="text-blue-400" />
                </div>
                <p className="text-xs text-gray-300 leading-relaxed">
                  {isKn
                    ? `${kpis?.openCases ?? '—'} ತೆರೆದ ಪ್ರಕರಣಗಳು ಸಕ್ರಿಯ ತನಿಖೆ ಅಗತ್ಯವಿದೆ. ಹೆಚ್ಚಿನ ಠಾಣೆಗಳಿಗೆ ಗಸ್ತು ತಂಡಗಳನ್ನು ನಿಯೋಜಿಸಿ.`
                    : `${kpis?.openCases ?? '—'} open cases require active investigation. Consider deploying additional patrol units to high-incident stations.`
                  }
                </p>
              </div>
              <div className="space-y-1.5">
                {(distribution ?? []).slice(0, 3).map((d: any, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <MapPin size={10} className="text-blue-400 flex-shrink-0" />
                    <span className="text-gray-400">{d.name}</span>
                    <span className="ml-auto text-blue-400 font-medium">{d.value} {isKn ? 'ಪ್ರಕರಣ' : 'cases'}</span>
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>
      </div>

      {/* ── Evidence Preview Strip ── */}
      {recentEvidence && recentEvidence.length > 0 && (
        <GlassCard padding={false}>
          <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-2">
              <Archive size={14} className="text-purple-400"/>
              <h3 className="text-sm font-semibold text-[var(--text)]">
                {isKn ? 'ಇತ್ತೀಚಿನ ಸಾಕ್ಷ್ಯಗಳು' : 'Recent Evidence'}
              </h3>
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full">Supabase Storage</span>
            </div>
            <Link to="/evidence" className="text-xs text-blue-400 hover:text-blue-300">
              {isKn ? 'ಎಲ್ಲಾ ನೋಡಿ →' : 'View all →'}
            </Link>
          </div>
          <div className="flex gap-3 px-5 py-4 overflow-x-auto scrollbar-hide">
            {recentEvidence.map((ev, i) => {
              const isImg = ev.mime_type?.startsWith('image/');
              return (
                <motion.div key={ev.id} initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{delay:i*0.05}}
                  className="flex-shrink-0 w-24 cursor-pointer group relative">
                  <Link to="/evidence">
                    <div className="w-24 h-20 rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--surface-2)] flex items-center justify-center">
                      {isImg && ev.public_url
                        ? <img src={ev.public_url} alt={ev.file_name} className="w-full h-full object-cover"/>
                        : <Archive size={22} className="text-gray-500"/>}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex items-center justify-center">
                        <Eye size={16} className="text-white"/>
                      </div>
                    </div>
                    <div className="mt-1.5 text-[10px] text-gray-400 truncate">{ev.file_name}</div>
                    {ev.case_no && <div className="text-[9px] text-blue-400 truncate">{ev.case_no}</div>}
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </GlassCard>
      )}
    </div>
  );
}
