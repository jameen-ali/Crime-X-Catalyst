import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Mic, Upload, Download, Share2, ChevronRight, CheckCircle, Volume2, VolumeX, FileText, UserPlus, Copy, Trash2, Bot } from 'lucide-react';
import { backendChatApi } from '../lib/backendApi';
import { auditApi } from '../lib/supabaseApi';
import { useAuthStore } from '../context/authStore';
import { useUIStore } from '../context/uiStore';
import type { ChatMessage } from '../types';
import jsPDF from 'jspdf';

/* ── Simple Markdown Parsing Helper ──────────────────────────────────── */
function renderMarkdown(content: string) {
  const lines = content.split('\n');
  let inTable = false;
  let tableRows: string[][] = [];
  const renderedElements: React.ReactNode[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = (key: string) => {
    if (currentParagraph.length > 0) {
      renderedElements.push(
        <p key={key} className="mb-2 last:mb-0">
          {currentParagraph.map((text, idx) => {
            const boldRegex = /\*\*(.*?)\*\*/g;
            const parts: React.ReactNode[] = [];
            let lastIndex = 0;
            let match;
            while ((match = boldRegex.exec(text)) !== null) {
              if (match.index > lastIndex) {
                parts.push(text.substring(lastIndex, match.index));
              }
              parts.push(<strong key={match.index} className="font-bold text-white">{match[1]}</strong>);
              lastIndex = boldRegex.lastIndex;
            }
            if (lastIndex < text.length) {
              parts.push(text.substring(lastIndex));
            }
            return <span key={idx}>{parts}</span>;
          })}
        </p>
      );
      currentParagraph = [];
    }
  };

  lines.forEach((line, idx) => {
    const trimmed = line.trim();

    if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
      flushParagraph(`p-${idx}`);
      const cols = trimmed.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
      if (trimmed.includes('---')) {
        return;
      }
      tableRows.push(cols);
      inTable = true;
      return;
    } else if (inTable) {
      renderedElements.push(
        <div key={`table-${idx}`} className="my-2 overflow-x-auto border border-[#1F2D40] rounded-xl bg-black/30">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="border-b border-[#1F2D40] bg-white/5">
                {tableRows[0]?.map((h, i) => (
                  <th key={i} className="px-3 py-2 text-gray-400 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.slice(1).map((row, rIdx) => (
                <tr key={rIdx} className="border-b border-[#1F2D40]/40 last:border-0 hover:bg-white/5">
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-gray-300">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      inTable = false;
    }

    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      flushParagraph(`p-${idx}`);
      renderedElements.push(
        <ul key={`ul-${idx}`} className="list-disc list-inside ml-2 mb-2 text-gray-300">
          <li>{trimmed.substring(2)}</li>
        </ul>
      );
      return;
    }

    currentParagraph.push(line);
  });

  flushParagraph(`p-final`);
  if (inTable && tableRows.length > 0) {
    renderedElements.push(
      <div key={`table-final`} className="my-2 overflow-x-auto border border-[#1F2D40] rounded-xl bg-black/30">
        <table className="w-full text-xs text-left border-collapse">
          <thead>
            <tr className="border-b border-[#1F2D40] bg-white/5">
              {tableRows[0]?.map((h, i) => (
                <th key={i} className="px-3 py-2 text-gray-400 font-semibold">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableRows.slice(1).map((row, rIdx) => (
              <tr key={rIdx} className="border-b border-[#1F2D40]/40 last:border-0 hover:bg-white/5">
                {row.map((cell, cIdx) => (
                  <td key={cIdx} className="px-3 py-2 text-gray-300">{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return <div className="space-y-1">{renderedElements}</div>;
}

/* ── Toast notification ─────────────────────────────────────────────── */
function Toast({ msg, onClose }: { msg: string; onClose: () => void }) {
  useEffect(() => { const t = setTimeout(onClose, 3000); return () => clearTimeout(t); }, [onClose]);
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 bg-[#111827] border border-green-500/30 rounded-2xl shadow-2xl text-sm text-green-400">
      <CheckCircle size={16} /> {msg}
    </motion.div>
  );
}

/* ── Typing indicator ────────────────────────────────────────────────── */
function TypingIndicator() {
  return (
    <div className="flex gap-1 px-4 py-3 rounded-2xl bg-[#1a2435] w-fit">
      {[0, 1, 2].map(i => <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />)}
    </div>
  );
}

export default function AIAssistant() {
  const { user } = useAuthStore();
  const { language, lastConversationId, setLastConversationId } = useUIStore();
  const isKn = language === 'kn';

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [, setConversations] = useState<{ id: string; title: string }[]>([]);
  const [activeConvId, setActiveConvId] = useState<string>('');
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadFileName, setUploadFileName] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Load conversations on mount — runs once only
  useEffect(() => {
    const initConversation = async () => {
      try {
        const storedId = useUIStore.getState().lastConversationId;

        // Only trust the stored ID if it looks like a real UUID
        const isValidUUID = (id: string | null) =>
          !!id && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);

        let targetId = '';
        if (isValidUUID(storedId)) {
          targetId = storedId!;
        } else {
          // Fall back: check DB for latest real conversation
          const list = await backendChatApi.getConversations();
          setConversations(list);
          if (list.length > 0 && isValidUUID(list[0].id)) {
            targetId = list[0].id;
          } else {
            // Brand new session — generate a real UUID
            targetId = crypto.randomUUID();
          }
        }
        setActiveConvId(targetId);
        setLastConversationId(targetId);
      } catch (e) {
        console.error(e);
        // Fallback: start a fresh UUID session
        const newId = crypto.randomUUID();
        setActiveConvId(newId);
        setLastConversationId(newId);
      }
    };
    initConversation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fetch messages when activeConvId changes
  useEffect(() => {
    if (!activeConvId) return;

    let isMounted = true;
    
    const fetchHistory = async () => {
      try {
        const history = await backendChatApi.getHistory(activeConvId);
        if (isMounted) {
          if (history.length === 0) {
            // Seed a welcome message
            const welcomeMsg: ChatMessage = {
              id: 'welcome',
              role: 'assistant',
              content: isKn
                ? '👋 ನಮಸ್ಕಾರ! ನಾನು Mistral AI ಚಾಲಿತ KSP ತನಿಖಾ ಸಹಾಯಕಿ. ಅಪರಾಧ ಮಾದರಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲು, FIR ಡೇಟಾ ಪ್ರಶ್ನಿಸಲು, ಜಾಲಗಳನ್ನು ಗುರುತಿಸಲು ಮತ್ತು ಗಸ್ತು ಶಿಫಾರಸುಗಳನ್ನು ಒದಗಿಸಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನೀವು ಏನನ್ನು ತನಿಖೆ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? (ಈ ಪ್ರತಿಕ್ರಿಯೆಗಳು AI-ಆಧರಿತ ತನಿಖಾ ಸಹಾಯಕ ಸಹಾಯವಾಗಿದ್ದು, ನ್ಯಾಯವಿಜ್ಞಾನ ತೀರ್ಮಾನವಲ್ಲ).'
                : '👋 Hello! I am the KSP Investigative Assistant powered by Mistral AI. I can help you analyze crime patterns, query FIR data, identify networks, and provide patrol recommendations. What would you like to investigate today? (This is an AI-assisted analytical aid, not a forensic conclusion).',
              timestamp: new Date().toISOString(),
              sources: [],
            };
            setMessages([welcomeMsg]);
          } else {
            setMessages(history);
          }
        }
      } catch (e) {
        console.error(e);
      }
    };

    fetchHistory();

    // Subscribe to realtime updates for this conversation
    const unsubscribe = backendChatApi.subscribeToConversation(activeConvId, () => {
      fetchHistory();
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeConvId, isKn]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const showToast = useCallback((msg: string) => { setToast(msg); }, []);

  const handleSendMessage = async (contentStr: string) => {
    if (!contentStr.trim() || isTyping) return;
    setInput('');

    // Optimistically append the user message — no full reload
    const tempUserMsg: ChatMessage = {
      id: 'temp-' + Date.now(),
      role: 'user',
      content: contentStr,
      timestamp: new Date().toISOString(),
      sources: []
    };
    setMessages(prev => [...prev, tempUserMsg]);
    setIsTyping(true);

    try {
      // Send to backend; the API will stream/store the assistant reply.
      // The realtime subscription will fire fetchHistory once the reply is saved.
      await backendChatApi.sendMessage(activeConvId, contentStr, user?.id);

      // Fetch the latest messages once to get the assistant reply
      // (covers cases where realtime subscription may not fire in time)
      const history = await backendChatApi.getHistory(activeConvId);
      if (history && history.length > 0) {
        setMessages(history);
      }

      if (user) {
        auditApi.log({
          performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
          role: user.rank || user.role,
          action: `AI Chat Inquiry: ${contentStr.substring(0, 100)}`,
          targetId: activeConvId,
        }).catch(console.error);
      }
    } catch (e) {
      console.error(e);
      // Remove the optimistic user message on failure
      setMessages(prev => prev.filter(m => m.id !== tempUserMsg.id));
      showToast(isKn ? 'ಸಂದೇಶ ಕಳುಹಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to send message');
    } finally {
      setIsTyping(false);
    }
  };

  /* ── Voice Input (Speech to Text) ─────────────────────────────────── */
  const handleVoice = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      showToast(isKn ? '⚠️ ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಧ್ವನಿ ಬೆಂಬಲವಿಲ್ಲ' : '⚠️ Speech recognition is not supported in your browser');
      return;
    }
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const r = new SR();
    r.lang = isKn ? 'kn-IN' : 'en-IN';
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e: any) => {
      const text = e.results[0][0].transcript;
      setInput(text);
      setIsListening(false);
      showToast(isKn ? 'ಧ್ವನಿ ಗುರುತಿಸಲಾಗಿದೆ' : 'Speech recognized');
    };
    r.onerror = () => setIsListening(false);
    r.onend = () => setIsListening(false);
    recognitionRef.current = r;
    r.start();
    setIsListening(true);
  };

  /* ── Speech Synthesis (Text to Speech) ────────────────────────────── */
  const handleSpeak = (msgId: string, text: string) => {
    if ('speechSynthesis' in window) {
      if (speakingId === msgId) {
        window.speechSynthesis.cancel();
        setSpeakingId(null);
        return;
      }
      window.speechSynthesis.cancel();
      // Remove sources annotation before reading
      const cleanText = text.split('||SOURCES||')[0].replace(/\*\*/g, '');
      const utterance = new SpeechSynthesisUtterance(cleanText);
      utterance.lang = isKn ? 'kn-IN' : 'en-IN';
      utterance.onend = () => setSpeakingId(null);
      utterance.onerror = () => setSpeakingId(null);
      setSpeakingId(msgId);
      window.speechSynthesis.speak(utterance);
    } else {
      showToast(isKn ? '⚠️ ನಿಮ್ಮ ಬ್ರೌಸರ್‌ನಲ್ಲಿ ಟೆಕ್ಸ್ಟ್-ಟು-ಸ್ಪೀಚ್ ಬೆಂಬಲವಿಲ್ಲ' : '⚠️ Text-to-speech is not supported');
    }
  };

  const handleCopyMessage = (text: string) => {
    const clean = text.split('||SOURCES||')[0].replace(/\*\*/g, '');
    navigator.clipboard.writeText(clean);
    showToast(isKn ? 'ಸಂದೇಶ ನಕಲಿಸಲಾಗಿದೆ' : 'Message copied to clipboard');
  };

  const handleClearHistory = async () => {
    if (!activeConvId) return;
    try {
      await backendChatApi.clearHistory(activeConvId);

      // Generate a real UUID so it never collides with the old conv
      const newConvId = crypto.randomUUID();
      setActiveConvId(newConvId);
      setLastConversationId(newConvId);
      setConversations([]);

      const welcomeMsg: ChatMessage = {
        id: 'welcome',
        role: 'assistant',
        content: isKn
          ? '👋 ನಮಸ್ಕಾರ! ನಾನು Mistral AI ಚಾಲಿತ KSP ತನಿಖಾ ಸಹಾಯಕಿ. ಅಪರಾಧ ಮಾದರಿಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲು, FIR ಡೇಟಾ ಪ್ರಶ್ನಿಸಲು, ಜಾಲಗಳನ್ನು ಗುರುತಿಸಲು ಮತ್ತು ಗಸ್ತು ಶಿಫಾರಸುಗಳನ್ನು ಒದಗಿಸಲು ನಾನು ನಿಮಗೆ ಸಹಾಯ ಮಾಡಬಲ್ಲೆ. ಇಂದು ನೀವು ಏನನ್ನು ತನಿಖೆ ಮಾಡಲು ಬಯಸುತ್ತೀರಿ? (ಈ ಪ್ರತಿಕ್ರಿಯೆಗಳು AI-ಆಧರಿತ ತನಿಖಾ ಸಹಾಯಕ ಸಹಾಯವಾಗಿದ್ದು, ನ್ಯಾಯವಿಜ್ಞಾನ ತೀರ್ಮಾನವಲ್ಲ).'
          : '👋 Hello! I am the KSP Investigative Assistant powered by Mistral AI. I can help you analyze crime patterns, query FIR data, identify networks, and provide patrol recommendations. What would you like to investigate today? (This is an AI-assisted analytical aid, not a forensic conclusion).',
        timestamp: new Date().toISOString(),
        sources: [],
      };
      // Immediately replace messages — the new UUID has no DB history
      setMessages([welcomeMsg]);
      showToast(isKn ? 'ಸಂಭಾಷಣೆಯ ಇತಿಹಾಸವನ್ನು ತೆರವುಗೊಳಿಸಲಾಗಿದೆ' : 'Conversation history cleared');
    } catch (e) {
      console.error(e);
      showToast(isKn ? 'ತೆರವುಗೊಳಿಸಲು ವಿಫಲವಾಗಿದೆ' : 'Failed to clear history');
    }
  };

  /* ── File Upload ─────────────────────────────────────────────────── */
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadProgress(0);
    setUploadFileName(file.name);
    
    // Simulate real upload progress
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev === null || prev >= 100) { clearInterval(interval); return null; }
        return Math.min(prev + 15, 100);
      });
    }, 150);

    setTimeout(async () => {
      clearInterval(interval);
      setUploadProgress(null);

      // Create a metadata entry for file upload

      try {
        await backendChatApi.sendMessage(activeConvId, `[Uploaded File: ${file.name}]`, user?.id);
        showToast(isKn ? 'ದಾಖಲೆ ಅಪ್‌ಲೋಡ್ ಯಶಸ್ವಿ' : 'File uploaded and logged successfully');
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  /* ── Export Actions ──────────────────────────────────────────────── */
  const exportTXT = () => {
    const text = messages.map(m =>
      `[${m.role.toUpperCase()}] ${new Date(m.timestamp).toLocaleTimeString()}\n${m.content.split('||SOURCES||')[0]}`
    ).join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ksp-chat-${activeConvId}.txt`; a.click();
    URL.revokeObjectURL(url);
    showToast(isKn ? 'TXT ರಫ್ತು ಮಾಡಲಾಗಿದೆ' : 'Chat exported as TXT');

    if (user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: `Export Chat TXT: Session ${activeConvId}`,
        targetId: activeConvId,
      }).catch(console.error);
    }
  };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ activeConvId, messages, exportedAt: new Date().toISOString() }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `ksp-chat-${activeConvId}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast(isKn ? 'JSON ರಫ್ತು ಮಾಡಲಾಗಿದೆ' : 'Chat exported as JSON');

    if (user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: `Export Chat JSON: Session ${activeConvId}`,
        targetId: activeConvId,
      }).catch(console.error);
    }
  };

  const generatePDFReport = (reportType: 'General' | 'FIR' | 'Criminal') => {
    const doc = new jsPDF();
    doc.setFillColor(15, 23, 42); // slate-900 background style
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(59, 130, 246); // blue-500
    doc.setFontSize(22);
    doc.text(`KSP AI ${reportType} Investigation Report`, 15, 25);
    
    doc.setTextColor(148, 163, 184); // slate-400
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 33);
    doc.text(`Officer ID: ${user?.badgeNumber || 'System'} | Station: ${user?.station || 'HQ'}`, 15, 39);
    doc.text(`Conversation session: ${activeConvId}`, 15, 45);
    doc.text(`AI-assisted Analytical Aid -- Not a Forensic Conclusion`, 15, 51);
 
    doc.setDrawColor(30, 41, 59); // slate-800 divider
    doc.line(15, 55, 195, 55);
 
    let y = 65;
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(12);
    doc.text('Chronological Analysis & Dialogue:', 15, y);
    y += 10;
 
    messages.forEach(m => {
      if (y > 270) {
        doc.addPage();
        doc.setFillColor(15, 23, 42);
        doc.rect(0, 0, 210, 297, 'F');
        y = 20;
      }
      doc.setTextColor(m.role === 'user' ? 245 : 96, m.role === 'user' ? 158 : 165, m.role === 'user' ? 11 : 250);
      doc.setFontSize(9);
      doc.text(`[${m.role.toUpperCase()}] - ${new Date(m.timestamp).toLocaleTimeString()}`, 15, y);
      y += 6;
 
      doc.setTextColor(226, 232, 240); // slate-200
      doc.setFontSize(10);
      const cleanContent = m.content.split('||SOURCES||')[0].replace(/\*\*/g, '');
      const lines = doc.splitTextToSize(cleanContent, 180);
      lines.forEach((line: string) => {
        if (y > 280) {
          doc.addPage();
          doc.setFillColor(15, 23, 42);
          doc.rect(0, 0, 210, 297, 'F');
          y = 20;
        }
        doc.text(line, 15, y);
        y += 5;
      });
      y += 5;
    });
 
    doc.save(`KSP_${reportType}_Report_${Date.now()}.pdf`);
    showToast(isKn ? 'ವರದಿ ಡೌನ್‌ಲೋಡ್ ಯಶಸ್ವಿ' : 'Report PDF downloaded successfully');

    if (user) {
      auditApi.log({
        performedBy: `${user.name} (${user.badgeNumber || 'N/A'})`,
        role: user.rank || user.role,
        action: `Generate PDF Report: Type ${reportType}, Session ${activeConvId}`,
        targetId: activeConvId,
      }).catch(console.error);
    }
  };

  const shareConv = () => {
    const link = `${window.location.origin}/ai-assistant?conv=${activeConvId}`;
    navigator.clipboard.writeText(link);
    showToast(isKn ? 'ಹಂಚಿಕೆ ಲಿಂಕ್ ಕ್ಲಿಪ್‌ಬೋರ್ಡ್‌ಗೆ ನಕಲಿಸಲಾಗಿದೆ' : 'Share link copied to clipboard');
  };

  const _createNewConv = () => {
    const newId = crypto.randomUUID();
    setActiveConvId(newId);
    setLastConversationId(newId);
    showToast(isKn ? 'ಹೊಸ ತನಿಖೆ ಪ್ರಾರಂಭಿಸಲಾಗಿದೆ' : 'Started new investigation conversation');
  };

  const SUGGESTED_QUESTIONS = isKn
    ? [
      'ವಾಹನ ಕಳ್ಳತನಗಳ ಇತ್ತೀಚಿನ ವಿಶ್ಲೇಷಣೆ ನೀಡಿ',
      'ಬೆಂಗಳೂರಿನ ಅಪರಾಧ ತಡೆಗಟ್ಟುವ ಸಲಹೆಗಳು',
      'ಸಕ್ರಿಯ ಕೊಲೆ ಪ್ರಕರಣಗಳ ಸ್ಥಿತಿ ತಿಳಿಸಿ',
      'ಗಸ್ತು ವಾಹನಗಳು ಹೆಚ್ಚಾಗಿರುವ ವಲಯಗಳು ಯಾವುವು?'
    ]
    : [
      'Analyze recent vehicle theft patterns',
      'Crime prevention advice for theft',
      'Status of active murder investigations',
      'What are the simulated high patrol frequency zones?'
    ];

  return (
    <div className="flex h-[calc(100vh-68px-44px-48px)] gap-4">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <button onClick={exportTXT}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-400 hover:text-white hover:border-blue-500/40 transition-all">
            <Download size={13} /> {isKn ? 'TXT ರಫ್ತು' : 'Export TXT'}
          </button>
          <button onClick={exportJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-400 hover:text-white hover:border-blue-500/40 transition-all">
            <Download size={13} /> JSON
          </button>
          <button onClick={() => generatePDFReport('General')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-400 hover:text-white hover:border-blue-500/40 transition-all">
            <FileText size={13} /> {isKn ? 'ತನಿಖಾ ವರದಿ (PDF)' : 'Investigation PDF'}
          </button>
          <button onClick={() => generatePDFReport('FIR')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-400 hover:text-white hover:border-blue-500/40 transition-all">
            <FileText size={13} /> {isKn ? 'FIR ಸಾರಾಂಶ (PDF)' : 'FIR Summary PDF'}
          </button>
          <button onClick={() => generatePDFReport('Criminal')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-400 hover:text-white hover:border-blue-500/40 transition-all">
            <UserPlus size={13} /> {isKn ? 'ಕ್ರಿಮಿನಲ್ ಪ್ರೊಫೈಲ್ (PDF)' : 'Criminal Profile PDF'}
          </button>
          <button onClick={shareConv}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1a2435] border border-[#1F2D40] text-xs text-gray-400 hover:text-white hover:border-blue-500/40 transition-all">
            <Share2 size={13} /> {isKn ? 'ಹಂಚಿಕೊಳ್ಳಿ' : 'Share Link'}
          </button>
          <button onClick={handleClearHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-950/20 border border-red-900/30 text-xs text-red-400 hover:bg-red-900/20 transition-all">
            <Trash2 size={13} /> {isKn ? 'ಚಾಟ್ ಅಳಿಸಿ' : 'Clear Chat'}
          </button>
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto rounded-2xl bg-[#0d1b2a] border border-[#1F2D40] p-4 space-y-4 mb-3">
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} gap-3`}>
              {msg.role !== 'user' && (
                <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 mt-1 shadow-lg border border-blue-400/20 text-white" title="KSP AI Assistant">
                  <Bot size={18} />
                </div>
              )}
              <div className="max-w-[80%] space-y-1">
                <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-sm shadow-md whitespace-pre-wrap' : 'bg-[#1a2435] text-gray-200 rounded-tl-sm border border-[#1F2D40] shadow-sm'}`}>
                  {msg.role === 'user' 
                    ? msg.content.split('||SOURCES||')[0]
                    : renderMarkdown(msg.content.split('||SOURCES||')[0])}
                </div>
                
                {/* Actions & Timestamp row */}
                <div className="flex items-center gap-2 text-[10px] text-gray-500 px-1">
                  <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
                  <div className="flex items-center gap-1.5 ml-auto">
                    <button onClick={() => handleCopyMessage(msg.content)} className="hover:text-blue-400 transition-colors p-1" title="Copy message">
                      <Copy size={11} />
                    </button>
                    {msg.role !== 'user' && (
                      <button onClick={() => handleSpeak(msg.id, msg.content)} className={`hover:text-blue-400 transition-colors p-1 ${speakingId === msg.id ? 'text-blue-400 animate-pulse' : ''}`} title="Read Aloud">
                        {speakingId === msg.id ? <VolumeX size={12} /> : <Volume2 size={12} />}
                      </button>
                    )}
                  </div>
                </div>


              </div>
            </motion.div>
          ))}
          {isTyping && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center flex-shrink-0 shadow-lg border border-blue-400/20 text-white">
                <Bot size={18} className="animate-pulse" />
              </div>
              <TypingIndicator />
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Upload status */}
        <AnimatePresence>
          {uploadProgress !== null && (
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="mb-2 px-4 py-2 rounded-xl bg-[#1a2435] border border-[#1F2D40] flex items-center gap-3">
              <span className="text-xs text-gray-400 truncate max-w-[180px]">{isKn ? `${uploadFileName} ವಿಶ್ಲೇಷಿಸಲಾಗುತ್ತಿದೆ…` : `Analyzing ${uploadFileName}...`}</span>
              <div className="flex-1 h-1.5 bg-[#1F2D40] rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
              </div>
              <span className="text-xs text-blue-400 font-mono">{uploadProgress}%</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggested questions */}
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {SUGGESTED_QUESTIONS.map(q => (
            <button key={q} onClick={() => handleSendMessage(q)}
              className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-xs text-blue-300 hover:bg-blue-500/20 transition-all">
              <ChevronRight size={11} />{q}
            </button>
          ))}
        </div>

        {/* Chat input form */}
        <div className="flex gap-2">
          <input type="file" ref={fileInputRef} onChange={handleUpload} className="hidden"
            accept=".pdf,image/*,video/*,audio/*" />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 p-3 rounded-xl bg-[#1a2435] border border-[#1F2D40] text-gray-400 hover:text-white hover:border-blue-500/40 transition-all"
            title={isKn ? 'ಸಾಕ್ಷ್ಯ ಅಪ್‌ಲೋಡ್ ಮಾಡಿ' : 'Upload Evidence Document'}>
            <Upload size={16} />
          </button>
          <div className="flex-1 flex gap-2">
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSendMessage(input)}
              placeholder={isKn ? 'ಅಪರಾಧಗಳು, ಆರೋಪಿಗಳು, ಅಪರಾಧ ಮಾದರಿಗಳ ಬಗ್ಗೆ AI ಅನ್ನು ಕೇಳಿ…' : 'Ask AI about crimes, suspects, patterns...'}
              className="flex-1 bg-[#111827] border border-[#1F2D40] text-sm text-gray-200 placeholder-gray-500 rounded-xl px-4 py-3 focus:border-blue-500 transition-colors"
            />
            <button onClick={handleVoice}
              className={`flex-shrink-0 p-3 rounded-xl border transition-all ${isListening ? 'bg-red-500/20 border-red-500/40 text-red-400 animate-pulse' : 'bg-[#1a2435] border-[#1F2D40] text-gray-400 hover:text-blue-400'}`}
              title={isListening ? (isKn ? 'ಕೇಳುವುದನ್ನು ನಿಲ್ಲಿಸಿ' : 'Stop listening') : (isKn ? 'ಧ್ವನಿ ಮೂಲಕ ಹೇಳಿ' : 'Speak to input')}>
              <Mic size={16} />
            </button>
            <button onClick={() => handleSendMessage(input)} disabled={!input.trim() || isTyping}
              className="flex-shrink-0 px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition-colors disabled:opacity-40 flex items-center gap-1.5">
              <Send size={15} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Toast */}
      <AnimatePresence>
        {toast && <Toast msg={toast} onClose={() => setToast('')} />}
      </AnimatePresence>
    </div>
  );
}
