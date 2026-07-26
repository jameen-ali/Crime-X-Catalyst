import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Server, Database } from 'lucide-react';
import { useUIStore } from '../context/uiStore';
import { useAuthStore } from '../context/authStore';
import { GlassCard, SectionHeader, StatusBadge } from '../components/ui';
import { healthApi } from '../mockApi';

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-blue-500' : 'bg-[#1F2D40]'}`}
        aria-checked={checked}
        role="switch"
        aria-label={label}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform shadow ${checked ? 'translate-x-5' : 'translate-x-0'}`} />
      </button>
    </div>
  );
}

export default function Settings() {
  const { theme, toggleTheme, language, setLanguage } = useUIStore();
  const { user } = useAuthStore();
  const [notifs, setNotifs] = useState(true);
  const [voice, setVoice] = useState(true);
  const [twoFA, setTwoFA] = useState(false);
  const [emailNotifs, setEmailNotifs] = useState(true);

  const { data: health } = useQuery({ queryKey: ['health'], queryFn: healthApi.getStatus });
  const isKn = language === 'kn';

  const MOCK_ENDPOINTS = [
    { service: 'FastAPI Backend', url: 'http://api.ksp-intelligence.local:8000', status: isKn ? 'ಅನುಕರಿಸಿದ' : 'Mock' },
    { service: 'PostgreSQL', url: 'postgresql://ksp-db:5432/intelligence', status: isKn ? 'ಅನುಕರಿಸಿದ' : 'Mock' },
    { service: 'Neo4j', url: 'bolt://neo4j:7687', status: isKn ? 'ಅನುಕರಿಸಿದ' : 'Mock' },
    { service: 'Qdrant', url: 'http://qdrant:6333', status: isKn ? 'ಅನುಕರಿಸಿದ' : 'Mock' },
    { service: 'Elasticsearch', url: 'http://elasticsearch:9200', status: isKn ? 'ಅನುಕರಿಸಿದ' : 'Mock' },
    { service: 'Redis', url: 'redis://redis:6379', status: isKn ? 'ಅನುಕರಿಸಿದ' : 'Mock' },
  ];

  const roleLabels: Record<string, string> = {
    Admin: isKn ? 'ಅಡ್ಮಿನ್' : 'Admin',
    Officer: isKn ? 'ತನಿಖಾಧಿಕಾರಿ' : 'Officer',
    Analyst: isKn ? 'ವಿಶ್ಲೇಷಕರು' : 'Analyst',
  };

  const statusMap: Record<string, string> = {
    'Healthy': isKn ? 'ಆರೋಗ್ಯಕರ' : 'Healthy',
    'Connected': isKn ? 'ಸಂಪರ್ಕಗೊಂಡಿದೆ' : 'Connected',
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <SectionHeader title={isKn ? 'ಸೆಟ್ಟಿಂಗ್ಗಳು' : 'Settings'} subtitle={isKn ? 'ಅಪ್ಲಿಕೇಶನ್ ಆದ್ಯತೆಗಳು ಮತ್ತು ವ್ಯವಸ್ಥಾ ಸಂರಚನೆ' : 'Application preferences and system configuration'} />

      {/* Profile card */}
      <GlassCard title={isKn ? 'ಪ್ರೊಫೈಲ್' : 'Profile'}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-xl font-bold text-white flex-shrink-0">
            {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="flex-1">
            <div className="text-base font-bold text-white">{user?.name}</div>
            <div className="text-sm text-blue-400">{user?.rank}</div>
            <div className="text-xs text-gray-400 mt-0.5">{user?.email} · {isKn ? 'ಬ್ಯಾಡ್ಜ್' : 'Badge'} {user?.badgeNumber}</div>
            <div className="text-xs text-gray-500">{user?.station} · {user?.district}</div>
          </div>
          <StatusBadge status={roleLabels[user?.role ?? 'Officer'] ?? (user?.role ?? 'Officer')} />
        </div>
      </GlassCard>

      {/* Appearance */}
      <GlassCard title={isKn ? 'ನೋಟ' : 'Appearance'}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-300">{isKn ? 'ಥೀಮ್' : 'Theme'}</div>
              <div className="text-xs text-gray-500 mt-0.5">{isKn ? 'ಕಾರ್ಯಾಚರಣೆಗೆ ಡಾರ್ಕ್ ಮೋಡ್ ಶಿಫಾರಸು ಮಾಡಲಾಗಿದೆ' : 'Dark mode is recommended for operations'}</div>
            </div>
            <div className="flex gap-2">
              {(['dark', 'light'] as const).map(t => (
                <button key={t} onClick={toggleTheme}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${theme === t ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-[#1F2D40] text-gray-400 hover:text-white'}`}>
                  {t === 'dark' ? (isKn ? '🌙 ಕರಾಳು' : '🌙 Dark') : (isKn ? '☀️ ಬೆಳಕು' : '☀️ Light')}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-300">{isKn ? 'ಭಾಷೆ' : 'Language'}</div>
              <div className="text-xs text-gray-500 mt-0.5">{isKn ? 'ಇಂಟರ್ಫೇಸ್ ಪ್ರದರ್ಶನ ಭಾಷೆ' : 'Interface display language'}</div>
            </div>
            <div className="flex gap-2">
              {(['en', 'kn'] as const).map(l => (
                <button key={l} onClick={() => setLanguage(l)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${language === l ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : 'border-[#1F2D40] text-gray-400 hover:text-white'}`}>
                  {l === 'en' ? '🇬🇧 English' : '🇮🇳 ಕನ್ನಡ'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard title={isKn ? 'ಅಧಿಸೂಚನೆಗಳು' : 'Notifications'}>
        <div className="space-y-3">
          <Toggle checked={notifs} onChange={setNotifs} label={isKn ? 'ಪುಶ್ ಅಧಿಸೂಚನೆಗಳು' : 'Push Notifications'} />
          <Toggle checked={emailNotifs} onChange={setEmailNotifs} label={isKn ? 'ಇಮೇಲ್ ಅಧಿಸೂಚನೆಗಳು' : 'Email Notifications'} />
          <Toggle checked={voice} onChange={setVoice} label={isKn ? 'ಧ್ವನಿ ಎಚ್ಚರಿಕೆಗಳು' : 'Voice Alerts'} />
        </div>
      </GlassCard>

      {/* Security */}
      <GlassCard title={isKn ? 'ಭದ್ರತೆ' : 'Security'}>
        <div className="space-y-3">
          <Toggle checked={twoFA} onChange={setTwoFA} label={isKn ? 'ದ್ವಿ-ಅಂಶ ಪ್ರಮಾಣೀಕರಣ (ಡೆಮೋ)' : 'Two-Factor Authentication (Demo)'} />
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-300">{isKn ? 'ಸೆಷನ್ ಕಾಲಾವಧಿ' : 'Session Timeout'}</div>
              <div className="text-xs text-gray-500">{isKn ? 'ನಿಷ್ಕ್ರಿಯತೆ ನಂತರ ಸ್ವಯಂಚಾಲಿತ ಲಾಗ್ ಔಟ್' : 'Automatic logout after inactivity'}</div>
            </div>
            <select className="bg-[#1a2435] border border-[#1F2D40] text-sm text-gray-200 rounded-xl px-3 py-1.5">
              <option>{isKn ? '30 ನಿಮಿಷ' : '30 minutes'}</option>
              <option>{isKn ? '1 ಗಂಟೆ' : '1 hour'}</option>
              <option>{isKn ? '4 ಗಂಟೆ' : '4 hours'}</option>
              <option>{isKn ? '8 ಗಂಟೆ' : '8 hours'}</option>
            </select>
          </div>
          <div className="text-xs text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2">
            {isKn ? '⚠️ ಇದು ಡೆಮೋ ವ್ಯವಸ್ಥೆ. ಎಲ್ಲಾ ಭದ್ರತಾ ವೈಶಿಷ್ಟ್ಯಗಳನ್ನು ಅನುಕರಿಸಲಾಗಿದೆ.' : '⚠️ This is a demo system. All security features are simulated.'}
          </div>
        </div>
      </GlassCard>

      {/* API Configuration */}
      <GlassCard title={isKn ? 'API ಸಂರಚನೆ (ಕೇವಲ ಓದುವಿಕೆ — ಉತ್ಪಾದನಾ ಎಂಡ್‌ಪಾಯಿಂಟ್‌ಗಳು)' : 'API Configuration (Read-only — Production Endpoints)'}>
        <div className="space-y-2">
          {MOCK_ENDPOINTS.map(ep => (
            <div key={ep.service} className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#1a2435] border border-[#1F2D40]">
              <Server size={13} className="text-blue-400 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white">{ep.service}</div>
                <div className="text-[10px] text-gray-500 font-mono truncate">{ep.url}</div>
              </div>
              <span className="text-[10px] bg-amber-500/15 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full">{ep.status}</span>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Database health */}
      <GlassCard title={isKn ? 'ಡೇಟಾಬೇಸ್ ಸ್ಥಿತಿ' : 'Database Status'}>
        <div className="space-y-3">
          {health ? Object.entries(health).map(([db, info]: [string, any]) => (
            <motion.div key={db} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-[#1a2435] border border-[#1F2D40]">
              <Database size={13} className="text-blue-400 flex-shrink-0" />
              <div className="flex-1">
                <div className="text-xs font-medium text-white capitalize">{db}</div>
                <div className="text-[10px] text-gray-500">v{info.version} · {info.latency}ms</div>
              </div>
              <StatusBadge status={statusMap[info.status] ?? info.status} />
            </motion.div>
          )) : Array.from({length:5}).map((_,i) => (
            <div key={i} className="skeleton h-12 rounded-xl" />
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
