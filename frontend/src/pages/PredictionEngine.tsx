import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Shield, AlertCircle, RefreshCw, FileText, CheckCircle, Scale, ChevronRight } from 'lucide-react';
import { LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { predictionApi } from '../mockApi';
import { auditApi } from '../lib/supabaseApi';
import { supabase } from '../lib/supabase';
import { GlassCard, SectionHeader, ConfidenceBar, SkeletonPanel } from '../components/ui';
import { useUIStore } from '../context/uiStore';
import { useAuthStore } from '../context/authStore';
import jsPDF from 'jspdf';

const TT = { contentStyle: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, color: 'var(--text)', fontSize: 12 }, itemStyle: { color: 'var(--text-muted)' } };

/* ── Custom Risk Gauge ──────────────────────────────────────────────── */
function RiskGauge({ value, isKn }: { value: number; isKn: boolean }) {
  const color = value >= 80 ? '#EF4444' : value >= 60 ? '#F59E0B' : '#10B981';
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className="relative w-44 h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 60" className="w-full h-full overflow-visible">
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke="var(--border)" strokeWidth="7" strokeLinecap="round" />
          <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" stroke={color} strokeWidth="7" strokeLinecap="round"
            strokeDasharray={`${(value / 100) * 125.6} 125.6`} />
          <text x="50" y="40" textAnchor="middle" fill="var(--text)" fontSize="16" fontWeight="800">{value}</text>
          <text x="50" y="49" textAnchor="middle" fill="var(--text-muted)" fontSize="6" fontWeight="500">
            {isKn ? 'ಅಪಾಯದ ದರ' : 'Score'}
          </text>
        </svg>
      </div>
      <div className={`text-sm font-bold mt-2 ${value >= 80 ? 'text-red-500' : value >= 60 ? 'text-amber-500' : 'text-green-500'}`}>
        {isKn ? (
          value >= 80 ? 'ಅತಿ ಗಂಭೀರ' : value >= 60 ? 'ಹೆಚ್ಚಿದ ಅಪಾಯ' : 'ಸಾಧಾರಣ'
        ) : (
          value >= 80 ? 'Critical Match' : value >= 60 ? 'High Probability' : 'Moderate'
        )}
      </div>
    </div>
  );
}

export default function PredictionEngine() {
  const { data: predictions, isLoading } = useQuery({ queryKey: ['predictions'], queryFn: predictionApi.getAll });
  const { data: forecast } = useQuery({ queryKey: ['forecast'], queryFn: predictionApi.getForecast });
  const { data: gauge } = useQuery({ queryKey: ['gauge'], queryFn: predictionApi.getRiskGauge });
  const { language } = useUIStore();
  const { user } = useAuthStore();
  const isKn = language === 'kn';

  const [activeTab, setActiveTab] = useState<'risk' | 'comparison'>('risk');
  const [caseList, setCaseList] = useState<any[]>([]);
  const [caseAId, setCaseAId] = useState<string>('');
  const [caseBId, setCaseBId] = useState<string>('');
  const [comparing, setComparing] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<any | null>(null);
  const [toast, setToast] = useState('');

  // Log prediction viewing on mount
  useEffect(() => {
    if (predictions && user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: 'Query AI Risk Predictions & Hotspots',
      }).catch(console.error);
    }
  }, [predictions, user]);

  // Fetch list of cases for comparison on mount
  useEffect(() => {
    const fetchCases = async () => {
      try {
        const { data, error } = await supabase
          .from('case_master')
          .select('case_master_id, case_no, crime_no, brief_facts')
          .order('case_master_id', { ascending: false })
          .limit(100);
        if (!error && data && data.length > 0) {
          setCaseList(data);
          if (!caseAId) setCaseAId(String(data[0].case_master_id));
          if (!caseBId && data.length > 1) setCaseBId(String(data[1].case_master_id));
        }
      } catch (err) {
        console.error("Error loading case dropdowns:", err);
      }
    };
    fetchCases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const triggerCompare = async () => {
    if (!caseAId || !caseBId) return;
    setComparing(true);
    setComparisonResult(null);
    try {
      const api = await import('../lib/supabaseApi');
      const result = await api.searchApi.compareCases(caseAId, caseBId);
      
      const similarity = Math.round(
        (result.patternSimilarity * 0.4) +
        (result.modusOperandiSimilarity * 0.3) +
        (result.locationProximity * 0.2) +
        (result.timelineMatch * 0.1)
      );

      const hasOverlaps = result.overlaps && result.overlaps.length > 0;
      const riskScore = Math.min(100, Math.round(similarity * 0.70 + (hasOverlaps ? 30 : 0)));

      setComparisonResult({
        ...result,
        computedSimilarity: similarity,
        computedRisk: riskScore
      });
      setToast(isKn ? 'ಹೋಲಿಕೆ ಯಶಸ್ವಿಯಾಗಿದೆ' : 'Comparison analysis completed');

      if (user) {
        auditApi.log({
          performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
          role: user.rank || user.role,
          action: `Run Case Comparison: Case A ${caseAId} vs Case B ${caseBId}`,
          targetId: `${caseAId}_vs_${caseBId}`,
        }).catch(console.error);
      }
    } catch (e: any) {
      console.error("Case comparison error:", e);
      setToast(isKn ? 'ಹೋಲಿಕೆ ವಿಫಲವಾಗಿದೆ' : `Comparison failed: ${e?.message || 'Error'}`);
    } finally {
      setComparing(false);
    }
  };

  const downloadComparisonPDF = () => {
    if (!comparisonResult) return;
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42); // Slate-900 background style
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(59, 130, 246); // Blue-500
    doc.setFontSize(22);
    doc.text('KSP AI Case Comparison Report', 15, 25);
    
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 33);
    doc.text(`AI-assisted Intelligence Aid -- Not an Authoritative Forensic Conclusion`, 15, 39);

    doc.setDrawColor(30, 41, 59); // Divider
    doc.line(15, 45, 195, 45);

    let y = 55;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.text('Summary Metrics:', 15, y);
    y += 10;

    doc.setFontSize(11);
    doc.text(`Modus Operandi Similarity: ${comparisonResult.modusOperandiSimilarity}%`, 15, y);
    doc.text(`Pattern Similarity: ${comparisonResult.patternSimilarity}%`, 110, y);
    y += 8;
    doc.text(`Location Proximity: ${comparisonResult.locationProximity}%`, 15, y);
    doc.text(`Timeline Match: ${comparisonResult.timelineMatch}%`, 110, y);
    y += 10;

    doc.setFillColor(30, 41, 59);
    doc.rect(15, y, 180, 20, 'F');
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(12);
    doc.text(`Calculated Correlation Match: ${comparisonResult.computedSimilarity}%`, 20, y + 8);
    doc.setTextColor(239, 68, 68);
    doc.text(`Combined Linked Risk Score: ${comparisonResult.computedRisk}%`, 20, y + 15);
    y += 28;

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Case A:', 15, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    const factsA = doc.splitTextToSize(comparisonResult.caseA?.brief_facts || 'None', 180);
    factsA.forEach((line: string) => { doc.text(line, 15, y); y += 5; });
    y += 5;

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Case B:', 15, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    const factsB = doc.splitTextToSize(comparisonResult.caseB?.brief_facts || 'None', 180);
    factsB.forEach((line: string) => { doc.text(line, 15, y); y += 5; });
    y += 8;

    if (y > 200) { doc.addPage(); doc.setFillColor(15, 23, 42); doc.rect(0, 0, 210, 297, 'F'); y = 20; }
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Overlaps & Modus Operandi Analysis:', 15, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text(`Overlaps detected: ${comparisonResult.overlaps?.join(', ') || 'None'}`, 15, y);
    y += 8;
    const predLines = doc.splitTextToSize(comparisonResult.predictionParagraph || '', 180);
    predLines.forEach((line: string) => { doc.text(line, 15, y); y += 5; });
    y += 10;

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Recommended Investigation Steps:', 15, y);
    y += 6;
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    comparisonResult.recommendations?.forEach((rec: string) => {
      doc.text(`- ${rec}`, 15, y);
      y += 5;
    });

    doc.save(`KSP_Comparison_Report_${caseAId}_vs_${caseBId}.pdf`);
    setToast(isKn ? 'ವರದಿ ಡೌನ್‌ಲೋಡ್ ಯಶಸ್ವಿ' : 'Report PDF downloaded');

    if (user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: `Download Case Comparison Report: Case A ${caseAId} vs Case B ${caseBId}`,
        targetId: `${caseAId}_vs_${caseBId}`,
      }).catch(console.error);
    }
  };

  const hotspots = predictions?.filter(p => p.type === 'Hotspot') ?? [];
  const repeatOffenders = predictions?.filter(p => p.type === 'Repeat Offender') ?? [];
  const patrolRecs = predictions?.filter(p => p.type === 'Patrol') ?? [];

  return (
    <div className="space-y-5">
      <div>
        <SectionHeader 
          title={isKn ? "ಮುನ್ಸೂಚನೆ ಮತ್ತು ಹೋಲಿಕೆ ಎಂಜಿನ್" : "Prediction & Case Comparison Engine"} 
          subtitle={isKn ? "AI/ML ಚಾಲಿತ ಅಪರಾಧ ಮಾದರಿ ಮುನ್ಸೂಚನೆ ಹಾಗೂ ಪ್ರಕರಣಗಳ ಹೋಲಿಕೆ" : "AI/ML driven crime prediction and case similarity analysis"} 
        />
        
        {/* Warning label */}
        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
          <AlertCircle size={14} className="text-amber-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-amber-300">
            {isKn ? (
              <>ಎಲ್ಲಾ ಮುನ್ಸೂಚನೆಗಳು ಮತ್ತು ಹೋಲಿಕೆ ಫಲಿತಾಂಶಗಳು <strong>ಕಲ್ಪಿತ AI ಸಹಾಯವಾಗಿದೆ</strong>. ಯಾವುದೇ ಅಧಿಕೃತ ಅಥವಾ ಅಂತಿಮ ಸಾಕ್ಷ್ಯವೆಂದು ಪರಿಗಣಿಸಲಾಗುವುದಿಲ್ಲ.</>
            ) : (
              <>All predictions and case comparison indicators are <strong>AI-assisted intelligence aids</strong>. They are not authoritative forensic conclusions.</>
            )}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#1F2D40] gap-4">
        <button onClick={() => setActiveTab('risk')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === 'risk' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
          {isKn ? "ಅಪಾಯ ಮುನ್ಸೂಚನೆಗಳು" : "Risk Predictions"}
        </button>
        <button onClick={() => setActiveTab('comparison')}
          className={`pb-2.5 text-sm font-semibold border-b-2 transition-all ${activeTab === 'comparison' ? 'border-blue-500 text-blue-400' : 'border-transparent text-gray-400 hover:text-white'}`}>
          {isKn ? "AI ಪ್ರಕರಣಗಳ ಹೋಲಿಕೆ" : "AI Case Comparison"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'risk' ? (
          <motion.div key="risk" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            {/* Top row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Risk Gauge */}
              <GlassCard title={isKn ? "ಪ್ರಸ್ತುತ ಅಪಾಯದ ಪ್ರಮಾಣ" : "Current Risk Level"}>
                {!gauge ? <SkeletonPanel rows={3} /> : (
                  <div className="space-y-3">
                    <RiskGauge value={gauge.riskScore} isKn={isKn} />
                    <div className="text-xs text-gray-500 text-center">
                      {isKn ? "ಪ್ರವೃತ್ತಿ: " : "Trend: "} 
                      <span className="text-red-400">
                        ↑ {isKn ? (gauge.trend === 'increasing' ? 'ಹೆಚ್ಚುತ್ತಿದೆ' : gauge.trend) : gauge.trend}
                      </span>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-gray-500 font-medium">
                        {isKn ? "ಅಪಾಯದ ಅಂಶಗಳು" : "Risk Factors"}
                      </div>
                      {gauge.factors.map((f: string) => (
                        <div key={f} className="flex items-center gap-1.5 text-xs text-gray-400">
                          <span className="w-1 h-1 rounded-full bg-amber-500" />{f}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>

              {/* Crime Trend Forecast */}
              <GlassCard title={isKn ? "೮ ವಾರಗಳ ಅಪರಾಧ ಮುನ್ಸೂಚನೆ" : "8-Week Crime Forecast"} className="md:col-span-2" padding={false}>
                <div className="p-5">
                  {!forecast ? <SkeletonPanel rows={5} /> : (
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={forecast}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1F2D40" />
                        <XAxis dataKey="name" tick={{ fill: '#6B7280', fontSize: 11 }} />
                        <YAxis tick={{ fill: '#6B7280', fontSize: 11 }} />
                        <Tooltip {...TT} />
                        <Legend wrapperStyle={{ fontSize: 11, color: '#9CA3AF' }} />
                        <Line type="monotone" dataKey="predicted" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" name={isKn ? "ಅಂದಾಜಿಸಲಾಗಿದೆ" : "Predicted"} dot={{ r: 4, fill: '#F59E0B' }} />
                        <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} name={isKn ? "ನೈಜ (ಹಿಂದಿನ)" : "Actual (Historical)"} />
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </GlassCard>
            </div>

            {/* Hotspot table */}
            <GlassCard title={isKn ? "ಅಪರಾಧ ಹಾಟ್‌ಸ್ಪಾಟ್ ಮುನ್ಸೂಚನೆಗಳು" : "Crime Hotspot Predictions"} padding={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-[#1F2D40]">
                      {(isKn 
                        ? ['ಸ್ಥಳ', 'ಜಿಲ್ಲೆ', 'ಅಪರಾಧದ ವಿಧ', 'ವಿಶ್ವಾಸಾರ್ಹತೆ', 'ಅಪಾಯದ ಅಂಕ', 'ಶಿಫಾರಸುಗಳು']
                        : ['Location', 'District', 'Crime Type', 'Confidence', 'Risk Score', 'Recommendations']
                      ).map(h => (
                        <th key={h} className="text-left px-4 py-3 text-gray-500 font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading ? Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-[#1F2D40]/50">
                        {Array.from({ length: 6 }).map((_, j) => <td key={j} className="px-4 py-3"><div className="skeleton h-3 w-24 rounded-full" /></td>)}
                      </tr>
                    )) : hotspots.slice(0, 8).map(p => (
                      <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="border-b border-[#1F2D40]/50 table-row-hover transition-colors">
                        <td className="px-4 py-3 text-white font-medium">{p.location}</td>
                        <td className="px-4 py-3 text-gray-400">{p.district}</td>
                        <td className="px-4 py-3 text-gray-300">{p.crimeType}</td>
                        <td className="px-4 py-3 w-32"><ConfidenceBar value={p.confidence} /></td>
                        <td className="px-4 py-3">
                          <span className={`font-bold ${p.riskScore >= 80 ? 'text-red-400' : p.riskScore >= 60 ? 'text-amber-400' : 'text-green-400'}`}>{p.riskScore}</span>
                        </td>
                        <td className="px-4 py-3 text-blue-400 text-xs max-w-[200px] truncate">{p.recommendation}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>

            {/* Patrol recommendations + Repeat offender */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard title={isKn ? "ಗಸ್ತು ಶಿಫಾರಸುಗಳು" : "Patrol Recommendations"} padding={false}>
                <div className="divide-y divide-[#1F2D40]">
                  {patrolRecs.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                        <Shield size={14} className="text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white">{p.location}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{p.recommendation}</div>
                        <div className="mt-1.5 w-24"><ConfidenceBar value={p.confidence} /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>

              <GlassCard title={isKn ? "ಪುನರಾವರ್ತಿತ ಅಪರಾಧಿ ಮುನ್ಸೂಚನೆಗಳು" : "Repeat Offender Predictions"} padding={false}>
                <div className="divide-y divide-[#1F2D40]">
                  {repeatOffenders.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-start gap-3 px-4 py-3.5 hover:bg-white/5 transition-colors">
                      <div className="w-8 h-8 rounded-xl bg-red-500/15 flex items-center justify-center flex-shrink-0">
                        <Brain size={14} className="text-red-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white">{p.location}</div>
                        <div className="text-[10px] text-gray-400 mt-0.5">{p.description}</div>
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`text-xs font-bold ${p.riskScore >= 80 ? 'text-red-400' : 'text-amber-400'}`}>
                            {isKn ? 'ಅಪಾಯ' : 'Risk'} {p.riskScore}
                          </span>
                          <div className="flex-1 w-20"><ConfidenceBar value={p.confidence} /></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            </div>
          </motion.div>
        ) : (
          <motion.div key="comparison" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-5">
            {/* Input Selection Dropdowns */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassCard title={isKn ? "ಪ್ರಕರಣ ಎ ಆಯ್ಕೆಮಾಡಿ" : "Select Case A"}>
                <select value={caseAId} onChange={e => setCaseAId(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1F2D40] text-sm text-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-0 outline-none">
                  <option value="">-- {isKn ? 'ಪ್ರಕರಣ ಆಯ್ಕೆಮಾಡಿ' : 'Select Case'} --</option>
                  {caseList.map(c => (
                    <option key={c.case_master_id} value={c.case_master_id}>
                      {c.case_no || `FIR ${c.crime_no}`} - {c.brief_facts?.substring(0, 50)}...
                    </option>
                  ))}
                </select>
                {caseAId && (
                  <div className="mt-3 text-xs text-gray-400 italic bg-black/25 p-3 rounded-lg border border-white/5">
                    {caseList.find(c => String(c.case_master_id) === String(caseAId) || c.case_no === caseAId)?.brief_facts}
                  </div>
                )}
              </GlassCard>

              <GlassCard title={isKn ? "ಪ್ರಕರಣ ಬಿ ಆಯ್ಕೆಮಾಡಿ" : "Select Case B"}>
                <select value={caseBId} onChange={e => setCaseBId(e.target.value)}
                  className="w-full bg-[#111827] border border-[#1F2D40] text-sm text-gray-200 rounded-xl px-4 py-3 focus:border-blue-500 focus:ring-0 outline-none">
                  <option value="">-- {isKn ? 'ಪ್ರಕರಣ ಆಯ್ಕೆಮಾಡಿ' : 'Select Case'} --</option>
                  {caseList.map(c => (
                    <option key={c.case_master_id} value={c.case_master_id}>
                      {c.case_no || `FIR ${c.crime_no}`} - {c.brief_facts?.substring(0, 50)}...
                    </option>
                  ))}
                </select>
                {caseBId && (
                  <div className="mt-3 text-xs text-gray-400 italic bg-black/25 p-3 rounded-lg border border-white/5">
                    {caseList.find(c => String(c.case_master_id) === String(caseBId) || c.case_no === caseBId)?.brief_facts}
                  </div>
                )}
              </GlassCard>
            </div>

            {/* Compare Button */}
            <div className="flex justify-center">
              <button onClick={triggerCompare} disabled={!caseAId || !caseBId || comparing}
                className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors disabled:opacity-40 flex items-center gap-2 shadow-lg">
                {comparing ? <RefreshCw className="animate-spin" size={16} /> : <Brain size={16} />}
                {comparing ? (isKn ? 'ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…' : 'Comparing Patterns...') : (isKn ? 'ಪ್ರಕರಣಗಳನ್ನು ಹೋಲಿಕೆ ಮಾಡಿ' : 'Compare Case Patterns')}
              </button>
            </div>

            {/* Comparison results details */}
            {comparisonResult && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                {/* Score indicators */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Gauge */}
                  <GlassCard title={isKn ? "ಒಟ್ಟಾರೆ ಸಾದೃಶ್ಯದ ಫಲಿತಾಂಶ" : "Combined Similarity Level"}>
                    <RiskGauge value={comparisonResult.computedSimilarity} isKn={isKn} />
                  </GlassCard>

                  {/* Weighted Formula details */}
                  <GlassCard title={isKn ? "ಪಾರದರ್ಶಕ ಸೂತ್ರದ ವಿವರಣೆ" : "Weighted Correlation Formula"}>
                    <div className="space-y-3.5 text-xs text-gray-400">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <Scale size={14} className="text-blue-400" />
                        <span>{isKn ? 'ಲೆಕ್ಕಾಚಾರದ ಸೂತ್ರ:' : 'Transparent Weight Metrics:'}</span>
                      </div>
                      
                      <div className="space-y-2 font-mono">
                        <div className="flex justify-between bg-black/30 p-2 rounded border border-white/5">
                          <span>Modus Operandi (30%)</span>
                          <span className="text-white">{comparisonResult.modusOperandiSimilarity}%</span>
                        </div>
                        <div className="flex justify-between bg-black/30 p-2 rounded border border-white/5">
                          <span>Crime Pattern (40%)</span>
                          <span className="text-white">{comparisonResult.patternSimilarity}%</span>
                        </div>
                        <div className="flex justify-between bg-black/30 p-2 rounded border border-white/5">
                          <span>Location Proximity (20%)</span>
                          <span className="text-white">{comparisonResult.locationProximity}%</span>
                        </div>
                        <div className="flex justify-between bg-black/30 p-2 rounded border border-white/5">
                          <span>Timeline Matches (10%)</span>
                          <span className="text-white">{comparisonResult.timelineMatch}%</span>
                        </div>
                      </div>

                      <div className="text-[10px] text-gray-500 italic mt-2">
                        {isKn 
                          ? 'ಲಿಂಕ್ಡ್ ರಿಸ್ಕ್ ಸ್ಕೋರ್ = ಒಟ್ಟಾರೆ ಸಾದೃಶ್ಯ x ೦.೭೦ + (ಅಪರಾಧಿ/ಸಂತ್ರಸ್ತರ ಅತಿಕ್ರಮಣವಿದ್ದರೆ ೩೦ ಅಂಕಗಳು)'
                          : 'Linked Risk Score = Similarity x 0.70 + (30 pts if any common Accused/Victim overlap is detected)'}
                      </div>
                    </div>
                  </GlassCard>

                  {/* Overlaps & Linked risk */}
                  <GlassCard title={isKn ? "ಲಿಂಕ್ಡ್ ರಿಸ್ಕ್ ಸ್ಕೋರ್" : "Linked Risk Score"}>
                    <div className="flex flex-col items-center justify-center h-full text-center space-y-2 py-2">
                      <div className="text-5xl font-black text-red-500 font-mono">{comparisonResult.computedRisk}%</div>
                      <div className="text-xs text-gray-400 font-semibold">{isKn ? 'ಸಂಭವನೀಯ ಲಿಂಕ್ಡ್ ಅಪಾಯ' : 'Probability cases are linked'}</div>
                      <div className="px-3 py-1 text-[10px] bg-red-950/20 border border-red-500/30 text-red-400 rounded-full mt-2 font-semibold">
                        {comparisonResult.overlaps?.length > 0
                          ? (isKn ? `ಸಾಮಾನ್ಯ ಹೆಸರುಗಳು: ${comparisonResult.overlaps.join(', ')}` : `Overlapping Names: ${comparisonResult.overlaps.join(', ')}`)
                          : (isKn ? 'ಯಾವುದೇ ಆರೋಪಿ/ಸಂತ್ರಸ್ತರ ಓವರ್‌ಲ್ಯಾಪ್ ಕಂಡುಬಂದಿಲ್ಲ' : 'No common accused/victim overlap')}
                      </div>
                    </div>
                  </GlassCard>
                </div>

                {/* Analytical summary card */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <GlassCard title={isKn ? "ತನಿಖಾ ಮಾದರಿ ವಿಶ್ಲೇಷಣೆ" : "AI Investigative Pattern Analysis"}>
                    <div className="space-y-3">
                      <p className="text-sm text-gray-300 leading-relaxed">
                        {comparisonResult.predictionParagraph}
                      </p>
                      <button onClick={downloadComparisonPDF}
                        className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-all">
                        <FileText size={14} /> {isKn ? 'ಹೋಲಿಕೆ ವರದಿ ಡೌನ್‌ಲೋಡ್ (PDF)' : 'Download Comparison PDF'}
                      </button>
                    </div>
                  </GlassCard>

                  <GlassCard title={isKn ? "ಶಿಫಾರಸು ಮಾಡಿದ ತನಿಖಾ ಕ್ರಮಗಳು" : "Recommended Investigation Steps"}>
                    <div className="space-y-2">
                      {comparisonResult.recommendations?.map((rec: string, index: number) => (
                        <div key={index} className="flex items-start gap-2.5 text-xs text-gray-300 bg-white/5 p-2.5 rounded-xl border border-white/5">
                          <ChevronRight size={14} className="text-blue-400 mt-0.5 flex-shrink-0" />
                          <span>{rec}</span>
                        </div>
                      ))}
                    </div>
                  </GlassCard>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 bg-[#111827] border border-green-500/30 rounded-2xl shadow-2xl text-xs text-green-400">
          <CheckCircle size={14} /> {toast}
        </div>
      )}
    </div>
  );
}
