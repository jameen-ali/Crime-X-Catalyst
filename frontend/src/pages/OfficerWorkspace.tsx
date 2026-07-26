import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, FileText, CheckCircle, Clock, Star, BookOpen, AlertCircle, RefreshCw, Check, Trash2 } from 'lucide-react';
import { useAuthStore } from '../context/authStore';
import { GlassCard, SectionHeader, StatusBadge } from '../components/ui';
import { caseApi, auditApi, assignmentApi } from '../lib/supabaseApi';
import { formatDistanceToNow } from 'date-fns';
import { kn } from 'date-fns/locale';
import { useUIStore } from '../context/uiStore';

const NOTES_INIT_KN = [
  { id: '1', title: 'KSP/2024/01042 ಪ್ರಕರಣದ ಫಾಲೋ ಅಪ್', content: 'ಕೋರಮಂಗಲ ಜಂಕ್ಷನ್‌ನಿಂದ ಸಿಸಿಟಿವಿ ದೃಶ್ಯಾವಳಿಗಳನ್ನು ಸಂಗ್ರಹಿಸಬೇಕಾಗಿದೆ. ರಿಲಯನ್ಸ್ ಮಾಲ್ ಭದ್ರತಾ ಸಿಬ್ಬಂದಿಯನ್ನು ಸಂಪರ್ಕಿಸಿ.', date: new Date().toISOString(), pinned: true },
  { id: '2', title: 'ವಾಹನ KA 01 AB 3456 — ವಾಚ್ ಲಿಸ್ಟ್', content: 'ಅಪರಾಧದ ಸ್ಥಳದ ಬಳಿ ಶಂಕಿತ ವಾಹನ ಪತ್ತೆಯಾಗಿದೆ. ಮಾಲೀಕರ ಪೂರ್ಣ ಹಿನ್ನೆಲೆ ಪರಿಶೀಲನೆ ನಡೆಸಿ.', date: new Date(Date.now() - 86400000).toISOString(), pinned: false },
];

const NOTES_INIT_EN = [
  { id: '1', title: 'Follow-up on Case KSP/2024/01042', content: 'Need to collect CCTV footage from Koramangala junction. Contact Reliance Mall security staff.', date: new Date().toISOString(), pinned: true },
  { id: '2', title: 'Vehicle KA 01 AB 3456 — Watchlist', content: 'Suspected vehicle spotted near the crime scene. Perform a full background check on the owner.', date: new Date(Date.now() - 86400000).toISOString(), pinned: false },
];

export default function OfficerWorkspace() {
  const { user } = useAuthStore();
  const { language } = useUIStore();
  const isKn = language === 'kn';

  const [notes, setNotes] = useState<any[]>(() => {
    try {
      const saved = localStorage.getItem('ksp_officer_notes');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed reading notes from localStorage:', e);
    }
    return isKn ? NOTES_INIT_KN : NOTES_INIT_EN;
  });
  const [newNote, setNewNote] = useState('');
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [activeTab, setActiveTab] = useState<'assignments' | 'cases' | 'notes' | 'bookmarks' | 'history'>('assignments');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const saveNotesToStorage = (updatedNotes: any[]) => {
    setNotes(updatedNotes);
    try {
      localStorage.setItem('ksp_officer_notes', JSON.stringify(updatedNotes));
    } catch (e) {
      console.error('Failed saving notes to localStorage:', e);
    }
  };

  // Load real assignments from Supabase
  const { data: assignments = [], refetch: refetchAssignments, isLoading: loadingAssignments, error: assignmentsError } = useQuery({
    queryKey: ['officer-assignments', user?.id],
    queryFn: async () => {
      return assignmentApi.getAssignments();
    },
    retry: 1
  });

  // Setup Realtime Subscription to assignments table
  useEffect(() => {
    const unsubscribe = assignmentApi.subscribeToAssignments(() => {
      refetchAssignments();
      setToast(isKn ? 'ನಿಯೋಜನೆಗಳು ನವೀಕರಿಸಲ್ಪಟ್ಟಿವೆ' : 'Assignments synchronized in real-time');
      setTimeout(() => setToast(''), 3000);
    });
    return () => unsubscribe();
  }, [refetchAssignments, isKn]);

  const { data: casesData } = useQuery({
    queryKey: ['officer-cases', user?.id],
    queryFn: () => caseApi.getAll({ pageSize: 50 }),
  });

  const { data: auditLogs = [] } = useQuery({
    queryKey: ['officer-audit-logs'],
    queryFn: () => auditApi.getLogs(),
  });

  let assignedFIRs = casesData?.items.filter(f => f.officerName === user?.name) || [];
  if (assignedFIRs.length === 0 && casesData?.items.length) {
    assignedFIRs = casesData.items.slice(0, 8);
  }

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    setUpdatingId(id);
    try {
      await assignmentApi.updateAssignmentStatus(id, newStatus);
      await refetchAssignments();
      setToast(isKn ? 'ಸ್ಥಿತಿ ಬದಲಾವಣೆ ಯಶಸ್ವಿಯಾಗಿದೆ' : `Assignment status updated to ${newStatus}`);
    } catch (e) {
      console.error(e);
      setToast(isKn ? 'ಸ್ಥಿತಿ ಬದಲಾವಣೆ ವಿಫಲವಾಗಿದೆ' : 'Failed to update assignment');
    } finally {
      setUpdatingId(null);
      setTimeout(() => setToast(''), 3000);
    }
  };

  const TABS = [
    { id: 'assignments', label: isKn ? 'ಕಾರ್ಯ ಹಂಚಿಕೆಗಳು' : 'Work Assignments', icon: FileText },
    { id: 'cases', label: isKn ? 'ನನ್ನ ಪ್ರಕರಣಗಳು' : 'My Cases', icon: BookOpen },
    { id: 'notes', label: isKn ? 'ಟಿಪ್ಪಣಿಗಳು' : 'Notes', icon: Star },
    { id: 'bookmarks', label: isKn ? 'ಬುಕ್‌ಮಾರ್ಕ್‌ಗಳು' : 'Bookmarks', icon: Bookmark },
    { id: 'history', label: isKn ? 'ಚಟುವಟಿಕೆ ಲಾಗ್' : 'Activity Log', icon: Clock },
  ] as const;

  const addNote = () => {
    if (!newNoteTitle.trim() || !newNote.trim()) return;
    const noteObj = {
      id: `${Date.now()}`,
      title: newNoteTitle,
      content: newNote,
      date: new Date().toISOString(),
      pinned: false
    };
    const updated = [noteObj, ...notes];
    saveNotesToStorage(updated);
    setNewNote('');
    setNewNoteTitle('');
    setToast(isKn ? 'ಟಿಪ್ಪಣಿ ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ' : 'Note saved successfully');
    setTimeout(() => setToast(''), 3000);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter(n => n.id !== id);
    saveNotesToStorage(updated);
    setToast(isKn ? 'ಟಿಪ್ಪಣಿ ಅಳಿಸಲಾಗಿದೆ' : 'Note deleted');
    setTimeout(() => setToast(''), 3000);
  };

  const togglePinNote = (id: string) => {
    const updated = notes.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n);
    saveNotesToStorage(updated);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return 'border-green-500/30 bg-green-500/5 text-green-400';
      case 'Assigned': return 'border-blue-500/30 bg-blue-500/5 text-blue-400';
      case 'Pending': return 'border-amber-500/30 bg-amber-500/5 text-amber-400';
      default: return 'border-amber-500/30 bg-amber-500/5 text-amber-400';
    }
  };

  return (
    <div className="space-y-5">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#111827] border border-blue-500/30 rounded-2xl text-xs text-blue-400 font-semibold shadow-2xl">
            <RefreshCw className="animate-spin" size={14} /> {toast}
          </motion.div>
        )}
      </AnimatePresence>

      <SectionHeader 
        title={isKn ? "ಅಧಿಕಾರಿ ಕಾರ್ಯಸ್ಥಳ ಮತ್ತು ನಿಯೋಜನೆಗಳು" : "Officer Workspace & Work Assignments"} 
        subtitle={isKn ? `ಸ್ವಾಗತ, ${user?.name} · ${user?.rank} · ${user?.station}` : `Welcome, ${user?.name} · ${user?.rank} · ${user?.station}`} 
      />

      {/* Realtime Alert Banner */}
      <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
        <AlertCircle size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
        <p className="text-xs text-blue-300">
          {isKn ? (
            <><strong>ಲೈವ್ ನವೀಕರಣಗಳು ಸಕ್ರಿಯವಾಗಿವೆ</strong> — ಈ ಬೋರ್ಡ್ ಸೂಪರ್ವೈಸರ್ ಬದಲಾವಣೆಗಳನ್ನು ಮತ್ತು ನಿಯೋಜನೆ ಸ್ಥಿತಿಗಳನ್ನು ನೈಜ ಸಮಯದಲ್ಲಿ ಸಿಂಕ್ ಮಾಡುತ್ತದೆ.</>
          ) : (
            <><strong>Live status board enabled</strong> — This workspace syncs assignment updates and supervisor telemetry changes in real-time.</>
          )}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-[#111827] rounded-xl border border-[#1F2D40] w-fit overflow-x-auto">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${activeTab === id ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'text-gray-400 hover:text-white'}`}>
            <Icon size={13} />{label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        {activeTab === 'assignments' && (
          <motion.div key="assignments" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {loadingAssignments ? (
                <div className="col-span-2 flex flex-col items-center justify-center py-12 space-y-3">
                  <RefreshCw className="animate-spin text-blue-500" size={24} />
                  <span className="text-xs text-gray-400">{isKn ? 'ನಿಯೋಜನೆಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...' : 'Loading assignments...'}</span>
                </div>
              ) : assignmentsError ? (
                <div className="col-span-2 p-6 rounded-2xl border border-red-500/20 bg-red-500/5 text-center">
                  <AlertCircle className="text-red-500 mx-auto mb-2" size={20} />
                  <p className="text-xs text-red-400 font-bold">
                    {isKn ? 'ನಿಯೋಜನೆಗಳನ್ನು ಪಡೆಯುವಲ್ಲಿ ವಿಫಲವಾಗಿದೆ' : 'Failed to load assignments'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">{(assignmentsError as any)?.message || 'Supabase connection error'}</p>
                  <button onClick={() => refetchAssignments()} className="mt-3.5 px-3 py-1.5 rounded-xl bg-red-500/20 hover:bg-red-500/30 text-red-400 text-[10px] font-semibold transition-colors">
                    {isKn ? 'ಮರುಪ್ರಯತ್ನಿಸಿ' : 'Retry'}
                  </button>
                </div>
              ) : assignments.length === 0 ? (
                <div className="col-span-2 text-center text-xs text-gray-500 py-10">No assignments mapped to this station.</div>
              ) : (
                assignments.map((task: any) => {
                  const caseNo = task.ref_id || task.case_no || 'REF-GEN';
                  
                  const title = task.title || (isKn 
                    ? `${task.type === 'Case' ? 'ಪ್ರಕರಣ ತನಿಖೆ' : task.type === 'Evidence Review' ? 'ಸಾಕ್ಷ್ಯ ಪರಿಶೀಲನೆ' : task.type === 'Patrol Duty' ? 'ಗಸ್ತು ಕರ್ತವ್ಯ' : 'ವಿಶೇಷ ತನಿಖೆ'} (${caseNo})`
                    : `${task.type || 'Investigation'} Duty (${caseNo})`
                  );

                  const description = task.description || (isKn
                    ? `${task.type === 'Case' ? 'ನಿಗದಿಪಡಿಸಿದ ಪ್ರಕರಣದ ಸಂಪೂರ್ಣ ತನಿಖೆ ನಡೆಸಿ, ಸಾಕ್ಷ್ಯಗಳನ್ನು ಸಂಗ್ರಹಿಸಿ ವರದಿ ಸಲ್ಲಿಸಿ.' : task.type === 'Evidence Review' ? 'ಪ್ರಕರಣಕ್ಕೆ ಸಂಬಂಧಿಸಿದ ಸಿಸಿಟಿವಿ ದೃಶ್ಯಾವಳಿಗಳು ಮತ್ತು ಫೋರೆನ್ಸಿಕ್ ಪುರಾವೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.' : task.type === 'Patrol Duty' ? 'ನಿಯೋಜಿತ ವಲಯದಲ್ಲಿ ಗಸ್ತು ನಡೆಸಿ ಮತ್ತು ಕಾನೂನು ಸುವ್ಯವಸ್ಥೆ ಕಾಪಾಡಿ.' : 'ಗಂಭೀರ ಅಪರಾಧ ಪ್ರಕರಣದ ಕುರಿತು ವಿವರವಾದ ತನಿಖೆ ನಡೆಸಿ ವರದಿ ನೀಡಿ.'} ಪ್ರಗತಿ ಹಂತ: ${task.progress || 0}%.`
                    : `Perform complete operational activities related to ${task.type || 'investigation'} reference ${caseNo}. Due date for submission: ${task.due_date || 'N/A'}. Target progress: ${task.progress || 0}%.`
                  );

                  return (
                    <div key={task.id} className={`p-5 rounded-3xl border transition-all ${getStatusColor(task.status)}`}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-blue-500">{caseNo}</span>
                          <h4 className="text-sm font-bold text-white mt-1">{title}</h4>
                        </div>
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black tracking-wider uppercase border border-current">
                          {task.status}
                        </span>
                      </div>

                      <p className="text-xs text-gray-400 mt-3.5 leading-relaxed">{description}</p>

                      <div className="flex items-center justify-between gap-3 mt-5 pt-4 border-t border-white/5">
                        <span className="text-[10px] text-gray-500">
                          {isKn ? 'ನಿಯೋಜಿಸಲಾಗಿದೆ: ' : 'Assigned: '}
                          {new Date(task.created_at).toLocaleDateString()}
                        </span>

                        <div className="flex gap-1.5">
                          {task.status === 'Pending' && (
                            <button onClick={() => handleStatusUpdate(task.id, 'Assigned')} disabled={updatingId === task.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-[10px] font-semibold transition-all">
                              {updatingId === task.id ? <RefreshCw className="animate-spin" size={10} /> : <Check size={10} />}
                              {isKn ? 'ಸ್ವೀಕರಿಸಿ' : 'Accept'}
                            </button>
                          )}

                          {task.status === 'Assigned' && (
                            <button onClick={() => handleStatusUpdate(task.id, 'Completed')} disabled={updatingId === task.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-[10px] font-semibold transition-all">
                              {updatingId === task.id ? <RefreshCw className="animate-spin" size={10} /> : <CheckCircle size={10} />}
                              {isKn ? 'ಪೂರ್ಣಗೊಳಿಸಿ' : 'Complete'}
                            </button>
                          )}

                          {task.status === 'Completed' && (
                            <button onClick={() => handleStatusUpdate(task.id, 'Pending')} disabled={updatingId === task.id}
                              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gray-700 hover:bg-gray-600 text-white text-[10px] font-semibold transition-all">
                              {updatingId === task.id ? <RefreshCw className="animate-spin" size={10} /> : <RefreshCw size={10} />}
                              {isKn ? 'ಮರುಪ್ರಾರಂಭಿಸಿ' : 'Reopen'}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}

        {activeTab === 'cases' && (
          <motion.div key="cases" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassCard title={isKn ? "ಸಕ್ರಿಯ ಪ್ರಕರಣಗಳು" : "Active Cases"} padding={false}>
              <div className="divide-y divide-[#1F2D40]">
                {assignedFIRs.map(f => (
                  <div key={f.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors">
                    <Clock size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-mono text-blue-400">{f.firNumber}</span>
                        <StatusBadge status={isKn ? (f.status === 'Closed' ? 'ಮುಚ್ಚಲಾಗಿದೆ' : f.status === 'Under Investigation' ? 'ತನಿಖೆಯಲ್ಲಿದೆ' : f.status === 'Pending' ? 'ಬಾಕಿ ಇದೆ' : f.status) : f.status} />
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">{f.crimeType} · {f.location}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">{formatDistanceToNow(new Date(f.dateReported), { addSuffix: true, locale: isKn ? kn : undefined })}</div>
                    </div>
                    <StatusBadge status={isKn ? (f.severity === 'Critical' ? 'ಅತಿ ಗಂಭೀರ' : f.severity === 'High' ? 'ಹೆಚ್ಚು' : f.severity === 'Medium' ? 'ಮಧ್ಯಮ' : f.severity === 'Low' ? 'ಕಡಿಮೆ' : f.severity) : f.severity} />
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'notes' && (
          <motion.div key="notes" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
            <GlassCard title={isKn ? "ಹೊಸ ಟಿಪ್ಪಣಿ ಬರೆಯಿರಿ" : "Write a New Note"}>
              <div className="space-y-3">
                <input value={newNoteTitle} onChange={e => setNewNoteTitle(e.target.value)} 
                  placeholder={isKn ? "ಟಿಪ್ಪಣಿಯ ಶೀರ್ಷಿಕೆ…" : "Note Title..."}
                  className="w-full bg-[#1a2435] border border-[#1F2D40] text-sm text-gray-200 placeholder-gray-500 rounded-xl px-4 py-2.5 focus:border-blue-500 transition-colors" />
                <textarea value={newNote} onChange={e => setNewNote(e.target.value)} 
                  placeholder={isKn ? "ನಿಮ್ಮ ತನಿಖಾ ಟಿಪ್ಪಣಿಯನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ…" : "Write your investigative note here..."}
                  rows={3} className="w-full bg-[#1a2435] border border-[#1F2D40] text-sm text-gray-200 placeholder-gray-500 rounded-xl px-4 py-2.5 focus:border-blue-500 transition-colors resize-none" />
                <button onClick={addNote} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors">
                  {isKn ? "ಟಿಪ್ಪಣಿ ಉಳಿಸಿ" : "Save Note"}
                </button>
              </div>
            </GlassCard>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {notes.map(note => (
                <motion.div key={note.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-2xl border transition-all ${note.pinned ? 'border-amber-500/30 bg-amber-500/5' : 'border-[#1F2D40] bg-[#111827]'}`}>
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-sm font-semibold text-white">{note.title}</div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button onClick={() => togglePinNote(note.id)} title={isKn ? "ಪಿನ್ ಮಾಡಿ" : "Pin note"}
                        className="p-1 rounded-lg hover:bg-white/10 transition-colors">
                        <Star size={14} className={note.pinned ? "text-amber-400 fill-amber-400" : "text-gray-500 hover:text-amber-400"} />
                      </button>
                      <button onClick={() => deleteNote(note.id)} title={isKn ? "ಅಳಿಸಿ" : "Delete note"}
                        className="p-1 rounded-lg hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 leading-relaxed whitespace-pre-wrap">{note.content}</div>
                  <div className="text-[10px] text-gray-500 mt-3">{formatDistanceToNow(new Date(note.date), { addSuffix: true, locale: isKn ? kn : undefined })}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {activeTab === 'bookmarks' && (
          <motion.div key="bookmarks" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <GlassCard title={isKn ? "ಉಳಿಸಿದ FIRಗಳು ಮತ್ತು ತನಿಖೆಗಳು" : "Saved FIRs and Investigations"} padding={false}>
              <div className="divide-y divide-[#1F2D40]">
                {(casesData?.items || []).slice(0, 5).map(f => (
                  <div key={f.id} className="flex items-center gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors">
                    <Bookmark size={14} className="text-purple-400 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="text-xs font-mono text-blue-400">{f.firNumber}</div>
                      <div className="text-xs text-gray-400">{f.crimeType} · {f.location}</div>
                    </div>
                    <StatusBadge status={isKn ? (f.status === 'Closed' ? 'ಮುಚ್ಚಲಾಗಿದೆ' : f.status === 'Under Investigation' ? 'ತನಿಖೆಯಲ್ಲಿದೆ' : f.status === 'Pending' ? 'ಬಾಕಿ ಇದೆ' : f.status) : f.status} />
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div key="history" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
            <GlassCard title={isKn ? "ಇತ್ತೀಚಿನ ಚಟುವಟಿಕೆಗಳು" : "Recent Activities"} padding={false}>
              <div className="divide-y divide-[#1F2D40]">
                {auditLogs.slice(0, 15).map(item => (
                  <div key={item.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/5 transition-colors">
                    <span className="text-base flex-shrink-0">📝</span>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-gray-300 line-clamp-1">
                        {item.performedBy} ({item.targetUser || 'Officer'}) performed {item.action} — {item.details}
                      </div>
                      <div className="text-[10px] text-gray-500">
                        {item.ipAddress} · {formatDistanceToNow(new Date(item.timestamp), { addSuffix: true, locale: isKn ? kn : undefined })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
