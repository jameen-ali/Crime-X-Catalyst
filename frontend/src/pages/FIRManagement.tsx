import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Download, Edit, Eye, Search, Trash2, X, CheckCircle } from 'lucide-react';
import { caseApi, lookupApi, auditApi } from '../lib/supabaseApi';
import { StatusBadge, FilterSelect, GlassCard, SectionHeader } from '../components/ui';
import { useUIStore } from '../context/uiStore';
import { useAuthStore } from '../context/authStore';
import type { FIR } from '../types';
import CriminalProfileModal from '../components/CriminalProfileModal';

const toCSV = (firs: FIR[], isKn: boolean) => {
  const headers = isKn 
    ? ['FIR ಸಂಖ್ಯೆ', 'ಅಪರಾಧ ವಿಧ', 'ಪೀಡಿತ', 'ಅಪಗ್ರಹಿ', 'ಅಧಿಕಾರಿ', 'ಜಿಲ್ಲೆ', 'ಪೋಲೀಸ್ ಸ್ಟೇಷನ್', 'ಸ್ಥಿತಿ', 'ತೀವ್ರತೆ', 'ವರದಿ ದಿನಾಂಕ', 'ಸ್ಥಳ']
    : ['FIR Number', 'Crime Type', 'Victim', 'Suspect', 'Officer', 'District', 'Station', 'Status', 'Severity', 'Reported Date', 'Location'];
  
  const rows = firs.map(f => [
    f.firNumber,
    f.crimeType,
    f.victimName,
    f.suspectName,
    f.officerName,
    f.district,
    f.station,
    f.status,
    f.severity,
    new Date(f.dateReported).toLocaleDateString(),
    f.location
  ]);
  
  return [headers, ...rows].map(r => r.map(c => `"${c}"`).join(',')).join('\n');
};

function FIRDrawer({ fir, onClose, onSuspectClick }: { fir: FIR; onClose: () => void; onSuspectClick: (name: string) => void }) {
  const { language } = useUIStore();
  const isKn = language === 'kn';

  const statusMap: Record<string, string> = {
    'Open': isKn ? 'ತೆರೆದಿದೆ' : 'Open',
    'Under Investigation': isKn ? 'ತನಿಖೆಯಲ್ಲಿದೆ' : 'Under Investigation',
    'Closed': isKn ? 'ಮುಚ್ಚಲಾಗಿದೆ' : 'Closed',
    'Pending': isKn ? 'ಬಾಕಿ ಇದೆ' : 'Pending',
    'Charge Sheeted': isKn ? 'ದೋಷಾರೋಪಣೆ ಪಟ್ಟಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ' : 'Charge Sheeted',
    'Undetected': isKn ? 'ಪತ್ತೆಯಾಗಿಲ್ಲ' : 'Undetected',
    'Critical': isKn ? 'ಅತಿ ಗಂಭೀರ' : 'Critical',
    'High': isKn ? 'ಹೆಚ್ಚು' : 'High',
    'Medium': isKn ? 'ಮಧ್ಯಮ' : 'Medium',
    'Low': isKn ? 'ಕಡಿಮೆ' : 'Low',
  };

  return (
    <motion.div
      initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
      className="fixed right-0 top-0 h-full w-full sm:w-[480px] bg-[#111827] border-l border-[#1F2D40] z-50 overflow-y-auto shadow-2xl"
    >
      <div className="sticky top-0 bg-[#111827] border-b border-[#1F2D40] px-6 py-4 flex items-center justify-between">
        <div>
          <div className="text-sm font-bold text-white">{fir.firNumber}</div>
          <div className="text-xs text-gray-400">{fir.crimeType} · {fir.location}</div>
        </div>
        <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
      </div>
      <div className="p-6 space-y-5">
        <div className="flex gap-3">
          <StatusBadge status={statusMap[fir.status] ?? fir.status} />
          <StatusBadge status={statusMap[fir.severity] ?? fir.severity} />
        </div>
        {[
          { label: isKn ? 'ವಿವರಣೆ' : 'Description', value: fir.description },
          { label: isKn ? 'ವರದಿ ದಿನಾಂಕ' : 'Reported Date', value: new Date(fir.dateReported).toLocaleString() },
          { label: isKn ? 'ಘಟನೆ ದಿನಾಂಕ' : 'Occurred Date', value: new Date(fir.dateOccurred).toLocaleString() },
          { label: isKn ? 'ಜಿಲ್ಲೆ' : 'District', value: fir.district },
          { label: isKn ? 'ಪೋಲೀಸ್ ಸ್ಟೇಷನ್' : 'Police Station', value: fir.station },
          { label: isKn ? 'ಸ್ಥಳ' : 'Location', value: fir.location },
          { label: isKn ? 'ಕೋಒೋರ್ಡಿನೇಟ್ಸ್' : 'Coordinates', value: `${fir.latitude.toFixed(4)}, ${fir.longitude.toFixed(4)}` },
        ].map(({ label, value }) => (
          <div key={label}>
            <div className="text-xs text-gray-500 mb-1">{label}</div>
            <div className="text-sm text-gray-200">{value}</div>
          </div>
        ))}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#1a2435] rounded-xl p-3 border border-[#1F2D40]">
            <div className="text-[10px] text-gray-500 mb-1">{isKn ? 'ಪೀಡಿತ' : 'Victim'}</div>
            <div className="text-sm text-white font-medium">{fir.victimName}</div>
            <div className="text-xs text-gray-400">{fir.victimGender === 'Male' ? (isKn ? 'ಪುರುಷ' : 'Male') : fir.victimGender === 'Female' ? (isKn ? 'ಮಹಿಳೆ' : 'Female') : fir.victimGender}, {fir.victimAge} {isKn ? 'ವರ್ಷ' : 'years'}</div>
          </div>
          <div className="bg-[#1a2435] rounded-xl p-3 border border-[#1F2D40] cursor-pointer hover:bg-white/5 transition-all"
               onClick={() => onSuspectClick(fir.suspectName)}>
            <div className="text-[10px] text-blue-400 mb-1 flex items-center gap-1">
              <span>{isKn ? 'ಅಪಗ್ರಹಿ' : 'Suspect'}</span>
              <span className="text-[8px] bg-blue-500/20 px-1 rounded font-normal text-blue-300">View Profile</span>
            </div>
            <div className="text-sm text-white font-medium underline decoration-blue-500 decoration-dotted">{fir.suspectName}</div>
            <div className="text-xs text-gray-400 mt-0.5">{fir.suspectAge ? `${fir.suspectAge} ${isKn ? 'ವರ್ಷ' : 'years'}` : (isKn ? 'ವಯಸ್ಸು ತಿಳಿಯದು' : 'Age unknown')}</div>
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1">{isKn ? 'ತನಿಖೆ ಅಧಿಕಾರಿ' : 'Investigating Officer'}</div>
          <div className="text-sm text-white">{fir.officerName}</div>
        </div>
        {fir.weaponUsed && (
          <div>
            <div className="text-xs text-gray-500 mb-1">{isKn ? 'ಬಳಸಿದ ಆಯುಧ' : 'Weapon Used'}</div>
            <div className="text-sm text-red-400">{fir.weaponUsed}</div>
          </div>
        )}
        <div>
          <div className="text-xs text-gray-500 mb-1">{isKn ? 'ಸಾಕ್ಷ್ಯದ ಸಂಖ್ಯೆ' : 'Evidence Count'}</div>
          <div className="text-sm text-white">{fir.evidenceCount} {isKn ? 'ವಸ್ತುಗಳು' : 'items'}</div>
        </div>
      </div>
    </motion.div>
  );
}

export default function FIRManagement() {
  const { language } = useUIStore();
  const { user } = useAuthStore();
  const isKn = language === 'kn';
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [districtId, setDistrictId] = useState('');
  const [crimeHeadId, setCrimeHeadId] = useState('');
  const [statusId, setStatusId] = useState('');
  const [selectedFIR, setSelectedFIR] = useState<FIR | null>(null);
  const [editingFIR, setEditingFIR] = useState<FIR | null>(null);
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const pageSize = 10;

  useEffect(() => {
    if (selectedFIR && user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: `View FIR Details: ${selectedFIR.firNumber}`,
        targetId: selectedFIR.id,
      }).catch(console.error);
    }
  }, [selectedFIR, user]);

  // Lookup queries
  const { data: districtsData } = useQuery({
    queryKey: ['districts'],
    queryFn: () => lookupApi.getDistricts(),
  });

  const { data: crimeHeadsData } = useQuery({
    queryKey: ['crimeHeads'],
    queryFn: () => lookupApi.getCrimeHeads(),
  });

  const { data: statusesData } = useQuery({
    queryKey: ['statuses'],
    queryFn: () => lookupApi.getCaseStatuses(),
  });

  const { data, isLoading } = useQuery({
    queryKey: ['firs', page, search, districtId, crimeHeadId, statusId],
    queryFn: async () => {
      return caseApi.getAll({
        page,
        pageSize,
        search,
        districtId: districtId ? Number(districtId) : undefined,
        crimeHeadId: crimeHeadId ? Number(crimeHeadId) : undefined,
        statusId: statusId ? Number(statusId) : undefined,
      });
    },
    placeholderData: prev => prev,
  });

  const showToastMessage = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const exportCSV = () => {
    if (!data?.items) return;
    const csv = toCSV(data.items, isKn);
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ksp-firs-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);

    if (user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: 'Export FIR CSV',
      }).catch(console.error);
    }
  };

  const handleDeleteFIR = async (id: string) => {
    if (confirm(isKn ? 'ಈ FIR ಅನ್ನು ಅಳಿಸಲು ನೀವು ಖಚಿತವಾಗಿ ಬಯಸುವಿರಾ?' : 'Are you sure you want to delete this FIR?')) {
      try {
        await caseApi.delete(Number(id));
        showToastMessage(isKn ? 'FIR ಅನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ' : 'FIR deleted successfully');
        queryClient.invalidateQueries({ queryKey: ['firs'] });

        if (user) {
          auditApi.log({
            performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
            role: user.rank || user.role,
            action: `Delete FIR: ${id}`,
            targetId: id,
          }).catch(console.error);
        }
      } catch (err) {
        console.error(err);
        showToastMessage(isKn ? 'FIR ಅಳಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to delete FIR');
      }
    }
  };

  const statusMap: Record<string, string> = {
    'Open': isKn ? 'ತೆರೆದಿದೆ' : 'Open',
    'Under Investigation': isKn ? 'ತನಿಖೆಯಲ್ಲಿದೆ' : 'Under Investigation',
    'Closed': isKn ? 'ಮುಚ್ಚಲಾಗಿದೆ' : 'Closed',
    'Pending': isKn ? 'ಬಾಕಿ ಇದೆ' : 'Pending',
    'Charge Sheeted': isKn ? 'ದೋಷಾರೋಪಣೆ ಪಟ್ಟಿ ಸಲ್ಲಿಕೆಯಾಗಿದೆ' : 'Charge Sheeted',
    'Undetected': isKn ? 'ಪತ್ತೆಯಾಗಿಲ್ಲ' : 'Undetected',
    'Critical': isKn ? 'ಅತಿ ಗಂಭೀರ' : 'Critical',
    'High': isKn ? 'ಹೆಚ್ಚು' : 'High',
    'Medium': isKn ? 'ಮಧ್ಯಮ' : 'Medium',
    'Low': isKn ? 'ಕಡಿಮೆ' : 'Low',
  };

  return (
    <div className="space-y-4">
      <SectionHeader title={isKn ? 'FIR ನಿರ್ವಹಣೆ' : 'FIR Management'} subtitle={isKn ? `ಒಟ್ಟು ${data?.total ?? 0} ದಾಖಲೆಗಳು` : `Total ${data?.total ?? 0} records`}
        right={
          (user?.role === 'Admin' || user?.role === 'Analyst') && (
            <button onClick={exportCSV} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors">
              <Download size={14} /> {isKn ? 'CSV ನಿರ್ಯಾತಿಸಿ' : 'Export CSV'}
            </button>
          )
        }
      />

      {/* Filters */}
      <GlassCard padding={false}>
        <div className="p-4 flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder={isKn ? 'FIR ಸಂಖ್ಯೆ, ಅಪರಾಧ ವಿಧ, ಪೀಡಿತರು ಹುಡುಕಿ…' : 'Search FIR number, crime type, victims...'}
              className="w-full bg-[#1a2435] border border-[#1F2D40] text-sm text-gray-200 placeholder-gray-500 rounded-xl pl-9 pr-4 py-2 focus:border-blue-500 transition-colors"
            />
          </div>
          <FilterSelect value={districtId} onChange={v => { setDistrictId(v); setPage(1); }}
            options={(districtsData ?? []).map(d => ({ value: String(d.district_id), label: d.district_name }))} placeholder={isKn ? 'ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು' : 'All Districts'} />
          <FilterSelect value={crimeHeadId} onChange={v => { setCrimeHeadId(v); setPage(1); }}
            options={(crimeHeadsData ?? []).map(c => ({ value: String(c.crime_head_id), label: c.crime_group_name }))} placeholder={isKn ? 'ಎಲ್ಲಾ ಅಪರಾಧ ಪ್ರಕಾರಗಳು' : 'All Crime Types'} />
          <FilterSelect value={statusId} onChange={v => { setStatusId(v); setPage(1); }}
            options={(statusesData ?? []).map(s => ({ value: String(s.case_status_id), label: statusMap[s.case_status_name] ?? s.case_status_name }))} placeholder={isKn ? 'ಎಲ್ಲಾ ಸ್ಥಿತಿಗಳು' : 'All Statuses'} />
          {(districtId || crimeHeadId || statusId || search) && (
            <button onClick={() => { setDistrictId(''); setCrimeHeadId(''); setStatusId(''); setSearch(''); setPage(1); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400 hover:bg-red-500/20 transition-colors">
              <X size={12} /> {isKn ? 'ತೆರವುಗೊಳಿಸಿ' : 'Clear'}
            </button>
          )}
        </div>
      </GlassCard>

      {/* Table */}
      <GlassCard padding={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-[#1F2D40]">
                {(isKn ? ['FIR ಸಂಖ್ಯೆ', 'ಅಪರಾಧ ವಿಧ', 'ಪೀಡಿತ', 'ಅಪಗ್ರಹಿ', 'ಅಧಿಕಾರಿ', 'ಜಿಲ್ಲೆ', 'ಸ್ಥಿತಿ', 'ತೀವ್ರತೆ', 'ದಿನಾಂಕ', 'ಕ್ರಮಾಗಳು'] : ['FIR Number', 'Crime Type', 'Victim', 'Suspect', 'Officer', 'District', 'Status', 'Severity', 'Date', 'Actions']).map(h => (
                  <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-[#1F2D40]/50">
                    {Array.from({ length: 10 }).map((_, j) => (
                      <td key={j} className="px-4 py-3"><div className="skeleton h-3 w-24 rounded-full" /></td>
                    ))}
                  </tr>
                ))
              ) : data?.items.map(fir => (
                <tr key={fir.id} className="border-b border-[#1F2D40]/50 table-row-hover transition-colors">
                  <td className="px-4 py-3 font-mono text-blue-400 font-medium whitespace-nowrap">{fir.firNumber}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{fir.crimeType}</td>
                  <td className="px-4 py-3 text-gray-300 whitespace-nowrap">{fir.victimName}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fir.suspectName}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap max-w-[100px] truncate">{fir.officerName}</td>
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{fir.district}</td>
                  <td className="px-4 py-3"><StatusBadge status={statusMap[fir.status] ?? fir.status} /></td>
                  <td className="px-4 py-3"><StatusBadge status={statusMap[fir.severity] ?? fir.severity} /></td>
                  <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(fir.dateReported).toLocaleDateString()}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <button onClick={() => setSelectedFIR(fir)}
                        className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-colors" aria-label="View FIR">
                        <Eye size={13} />
                      </button>
                      {(user?.role === 'Admin' || user?.role === 'Officer') && (
                        <button onClick={() => setEditingFIR(fir)}
                          className="p-1.5 rounded-lg hover:bg-amber-500/20 text-gray-400 hover:text-amber-400 transition-colors" aria-label="Edit FIR">
                          <Edit size={13} />
                        </button>
                      )}
                      {user?.role === 'Admin' && (
                        <button onClick={() => handleDeleteFIR(fir.id)}
                          className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" aria-label="Delete FIR">
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data && (
          <div className="px-4 py-3 border-t border-[#1F2D40] flex items-center justify-between">
            <span className="text-xs text-gray-500">
              {isKn 
                ? `${((page-1)*pageSize)+1}–${Math.min(page*pageSize, data.total)} / ${data.total} ತೋರಿಸಲಾಗಿದೆ`
                : `Showing ${((page-1)*pageSize)+1}–${Math.min(page*pageSize, data.total)} of ${data.total} items`}
            </span>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page === 1}
                className="p-1.5 rounded-lg border border-[#1F2D40] text-gray-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronLeft size={14} /></button>
              <span className="text-xs text-gray-400 px-2">{isKn ? `ಪುಟ ${page} / ${data.totalPages}` : `Page ${page} of ${data.totalPages}`}</span>
              <button onClick={() => setPage(p => Math.min(data.totalPages, p+1))} disabled={page === data.totalPages}
                className="p-1.5 rounded-lg border border-[#1F2D40] text-gray-400 hover:text-white disabled:opacity-30 transition-colors"><ChevronRight size={14} /></button>
            </div>
          </div>
        )}
      </GlassCard>

      {/* Drawer */}
      <AnimatePresence>
        {selectedFIR && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40" onClick={() => setSelectedFIR(null)} />
            <FIRDrawer fir={selectedFIR} onClose={() => setSelectedFIR(null)} onSuspectClick={(name) => setSelectedSuspect(name)} />
          </>
        )}
      </AnimatePresence>

      {/* Criminal Profile Modal */}
      <AnimatePresence>
        {selectedSuspect && (
          <CriminalProfileModal suspectName={selectedSuspect} onClose={() => setSelectedSuspect(null)} isKn={isKn} />
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <AnimatePresence>
        {editingFIR && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50" onClick={() => setEditingFIR(null)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#111827] rounded-2xl border border-[#1F2D40] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2D40]">
                  <span className="text-sm font-bold text-white">
                    {isKn ? "FIR ತಿದ್ದುಪಡಿ" : "Edit FIR"} - {editingFIR.firNumber}
                  </span>
                  <button onClick={() => setEditingFIR(null)} className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
                </div>
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const form = e.target as HTMLFormElement;
                  const formData = new FormData(form);
                  const patch = {
                    status: formData.get('status') as any,
                    officerName: formData.get('officerName') as string,
                    description: formData.get('description') as string,
                  };
                  try {
                    await caseApi.update(Number(editingFIR.id), patch);
                    showToastMessage(isKn ? 'FIR ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ' : 'FIR updated successfully');
                    
                    if (user) {
                      auditApi.log({
                        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
                        role: user.rank || user.role,
                        action: `Edit FIR: ${editingFIR.firNumber}`,
                        targetId: editingFIR.id,
                      }).catch(console.error);
                    }

                    setEditingFIR(null);
                    queryClient.invalidateQueries({ queryKey: ['firs'] });
                  } catch (err) {
                    console.error(err);
                    showToastMessage(isKn ? 'FIR ನವೀಕರಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to update FIR');
                  }
                }} className="p-6 space-y-4">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">{isKn ? 'ಸ್ಥಿತಿ' : 'Status'}</label>
                    <select name="status" defaultValue={editingFIR.status}
                      className="w-full bg-[#1a2435] border border-[#1F2D40] text-sm text-[#CCCCCC] rounded-xl px-3 py-2.5 focus:border-blue-500 transition-colors">
                      {['Open', 'Under Investigation', 'Closed', 'Pending'].map(s => (
                        <option key={s} value={s}>{statusMap[s] ?? s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">{isKn ? 'ತನಿಖಾಧಿಕಾರಿ' : 'Investigating Officer'}</label>
                    <input name="officerName" defaultValue={editingFIR.officerName} required
                      className="w-full bg-[#1a2435] border border-[#1F2D40] text-sm text-gray-200 rounded-xl px-4 py-2.5 focus:border-blue-500 transition-colors" />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">{isKn ? 'ವಿವರಣೆ' : 'Description'}</label>
                    <textarea name="description" defaultValue={editingFIR.description} rows={3} required
                      className="w-full bg-[#1a2435] border border-[#1F2D40] text-sm text-gray-200 rounded-xl px-4 py-2 focus:border-blue-500 transition-colors" />
                  </div>
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => setEditingFIR(null)} className="flex-1 py-2.5 rounded-xl border border-[#1F2D40] text-sm text-gray-400 hover:text-white transition-colors">
                      {isKn ? "ರದ್ದುಮಾಡಿ" : "Cancel"}
                    </button>
                    <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                      {isKn ? "ಉಳಿಸಿ" : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#111827] border border-green-500/30 rounded-2xl shadow-2xl text-sm text-green-400">
          <CheckCircle size={16} /> {toast}
        </div>
      )}
    </div>
  );
}
