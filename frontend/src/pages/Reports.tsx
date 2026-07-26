import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, BarChart2, Calendar, Building, User, Brain } from 'lucide-react';
import { reportsApi } from '../mockApi';
import { GlassCard, SectionHeader } from '../components/ui';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import { useUIStore } from '../context/uiStore';
import { useAuthStore } from '../context/authStore';
import { auditApi } from '../lib/supabaseApi';

const REPORT_TYPES = [
  { type: 'Daily', labelKn: 'ದೈನಂದಿನ', labelEn: 'Daily', icon: Calendar, descKn: 'ದೈನಂದಿನ ಅಪರಾಧ ಸಾರಾಂಶ ಮತ್ತು ಚಟುವಟಿಕೆ ಲಾಗ್', descEn: 'Daily crime summary and activity log' },
  { type: 'Weekly', labelKn: 'ಸಾಪ್ತಾಹಿಕ', labelEn: 'Weekly', icon: BarChart2, descKn: 'ಸಾಪ್ತಾಹಿಕ ಪ್ರವೃತ್ತಿ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಕಾರ್ಯಕ್ಷಮತೆಯ ಮೆಟ್ರಿಕ್ಸ್', descEn: 'Weekly trend analysis and performance metrics' },
  { type: 'Monthly', labelKn: 'ಮಾಸಿಕ', labelEn: 'Monthly', icon: FileText, descKn: 'ಮಾಸಿಕ ಸಮಗ್ರ ಅಪರಾಧ ಅಂಕಿಅಂಶಗಳು', descEn: 'Monthly comprehensive crime statistics' },
  { type: 'District', labelKn: 'ಜಿಲ್ಲಾವಾರು', labelEn: 'District', icon: Building, descKn: 'ಜಿಲ್ಲಾ ಮಟ್ಟದ ವಿಭಜನೆ ಮತ್ತು ಹೋಲಿಕೆಗಳು', descEn: 'District-level breakdown and comparisons' },
  { type: 'Officer', labelKn: 'ಅಧಿಕಾರಿ', labelEn: 'Officer', icon: User, descKn: 'ಅಧಿಕಾರಿ ಕಾರ್ಯಕ್ಷಮತೆ ಮತ್ತು ಪ್ರಕರಣ ನಿಯೋಜನೆ ವರದಿ', descEn: 'Officer performance and case assignment report' },
  { type: 'Crime Summary', labelKn: 'ಅಪರಾಧ ಸಾರಾಂಶ', labelEn: 'Crime Summary', icon: BarChart2, descKn: 'ಅಪರಾಧ ವರ್ಗದ ವಿಶ್ಲೇಷಣೆ ಮತ್ತು ಮಾದರಿಯ ವರದಿ', descEn: 'Crime category analysis and pattern report' },
  { type: 'Prediction', labelKn: 'ಮುನ್ಸೂಚನೆ', labelEn: 'Prediction', icon: Brain, descKn: 'AI ಮುನ್ಸೂಚನೆ ವಿಶ್ವಾಸಾರ್ಹತೆ ಮತ್ತು ಮುನ್ನೋಟ ವರದಿ', descEn: 'AI forecasting confidence and outlook report' },
];

export default function Reports() {
  const { user } = useAuthStore();
  const [selectedType, setSelectedType] = useState('');
  const [generating, setGenerating] = useState(false);
  const [reportData, setReportData] = useState<any>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const { language } = useUIStore();
  const isKn = language === 'kn';

  const generate = async () => {
    if (!selectedType) return;
    setGenerating(true);
    const data = await reportsApi.generate(selectedType);
    setReportData(data);
    setPreviewVisible(true);
    setGenerating(false);

    if (user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: `Generate Report: Type ${selectedType}`,
      }).catch(console.error);
    }
  };

  const exportPDF = () => {
    if (!reportData) return;
    const doc = new jsPDF();
    doc.setFillColor(8, 17, 31);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(59, 130, 246);
    doc.setFontSize(20);
    doc.text('KSP Intelligence Report', 20, 25);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(12);
    doc.text(`Type: ${reportData.type}`, 20, 40);
    doc.text(`Generated: ${new Date(reportData.generatedAt).toLocaleString()}`, 20, 50);
    doc.text(`District: ${reportData.options?.district ?? 'All Districts'}`, 20, 60);
    doc.setFontSize(14);
    doc.setTextColor(59, 130, 246);
    doc.text('KPI Summary', 20, 80);
    doc.setTextColor(200, 200, 200);
    doc.setFontSize(11);
    const kpis = reportData.kpis;
    if (kpis) {
      doc.text(`Total FIRs: ${kpis.totalFIRs}`, 20, 95);
      doc.text(`Open Cases: ${kpis.openCases}`, 20, 105);
      doc.text(`Solved Cases: ${kpis.solvedCases}`, 20, 115);
      doc.text(`Crime Risk Score: ${kpis.crimeRiskScore}%`, 20, 125);
    }
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('SYNTHETIC DATA DEMO — NOT FOR OPERATIONAL USE', 20, 280);
    doc.text('Karnataka State Police Intelligence Dashboard', 20, 285);
    doc.save(`KSP_${reportData.type}_Report_${Date.now()}.pdf`);

    if (user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: `Export Report PDF: Type ${reportData.type}`,
      }).catch(console.error);
    }
  };

  const exportExcel = () => {
    if (!reportData) return;
    const wb = XLSX.utils.book_new();
    // KPI sheet
    const kpiSheet = XLSX.utils.json_to_sheet([reportData.kpis]);
    XLSX.utils.book_append_sheet(wb, kpiSheet, 'KPIs');
    // FIRs sheet
    const firSheet = XLSX.utils.json_to_sheet(
      reportData.firs.map((f: any) => ({
        'FIR Number': f.firNumber, 'Crime Type': f.crimeType,
        'Victim': f.victimName, 'District': f.district,
        'Status': f.status, 'Severity': f.severity,
        'Date': new Date(f.dateReported).toLocaleDateString(),
      }))
    );
    XLSX.utils.book_append_sheet(wb, firSheet, 'FIRs');
    // Trend sheet
    const trendSheet = XLSX.utils.json_to_sheet(reportData.trend ?? []);
    XLSX.utils.book_append_sheet(wb, trendSheet, 'Crime Trend');
    XLSX.writeFile(wb, `KSP_${reportData.type}_Report_${Date.now()}.xlsx`);

    if (user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: `Export Report Excel: Type ${reportData.type}`,
      }).catch(console.error);
    }
  };

  const exportCSV = () => {
    if (!reportData?.firs) return;
    const headers = Object.keys(reportData.firs[0] ?? {}).join(',');
    const rows = reportData.firs.map((f: any) => Object.values(f).map((v: any) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([`${headers}\n${rows}`], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `KSP_${reportData.type}_${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);

    if (user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: `Export Report CSV: Type ${reportData.type}`,
      }).catch(console.error);
    }
  };

  const typeLabels: Record<string, Record<string, string>> = {
    kn: {
      Daily: 'ದೈನಂದಿನ',
      Weekly: 'ಸಾಪ್ತಾಹಿಕ',
      Monthly: 'ಮಾಸಿಕ',
      District: 'ಜಿಲ್ಲಾವಾರು',
      Officer: 'ಅಧಿಕಾರಿ',
      'Crime Summary': 'ಅಪರಾಧ ಸಾರಾಂಶ',
      Prediction: 'ಮುನ್ಸೂಚನೆ',
    },
    en: {
      Daily: 'Daily',
      Weekly: 'Weekly',
      Monthly: 'Monthly',
      District: 'District',
      Officer: 'Officer',
      'Crime Summary': 'Crime Summary',
      Prediction: 'Prediction',
    }
  };

  return (
    <div className="space-y-5">
      <SectionHeader 
        title={isKn ? "ವರದಿ ಜನರೇಟರ್" : "Report Generator"} 
        subtitle={isKn ? "ಅಪರಾಧ ಮಾಹಿತಿಗಳ ವರದಿಗಳನ್ನು ತಯಾರಿಸಿ ಮತ್ತು ರಫ್ತು ಮಾಡಿ" : "Generate and export crime intelligence reports"} 
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Config panel */}
        <div className="space-y-4">
          <GlassCard title={isKn ? "ವರದಿ ಸಂರಚನೆ" : "Report Configuration"}>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-gray-400 mb-2">
                  {isKn ? "ವರದಿ ಪ್ರಕಾರ *" : "Report Type *"}
                </label>
                <div className="space-y-2">
                  {REPORT_TYPES.map(({ type, labelKn, labelEn, icon: Icon, descKn, descEn }) => (
                    <button key={type} onClick={() => setSelectedType(type)}
                      className={`w-full flex items-start gap-3 px-3 py-3 rounded-xl border text-left transition-all ${selectedType === type ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-[#1F2D40] text-gray-400 hover:bg-white/5 hover:text-white'}`}>
                      <Icon size={16} className="mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="text-xs font-medium">
                          {isKn ? labelKn : labelEn}
                        </div>
                        <div className="text-[10px] mt-0.5 opacity-70">
                          {isKn ? descKn : descEn}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
              <button onClick={generate} disabled={!selectedType || generating}
                className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                {generating ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> {isKn ? "ಸಿದ್ಧಪಡಿಸಲಾಗುತ್ತಿದೆ…" : "Generating…"}</>
                ) : (
                  <><BarChart2 size={16} /> {isKn ? "ವರದಿ ತಯಾರಿಸಿ" : "Generate Report"}</>
                )}
              </button>
            </div>
          </GlassCard>
        </div>

        {/* Preview panel */}
        <div className="lg:col-span-2">
          {previewVisible && reportData ? (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
              <GlassCard 
                title={`${typeLabels[language]?.[reportData.type] ?? typeLabels['en']?.[reportData.type] ?? reportData.type} ${isKn ? "ವರದಿ ಮುನ್ನೋಟ" : "Report Preview"}`} 
                padding={false}
                headerRight={
                  <div className="flex gap-2">
                    <button onClick={exportPDF} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/20 border border-red-500/30 text-xs text-red-400 hover:bg-red-500/30 transition-colors">
                      <Download size={13} /> PDF
                    </button>
                    <button onClick={exportExcel} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-green-500/20 border border-green-500/30 text-xs text-green-400 hover:bg-green-500/30 transition-colors">
                      <Download size={13} /> Excel
                    </button>
                    <button onClick={exportCSV} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-xs text-blue-400 hover:bg-blue-500/30 transition-colors">
                      <Download size={13} /> CSV
                    </button>
                  </div>
                }>
                <div className="p-6 space-y-5">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-lg font-bold text-white">
                        {isKn ? "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್" : "Karnataka State Police"}
                      </div>
                      <div className="text-sm text-blue-400">
                        {typeLabels[language]?.[reportData.type] ?? typeLabels['en']?.[reportData.type] ?? reportData.type} {isKn ? "ಇಂಟೆಲಿಜೆನ್ಸ್ ವರದಿ" : "Intelligence Report"}
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 text-right">
                      <div>{isKn ? "ರಚಿಸಿದ ಸಮಯ: " : "Generated: "}{new Date(reportData.generatedAt).toLocaleString()}</div>
                      <div>{isKn ? "ಜಿಲ್ಲೆ: " : "District: "}{reportData.options?.district ?? (isKn ? 'ಎಲ್ಲಾ ಜಿಲ್ಲೆಗಳು' : 'All Districts')}</div>
                    </div>
                  </div>
                  {/* KPI summary */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: isKn ? 'ಒಟ್ಟು FIR ಗಳು' : 'Total FIRs', value: reportData.kpis.totalFIRs, color: 'text-blue-400' },
                      { label: isKn ? 'ತೆರೆದ ಪ್ರಕರಣಗಳು' : 'Open Cases', value: reportData.kpis.openCases, color: 'text-amber-400' },
                      { label: isKn ? 'ಪರಿಹರಿಸಿದ ಪ್ರಕರಣಗಳು' : 'Solved Cases', value: reportData.kpis.solvedCases, color: 'text-green-400' },
                      { label: isKn ? 'ಅಪಾಯದ ಅಂಕ' : 'Risk Score', value: `${reportData.kpis.crimeRiskScore}%`, color: 'text-red-400' },
                    ].map(s => (
                      <div key={s.label} className="bg-[#1a2435] rounded-xl p-3 border border-[#1F2D40]">
                        <div className="text-[10px] text-gray-500">{s.label}</div>
                        <div className={`text-xl font-bold ${s.color} mt-0.5`}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                  {/* Sample FIRs */}
                  <div>
                    <div className="text-sm font-semibold text-white mb-2">
                      {isKn ? `ಒಳಗೊಂಡಿರುವ ಮಾದರಿ FIR ಗಳು (${reportData.firs.length})` : `Included Sample FIRs (${reportData.firs.length})`}
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead><tr className="border-b border-[#1F2D40]">
                          {(isKn 
                            ? ['FIR ಸಂಖ್ಯೆ','ಅಪರಾಧ','ಜಿಲ್ಲೆ','ಸ್ಥಿತಿ','ಗಂಭೀರತೆ']
                            : ['FIR Number', 'Crime Type', 'District', 'Status', 'Severity']
                          ).map(h => <th key={h} className="text-left px-3 py-2 text-gray-500">{h}</th>)}
                        </tr></thead>
                        <tbody>
                          {reportData.firs.slice(0, 8).map((f: any) => (
                            <tr key={f.id} className="border-b border-[#1F2D40]/50">
                              <td className="px-3 py-2 font-mono text-blue-400 text-[10px]">{f.firNumber}</td>
                              <td className="px-3 py-2 text-gray-300">{f.crimeType}</td>
                              <td className="px-3 py-2 text-gray-400">{f.district}</td>
                              <td className="px-3 py-2 text-gray-400">
                                {isKn ? (f.status === 'Closed' ? 'ಮುಚ್ಚಲಾಗಿದೆ' : f.status === 'Under Investigation' ? 'ತನಿಖೆಯಲ್ಲಿದೆ' : f.status === 'Pending' ? 'ಬಾಕಿ ಇದೆ' : f.status) : f.status}
                              </td>
                              <td className="px-3 py-2 text-gray-400">
                                {isKn ? (f.severity === 'Critical' ? 'ಅತಿ ಗಂಭೀರ' : f.severity === 'High' ? 'ಹೆಚ್ಚು' : f.severity === 'Medium' ? 'ಮಧ್ಯಮ' : f.severity === 'Low' ? 'ಕಡಿಮೆ' : f.severity) : f.severity}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-600 border-t border-[#1F2D40] pt-3">
                    {isKn ? "⚠️ ಇದು ಡೆಮೋ ವ್ಯವಸ್ಥೆ — ಅಧಿಕೃತ ಬಳಕೆಗೆ ಸೂಕ್ತವಲ್ಲ · KSP ಇಂಟೆಲಿಜೆನ್ಸ್ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್" : "⚠️ Fictional Demo System — Not for operational use · KSP Intelligence Dashboard"}
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          ) : (
            <div className="h-full flex items-center justify-center rounded-2xl border border-dashed border-[#1F2D40] min-h-[400px]">
              <div className="text-center text-gray-500">
                <FileText size={48} className="mx-auto mb-3 opacity-30" />
                <div className="text-sm">
                  {isKn ? "ವರದಿ ಪ್ರಕಾರವನ್ನು ಆಯ್ಕೆಮಾಡಿ ಮತ್ತು \"ವರದಿ ತಯಾರಿಸಿ\" ಕ್ಲಿಕ್ ಮಾಡಿ" : "Select a report type and click \"Generate Report\""}
                </div>
                <div className="text-xs mt-1">
                  {isKn ? "ವರದಿಗಳನ್ನು PDF, Excel ಅಥವಾ CSV ರೂಪದಲ್ಲಿ ರಫ್ತು ಮಾಡಬಹುದು" : "Reports can be exported in PDF, Excel, or CSV format"}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
