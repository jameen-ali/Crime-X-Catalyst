import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search, FileText, User, Car, MapPin, AlertCircle, X, Calendar, Shield,
  Activity, Paperclip, GitFork, Clock, Download, History, AlertTriangle
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { backendSearchApi } from '../lib/backendApi';
import {
  caseApi, auditApi,
  getSearchHistory, removeSearchHistory, clearSearchHistory
} from '../lib/supabaseApi';
import { supabase } from '../lib/supabase';
import { StatusBadge, GlassCard, ConfidenceBar } from '../components/ui';
import { useUIStore } from '../context/uiStore';
import { useAuthStore } from '../context/authStore';
import CriminalProfileModal from '../components/CriminalProfileModal';

const TYPE_ICONS: Record<string, React.ReactNode> = {
  FIR: <FileText size={14} className="text-blue-400" />,
  Evidence: <Paperclip size={14} className="text-cyan-400" />,
  Person: <User size={14} className="text-green-400" />,
  Officer: <Shield size={14} className="text-purple-400" />,
  Vehicle: <Car size={14} className="text-amber-400" />,
  Alert: <AlertTriangle size={14} className="text-red-400" />,
  Assignment: <Activity size={14} className="text-indigo-400" />,
  Audit: <Clock size={14} className="text-gray-400" />,
};

const STATUS_LABELS: Record<string, string> = {
  'Open': 'Open',
  'Under Investigation': 'Under Investigation',
  'Closed': 'Closed',
  'Pending': 'Pending',
  'Active': 'Active',
};

const STATUS_LABELS_KN: Record<string, string> = {
  'Open': 'ತೆರೆದಿದೆ',
  'Under Investigation': 'ತನಿಖೆಯಲ್ಲಿದೆ',
  'Closed': 'ಮುಚ್ಚಲಾಗಿದೆ',
  'Pending': 'ಬಾಕಿ ಇದೆ',
  'Active': 'ಸಕ್ರಿಯ',
};

// ─── Case Details Drawer ──────────────────────────────────────────────────────
function CaseDetailsDrawer({ caseId, onClose, onSuspectClick }: { caseId: number; onClose: () => void; onSuspectClick: (name: string) => void }) {
  const { language } = useUIStore();
  const { user } = useAuthStore();
  const isKn = language === 'kn';

  const { data: c, isLoading } = useQuery({
    queryKey: ['case-details-drawer', caseId],
    queryFn: async () => {
      const full = await caseApi.getById(caseId);
      const { data: ev } = await supabase
        .from('evidence')
        .select('*')
        .eq('case_master_id', caseId);
      const { data: related } = await supabase
        .from('case_master')
        .select('case_master_id, case_no, crime_no, brief_facts, case_status_id')
        .eq('crime_major_head_id', full?.crime_major_head_id || 1)
        .neq('case_master_id', caseId)
        .limit(3);
      return { ...full, evidence: ev || [], related: related || [] };
    },
    enabled: !!caseId,
  });

  useEffect(() => {
    if (caseId && user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: `View Case Details: ${caseId}`,
        targetId: String(caseId),
      }).catch(console.error);
    }
  }, [caseId, user]);

  if (isLoading) {
    return (
      <motion.div
        initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed right-0 top-0 h-full w-full sm:w-[540px] bg-[#111827] border-l border-[#1F2D40] z-50 p-6 flex flex-col justify-center items-center"
      >
        <div className="w-8 h-8 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4" />
        <span className="text-xs text-gray-400">{isKn ? 'ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading case file...'}</span>
      </motion.div>
    );
  }

  if (!c) return null;

  const statusName = c.case_status_master?.case_status_name || 'Open';
  const statusLabel = isKn ? (STATUS_LABELS_KN[statusName] || statusName) : (STATUS_LABELS[statusName] || statusName);

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full sm:w-[540px] bg-[#111827] border-l border-[#1F2D40] z-50 overflow-y-auto shadow-2xl flex flex-col"
    >
      <div className="sticky top-0 bg-[#111827] border-b border-[#1F2D40] px-6 py-4 flex items-center justify-between z-10">
        <div>
          <div className="text-xs font-mono text-blue-400 font-semibold">{isKn ? 'ಪ್ರಕರಣದ ವಿವರಗಳು' : 'CASE DOSSIER'}</div>
          <div className="text-sm font-bold text-white">{c.case_no || c.crime_no}</div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1">
        <div className="flex gap-2">
          <StatusBadge status={statusLabel} />
          <StatusBadge status={c.crime_head?.crime_group_name || 'Offence'} />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <FileText size={12} /> {isKn ? 'ಸಂಕ್ಷಿಪ್ತ ವಿವರಣೆ' : 'Brief Facts / Narrative'}
          </h3>
          <p className="text-sm text-gray-200 bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed">
            {c.brief_facts || (isKn ? 'ಯಾವುದೇ ವಿವರಣೆ ಲಭ್ಯವಿಲ್ಲ' : 'No narrative details provided.')}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a2435] rounded-xl p-3.5 border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><Calendar size={10} /> {isKn ? 'ವರದಿ ಮಾಡಿದ ದಿನಾಂಕ' : 'Reported Date'}</div>
            <div className="text-xs text-white font-medium">{c.crime_registered_date ? new Date(c.crime_registered_date).toLocaleString() : '—'}</div>
          </div>
          <div className="bg-[#1a2435] rounded-xl p-3.5 border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-1 flex items-center gap-1"><MapPin size={10} /> {isKn ? 'ಸ್ಥಳ ಮತ್ತು ಠಾಣೆ' : 'Station & Location'}</div>
            <div className="text-xs text-white font-medium truncate">{c.unit?.unit_name || 'KSP Station'}</div>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <User size={12} /> {isKn ? 'ಸಂಬಂಧಪಟ್ಟ ವ್ಯಕ್ತಿಗಳು' : 'Involved Entities'}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-red-500/5 rounded-xl p-3 border border-red-500/10">
              <span className="text-[10px] font-semibold text-red-400 uppercase tracking-wider">{isKn ? 'ಆರೋಪಿಗಳು' : 'Accused'}</span>
              <div className="mt-2 space-y-2">
                {(c.accused && c.accused.length > 0) ? c.accused.map((a: any) => (
                  <div key={a.accused_master_id} onClick={() => onSuspectClick(a.accused_name)}
                       className="cursor-pointer group flex items-center justify-between text-xs text-white font-medium hover:underline">
                    <span>{a.accused_name}</span>
                    <span className="text-[9px] text-red-400 bg-red-400/10 px-1.5 py-0.5 rounded group-hover:bg-red-400/25 transition-all">Profile</span>
                  </div>
                )) : <div className="text-xs text-gray-500">{isKn ? 'ಯಾರೂ ಇಲ್ಲ' : 'No accused records.'}</div>}
              </div>
            </div>

            <div className="bg-green-500/5 rounded-xl p-3 border border-green-500/10">
              <span className="text-[10px] font-semibold text-green-400 uppercase tracking-wider">{isKn ? 'ಪೀಡಿತರು' : 'Victims / Complainant'}</span>
              <div className="mt-2 space-y-2 text-xs">
                {(c.victim && c.victim.length > 0) ? c.victim.map((v: any) => (
                  <div key={v.victim_master_id} className="text-xs text-white font-medium">
                    {v.victim_name} <span className="text-[10px] text-gray-400">({v.age_year || '—'} Yrs)</span>
                  </div>
                )) : null}
                {c.complainant_details?.[0] && (
                  <div className="pt-1 border-t border-[#1F2D40] mt-1 text-[11px] text-gray-400">
                    {isKn ? 'ದೂರುದಾರರು: ' : 'Complainant: '} {c.complainant_details[0].complainant_name}
                  </div>
                )}
                {(!c.victim?.length && !c.complainant_details?.length) && (
                  <div className="text-xs text-gray-500">{isKn ? 'ಯಾರೂ ಇಲ್ಲ' : 'No victim records.'}</div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <Paperclip size={12} /> {isKn ? 'ಸಾಕ್ಷ್ಯಗಳು ಮತ್ತು ಫೈಲ್‌ಗಳು' : 'Linked Evidence & Media'}
          </h3>
          {(c.evidence && c.evidence.length > 0) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {c.evidence.map((ev: any) => (
                <div key={ev.id || ev.file_name} className="flex items-center gap-2.5 p-2 bg-[#1a2435] border border-[#1F2D40] rounded-xl text-xs">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-mono text-[9px] uppercase">
                    {ev.mime_type?.split('/')?.[1] || 'DOC'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-gray-300 font-medium truncate">{ev.file_name}</div>
                    <div className="text-[9px] text-gray-500 truncate">{ev.description || 'No description'}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 bg-[#1a2435]/30 p-3 rounded-xl text-center border border-dashed border-[#1F2D40]">
              {isKn ? 'ಯಾವುದೇ ಸಾಕ್ಷ್ಯ ಜೋಡಿಸಿಲ್ಲ' : 'No evidence attachments listed.'}
            </div>
          )}
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <GitFork size={12} /> {isKn ? 'ಕ್ರಿಮಿನಲ್ ನೆಟ್‌ವರ್ಕ್' : 'Visual Relationship Graph'}
          </h3>
          <div className="bg-black/20 p-4 rounded-xl border border-[#1F2D40] space-y-3">
            <div className="flex flex-wrap items-center justify-center gap-4 text-xs">
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-500" /> {isKn ? 'ತನಿಖಾಧಿಕಾರಿ' : 'Officer'}</div>
              <span className="text-gray-600">→</span>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500" /> {isKn ? 'ಆರೋಪಿ' : 'Accused'}</div>
              <span className="text-gray-600">→</span>
              <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500" /> {isKn ? 'ಪೀಡಿತ' : 'Victim'}</div>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-400 flex items-center gap-1.5">
            <Activity size={12} /> {isKn ? 'ಸಂಬಂಧಿತ ಪ್ರಕರಣಗಳು' : 'Related Cases'}
          </h3>
          {c.related && c.related.length > 0 ? (
            <div className="space-y-2">
              {c.related.map((rc: any) => (
                <div key={rc.case_master_id} className="p-2.5 bg-[#1a2435]/65 border border-[#1F2D40]/60 rounded-xl text-xs">
                  <div className="font-mono text-blue-400 font-medium">{rc.case_no || rc.crime_no}</div>
                  <p className="text-gray-400 line-clamp-1 mt-0.5">{rc.brief_facts}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-gray-500 italic">{isKn ? 'ಸಂಬಂಧಿತ ಪ್ರಕರಣಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No similar category cases found.'}</div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Evidence Details Drawer ──────────────────────────────────────────────────
function EvidenceDetailsDrawer({ item, onClose }: { item: any; onClose: () => void }) {
  const { language } = useUIStore();
  const isKn = language === 'kn';

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full sm:w-[540px] bg-[#111827] border-l border-[#1F2D40] z-50 overflow-y-auto shadow-2xl flex flex-col"
    >
      <div className="sticky top-0 bg-[#111827] border-b border-[#1F2D40] px-6 py-4 flex items-center justify-between z-10">
        <div>
          <div className="text-xs font-mono text-cyan-400 font-semibold">{isKn ? 'ಸಾಕ್ಷ್ಯದ ವಿವರಗಳು' : 'EVIDENCE FILE'}</div>
          <div className="text-sm font-bold text-white truncate max-w-[360px]">{item.title || item.file_name}</div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1">
        {item.public_url && (
          <div className="bg-[#1a2435] rounded-2xl p-2 border border-[#1F2D40] overflow-hidden flex items-center justify-center min-h-[220px]">
            {item.mime_type?.startsWith('image/') || item.category === 'Crime Scene' || item.category === 'Fingerprints' || item.category === 'Weapons' || item.category === 'Vehicles' ? (
              <img src={item.public_url} alt={item.title} className="max-h-72 w-full object-contain rounded-xl" />
            ) : item.mime_type?.startsWith('video/') ? (
              <video src={item.public_url} controls className="max-h-72 w-full rounded-xl" />
            ) : item.mime_type?.startsWith('audio/') ? (
              <audio src={item.public_url} controls className="w-full p-4" />
            ) : (
              <div className="p-8 text-center">
                <FileText size={48} className="mx-auto text-cyan-400 mb-2 opacity-60" />
                <div className="text-xs text-gray-300 font-mono">{item.file_name}</div>
              </div>
            )}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <StatusBadge status={item.category || 'Evidence'} />
          <StatusBadge status={item.status || 'Secured'} />
        </div>

        <div className="space-y-1">
          <div className="text-xs text-gray-400 font-semibold">{isKn ? 'ವಿವರಣೆ' : 'Description & Notes'}</div>
          <p className="text-sm text-gray-200 bg-white/5 p-4 rounded-xl border border-white/5 leading-relaxed">
            {item.description || item.notes || 'No notes available for this evidence item.'}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a2435] p-3 rounded-xl border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-0.5">{isKn ? 'ಲಿಂಕ್ ಮಾಡಲಾದ FIR' : 'Linked FIR'}</div>
            <div className="text-xs font-mono text-blue-400 font-semibold">{item.linked_fir || 'Unlinked'}</div>
          </div>
          <div className="bg-[#1a2435] p-3 rounded-xl border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-0.5">{isKn ? 'ತನಿಖಾಧಿಕಾರಿ' : 'Officer'}</div>
            <div className="text-xs text-white font-medium">{item.officer || 'Inspector Ramesh'}</div>
          </div>
          <div className="bg-[#1a2435] p-3 rounded-xl border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-0.5">{isKn ? 'ಜಿಲ್ಲೆ' : 'District'}</div>
            <div className="text-xs text-white font-medium">{item.district || 'Bengaluru City'}</div>
          </div>
          <div className="bg-[#1a2435] p-3 rounded-xl border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-0.5">{isKn ? 'ಫೈಲ್ ಗಾತ್ರ' : 'File Size'}</div>
            <div className="text-xs text-white font-medium">{(item.file_size ? (item.file_size / 1024).toFixed(1) + ' KB' : '—')}</div>
          </div>
        </div>

        {item.public_url && (
          <a
            href={item.public_url} target="_blank" rel="noreferrer" download
            className="w-full py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs flex items-center justify-center gap-2 transition-all shadow-lg"
          >
            <Download size={14} /> {isKn ? 'ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ' : 'Download Original Media File'}
          </a>
        )}
      </div>
    </motion.div>
  );
}

// ─── Officer Details Drawer ───────────────────────────────────────────────────
function OfficerDetailsDrawer({ item, onClose }: { item: any; onClose: () => void }) {
  const { language } = useUIStore();
  const isKn = language === 'kn';

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full sm:w-[540px] bg-[#111827] border-l border-[#1F2D40] z-50 overflow-y-auto shadow-2xl flex flex-col"
    >
      <div className="sticky top-0 bg-[#111827] border-b border-[#1F2D40] px-6 py-4 flex items-center justify-between z-10">
        <div>
          <div className="text-xs font-mono text-purple-400 font-semibold">{isKn ? 'ಅಧಿಕಾರಿ ವಿವರ' : 'OFFICER PROFILE'}</div>
          <div className="text-sm font-bold text-white">{item.name}</div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1">
        <div className="flex items-center gap-4 bg-[#1a2435] p-4 rounded-2xl border border-[#1F2D40]">
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-300 font-bold text-xl">
            {item.first_name?.[0] || 'O'}
          </div>
          <div>
            <div className="text-base font-bold text-white">{item.name}</div>
            <div className="text-xs text-purple-400 font-mono mt-0.5">KGID: {item.badgeNumber}</div>
            <div className="text-xs text-gray-400 mt-1">{item.designation} · {item.station}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a2435] p-3.5 rounded-xl border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-0.5">{isKn ? 'ಶ್ರೇಣಿ / ಹುದ್ದೆ' : 'Rank'}</div>
            <div className="text-xs text-white font-medium">{item.rank}</div>
          </div>
          <div className="bg-[#1a2435] p-3.5 rounded-xl border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-0.5">{isKn ? 'ಜಿಲ್ಲೆ' : 'District'}</div>
            <div className="text-xs text-white font-medium">{item.district}</div>
          </div>
          <div className="bg-[#1a2435] p-3.5 rounded-xl border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-0.5">{isKn ? 'ಠಾಣೆ' : 'Station Unit'}</div>
            <div className="text-xs text-white font-medium truncate">{item.station}</div>
          </div>
          <div className="bg-[#1a2435] p-3.5 rounded-xl border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-0.5">{isKn ? 'ಸೇರ್ಪಡೆ ದಿನಾಂಕ' : 'Appointment'}</div>
            <div className="text-xs text-white font-medium">{item.appointmentDate ? new Date(item.appointmentDate).toLocaleDateString() : '—'}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Vehicle Details Drawer ───────────────────────────────────────────────────
function VehicleDetailsDrawer({ item, onClose }: { item: any; onClose: () => void }) {
  const { language } = useUIStore();
  const isKn = language === 'kn';

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full sm:w-[540px] bg-[#111827] border-l border-[#1F2D40] z-50 overflow-y-auto shadow-2xl flex flex-col"
    >
      <div className="sticky top-0 bg-[#111827] border-b border-[#1F2D40] px-6 py-4 flex items-center justify-between z-10">
        <div>
          <div className="text-xs font-mono text-amber-400 font-semibold">{isKn ? 'ವಾಹನದ ವಿವರ' : 'VEHICLE RECORD'}</div>
          <div className="text-sm font-bold text-white font-mono">{item.registrationNumber}</div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
          <X size={18} />
        </button>
      </div>

      <div className="p-6 space-y-6 flex-1">
        <div className="flex items-center gap-3">
          <StatusBadge status={item.status || 'Active'} />
          <span className="text-xs text-gray-400 font-mono">{item.make} {item.model} ({item.color})</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-[#1a2435] p-3.5 rounded-xl border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-0.5">{isKn ? 'ನಂದಾಯಿತ ಮಾಲೀಕರು' : 'Owner Entity'}</div>
            <div className="text-xs text-white font-medium">{item.ownerName}</div>
          </div>
          <div className="bg-[#1a2435] p-3.5 rounded-xl border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-0.5">{isKn ? 'ಜಿಲ್ಲೆ' : 'District Jurisdiction'}</div>
            <div className="text-xs text-white font-medium">{item.district}</div>
          </div>
        </div>

        {item.latitude && item.longitude && (
          <div className="space-y-2">
            <div className="text-xs text-gray-400 font-semibold">{isKn ? 'ಕೊನೆಯ ಜಿಪಿಎಸ್ ಸ್ಥಳ' : 'Last Reported GPS Location'}</div>
            <div className="bg-[#1a2435] p-4 rounded-xl border border-[#1F2D40] text-xs font-mono text-amber-300">
              Lat: {item.latitude.toFixed(4)}, Lon: {item.longitude.toFixed(4)} {item.speed ? `· Speed: ${item.speed} km/h` : ''}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}

// ─── Main SmartSearch Component ───────────────────────────────────────────────
export default function SmartSearch() {
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [debouncedQ, setDebouncedQ] = useState(query);
  const [history, setHistory] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Filters state
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [districtFilter, setDistrictFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortBy, setSortBy] = useState<'relevance' | 'newest' | 'oldest' | 'alphabetical'>('relevance');

  // Selected entities for Drawers/Modals
  const [selectedCaseId, setSelectedCaseId] = useState<number | null>(null);
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [selectedEvidence, setSelectedEvidence] = useState<any | null>(null);
  const [selectedOfficer, setSelectedOfficer] = useState<any | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);

  const { language } = useUIStore();
  const isKn = language === 'kn';
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load search history
  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // Debounce query (300ms)
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  // Main search query against Supabase PostgreSQL
  const { data: results, isLoading, isError, error } = useQuery({
    queryKey: ['smart-search-query', debouncedQ, districtFilter, statusFilter, sortBy],
    queryFn: () => backendSearchApi.search(debouncedQ, {
      district: districtFilter,
      status: statusFilter,
      sortBy,
    }),
    enabled: debouncedQ.trim().length >= 2,
    staleTime: 1000 * 30,
  });

  // Search auto-complete suggestions query
  const { data: suggestions = [] } = useQuery({
    queryKey: ['search-suggestions', query],
    queryFn: () => backendSearchApi.getSuggestions(query),
    enabled: query.trim().length >= 2 && showSuggestions,
  });

  const handleSelectQuery = (q: string) => {
    setQuery(q);
    setParams({ q });
    setShowHistory(false);
    setShowSuggestions(false);
  };

  const handleRemoveHistory = (e: React.MouseEvent, q: string) => {
    e.stopPropagation();
    const updated = removeSearchHistory(q);
    setHistory(updated);
  };

  const handleClearHistory = () => {
    clearSearchHistory();
    setHistory([]);
  };

  const EXAMPLE_QUERIES = isKn
    ? ['ದರೋಡೆ', 'ಅರ್ಜುನ್', 'KA 01', 'ಕೋರಮಂಗಲ', 'ವಾಹನ ಕಳ್ಳತನ', 'ಪ್ರಿಯಾ', 'Ramesh']
    : ['Robbery', 'Arjun', 'KA 01', 'Koramangala', 'Vehicle Theft', 'Priya', 'Ramesh'];

  const CATEGORY_TABS = [
    { id: 'All', labelEn: 'All Results', labelKn: 'ಎಲ್ಲವೂ' },
    { id: 'FIR', labelEn: 'FIRs', labelKn: 'FIR ಗಳು' },
    { id: 'Evidence', labelEn: 'Evidence', labelKn: 'ಸಾಕ್ಷ್ಯಗಳು' },
    { id: 'Person', labelEn: 'Persons', labelKn: 'ವ್ಯಕ್ತಿಗಳು' },
    { id: 'Officer', labelEn: 'Officers', labelKn: 'ಅಧಿಕಾರಿಗಳು' },
    { id: 'Vehicle', labelEn: 'Vehicles', labelKn: 'ವಾಹನಗಳು' },
    { id: 'Alert', labelEn: 'Alerts', labelKn: 'ಎಚ್ಚರಿಕೆಗಳು' },
  ];

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Search className="text-blue-400" size={24} />
          {isKn ? 'ಸ್ಮಾರ್ಟ್ ಹುಡುಕಾಟ' : 'Smart Search'}
        </h1>
        <p className="text-sm text-gray-400 mt-0.5">
          {isKn
            ? 'FIRಗಳು, ಸಾಕ್ಷ್ಯಗಳು, ಆರೋಪಿಗಳು, ಅಧಿಕಾರಿಗಳು ಮತ್ತು ವಾಹನಗಳಾದ್ಯಂತ Supabase PostgreSQL ಜಾಗತಿಕ ಹುಡುಕಾಟ'
            : 'Enterprise multi-entity search across FIRs, Evidence, Suspects, Officers, Vehicles & Intelligence from Supabase'}
        </p>
      </div>

      {/* Main Search Input & Auto-complete */}
      <div className="relative z-30">
        <div className="relative">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            ref={searchInputRef}
            value={query}
            onChange={e => {
              setQuery(e.target.value);
              setShowSuggestions(true);
              setShowHistory(false);
            }}
            onFocus={() => {
              if (query.trim().length >= 2) setShowSuggestions(true);
              else setShowHistory(true);
            }}
            placeholder={isKn ? 'FIR ಸಂಖ್ಯೆ, ವ್ಯಕ್ತಿ, ವಾಹನ, ಸಾಕ್ಷ್ಯ, ಅಧಿಕಾರಿ ಅಥವಾ ಕೀವರ್ಡ್‌ಗಳನ್ನು ಹುಡುಕಿ…' : 'Search FIR number, suspect name, vehicle registration, evidence, officer, location...'}
            className="w-full bg-[#111827] border border-[#1F2D40] text-base text-white placeholder-gray-500 rounded-2xl pl-12 pr-10 py-4 focus:border-blue-500 transition-colors shadow-2xl"
            autoFocus
          />
          {query && (
            <button
              onClick={() => { setQuery(''); setDebouncedQ(''); setParams({}); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white p-1"
            >
              <X size={16} />
            </button>
          )}
          {isLoading && (
            <div className="absolute right-12 top-1/2 -translate-y-1/2 w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin" />
          )}
        </div>

        {/* Auto-complete Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && suggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="absolute left-0 right-0 top-full mt-2 bg-[#111827] border border-[#1F2D40] rounded-2xl shadow-2xl overflow-hidden divide-y divide-[#1F2D40] z-40"
            >
              {suggestions.map((s, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectQuery(s.label.replace(/^(Case|Officer|Suspect|Vehicle|Evidence)\s+/, ''))}
                  className="px-5 py-3 hover:bg-white/5 cursor-pointer flex items-center justify-between text-xs transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    {TYPE_ICONS[s.type] || <Search size={14} className="text-gray-400" />}
                    <span className="text-gray-200 font-medium">{s.label}</span>
                  </div>
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-mono">{s.type}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Recent Search History Dropdown */}
        <AnimatePresence>
          {showHistory && history.length > 0 && !query && (
            <motion.div
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              className="absolute left-0 right-0 top-full mt-2 bg-[#111827] border border-[#1F2D40] rounded-2xl shadow-2xl p-3 z-40 space-y-2"
            >
              <div className="flex items-center justify-between text-xs text-gray-400 px-2 pb-1 border-b border-[#1F2D40]">
                <span className="flex items-center gap-1 font-semibold"><History size={12} /> {isKn ? 'ಇತ್ತೀಚಿನ ಹುಡುಕಾಟಗಳು' : 'Recent Searches'}</span>
                <button onClick={handleClearHistory} className="text-[11px] text-red-400 hover:underline">{isKn ? 'ಇತಿಹಾಸ ತೆರವುಗೊಳಿಸಿ' : 'Clear All'}</button>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {history.map((term, i) => (
                  <span
                    key={i}
                    onClick={() => handleSelectQuery(term)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-300 hover:text-white hover:border-blue-500/40 cursor-pointer transition-all"
                  >
                    <span>{term}</span>
                    <X size={12} className="text-gray-500 hover:text-red-400" onClick={(e) => handleRemoveHistory(e, term)} />
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Try Chips */}
      {!query && (
        <div>
          <div className="text-xs text-gray-500 mb-2">
            {isKn ? 'ಹುಡುಕಲು ಪ್ರಯತ್ನಿಸಿ:' : 'Try searching database:'}
          </div>
          <div className="flex flex-wrap gap-2">
            {EXAMPLE_QUERIES.map(q => (
              <button key={q} onClick={() => handleSelectQuery(q)}
                className="px-3 py-1.5 rounded-xl bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-300 hover:text-white hover:border-blue-500/40 transition-all">
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Vector/DB Notice */}
      <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <AlertCircle size={15} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-300 leading-relaxed">
          {isKn ? (
            <>
              <strong>Supabase PostgreSQL ಗ್ಲೋಬಲ್ ಹುಡುಕಾಟ</strong> — ಈ ಹುಡುಕಾಟ ವ್ಯವಸ್ಥೆಯು FIRಗಳು, ಸಾಕ್ಷ್ಯಗಳು, ಆರೋಪಿಗಳು, ಅಧಿಕಾರಿಗಳು ಮತ್ತು ವಾಹನಗಳ ಡೇಟಾಬೇಸ್‌ನಿಂದ ನೈಜ-ಸಮಯದ ಡೇಟಾವನ್ನು ಪಡೆದುಕೊಳ್ಳುತ್ತದೆ.
            </>
          ) : (
            <>
              <strong>Supabase PostgreSQL Database Connected</strong> — Live multi-entity search engine querying FIRs, Evidence, Suspects, Officers & Patrol Vehicles in real-time.
            </>
          )}
        </p>
      </div>

      {/* Filter & Sorting Toolbar */}
      {query && (
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#111827] p-3.5 rounded-2xl border border-[#1F2D40]">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center gap-1">
            {CATEGORY_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                  categoryFilter === tab.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {isKn ? tab.labelKn : tab.labelEn}
              </button>
            ))}
          </div>

          {/* Controls */}
          <div className="flex items-center gap-2">
            <select
              value={districtFilter}
              onChange={e => setDistrictFilter(e.target.value)}
              className="bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-300 rounded-xl px-2.5 py-1.5 focus:border-blue-500"
            >
              <option value="All">{isKn ? 'ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು' : 'All Districts'}</option>
              <option value="Bengaluru City">Bengaluru City</option>
              <option value="Mysuru City">Mysuru City</option>
              <option value="Mangaluru City">Mangaluru City</option>
              <option value="Hubballi-Dharwad">Hubballi-Dharwad</option>
              <option value="Belagavi">Belagavi</option>
            </select>

            <select
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-300 rounded-xl px-2.5 py-1.5 focus:border-blue-500"
            >
              <option value="All">{isKn ? 'ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು' : 'All Statuses'}</option>
              <option value="Open">Open</option>
              <option value="Under Investigation">Under Investigation</option>
              <option value="Closed">Closed</option>
              <option value="Active">Active</option>
            </select>

            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-300 rounded-xl px-2.5 py-1.5 focus:border-blue-500"
            >
              <option value="relevance">{isKn ? 'ಹೆಚ್ಚು ಪ್ರಸ್ತುತ' : 'Highest Relevance'}</option>
              <option value="newest">{isKn ? 'ಹೊಸದು' : 'Newest First'}</option>
              <option value="oldest">{isKn ? 'ಹಳೆಯದು' : 'Oldest First'}</option>
              <option value="alphabetical">{isKn ? 'ಅಕಾರಾದಿ' : 'Alphabetical'}</option>
            </select>
          </div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 text-center text-xs text-red-300">
          Database query error: {String(error?.message || error)}
        </div>
      )}

      {/* Results Section */}
      <AnimatePresence>
        {results && !isLoading && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="text-xs text-gray-400 font-medium">
              {isKn ? (
                <>"{results.query}" ಗಾಗಿ ಡೇಟಾಬೇಸ್‌ನಲ್ಲಿ {results.total} ಫಲಿತಾಂಶಗಳು ಕಂಡುಬಂದಿವೆ</>
              ) : (
                <>Found {results.total} database record{results.total === 1 ? '' : 's'} for "{results.query}"</>
              )}
            </div>

            {/* FIRs Group */}
            {(categoryFilter === 'All' || categoryFilter === 'FIR') && results.firs.length > 0 && (
              <GlassCard title={isKn ? `FIR ಗಳು (${results.firs.length})` : `FIRs (${results.firs.length})`} padding={false}>
                <div className="divide-y divide-[#1F2D40]">
                  {results.firs.map((f: any) => (
                    <div
                      key={f.id}
                      onClick={() => setSelectedCaseId(Number(f.id))}
                      className="flex items-start gap-3 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="mt-0.5 p-2 rounded-xl bg-blue-500/10 text-blue-400 group-hover:scale-110 transition-transform">
                        {TYPE_ICONS.FIR}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span className="text-sm font-mono text-blue-400 font-bold group-hover:underline">{f.firNumber}</span>
                          <StatusBadge status={f.status} />
                          <StatusBadge status={f.crimeType} />
                        </div>
                        <p className="text-xs text-gray-300 line-clamp-2 leading-relaxed">{f.description || 'No description'}</p>
                        <div className="text-xs text-gray-500 mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1">
                          <span>{isKn ? `ಸಂತ್ರಸ್ತರು: ${f.victimName}` : `Victim: ${f.victimName}`}</span>
                          <span>{isKn ? `ಆರೋಪಿ: ${f.accusedName}` : `Accused: ${f.accusedName}`}</span>
                          <span>{isKn ? `ತನಿಖಾಧಿಕಾರಿ: ${f.officerName}` : `Officer: ${f.officerName}`}</span>
                          <span>{f.district}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-28">
                        <ConfidenceBar value={Math.round(f._score * 100)} label={isKn ? "ಪ್ರಸ್ತುತತೆ" : "Relevance"} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Evidence Group */}
            {(categoryFilter === 'All' || categoryFilter === 'Evidence') && results.evidence.length > 0 && (
              <GlassCard title={isKn ? `ಸಾಕ್ಷ್ಯಗಳು (${results.evidence.length})` : `Evidence Items (${results.evidence.length})`} padding={false}>
                <div className="divide-y divide-[#1F2D40]">
                  {results.evidence.map((ev: any) => (
                    <div
                      key={ev.id}
                      onClick={() => setSelectedEvidence(ev)}
                      className="flex items-start gap-3.5 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      {ev.public_url && (ev.mime_type?.startsWith('image/') || ev.category === 'Crime Scene' || ev.category === 'Fingerprints' || ev.category === 'Weapons') ? (
                        <img src={ev.public_url} alt={ev.title} className="w-12 h-12 rounded-xl object-cover border border-[#1F2D40] flex-shrink-0" />
                      ) : (
                        <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center text-cyan-400 flex-shrink-0">
                          <Paperclip size={18} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold text-white group-hover:text-cyan-300 transition-colors truncate">{ev.title || ev.file_name}</span>
                          <StatusBadge status={ev.category || 'Evidence'} />
                        </div>
                        <div className="text-xs text-gray-400 truncate">{ev.description || 'No description provided.'}</div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-3">
                          <span>FIR: {ev.linked_fir || 'Unlinked'}</span>
                          <span>Officer: {ev.officer || 'Ramesh'}</span>
                          <span>District: {ev.district || 'Bengaluru City'}</span>
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-28">
                        <ConfidenceBar value={Math.round(ev._score * 100)} label={isKn ? "ಪ್ರಸ್ತುತತೆ" : "Relevance"} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Persons Group */}
            {(categoryFilter === 'All' || categoryFilter === 'Person') && results.persons.length > 0 && (
              <GlassCard title={isKn ? `ವ್ಯಕ್ತಿಗಳು (${results.persons.length})` : `Persons / Suspects (${results.persons.length})`} padding={false}>
                <div className="divide-y divide-[#1F2D40]">
                  {results.persons.map((p: any) => (
                    <div
                      key={p.id}
                      onClick={() => setSelectedSuspect(p.name)}
                      className="flex items-start gap-3 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="mt-0.5 p-2 rounded-xl bg-green-500/10 text-green-400 group-hover:scale-110 transition-transform">
                        {TYPE_ICONS.Person}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white underline decoration-blue-500 decoration-dotted group-hover:text-blue-400 transition-colors">
                            {p.name}
                          </span>
                          <StatusBadge status={p.role} />
                        </div>
                        <div className="text-xs text-gray-400">
                          {p.gender}, {p.age} yrs · District: {p.district}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Risk Score: <span className={p.riskScore > 70 ? 'text-red-400 font-bold' : p.riskScore > 40 ? 'text-amber-400' : 'text-green-400'}>{p.riskScore}</span> · Linked FIRs: {p.linkedFIRs?.length || 1}
                        </div>
                      </div>
                      <div className="flex-shrink-0 w-28">
                        <ConfidenceBar value={Math.round(p._score * 100)} label={isKn ? "ಪ್ರಸ್ತುತತೆ" : "Relevance"} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Officers Group */}
            {(categoryFilter === 'All' || categoryFilter === 'Officer') && results.officers.length > 0 && (
              <GlassCard title={isKn ? `ಅಧಿಕಾರಿಗಳು (${results.officers.length})` : `Officers (${results.officers.length})`} padding={false}>
                <div className="divide-y divide-[#1F2D40]">
                  {results.officers.map((o: any) => (
                    <div
                      key={o.id}
                      onClick={() => setSelectedOfficer(o)}
                      className="flex items-start gap-3.5 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-300 font-bold text-sm flex-shrink-0">
                        {o.first_name?.[0] || 'O'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-bold text-white group-hover:text-purple-300 transition-colors">{o.name}</span>
                          <span className="text-[10px] text-purple-400 bg-purple-400/10 px-2 py-0.5 rounded font-mono">KGID: {o.badgeNumber}</span>
                        </div>
                        <div className="text-xs text-gray-400">{o.rank} · {o.designation}</div>
                        <div className="text-xs text-gray-500 mt-1">Station: {o.station} · District: {o.district}</div>
                      </div>
                      <div className="flex-shrink-0 w-28">
                        <ConfidenceBar value={Math.round(o._score * 100)} label={isKn ? "ಪ್ರಸ್ತುತತೆ" : "Relevance"} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Vehicles Group */}
            {(categoryFilter === 'All' || categoryFilter === 'Vehicle') && results.vehicles.length > 0 && (
              <GlassCard title={isKn ? `ವಾಹನಗಳು (${results.vehicles.length})` : `Vehicles (${results.vehicles.length})`} padding={false}>
                <div className="divide-y divide-[#1F2D40]">
                  {results.vehicles.map((v: any) => (
                    <div
                      key={v.id}
                      onClick={() => setSelectedVehicle(v)}
                      className="flex items-start gap-3.5 px-5 py-4 hover:bg-white/5 transition-colors cursor-pointer group"
                    >
                      <div className="mt-0.5 p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                        {TYPE_ICONS.Vehicle}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-mono font-bold text-amber-400 group-hover:underline">{v.registrationNumber}</span>
                          <StatusBadge status={v.status} />
                        </div>
                        <div className="text-xs text-gray-300">{v.color} {v.make} {v.model}</div>
                        <div className="text-xs text-gray-500 mt-1">Owner: {v.ownerName} · District: {v.district}</div>
                      </div>
                      <div className="flex-shrink-0 w-28">
                        <ConfidenceBar value={Math.round(v._score * 100)} label={isKn ? "ಪ್ರಸ್ತುತತೆ" : "Relevance"} />
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Empty State */}
            {results.total === 0 && (
              <div className="text-center py-16 bg-[#111827] rounded-3xl border border-[#1F2D40] text-gray-400 space-y-3">
                <Search size={44} className="mx-auto opacity-30 text-blue-400" />
                <div className="text-base font-semibold text-white">
                  {isKn ? `"${query}" ಗಾಗಿ ಯಾವುದೇ ಫಲಿತಾಂಶಗಳು ಕಂಡುಬಂದಿಲ್ಲ` : `No matching records found in the database.`}
                </div>
                <div className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
                  {isKn
                    ? 'ದಯವಿಟ್ಟು ವಿಭಿನ್ನ ಕೀವರ್ಡ್‌ಗಳು, FIR ಸಂಖ್ಯೆಗಳು (ಉದಾ: FIR-2024-101) ಅಥವಾ ಅಧಿಕಾರಿಗಳ ಹೆಸರುಗಳನ್ನು ಬಳಸಿ ಪ್ರಯತ್ನಿಸಿ.'
                    : `No records matching "${query}" were found in Supabase tables. Try searching for "Robbery", "Ramesh", "KA01", "Burglary", or an evidence filename.`}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawers and Modals */}
      <AnimatePresence>
        {selectedSuspect && (
          <CriminalProfileModal suspectName={selectedSuspect} onClose={() => setSelectedSuspect(null)} isKn={isKn} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedCaseId && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40" onClick={() => setSelectedCaseId(null)} />
            <CaseDetailsDrawer caseId={selectedCaseId} onClose={() => setSelectedCaseId(null)} onSuspectClick={(name) => setSelectedSuspect(name)} />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedEvidence && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40" onClick={() => setSelectedEvidence(null)} />
            <EvidenceDetailsDrawer item={selectedEvidence} onClose={() => setSelectedEvidence(null)} />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedOfficer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40" onClick={() => setSelectedOfficer(null)} />
            <OfficerDetailsDrawer item={selectedOfficer} onClose={() => setSelectedOfficer(null)} />
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedVehicle && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40" onClick={() => setSelectedVehicle(null)} />
            <VehicleDetailsDrawer item={selectedVehicle} onClose={() => setSelectedVehicle(null)} />
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
