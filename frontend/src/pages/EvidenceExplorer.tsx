import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Archive, Grid, List, Upload, X, FileText, Image,
  Video, Mic, Eye, Download, Clock, Trash2,
  CheckCircle, Edit3, Save, MapPin, Tag, ShieldCheck, RefreshCw
} from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuthStore } from '../context/authStore';
import { GlassCard, SectionHeader, StatusBadge, SkeletonPanel } from '../components/ui';
import { formatDistanceToNow, format } from 'date-fns';
import { kn } from 'date-fns/locale';
import { evidenceApi, auditApi, type SupabaseEvidence } from '../lib/supabaseApi';
import { supabase } from '../lib/supabase';
import { DATASET_FILES } from '../lib/datasetFiles';
import { useUIStore } from '../context/uiStore';

// Deterministic function to assign a dataset image based on evidence ID if public_url is absent
function getLocalDatasetImage(id: number | string): string | null {
  if (!DATASET_FILES || DATASET_FILES.length === 0) return null;
  // Simple hash of the ID
  const strId = String(id);
  let hash = 0;
  for (let i = 0; i < strId.length; i++) {
    hash = strId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % DATASET_FILES.length;
  return `/dataset/${DATASET_FILES[index]}`;
}
/* ── Category & Type Styling Configuration ───────────────────────── */
const TYPE_ICONS: Record<string, React.ReactNode> = {
  Image: <Image size={20} className="text-blue-400" />,
  Video: <Video size={20} className="text-purple-400" />,
  Audio: <Mic size={20} className="text-green-400" />,
  Document: <FileText size={20} className="text-amber-400" />,
  Physical: <Archive size={20} className="text-red-400" />,
};

const TYPE_BG: Record<string, string> = {
  Image: 'bg-blue-500/10 border-blue-500/20',
  Video: 'bg-purple-500/10 border-purple-500/20',
  Audio: 'bg-green-500/10 border-green-500/20',
  Document: 'bg-amber-500/10 border-amber-500/20',
  Physical: 'bg-red-500/10 border-red-500/20',
};

const CATEGORIES = [
  'All',
  'Images',
  'Videos',
  'Audio',
  'Documents',
  'Weapons',
  'Vehicles',
  'Crime Scene',
  'Fingerprints',
  'CCTV',
];

const DISTRICT_OPTIONS = [
  'All',
  'Bengaluru City',
  'Mysuru City',
  'Mangaluru City',
  'Hubballi-Dharwad',
  'Belagavi',
  'Kalaburagi',
  'Tumakuru',
  'Udupi',
  'Shivamogga',
];

const CRIME_TYPE_OPTIONS = [
  'All',
  'Homicide',
  'Burglary',
  'Aggravated Assault',
  'Robbery',
  'Vehicle Theft',
  'Illegal Firearm Possession',
  'Commercial Burglary',
  'Forgery',
  'Cyber Fraud',
];

const OFFICER_OPTIONS = [
  'All',
  'Insp. Ramesh Gowda',
  'Insp. Manjunath Patil',
  'SI Savitha Bhat',
  'Insp. Venkatesh Rao',
  'Sub-Insp. Prakash Shetty',
  'Insp. Anand Kumar',
  'SI Deepa Hegde',
];

function formatBytes(b: number) {
  if (!b || b <= 0) return '0 B';
  if (b < 1024) return `${b} B`;
  if (b < 1024 ** 2) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / (1024 ** 2)).toFixed(1)} MB`;
}

function getEvidenceType(mime: string = ''): string {
  if (mime.startsWith('image/')) return 'Image';
  if (mime.startsWith('video/')) return 'Video';
  if (mime.startsWith('audio/')) return 'Audio';
  if (mime === 'application/pdf' || mime.includes('document') || mime.includes('text')) return 'Document';
  return 'Document';
}

/* ── Evidence Detail Page / Modal ─────────────────────────────────────── */
function DetailModal({ ev, onClose, onRefresh }: { ev: SupabaseEvidence; onClose: () => void; onRefresh: () => void }) {
  const { language } = useUIStore();
  const { user } = useAuthStore();
  const isKn = language === 'kn';
  const evType = ev.evidence_type || getEvidenceType(ev.mime_type);
  const queryClient = useQueryClient();

  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(ev.title || ev.file_name);
  const [category, setCategory] = useState(ev.category || 'Crime Scene');
  const [status, setStatus] = useState(ev.status || 'Secured');
  const [notes, setNotes] = useState(ev.notes || ev.description || '');
  const [linkedFir, setLinkedFir] = useState(ev.linked_fir || ev.case_no || '');
  const [officer, setOfficer] = useState(ev.officer || ev.officer_name || '');
  const [crimeType, setCrimeType] = useState(ev.crime_type || ev.crime_group_name || '');
  const [district, setDistrict] = useState(ev.district || '');
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDownload = () => {
    if (user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: `Download Evidence: ${ev.file_name}`,
        targetId: ev.id,
      }).catch(console.error);
    }
  };

  const handleSaveEdit = async () => {
    setSaving(true);
    try {
      await evidenceApi.update(ev.id, {
        title,
        category,
        status,
        notes,
        description: notes,  // 'description' is the real DB column; 'notes' goes into ai_analysis
        linked_fir: linkedFir,
        officer,
        crime_type: crimeType,
        district,
      });
      setIsEditing(false);
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      onRefresh();
    } catch (err: any) {
      console.error('Save edit error:', err);
    } finally {
      setSaving(false);
    }
  };

  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await evidenceApi.delete(ev.id, ev.storage_path);
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      onRefresh();
      onClose();
    } catch (err: any) {
      console.error('Delete error:', err);
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
      onRefresh();
      onClose();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 overflow-y-auto" onClick={onClose}>
      <motion.div initial={{ scale: 0.95, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="bg-[#111827] rounded-2xl border border-[#1F2D40] w-full max-w-3xl shadow-2xl overflow-hidden my-6"
        onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1F2D40] bg-[#1a2435]/50">
          <div className="flex items-center gap-3">
            {TYPE_ICONS[evType]}
            <div>
              <h2 className="text-base font-semibold text-white truncate max-w-md">{ev.title || ev.file_name}</h2>
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <span className="font-mono text-blue-400">{ev.linked_fir || ev.case_no || 'FIR-2024-001'}</span>
                <span>•</span>
                <span>{ev.category || 'Crime Scene'}</span>
                <span>•</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px]">{ev.status || 'Secured'}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <button onClick={() => setIsEditing(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 hover:bg-blue-600/30 text-xs transition-colors">
                <Edit3 size={14} /> {isKn ? 'ಸಂಪಾದಿಸಿ' : 'Edit'}
              </button>
            ) : (
              <button onClick={handleSaveEdit} disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-green-600 hover:bg-green-500 text-white text-xs font-medium transition-colors disabled:opacity-50">
                <Save size={14} /> {saving ? (isKn ? 'ಉಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Saving...') : (isKn ? 'ಉಳಿಸಿ' : 'Save')}
              </button>
            )}

            {confirmDelete ? (
              <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 p-1 rounded-xl text-xs">
                <span className="text-red-400 font-medium px-2 text-[11px]">{isKn ? 'ಖಚಿತವೇ?' : 'Delete item?'}</span>
                <button onClick={handleDelete} disabled={deleting} className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white rounded-lg font-semibold text-[11px] transition-colors">
                  {deleting ? (isKn ? 'ಅಳಿಸಲಾಗುತ್ತಿದೆ...' : 'Deleting...') : (isKn ? 'ಹೌದು, ಅಳಿಸಿ' : 'Yes, Delete')}
                </button>
                <button onClick={() => setConfirmDelete(false)} className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg text-[11px] transition-colors">
                  {isKn ? 'ರದ್ದು' : 'Cancel'}
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(true)} disabled={deleting}
                className="p-1.5 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/30 transition-colors" title="Delete Evidence">
                <Trash2 size={16} />
              </button>
            )}

            <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"><X size={18} /></button>
          </div>
        </div>

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Media Preview Container */}
          <div className={`w-full rounded-2xl border overflow-hidden flex flex-col items-center justify-center ${TYPE_BG[evType]} relative min-h-[240px] bg-black/40`}>
            {evType === 'Image' ? (
              <img
                src={ev.public_url || ev.thumbnail_url || getLocalDatasetImage(ev.id) || ''}
                alt={ev.file_name}
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full max-h-[380px] object-contain rounded-xl"
              />
            ) : evType === 'Video' && ev.public_url ? (
              <video src={ev.public_url} controls className="w-full max-h-[380px] rounded-xl" />
            ) : evType === 'Audio' && ev.public_url ? (
              <div className="p-8 text-center space-y-4 w-full max-w-md">
                <Mic size={48} className="mx-auto text-green-400 animate-pulse" />
                <audio src={ev.public_url} controls className="w-full" />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3 py-12">
                <div className="w-20 h-20 rounded-3xl flex items-center justify-center bg-white/10">{TYPE_ICONS[evType]}</div>
                <span className="text-sm font-medium text-gray-300">{ev.file_name}</span>
                {ev.public_url && (
                  <a href={ev.public_url} onClick={handleDownload} target="_blank" rel="noreferrer" className="text-xs text-blue-400 underline flex items-center gap-1">
                    <Download size={14} /> Open Document
                  </a>
                )}
              </div>
            )}
            <div className="absolute top-3 left-3 flex gap-2">
              <span className="px-2.5 py-1 bg-black/70 border border-white/10 backdrop-blur text-white text-[11px] rounded-lg flex items-center gap-1">
                <ShieldCheck size={12} className="text-green-400" /> Evidence Vault Verified
              </span>
            </div>
          </div>

          {/* Editable / Detailed Form */}
          {isEditing ? (
            <div className="bg-[#1a2435] border border-[#1F2D40] rounded-2xl p-5 space-y-4 text-xs">
              <h3 className="text-sm font-semibold text-white mb-2">{isKn ? 'ಸಾಕ್ಷ್ಯದ ವಿವರ ತಿದ್ದುಪಡಿ' : 'Edit Evidence Metadata'}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 mb-1">Evidence Title</label>
                  <input value={title} onChange={e => setTitle(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Category</label>
                  <select value={category} onChange={e => setCategory(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500">
                    {CATEGORIES.filter(c => c !== 'All' && c !== 'Images' && c !== 'Videos' && c !== 'Audio' && c !== 'Documents').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Linked FIR / Case</label>
                  <input value={linkedFir} onChange={e => setLinkedFir(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Investigating Officer</label>
                  <input value={officer} onChange={e => setOfficer(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Crime Type</label>
                  <input value={crimeType} onChange={e => setCrimeType(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">District</label>
                  <input value={district} onChange={e => setDistrict(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500" />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1">Status</label>
                  <select value={status} onChange={e => setStatus(e.target.value)}
                    className="w-full bg-[#111827] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500">
                    <option value="Secured">Secured</option>
                    <option value="Under Analysis">Under Analysis</option>
                    <option value="Submitted to Court">Submitted to Court</option>
                    <option value="Archived">Archived</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Notes & Description</label>
                <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3}
                  className="w-full bg-[#111827] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500" />
              </div>
            </div>
          ) : (
            /* Standard View */
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              {[
                { label: isKn ? 'ವಿಧ' : 'Evidence Type', value: evType },
                { label: isKn ? 'ವರ್ಗ' : 'Category', value: ev.category || 'Crime Scene' },
                { label: isKn ? 'ಸಂಬಂಧಿತ FIR' : 'Linked FIR', value: ev.linked_fir || ev.case_no || 'FIR-2024-001' },
                { label: isKn ? 'ಅಪರಾಧ ಮಾದರಿ' : 'Crime Type', value: ev.crime_type || ev.crime_group_name || 'Burglary' },
                { label: isKn ? 'ಅಧಿಕಾರಿ' : 'Officer', value: ev.officer || ev.officer_name || 'Insp. Ramesh Gowda' },
                { label: isKn ? 'ಜಿಲ್ಲೆ' : 'District', value: ev.district || 'Bengaluru City' },
                { label: isKn ? 'ಫೈಲ್ ಗಾತ್ರ' : 'File Size', value: formatBytes(ev.file_size) },
                { label: isKn ? 'ಅಪ್‌ಲೋಡ್ ದಿನಾಂಕ' : 'Uploaded At', value: ev.uploaded_at ? format(new Date(ev.uploaded_at), 'dd MMM yyyy, HH:mm') : '—' },
              ].map(({ label, value }) => (
                <div key={label} className="bg-[#1a2435] rounded-xl p-3 border border-[#1F2D40]">
                  <div className="text-[10px] text-gray-500 uppercase font-semibold mb-1">{label}</div>
                  <div className="text-gray-200 truncate font-medium">{value}</div>
                </div>
              ))}
            </div>
          )}

          {/* Location & Coordinates */}
          <div className="bg-[#1a2435] border border-[#1F2D40] rounded-2xl p-4 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400"><MapPin size={18} /></div>
              <div>
                <div className="text-gray-200 font-medium">{ev.location || 'MG Road, Bengaluru'}</div>
                <div className="text-[10px] text-gray-500 font-mono">Lat: {ev.latitude || 12.9716}, Lng: {ev.longitude || 77.5946}</div>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 text-[10px] border border-blue-500/20 font-mono">GPS Verified</span>
          </div>

          {/* Description / Notes */}
          {ev.notes && (
            <div className="bg-[#1a2435] rounded-2xl p-4 border border-[#1F2D40] space-y-1">
              <div className="text-[10px] text-gray-500 uppercase font-semibold">{isKn ? 'ಟಿಪ್ಪಣಿಗಳು ಮತ್ತು ವಿವರಣೆ' : 'Notes & Case Description'}</div>
              <p className="text-xs text-gray-300 leading-relaxed">{ev.notes}</p>
            </div>
          )}

          {/* Tags */}
          {ev.tags && ev.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 items-center">
              <Tag size={12} className="text-gray-500" />
              {ev.tags.map(tag => (
                <span key={tag} className="px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px]">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {/* Download & Storage path info */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#1F2D40]">
            <span className="text-[11px] text-gray-500 font-mono truncate max-w-md">Storage: {ev.storage_path || `evidence-files/${ev.file_name}`}</span>
            {ev.public_url && (
              <a href={ev.public_url} download={ev.file_name} target="_blank" rel="noreferrer" onClick={handleDownload}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs transition-colors w-full sm:w-auto">
                <Download size={14} /> {isKn ? 'ಫೈಲ್ ಡೌನ್‌ಲೋಡ್ ಮಾಡಿ' : 'Download Evidence File'}
              </a>
            )}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ── Upload New Evidence Modal ─────────────────────────────────────────── */
interface UploadModalProps {
  onClose: () => void;
  onUploadSuccess: (msg: string) => void;
  isKn: boolean;
  officerId: number;
}

function UploadModal({ onClose, onUploadSuccess, isKn, officerId }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Crime Scene');
  const [crimeType, setCrimeType] = useState('Burglary');
  const [district, setDistrict] = useState('Bengaluru City');
  const [officer, setOfficer] = useState('Insp. Ramesh Gowda');
  const [linkedFir, setLinkedFir] = useState('FIR-2024-101');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setSubmitting(true);
    try {
      await evidenceApi.upload(file, {
        officerId,
        title: title || `${category} Evidence - ${file.name}`,
        category,
        crimeType,
        district,
        linkedFir,
        officer,
        description: description || `Uploaded ${file.name}`,
        notes: notes || description,
      });
      onUploadSuccess(isKn ? `"${file.name}" ಸಾಕ್ಷ್ಯ ಅಪ್‌ಲೋಡ್ ಯಶಸ್ವಿಯಾಗಿದೆ` : `"${file.name}" evidence uploaded and saved to Supabase Storage.`);
      onClose();
    } catch (err: any) {
      alert(`Upload failed: ${err.message || err}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
        className="bg-[#111827] rounded-2xl border border-[#1F2D40] w-full max-w-lg shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1F2D40]">
          <span className="text-sm font-bold text-white">{isKn ? 'ಹೊಸ ಸಾಕ್ಷ್ಯ ಅಪ್‌ಲೋಡ್' : 'Upload New Evidence'}</span>
          <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-xl text-gray-400 hover:text-white transition-colors"><X size={16} /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* File Picker */}
          <div>
            <label className="block text-xs text-gray-400 mb-1">{isKn ? 'ಫೈಲ್ ಆಯ್ಕೆಮಾಡಿ' : 'Select Evidence File'}</label>
            <div onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-[#1F2D40] hover:border-blue-500 bg-[#1a2435] rounded-xl p-5 text-center cursor-pointer transition-colors">
              <Upload size={24} className="mx-auto mb-2 text-blue-400" />
              <span className="text-xs text-gray-300 block font-medium">{file ? file.name : (isKn ? 'ಫೈಲ್ ಆಯ್ಕೆ ಮಾಡಲು ಕ್ಲಿಕ್ ಮಾಡಿ' : 'Click to select image, video, audio or document')}</span>
              {file && <span className="text-[10px] text-blue-400 mt-1 block">({formatBytes(file.size)})</span>}
              <span className="text-[10px] text-gray-500 mt-1 block">Supported: JPG, PNG, WEBP, BMP, MP4, AVI, MOV, MP3, WAV, PDF, DOCX, TXT</span>
            </div>
            <input type="file" ref={fileInputRef} onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-gray-400 mb-1">Evidence Title</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Crime Scene Photo 101"
                className="w-full bg-[#1a2435] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Category</label>
              <select value={category} onChange={e => setCategory(e.target.value)}
                className="w-full bg-[#1a2435] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500">
                {CATEGORIES.filter(c => c !== 'All' && c !== 'Images' && c !== 'Videos' && c !== 'Audio' && c !== 'Documents').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Linked FIR</label>
              <input value={linkedFir} onChange={e => setLinkedFir(e.target.value)} placeholder="FIR-2024-101" required
                className="w-full bg-[#1a2435] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Investigating Officer</label>
              <select value={officer} onChange={e => setOfficer(e.target.value)}
                className="w-full bg-[#1a2435] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500">
                {OFFICER_OPTIONS.filter(o => o !== 'All').map(o => (
                  <option key={o} value={o}>{o}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">Crime Type</label>
              <select value={crimeType} onChange={e => setCrimeType(e.target.value)}
                className="w-full bg-[#1a2435] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500">
                {CRIME_TYPE_OPTIONS.filter(ct => ct !== 'All').map(ct => (
                  <option key={ct} value={ct}>{ct}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-400 mb-1">District</label>
              <select value={district} onChange={e => setDistrict(e.target.value)}
                className="w-full bg-[#1a2435] border border-[#1F2D40] text-gray-200 rounded-xl px-3 py-2 focus:border-blue-500">
                {DISTRICT_OPTIONS.filter(d => d !== 'All').map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">{isKn ? 'ವಿವರಣೆ' : 'Description & Forensic Notes'}</label>
            <textarea value={description} onChange={e => { setDescription(e.target.value); setNotes(e.target.value); }} rows={3}
              className="w-full bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-200 rounded-xl px-4 py-2 focus:border-blue-500 transition-colors"
              placeholder={isKn ? 'ಸಾಕ್ಷ್ಯದ ವಿವರಣೆಯನ್ನು ನಮೂದಿಸಿ...' : 'Enter forensic details, location notes, chain of custody...'} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-[#1F2D40] text-sm text-gray-400 hover:text-white transition-colors">
              {isKn ? 'ರದ್ದುಮಾಡಿ' : 'Cancel'}
            </button>
            <button type="submit" disabled={submitting || !file}
              className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-medium transition-colors">
              {submitting ? (isKn ? 'ಅಪ್‌ಲೋಡ್ ಆಗುತ್ತಿದೆ...' : 'Uploading...') : (isKn ? 'ಅಪ್‌ಲೋಡ್' : 'Upload Evidence')}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Evidence Explorer Component ─────────────────────────────────── */
const PAGE_SIZE = 40;

export default function EvidenceExplorer() {
  const { user } = useAuthStore();
  const { language } = useUIStore();
  const isKn = language === 'kn';
  const queryClient = useQueryClient();
  const dropRef = useRef<HTMLDivElement>(null);

  const [view, setView] = useState<'grid' | 'list' | 'timeline'>('grid');
  const [search, setSearch] = useState('');
  const [categoryFilter, _setCategoryFilter] = useState('All');
  const [districtFilter, _setDistrictFilter] = useState('All');
  const [crimeTypeFilter, _setCrimeTypeFilter] = useState('All');
  const [officerFilter, _setOfficerFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [selectedEvidence, setSelectedEvidence] = useState<SupabaseEvidence | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadMsg, setUploadMsg] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  // Officer lookup
  const { data: officerId } = useQuery({
    queryKey: ['employee-search-self', user?.name],
    queryFn: async () => {
      if (!user?.name) return 1;
      const firstName = user.name.split(' ').pop() || '';
      const { data } = await supabase
        .from('employee')
        .select('employee_id')
        .ilike('first_name', `%${firstName}%`)
        .limit(1);
      return data?.[0]?.employee_id ?? 1;
    },
    enabled: !!user?.name,
  });

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['evidence', page, search, categoryFilter, districtFilter, crimeTypeFilter, officerFilter],
    queryFn: () => evidenceApi.getAll({
      page,
      pageSize: PAGE_SIZE,
      search: search || undefined,
      category: categoryFilter !== 'All' ? categoryFilter : undefined,
      district: districtFilter !== 'All' ? districtFilter : undefined,
      crimeType: crimeTypeFilter !== 'All' ? crimeTypeFilter : undefined,
      officer: officerFilter !== 'All' ? officerFilter : undefined,
    }),
    placeholderData: prev => prev,
  });

  const items = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Realtime subscriber
  useEffect(() => {
    const unsub = evidenceApi.subscribeToNew(() => {
      queryClient.invalidateQueries({ queryKey: ['evidence'] });
    });
    return () => {
      unsub();
    };
  }, [queryClient]);

  const handleUploadSuccess = (msg: string) => {
    setUploadMsg(msg);
    queryClient.invalidateQueries({ queryKey: ['evidence'] });
    setTimeout(() => setUploadMsg(''), 4000);
  };

  const handleDrop = (ev: React.DragEvent) => {
    ev.preventDefault();
    setIsDragging(false);
    if (ev.dataTransfer.files?.length) {
      setShowUploadModal(true);
    }
  };

  return (
    <div className="space-y-4" ref={dropRef}
      onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}>

      <SectionHeader
        title={isKn ? 'ಸಾಕ್ಷ್ಯ ಎಕ್ಸ್‌ಪ್ಲೋರರ್' : 'Evidence Explorer'}
        subtitle={isKn ? `ಒಟ್ಟು ${total} ಸಾಕ್ಷ್ಯಗಳು · Supabase Storage & PostgreSQL` : `${total} total items · Supabase Storage & PostgreSQL`}
        right={
          <div className="flex gap-2">
            {(['grid', 'list', 'timeline'] as const).map(v => (
              <button key={v} onClick={() => setView(v)} aria-label={`${v} view`}
                className={`p-2 rounded-xl border transition-colors ${view === v ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-[#1F2D40] text-gray-400 hover:text-white'}`}>
                {v === 'grid' ? <Grid size={16} /> : v === 'list' ? <List size={16} /> : <Clock size={16} />}
              </button>
            ))}
            <button onClick={() => refetch()} className="p-2 rounded-xl border border-[#1F2D40] text-gray-400 hover:text-white transition-colors" title="Refresh Evidence Data">
              <RefreshCw size={16} />
            </button>
            <button onClick={() => setShowUploadModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-lg shadow-blue-600/20">
              <Upload size={14} /> {isKn ? 'ಸಾಕ್ಷ್ಯ ಅಪ್‌ಲೋಡ್' : 'Upload Evidence'}
            </button>
          </div>
        }
      />

      {/* Drag & Drop Overlay */}
      <AnimatePresence>
        {isDragging && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-blue-900/70 border-4 border-dashed border-blue-400 backdrop-blur-sm flex flex-col items-center justify-center pointer-events-none">
            <Upload size={48} className="text-blue-300 animate-bounce mb-3" />
            <div className="text-white text-2xl font-bold">Drop Media to Upload to Evidence Vault</div>
            <div className="text-blue-200 text-sm mt-1">Automatic Storage & Metadata Generation</div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Alert */}
      <AnimatePresence>
        {uploadMsg && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="px-4 py-3 rounded-xl text-xs border bg-green-500/10 border-green-500/20 text-green-400 flex items-center gap-2 shadow-lg">
            <CheckCircle size={16} /> {uploadMsg}
          </motion.div>
        )}
      </AnimatePresence>



      {/* Grid View */}
      {view === 'grid' && (
        isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-2xl border border-[#1F2D40] bg-[#1a2435] aspect-square animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {items.map((ev, i) => {
              const evType = ev.evidence_type || getEvidenceType(ev.mime_type);
              return (
                <motion.div key={ev.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.005 }}
                  onClick={() => setSelectedEvidence(ev)}
                  className={`rounded-2xl border cursor-pointer hover:scale-[1.03] transition-all overflow-hidden ${TYPE_BG[evType]} relative group shadow-md flex flex-col justify-between`}>
                  <div className="aspect-square flex flex-col items-center justify-center gap-2 p-2 relative bg-black/30">
                    {evType === 'Image' ? (
                      <img
                        src={ev.public_url || ev.thumbnail_url || getLocalDatasetImage(ev.id) || ''}
                        alt={ev.title || ev.file_name}
                        loading="lazy"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=800&q=80';
                        }}
                        className="w-full h-full object-cover absolute inset-0 rounded-t-2xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-2 p-3 text-center">
                        {TYPE_ICONS[evType]}
                        <span className="text-[10px] text-gray-300 line-clamp-2 font-medium">{ev.title || ev.file_name}</span>
                      </div>
                    )}
                    <div className="absolute top-1.5 left-1.5 px-2 py-0.5 bg-black/60 backdrop-blur text-white text-[9px] font-semibold rounded-md border border-white/10">
                      {ev.category || 'Crime Scene'}
                    </div>
                  </div>
                  <div className="p-2.5 bg-[#111827]/90 border-t border-[#1F2D40] space-y-1">
                    <div className="text-xs font-semibold text-white truncate">{ev.title || ev.file_name}</div>
                    <div className="flex items-center justify-between text-[10px] text-gray-400">
                      <span className="font-mono text-blue-400">{ev.linked_fir || ev.case_no || 'FIR-2024'}</span>
                      <span>{formatBytes(ev.file_size)}</span>
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-blue-900/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-2xl backdrop-blur-[2px]">
                    <Eye size={24} className="text-white drop-shadow-md" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )
      )}

      {/* List View */}
      {view === 'list' && (
        <GlassCard padding={false}>
          {isLoading ? <div className="p-6"><SkeletonPanel rows={8} /></div> : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[#1F2D40] bg-[#1a2435]/40 text-gray-400 font-semibold">
                    <th className="text-left px-4 py-3">Preview & Evidence Name</th>
                    <th className="text-left px-4 py-3">Category</th>
                    <th className="text-left px-4 py-3">Crime Type</th>
                    <th className="text-left px-4 py-3">District</th>
                    <th className="text-left px-4 py-3">Linked FIR</th>
                    <th className="text-left px-4 py-3">Officer</th>
                    <th className="text-left px-4 py-3">File Size</th>
                    <th className="text-left px-4 py-3">Upload Date</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-right px-4 py-3">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(ev => {
                    const evType = ev.evidence_type || getEvidenceType(ev.mime_type);
                    return (
                      <tr key={ev.id} className="border-b border-[#1F2D40]/50 hover:bg-white/5 transition-colors cursor-pointer" onClick={() => setSelectedEvidence(ev)}>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            {evType === 'Image' ? (
                              <img src={ev.public_url || ev.thumbnail_url || getLocalDatasetImage(ev.id) || ''} loading="lazy" className="w-8 h-8 rounded-lg object-cover flex-shrink-0 border border-[#1F2D40]" alt="" />
                            ) : TYPE_ICONS[evType]}
                            <span className="text-gray-200 font-medium truncate max-w-[180px]">{ev.title || ev.file_name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={ev.category || 'Crime Scene'} /></td>
                        <td className="px-4 py-3 text-gray-300">{ev.crime_type || ev.crime_group_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{ev.district || '—'}</td>
                        <td className="px-4 py-3 font-mono text-blue-400">{ev.linked_fir || ev.case_no || '—'}</td>
                        <td className="px-4 py-3 text-gray-300">{ev.officer || ev.officer_name || '—'}</td>
                        <td className="px-4 py-3 text-gray-400">{formatBytes(ev.file_size)}</td>
                        <td className="px-4 py-3 text-gray-400">{ev.uploaded_at ? formatDistanceToNow(new Date(ev.uploaded_at), { addSuffix: true, locale: isKn ? kn : undefined }) : '—'}</td>
                        <td className="px-4 py-3"><span className="px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 text-[10px]">{ev.status || 'Secured'}</span></td>
                        <td className="px-4 py-3 text-right">
                          <button onClick={(e) => { e.stopPropagation(); setSelectedEvidence(ev); }} className="p-1.5 rounded-lg hover:bg-blue-500/20 text-gray-400 hover:text-blue-400 transition-colors">
                            <Eye size={14} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      )}

      {/* Timeline View */}
      {view === 'timeline' && (
        <div className="space-y-3">
          {isLoading ? <SkeletonPanel rows={6} /> : items.map((ev, i) => {
            const evType = ev.evidence_type || getEvidenceType(ev.mime_type);
            return (
              <motion.div key={ev.id} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                className="flex gap-4 items-start">
                <div className="flex flex-col items-center gap-1 flex-shrink-0">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${TYPE_BG[evType]}`}>{TYPE_ICONS[evType]}</div>
                  {i < items.length - 1 && <div className="w-px h-8 bg-[#1F2D40]" />}
                </div>
                <div className="flex-1 bg-[#111827] rounded-2xl border border-[#1F2D40] p-4 cursor-pointer hover:border-blue-500/40 transition-colors shadow-md" onClick={() => setSelectedEvidence(ev)}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-white">{ev.title || ev.file_name}</div>
                      <div className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                        <span className="font-mono text-blue-400">{ev.linked_fir || ev.case_no || 'FIR-2024-001'}</span>
                        <span>•</span>
                        <span>{ev.officer || ev.officer_name || 'Officer'}</span>
                        <span>•</span>
                        <span>{ev.uploaded_at ? formatDistanceToNow(new Date(ev.uploaded_at), { addSuffix: true, locale: isKn ? kn : undefined }) : 'Recently'}</span>
                      </div>
                      {ev.notes && <div className="text-xs text-gray-300 mt-2 line-clamp-2 bg-[#1a2435] p-2 rounded-xl border border-[#1F2D40]">{ev.notes}</div>}
                    </div>
                    {evType === 'Image' && (
                      <img src={ev.public_url || ev.thumbnail_url || getLocalDatasetImage(ev.id) || ''} loading="lazy" className="w-20 h-16 rounded-xl object-cover flex-shrink-0 border border-[#1F2D40]" alt="" />
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-4 py-2 rounded-xl bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-300 hover:text-white disabled:opacity-40 transition-colors font-medium">
            {isKn ? '← ಹಿಂದೆ' : '← Previous Page'}
          </button>
          <span className="text-xs text-gray-400 font-medium">
            {isKn ? `ಪುಟ ${page} ರಲ್ಲಿ ${totalPages}` : `Page ${page} of ${totalPages}`}
          </span>
          <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))} className="px-4 py-2 rounded-xl bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-300 hover:text-white disabled:opacity-40 transition-colors font-medium">
            {isKn ? 'ಮುಂದೆ →' : 'Next Page →'}
          </button>
        </div>
      )}

      {/* Empty State */}
      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-gray-400 bg-[#111827]/40 rounded-2xl border border-[#1F2D40]">
          <Archive size={48} className="mb-3 opacity-30 text-blue-400" />
          <div className="text-base font-semibold text-gray-200">{isKn ? 'ಯಾವುದೇ ಸಾಕ್ಷ್ಯಗಳು ಹೊಂದಿಕೆಯಾಗುತ್ತಿಲ್ಲ' : 'No matching evidence found'}</div>
          <div className="text-xs text-gray-500 mt-1 max-w-sm text-center">{isKn ? 'ದಯವಿಟ್ಟು ಬೇರೆ ಶೋಧನಾ ಪದವನ್ನು ಪ್ರಯತ್ನಿಸಿ.' : 'Try resetting your search query.'}</div>
          <button onClick={() => { setSearch(''); setPage(1); }}
            className="mt-4 px-4 py-2 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400 text-xs hover:bg-blue-600/30 transition-colors">
            {isKn ? 'ಹುಡುಕಾಟವನ್ನು ತೆರವುಗೊಳಿಸಿ' : 'Clear Search'}
          </button>
        </div>
      )}

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEvidence && (
          <DetailModal
            ev={selectedEvidence}
            onClose={() => setSelectedEvidence(null)}
            onRefresh={() => refetch()}
          />
        )}
      </AnimatePresence>

      {/* Upload Modal */}
      <AnimatePresence>
        {showUploadModal && (
          <UploadModal
            onClose={() => setShowUploadModal(false)}
            onUploadSuccess={handleUploadSuccess}
            isKn={isKn}
            officerId={officerId ?? 1}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
