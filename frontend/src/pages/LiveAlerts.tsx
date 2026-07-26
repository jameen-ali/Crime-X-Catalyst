import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Check, X, AlertTriangle, Zap, Car, Globe, Users, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { alertsApi } from '../mockApi';
import { StatusBadge, FilterSelect, GlassCard, SectionHeader } from '../components/ui';
import { formatDistanceToNow } from 'date-fns';
import { kn } from 'date-fns/locale';
import type { Alert } from '../types';
import { useUIStore } from '../context/uiStore';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  'Crime Spike': <TrendingUpIcon />,
  'Repeat Offender Released': <Users size={16} />,
  'Vehicle Theft Alert': <Car size={16} />,
  'Cyber Attack': <Globe size={16} />,
  'Gang Activity': <AlertTriangle size={16} />,
  'High Risk Zone': <AlertCircle size={16} />,
};

function TrendingUpIcon() { return <Zap size={16} />; }

const SEV_COLORS: Record<string, string> = {
  Critical: 'border-l-red-500 bg-red-500/5',
  High: 'border-l-amber-500 bg-amber-500/5',
  Medium: 'border-l-blue-500 bg-blue-500/5',
  Low: 'border-l-green-500 bg-green-500/5',
};

const SEV_ICON_COLORS: Record<string, string> = {
  Critical: 'text-red-400 bg-red-500/15',
  High: 'text-amber-400 bg-amber-500/15',
  Medium: 'text-blue-400 bg-blue-500/15',
  Low: 'text-green-400 bg-green-500/15',
};

const SEV_LABELS: Record<string, Record<string, string>> = {
  kn: {
    Critical: 'ಅತಿಗಂಭೀರ',
    High: 'ಹೆಚ್ಚು',
    Medium: 'ಮಧ್ಯಮ',
    Low: 'ಕಡಿಮೆ',
  },
  en: {
    Critical: 'Critical',
    High: 'High',
    Medium: 'Medium',
    Low: 'Low',
  }
};

/* Local read storage helper */
const getReadAlerts = (): string[] => {
  try {
    return JSON.parse(localStorage.getItem('ksp-read-alerts') || '[]');
  } catch {
    return [];
  }
};

const markAlertRead = (id: string) => {
  try {
    const current = getReadAlerts();
    if (!current.includes(id)) {
      current.push(id);
      localStorage.setItem('ksp-read-alerts', JSON.stringify(current));
    }
  } catch (e) {
    console.error(e);
  }
};

/* Toast notification component */
function Toast({ msg, type = 'success', onClose }: { msg: string; type?: 'success' | 'warning'; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#111827] border rounded-2xl shadow-2xl text-sm ${type === 'success' ? 'border-green-500/30 text-green-400' : 'border-amber-500/30 text-amber-400'
        }`}>
      {type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />} {msg}
    </motion.div>
  );
}

export default function LiveAlerts() {
  const [type, setType] = useState('');
  const [severity, setSeverity] = useState('');
  const [toast, setToast] = useState('');
  const [toastType, setToastType] = useState<'success' | 'warning'>('success');
  const qc = useQueryClient();
  const { language } = useUIStore();
  const isKn = language === 'kn';

  const { data: alerts = [], isLoading } = useQuery({
    queryKey: ['alerts', type, severity],
    queryFn: async () => {
      const data = await alertsApi.getAll({ type: type || undefined, severity: severity as any || undefined });
      const readIds = getReadAlerts();
      return data.map(a => ({
        ...a,
        isRead: a.isRead || readIds.includes(a.id)
      }));
    },
    refetchInterval: 30000,
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const readIds = getReadAlerts();
      if (readIds.includes(id)) {
        throw new Error('already_read');
      }
      markAlertRead(id);
      await alertsApi.markRead(id);
      return id;
    },
    onSuccess: () => {
      setToastType('success');
      setToast(isKn ? 'ಎಚ್ಚರಿಕೆಯನ್ನು ಓದಲಾಗಿದೆ ಎಂದು ಯಶಸ್ವಿಯಾಗಿ ಗುರುತಿಸಲಾಗಿದೆ.' : 'Alert marked as read successfully.');
      qc.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: any) => {
      if (error.message === 'already_read') {
        setToastType('warning');
        setToast(isKn ? 'ಈ ಎಚ್ಚರಿಕೆಯನ್ನು ಈಗಾಗಲೇ ಓದಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಲಾಗಿದೆ.' : 'This alert has already been marked as read.');
      }
    }
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  return (
    <div className="space-y-4">
      <SectionHeader
        title={isKn ? "ಲೈವ್ ಅಪರಾಧ ಎಚ್ಚರಿಕೆಗಳು" : "Live Crime Alerts"}
        subtitle={isKn ? `${unreadCount} ಓದದ · ಒಟ್ಟು ${alerts.length}` : `${unreadCount} unread · Total ${alerts.length}`}
        right={
          <button 
            onClick={() => {
              qc.invalidateQueries({ queryKey: ['alerts'] });
              setToastType('success');
              setToast(isKn ? 'ಎಚ್ಚರಿಕೆಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ' : 'Alerts manually refreshed');
            }}
            title={isKn ? "ನವೀಕರಿಸಿ" : "Click to refresh live alerts"}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 text-xs font-semibold transition-all shadow-sm group cursor-pointer">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>{isKn ? "ಲೈವ್ ಸ್ವಯಂ ನವೀಕರಣ (30ಸೆ)" : "Live Auto-Refresh (30s)"}</span>
            <RefreshCw size={12} className="text-emerald-400/70 group-hover:rotate-180 transition-transform duration-500" />
          </button>
        }
      />

      {/* Filters */}
      <GlassCard padding={false}>
        <div className="p-4 flex flex-wrap gap-3 items-center">
          <FilterSelect value={type} onChange={setType}
            options={isKn ? [
              { value: 'Crime Spike', label: 'ಅಪರಾಧ ಹೆಚ್ಚಳ' },
              { value: 'Repeat Offender Released', label: 'ಪುನರಾವರ್ತಿತ ಆರೋಪಿ ಬಿಡುಗಡೆ' },
              { value: 'Vehicle Theft Alert', label: 'ವಾಹನ ಕಳ್ಳತನ ಎಚ್ಚರಿಕೆ' },
              { value: 'Cyber Attack', label: 'ಸೈಬರ್ ದಾಳಿ' },
              { value: 'Gang Activity', label: 'ಗ್ಯಾಂಗ್ ಚಟುವಟಿಕೆ' },
              { value: 'High Risk Zone', label: 'ಹೆಚ್ಚಿನ ಅಪಾಯದ ವಲಯ' },
            ] : [
              { value: 'Crime Spike', label: 'Crime Spike' },
              { value: 'Repeat Offender Released', label: 'Repeat Offender Released' },
              { value: 'Vehicle Theft Alert', label: 'Vehicle Theft Alert' },
              { value: 'Cyber Attack', label: 'Cyber Attack' },
              { value: 'Gang Activity', label: 'Gang Activity' },
              { value: 'High Risk Zone', label: 'High Risk Zone' },
            ]}
            placeholder={isKn ? "ಸರ್ವ ವಿಧಗಳು" : "All Types"} />
          <FilterSelect value={severity} onChange={setSeverity}
            options={isKn ? [
              { value: 'Critical', label: 'ಅತಿಗಂಭೀರ' },
              { value: 'High', label: 'ಹೆಚ್ಚು' },
              { value: 'Medium', label: 'ಮಧ್ಯಮ' },
              { value: 'Low', label: 'ಕಡಿಮೆ' },
            ] : [
              { value: 'Critical', label: 'Critical' },
              { value: 'High', label: 'High' },
              { value: 'Medium', label: 'Medium' },
              { value: 'Low', label: 'Low' },
            ]}
            placeholder={isKn ? "ಸರ್ವ ತೀವ್ರತೆಗಳು" : "All Severities"} />
          {(type || severity) && (
            <button onClick={() => { setType(''); setSeverity(''); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
              <X size={12} /> {isKn ? "ತೆರವುಗೊಳಿಸಿ" : "Clear"}
            </button>
          )}
          <span className="ml-auto text-xs text-gray-500">
            {alerts.length} {isKn ? "ಎಚ್ಚರಿಕೆಗಳು" : "alerts"}
          </span>
        </div>
      </GlassCard>

      {/* Alert cards */}
      <div className="space-y-3 relative">
        {isLoading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-2xl border border-[#1F2D40] bg-[#111827] p-4">
              <div className="skeleton h-4 w-48 rounded-full mb-2" />
              <div className="skeleton h-3 w-full rounded-full mb-1" />
              <div className="skeleton h-3 w-2/3 rounded-full" />
            </div>
          ))
        ) : (
          <AnimatePresence mode="popLayout">
            {alerts.map((alert: Alert, _i) => (
              <motion.div
                key={alert.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`rounded-2xl border border-[#1F2D40] ${SEV_COLORS[alert.severity]} border-l-4 p-4 ${!alert.isRead ? 'ring-1 ring-blue-500/20' : ''
                  } hover:scale-[1.005] transition-all`}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${SEV_ICON_COLORS[alert.severity]}`}>
                    {TYPE_ICONS[alert.type] ?? <Bell size={16} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-2 flex-wrap mb-1">
                      <span className="text-sm font-semibold text-white">{alert.title}</span>
                      <StatusBadge status={SEV_LABELS[language]?.[alert.severity] ?? SEV_LABELS['en']?.[alert.severity] ?? alert.severity} />
                      {!alert.isRead && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 transition-all duration-300">
                          {isKn ? "ಹೊಸದು" : "New"}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">{alert.description}</p>
                    <div className="flex items-center gap-3 mt-2 text-[10px] text-gray-500">
                      <span>📍 {alert.district} · {alert.location}</span>
                      <span>🕐 {formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true, locale: isKn ? kn : undefined })}</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => markRead.mutate(alert.id)}
                      className={`p-2 rounded-xl transition-all ${alert.isRead
                          ? 'text-green-400 bg-green-500/10 border border-green-500/20'
                          : 'text-gray-400 hover:text-green-400 hover:bg-green-500/20 hover:scale-105'
                        }`}
                      aria-label="Mark as read"
                      title={alert.isRead ? (isKn ? 'ಓದಲಾಗಿದೆ' : 'Read') : (isKn ? 'ಓದಲಾಗಿದೆ ಎಂದು ಗುರುತಿಸಿ' : 'Mark as read')}
                    >
                      <Check size={14} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {!isLoading && alerts.length === 0 && (
          <div className="text-center py-16">
            <Bell size={40} className="mx-auto mb-3 text-gray-600" />
            <div className="text-sm text-gray-500">
              {isKn ? "ನಿಮ್ಮ ಫಿಲ್ಟರ್‌ಗಳಿಗೆ ಯಾವುದೇ ಎಚ್ಚರಿಕೆ ಹೊಂದಿಲ್ಲ" : "No alerts match your filter criteria"}
            </div>
          </div>
        )}
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <Toast msg={toast} type={toastType} onClose={() => setToast('')} />
        )}
      </AnimatePresence>
    </div>
  );
}
