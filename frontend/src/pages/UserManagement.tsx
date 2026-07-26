import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Shield, Edit, Search, CheckSquare, X } from 'lucide-react';
import { usersApi } from '../mockApi';
import { GlassCard, SectionHeader, StatusBadge, FilterSelect } from '../components/ui';
import { formatDistanceToNow } from 'date-fns';
import { kn } from 'date-fns/locale';
import type { Officer } from '../types';
import { useUIStore } from '../context/uiStore';

const ROLE_PERMS: Record<string, Record<string, string[]>> = {
  kn: {
    Admin: ['FIR ವೀಕ್ಷಣೆ', 'FIR ತಿದ್ದುಪಡಿ', 'FIR ಅಳಿಸುವಿಕೆ', 'ನೆಟ್‌ವರ್ಕ್ ವೀಕ್ಷಣೆ', 'ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ', 'ವರದಿಗಳ ರಫ್ತು', 'ಮುನ್ಸೂಚನೆಗಳ ವೀಕ್ಷಣೆ', 'ಸಾಕ್ಷ್ಯಗಳ ನಿರ್ವಹಣೆ'],
    Analyst: ['FIR ವೀಕ್ಷಣೆ', 'ನೆಟ್‌ವರ್ಕ್ ವೀಕ್ಷಣೆ', 'ವರದಿಗಳ ರಫ್ತು', 'ಮುನ್ಸೂಚನೆಗಳ ವೀಕ್ಷಣೆ'],
    Officer: ['FIR ವೀಕ್ಷಣೆ', 'FIR ತಿದ್ದುಪಡಿ', 'ನೆಟ್‌ವರ್ಕ್ ವೀಕ್ಷಣೆ', 'ಮುನ್ಸೂಚನೆಗಳ ವೀಕ್ಷಣೆ'],
  },
  en: {
    Admin: ['View FIR', 'Modify FIR', 'Delete FIR', 'View Network', 'User Management', 'Export Reports', 'View Predictions', 'Manage Evidence'],
    Analyst: ['View FIR', 'View Network', 'Export Reports', 'View Predictions'],
    Officer: ['View FIR', 'Modify FIR', 'View Network', 'View Predictions'],
  }
};

export default function UserManagement() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [editingOfficer, setEditingOfficer] = useState<Officer | null>(null);
  const [selectedRole, setSelectedRole] = useState<'Admin' | 'Officer' | 'Analyst'>('Officer');
  const [toast, setToast] = useState('');
  const { language } = useUIStore();
  const isKn = language === 'kn';

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3500);
  };

  const { data: officers = [], isLoading, refetch } = useQuery({ queryKey: ['officers'], queryFn: usersApi.getAll });
  const { data: auditLogs = [] } = useQuery({ queryKey: ['audit'], queryFn: usersApi.getAuditLogs });

  const filtered = officers.filter((o: Officer) =>
    (!search || o.name.toLowerCase().includes(search.toLowerCase()) || o.badgeNumber.includes(search)) &&
    (!roleFilter || o.role === roleFilter)
  );

  const handleDelete = async (id: string) => {
    if (!confirm(isKn ? 'ಈ ಅಧಿಕಾರಿಯ ಖಾತೆಯನ್ನು ಅಳಿಸುವುದೇ?' : 'Are you sure you want to delete this officer\'s account?')) return;
    await usersApi.delete(id);
    showToast(isKn ? 'ಅಧಿಕಾರಿಯ ಖಾತೆ ಅಳಿಸಲಾಗಿದೆ' : 'Officer account deleted successfully');
    refetch();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const data = Object.fromEntries(new FormData(form));
    const officerData = {
      name: data.name as string,
      rank: data.rank as string,
      email: data.email as string,
      role: selectedRole,
      station: data.station as string,
      district: data.district as string,
      ...(editingOfficer ? { status: data.status as any } : {}),
    };
    if (editingOfficer) {
      await usersApi.update(editingOfficer.id, officerData);
      showToast(isKn ? 'ಅಧಿಕಾರಿಯ ವಿವರಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ನವೀಕರಿಸಲಾಗಿದೆ' : 'Officer details updated successfully!');
      setEditingOfficer(null);
    } else {
      await usersApi.create(officerData);
      showToast(isKn ? 'ಹೊಸ ಅಧಿಕಾರಿಯ ಖಾತೆ ಯಶಸ್ವಿಯಾಗಿ ಸೃಷ್ಟಿಸಲಾಗಿದೆ' : 'New officer created successfully!');
      setAddOpen(false);
    }
    refetch();
  };

  const roleLabels: Record<string, Record<string, string>> = {
    kn: {
      Admin: 'ಅಡ್ಮಿನ್',
      Officer: 'ತನಿಖಾಧಿಕಾರಿ',
      Analyst: 'ವಿಶ್ಲೇಷಕರು',
    },
    en: {
      Admin: 'Admin',
      Officer: 'Officer',
      Analyst: 'Analyst',
    }
  };

  return (
    <div className="space-y-5 relative">
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed top-20 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#111827] border border-blue-500/40 rounded-2xl text-xs text-blue-400 font-semibold shadow-2xl">
            <CheckSquare size={16} className="text-green-400" /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHeader 
        title={isKn ? "ಬಳಕೆದಾರರ ನಿರ್ವಹಣೆ" : "User Management"} 
        subtitle={isKn ? "ಅಧಿಕಾರಿಗಳು, ಪಾತ್ರಗಳು ಮತ್ತು ಅನುಮತಿಗಳನ್ನು ನಿರ್ವಹಿಸಿ (ಅಡ್ಮಿನ್ ಮಾತ್ರ)" : "Manage officers, roles, and permissions (Admin Only)"}
        right={
          <button onClick={() => setAddOpen(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors">
            <Plus size={14} /> {isKn ? "ಅಧಿಕಾರಿ ಸೇರಿಸಿ" : "Add Officer"}
          </button>
        }
      />

      {/* Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <GlassCard padding={false}>
            <div className="p-4 flex gap-3">
              <div className="relative flex-1">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
                <input value={search} onChange={e => setSearch(e.target.value)} 
                  placeholder={isKn ? "ಅಧಿಕಾರಿಗಳನ್ನು ಹುಡುಕಿ…" : "Search officers..."}
                  className="w-full bg-[#1a2435] border border-[#1F2D40] text-sm text-gray-200 placeholder-gray-500 rounded-xl pl-9 pr-4 py-2 focus:border-blue-500 transition-colors" />
              </div>
              <FilterSelect value={roleFilter} onChange={setRoleFilter}
                options={isKn ? [
                  {value:'Admin',label:'ಅಡ್ಮಿನ್'},
                  {value:'Officer',label:'ಅಧಿಕಾರಿ'},
                  {value:'Analyst',label:'ವಿಶ್ಲೇಷಕರು'}
                ] : [
                  {value:'Admin',label:'Admin'},
                  {value:'Officer',label:'Officer'},
                  {value:'Analyst',label:'Analyst'}
                ]}
                placeholder={isKn ? "ಎಲ್ಲಾ ಪಾತ್ರಗಳು" : "All Roles"} />
            </div>
          </GlassCard>

          {/* Officers table */}
          <GlassCard padding={false}>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="border-b border-[#1F2D40]">
                  {(isKn 
                    ? ['ಹೆಸರು','ಬ್ಯಾಡ್ಜ್','ಪಾತ್ರ','ಜಿಲ್ಲೆ','ಠಾಣೆ','ಸ್ಥಿತಿ','ಕ್ರಿಯೆಗಳು']
                    : ['Name', 'Badge', 'Role', 'District', 'Station', 'Status', 'Actions']
                  ).map(h => (
                    <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {isLoading ? Array.from({length:6}).map((_,i) => (
                    <tr key={i} className="border-b border-[#1F2D40]/50">
                      {Array.from({length:7}).map((_,j) => <td key={j} className="px-4 py-3"><div className="skeleton h-3 w-20 rounded-full" /></td>)}
                    </tr>
                  )) : filtered.map((o: Officer) => (
                    <tr key={o.id} className="border-b border-[#1F2D40]/50 table-row-hover transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {o.name.split(' ').map(n => n[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <div className="text-white font-medium whitespace-nowrap">{o.name}</div>
                            <div className="text-gray-500 text-[10px]">{o.rank}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-mono text-blue-400">{o.badgeNumber}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={roleLabels[language]?.[o.role] ?? roleLabels['en']?.[o.role] ?? o.role} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{o.district}</td>
                      <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{o.station}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={o.status === 'Active' ? (isKn ? 'ಸಕ್ರಿಯ' : 'Active') : o.status === 'On Leave' ? (isKn ? 'ರಜೆಯಲ್ಲಿದ್ದಾರೆ' : 'On Leave') : o.status === 'Suspended' ? (isKn ? 'ಅಮಾನತುಗೊಂಡಿದ್ದಾರೆ' : 'Suspended') : o.status} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          <button onClick={() => { setEditingOfficer(o); setSelectedRole(o.role); }} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-colors" aria-label="Edit"><Edit size={13} /></button>
                          <button onClick={() => handleDelete(o.id)} className="p-1.5 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-colors" aria-label="Delete"><Trash2 size={13} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </div>

        {/* Right panel: Permissions + Audit */}
        <div className="space-y-4">
          <GlassCard title={isKn ? "ಅನುಮತಿಗಳ ಮ್ಯಾಟ್ರಿಕ್ಸ್" : "Permissions Matrix"}>
            <div className="space-y-3">
              {(['Admin','Officer','Analyst'] as const).map(role => (
                <div key={role} className="space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-white">
                    <Shield size={12} className={role === 'Admin' ? 'text-red-400' : role === 'Analyst' ? 'text-green-400' : 'text-blue-400'} />
                    {roleLabels[language]?.[role] ?? roleLabels['en']?.[role] ?? role}
                  </div>
                  <div className="ml-4 space-y-1">
                    {(ROLE_PERMS[language] ?? ROLE_PERMS['en'])[role].map(perm => (
                      <div key={perm} className="flex items-center gap-1.5 text-[11px] text-gray-400">
                        <CheckSquare size={10} className="text-green-400" />{perm}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard title={isKn ? "ಆಡಿಟ್ ಲಾಗ್" : "Audit Log"} padding={false}>
            <div className="divide-y divide-[#1F2D40] max-h-[300px] overflow-y-auto">
              {auditLogs.slice(0, 15).map((log: any) => {
                let actKan = log.action;
                if (isKn) {
                  if (log.action.includes('User logged in')) actKan = 'ಬಳಕೆದಾರರು ಲಾಗಿನ್ ಆಗಿದ್ದಾರೆ';
                  if (log.action.includes('FIR modified')) actKan = 'FIR ತಿದ್ದುಪಡಿ ಮಾಡಲಾಗಿದೆ';
                  if (log.action.includes('Generated report')) actKan = 'ವರದಿ ತಯಾರಿಸಲಾಗಿದೆ';
                  if (log.action.includes('Evidence uploaded')) actKan = 'ಸಾಕ್ಷ್ಯ ಅಪ್‌ಲೋಡ್ ಮಾಡಲಾಗಿದೆ';
                }
                return (
                  <div key={log.id} className="px-4 py-2.5 hover:bg-white/5 transition-colors">
                    <div className="text-xs font-medium text-white">{actKan}</div>
                    <div className="text-[10px] text-gray-500">{log.performedBy} · {log.ipAddress}</div>
                    <div className="text-[10px] text-gray-600">{formatDistanceToNow(new Date(log.timestamp), { addSuffix: true, locale: isKn ? kn : undefined })}</div>
                  </div>
                );
              })}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Add / Edit Officer modal */}
      <AnimatePresence>
        {(addOpen || editingOfficer) && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-50" onClick={() => { setAddOpen(false); setEditingOfficer(null); }} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="bg-[#111827] rounded-2xl border border-[#1F2D40] w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2D40]">
                  <span className="text-sm font-bold text-white">
                    {editingOfficer 
                      ? (isKn ? "ಅಧಿಕಾರಿಯ ಖಾತೆ ತಿದ್ದಿ" : "Edit Officer Details") 
                      : (isKn ? "ಹೊಸ ಅಧಿಕಾರಿಯನ್ನು ಸೇರಿಸಿ" : "Add New Officer")}
                  </span>
                  <button onClick={() => { setAddOpen(false); setEditingOfficer(null); }} className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-3">
                  {(isKn ? [
                    { name: 'name', placeholder: 'ಪೂರ್ಣ ಹೆಸರು', label: 'ಹೆಸರು', value: editingOfficer?.name },
                    { name: 'rank', placeholder: 'ಉದಾ: ಸಬ್ ಇನ್ಸ್‌ಪೆಕ್ಟರ್', label: 'ಹುದ್ದೆ/ಶ್ರೇಣಿ', value: editingOfficer?.rank },
                    { name: 'email', placeholder: 'officer@ksp.gov.in', label: 'ಇಮೇಲ್ ವಿಳಾಸ', type: 'email', value: editingOfficer?.email },
                    { name: 'station', placeholder: 'ಪೊಲೀಸ್ ಠಾಣೆ', label: 'ಠಾಣೆ', value: editingOfficer?.station },
                    { name: 'district', placeholder: 'ಜಿಲ್ಲೆ', label: 'ಜಿಲ್ಲೆ', value: editingOfficer?.district },
                  ] : [
                    { name: 'name', placeholder: 'Full Name', label: 'Name', value: editingOfficer?.name },
                    { name: 'rank', placeholder: 'e.g., Sub Inspector', label: 'Rank/Designation', value: editingOfficer?.rank },
                    { name: 'email', placeholder: 'officer@ksp.gov.in', label: 'Email Address', type: 'email', value: editingOfficer?.email },
                    { name: 'station', placeholder: 'Police Station', label: 'Station', value: editingOfficer?.station },
                    { name: 'district', placeholder: 'District', label: 'District', value: editingOfficer?.district },
                  ]).map(f => (
                    <div key={f.name}>
                      <label className="block text-xs text-gray-400 mb-1">{f.label}</label>
                      <input name={f.name} type={f.type ?? 'text'} placeholder={f.placeholder} defaultValue={f.value ?? ''} required
                        className="w-full bg-[#1a2435] border border-[#1F2D40] text-sm text-gray-200 placeholder-gray-500 rounded-xl px-4 py-2.5 focus:border-blue-500 transition-colors" />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">
                      {isKn ? "ಪಾತ್ರ" : "Role"}
                    </label>
                    <div className="flex gap-2">
                      {(['Admin','Officer','Analyst'] as const).map(r => (
                        <button type="button" key={r} onClick={() => setSelectedRole(r)}
                          className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all ${selectedRole === r ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400' : 'border border-[#1F2D40] text-gray-400 hover:text-white'}`}>
                          {roleLabels[language]?.[r] ?? roleLabels['en']?.[r] ?? r}
                        </button>
                      ))}
                    </div>
                  </div>
                  {editingOfficer && (
                    <div>
                      <label className="block text-xs text-gray-400 mb-1">
                        {isKn ? "ಸ್ಥಿತಿ" : "Status"}
                      </label>
                      <select name="status" defaultValue={editingOfficer.status}
                        className="w-full bg-[#1a2435] border border-[#1F2D40] text-sm text-[#CCCCCC] rounded-xl px-3 py-2.5 focus:border-blue-500 transition-colors">
                        <option value="Active">{isKn ? 'ಸಕ್ರಿಯ' : 'Active'}</option>
                        <option value="On Leave">{isKn ? 'ರಜೆಯಲ್ಲಿದ್ದಾರೆ' : 'On Leave'}</option>
                        <option value="Suspended">{isKn ? 'ಅಮಾನತುಗೊಂಡಿದ್ದಾರೆ' : 'Suspended'}</option>
                      </select>
                    </div>
                  )}
                  <div className="flex gap-3 pt-2">
                    <button type="button" onClick={() => { setAddOpen(false); setEditingOfficer(null); }} className="flex-1 py-2.5 rounded-xl border border-[#1F2D40] text-sm text-gray-400 hover:text-white transition-colors">
                      {isKn ? "ರದ್ದುಮಾಡಿ" : "Cancel"}
                    </button>
                    <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium transition-colors">
                      {editingOfficer 
                        ? (isKn ? "ಬದಲಾವಣೆ ಉಳಿಸಿ" : "Save Changes") 
                        : (isKn ? "ಅಧಿಕಾರಿಯನ್ನು ರಚಿಸಿ" : "Create Officer")}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
