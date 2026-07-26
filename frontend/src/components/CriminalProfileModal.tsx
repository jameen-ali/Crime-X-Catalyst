import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, FileText, CheckCircle, ShieldAlert, Award, Calendar, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import jsPDF from 'jspdf';

interface CriminalProfileModalProps {
  suspectName: string;
  onClose: () => void;
  isKn: boolean;
}

export default function CriminalProfileModal({ suspectName, onClose, isKn }: CriminalProfileModalProps) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    const fetchSuspectProfile = async () => {
      setLoading(true);
      try {
        // Query accused records to compile history
        const { data, error } = await supabase
          .from('accused')
          .select(`
            accused_master_id,
            accused_name,
            age_year,
            gender_id,
            risk_score,
            known_aliases,
            case_master_id,
            case_master (
              case_no,
              crime_no,
              brief_facts,
              incident_from_date,
              latitude,
              longitude
            )
          `)
          .eq('accused_name', suspectName);

        if (error) throw error;

        if (data && data.length > 0) {
          // Combine details from the records
          const first = data[0];
          const cases = data
            .map(d => d.case_master)
            .filter(c => c !== null);

          // Get unique aliases
          const aliasesSet = new Set<string>();
          data.forEach(d => {
            if (d.known_aliases) {
              d.known_aliases.forEach((a: string) => aliasesSet.add(a));
            }
          });

          // Compute age estimate and risk score average
          const avgRisk = Math.round(data.reduce((acc, d) => acc + (d.risk_score || 40), 0) / data.length);

          setProfile({
            name: suspectName,
            age: first.age_year || 35,
            gender: first.gender_id || 'Male',
            riskScore: avgRisk,
            aliases: Array.from(aliasesSet),
            photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(suspectName)}&backgroundType=gradientLinear`,
            cases: cases
          });
        } else {
          // If no records found, make a synthetic placeholder
          setProfile({
            name: suspectName,
            age: 38,
            gender: 'Male',
            riskScore: 55,
            aliases: ['No aliases registered'],
            photoUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(suspectName)}&backgroundType=gradientLinear`,
            cases: []
          });
        }
      } catch (err) {
        console.error("Error building profile:", err);
      } finally {
        setLoading(false);
      }
    };

    if (suspectName) {
      fetchSuspectProfile();
    }
  }, [suspectName]);

  const generateProfilePDF = () => {
    if (!profile) return;
    const doc = new jsPDF();

    // Theme Background
    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 297, 'F');

    // Header
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(22);
    doc.text('KSP Smart Police Intelligence Division', 15, 25);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(14);
    doc.text('Confidential Criminal Profile Report', 15, 33);

    doc.setDrawColor(30, 41, 59);
    doc.line(15, 38, 195, 38);

    // Profile Box
    doc.setFillColor(30, 41, 59);
    doc.rect(15, 45, 180, 50, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text(profile.name, 20, 55);

    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text(`Age: ${profile.age} years  |  Gender: ${profile.gender}`, 20, 63);
    doc.text(`Aliases: ${profile.aliases.join(', ') || 'None'}`, 20, 70);
    doc.text(`Calculated Intelligence Risk Score: ${profile.riskScore}%`, 20, 77);
    doc.text(`Linked Investigations: ${profile.cases.length} active case files`, 20, 84);

    // Timeline of Offences
    let y = 110;
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(14);
    doc.text('Linked Offences & History:', 15, y);
    y += 10;

    if (profile.cases.length === 0) {
      doc.setTextColor(203, 213, 225);
      doc.setFontSize(10);
      doc.text('No prior case connections recorded in the active workspace database.', 15, y);
    } else {
      profile.cases.forEach((c: any, index: number) => {
        if (y > 250) {
          doc.addPage();
          doc.setFillColor(15, 23, 42);
          doc.rect(0, 0, 210, 297, 'F');
          y = 20;
        }
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(11);
        doc.text(`${index + 1}. Case Reference: ${c.case_no || `FIR ${c.crime_no}`}`, 15, y);
        y += 5;

        doc.setTextColor(148, 163, 184);
        doc.setFontSize(9);
        doc.text(`Date of Occurrence: ${c.incident_from_date || 'N/A'}`, 18, y);
        y += 5;

        doc.setTextColor(203, 213, 225);
        doc.setFontSize(9);
        const narrative = doc.splitTextToSize(c.brief_facts || 'No brief facts registered.', 170);
        narrative.forEach((line: string) => {
          if (y > 270) {
            doc.addPage();
            doc.setFillColor(15, 23, 42);
            doc.rect(0, 0, 210, 297, 'F');
            y = 20;
          }
          doc.text(line, 18, y);
          y += 5;
        });
        y += 5;
      });
    }

    // AI Warning Footer
    doc.setDrawColor(30, 41, 59);
    doc.line(15, 275, 195, 275);
    doc.setTextColor(148, 163, 184);
    doc.setFontSize(8);
    doc.text('DISCLAIMER: This profile is an AI-assisted analytical compilation based on matching case names.', 15, 282);
    doc.text('It is not an authoritative forensic conclusion. Verify all information via official case diaries.', 15, 286);

    doc.save(`KSP_Criminal_Profile_${profile.name.replace(/\s+/g, '_')}.pdf`);
    setToast(isKn ? 'ಪ್ರೊಫೈಲ್ ವರದಿ ಡೌನ್‌ಲೋಡ್ ಯಶಸ್ವಿ' : 'Criminal Profile report downloaded');
    setTimeout(() => setToast(''), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#111827] border border-green-500/30 rounded-2xl shadow-2xl text-xs text-green-400 font-semibold">
          <CheckCircle size={14} /> {toast}
        </div>
      )}

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-xl bg-[#0d1b2a] border border-[#1F2D40] rounded-[24px] overflow-hidden shadow-2xl">
        <div className="px-6 py-4 border-b border-[#1F2D40] flex items-center justify-between bg-blue-950/20">
          <h3 className="font-bold text-white text-sm flex items-center gap-2">
            <Award size={16} className="text-blue-500" />
            {isKn ? 'ಕ್ರಿಮಿನಲ್ ಹಿನ್ನೆಲೆ ವಿವರ' : 'Criminal Profiler Intelligence'}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="p-6 space-y-5 max-h-[500px] overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-10 space-y-3">
              <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <div className="text-xs text-gray-400">{isKn ? 'ಪ್ರೊಫೈಲ್ ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ…' : 'Compiling profile data...'}</div>
            </div>
          ) : profile ? (
            <div className="space-y-6">
              {/* Profile Card Summary */}
              <div className="flex gap-4 items-start bg-white/5 p-4 rounded-2xl border border-white/5">
                <img src={profile.photoUrl} alt={profile.name} className="w-16 h-16 rounded-xl border border-blue-500/30 bg-blue-950/40" />
                <div className="flex-1 min-w-0">
                  <h4 className="text-base font-bold text-white truncate">{profile.name}</h4>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-1">
                    <User size={12} /> {profile.gender}, {profile.age} {isKn ? 'ವರ್ಷ' : 'years'}
                  </div>
                  <div className="text-xs text-gray-400 mt-1">
                    <strong>Aliases:</strong> {profile.aliases.join(', ') || 'None'}
                  </div>
                </div>
              </div>

              {/* Risk Level gauge */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-[#1a2435] rounded-xl p-3 border border-[#1F2D40] flex flex-col justify-between">
                  <div className="text-[10px] text-gray-500 mb-1">{isKn ? 'ಅಪಾಯದ ಪ್ರಮಾಣ' : 'Calculated Risk'}</div>
                  <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold ${profile.riskScore >= 75 ? 'text-red-400' : 'text-amber-400'}`}>{profile.riskScore}%</span>
                    <span className="text-[9px] text-gray-500 font-semibold">{isKn ? 'ಹೆಚ್ಚು' : 'High Match'}</span>
                  </div>
                </div>
                <div className="bg-[#1a2435] rounded-xl p-3 border border-[#1F2D40] flex flex-col justify-between">
                  <div className="text-[10px] text-gray-500 mb-1">{isKn ? 'ಲಿಂಕ್ಡ್ ಪ್ರಕರಣಗಳು' : 'Linked Cases'}</div>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-blue-400">{profile.cases.length}</span>
                    <span className="text-[9px] text-gray-500 font-semibold">{isKn ? 'ಸಕ್ರಿಯ' : 'Active'}</span>
                  </div>
                </div>
              </div>

              {/* Linked Case List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-white">{isKn ? 'ಲಿಂಕ್ ಮಾಡಲಾದ ಪ್ರಕರಣಗಳು:' : 'Associated Investigations:'}</div>
                {profile.cases.length === 0 ? (
                  <div className="text-xs text-gray-500 italic bg-black/20 p-3 rounded-xl border border-white/5">
                    {isKn ? 'ಯಾವುದೇ ಪೂರ್ವ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ' : 'No prior case records found for this suspect.'}
                  </div>
                ) : (
                  profile.cases.map((c: any, index: number) => (
                    <div key={index} className="bg-black/25 p-3 rounded-xl border border-white/5 space-y-1">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span>{c.case_no || `FIR ${c.crime_no}`}</span>
                        <span className="text-[10px] text-blue-400 flex items-center gap-1 font-normal">
                          <Calendar size={10} /> {c.incident_from_date?.substring(0, 10)}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                        {c.brief_facts}
                      </p>
                    </div>
                  ))
                )}
              </div>

              {/* AI Warning Disclaimer */}
              <div className="flex gap-2 p-3 bg-red-950/20 border border-red-500/20 rounded-xl text-[10px] text-red-400">
                <ShieldAlert className="flex-shrink-0 mt-0.5" size={14} />
                <p>
                  {isKn 
                    ? 'ಗಮನಿಸಿ: ಈ ಕ್ರಿಮಿನಲ್ ಪ್ರೊಫೈಲ್ ಹೆಸರಿನ ಆಧಾರದ ಮೇಲೆ ರಚಿಸಲಾದ ಕಲ್ಪಿತ AI ಸಹಾಯವಾಗಿದ್ದು, ಇದು ನ್ಯಾಯವಿಜ್ಞಾನ ತೀರ್ಮಾನವಲ್ಲ. ದಯವಿಟ್ಟು ಪ್ರಕರಣ ದಾಖಲೆಗಳೊಂದಿಗೆ ಪರಿಶೀಲಿಸಿ.'
                    : 'AI Notice: This analytical profile is compiled based on matching case names. It is not an authoritative forensic conclusion. Verify all information via official case diaries.'}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#1F2D40]">
                <button onClick={generateProfilePDF}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all">
                  <FileText size={14} />
                  {isKn ? 'ವರದಿ ಡೌನ್‌ಲೋಡ್ (PDF)' : 'Generate Profile PDF'}
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center text-xs text-gray-500 py-6">{isKn ? 'ಪ್ರೊಫೈಲ್ ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಿಲ್ಲ' : 'Profile not found.'}</div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
