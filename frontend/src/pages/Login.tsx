import { useState } from 'react';
import { motion } from 'framer-motion';
import { Eye, EyeOff, AlertCircle, Lock, Globe, User, Shield, CheckCircle2, Cpu, Activity, FileSearch, Sun, Moon } from 'lucide-react';
import { useAuthStore } from '../context/authStore';
import { useUIStore } from '../context/uiStore';

import kspLogo from '../assets/ksp-logo.png';

// ─── KSP Government Emblem component using official logo ───────────────────────
function KSPEmblem({ size = 88 }: { size?: number }) {
  return (
    <img
      src={kspLogo}
      alt="Karnataka State Police Logo"
      style={{
        width: size,
        height: size,
        objectFit: 'contain',
        filter: 'drop-shadow(0 0 12px rgba(45,140,255,0.25))',
      }}
    />
  );
}

// ─── Premium Enterprise Left Panel (Floating Logo Hero) ──────────────────────
function IntelligenceIllustration() {
  const { theme } = useUIStore();
  const isLight = theme === 'light';

  const bulletPoints = [
    'Real-Time Crime Analysis',
    'Predictive Intelligence',
    'Cyber Surveillance',
    'Evidence Correlation',
    'Officer Decision Support',
  ];

  return (
    <div className="absolute inset-0 overflow-hidden select-none" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* ── Background: Matches Main Dashboard Navy-Slate Gradient (#2D3250 / #424769) ── */}
      <div 
        className="absolute inset-0 transition-colors duration-300" 
        style={{ 
          background: isLight 
            ? 'linear-gradient(135deg, #f0f4f9 0%, #e2e8f0 50%, #dbeafe 100%)'
            : 'linear-gradient(135deg, #232742 0%, #2D3250 50%, #373C5E 100%)' 
        }} 
      />

      {/* ── Soft Grid Pattern ── */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{ 
          backgroundImage: isLight 
            ? 'radial-gradient(circle, rgba(45,140,255,0.18) 1px, transparent 1px)' 
            : 'radial-gradient(circle, rgba(246,177,122,0.15) 1px, transparent 1px)', 
          backgroundSize: '40px 40px', 
          opacity: 0.5 
        }} 
      />
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: isLight ? 0.08 : 0.05 }}>
        <defs>
          <pattern id="cleanGrid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M 80 0 L 0 0 0 80" fill="none" stroke="#F6B17A" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cleanGrid)" />
      </svg>

      {/* ── Spotlight Beam Ray (Centered Directly on Top of the Logo) ── */}
      <div 
        className="absolute pointer-events-none" 
        style={{ 
          top: 0, 
          left: '50%', 
          transform: 'translateX(-50%)', 
          width: '420px', 
          height: '80%', 
          background: isLight
            ? 'linear-gradient(180deg, rgba(96,165,250,0.22) 0%, rgba(246,177,122,0.12) 40%, transparent 100%)'
            : 'linear-gradient(180deg, rgba(246,177,122,0.22) 0%, rgba(96,165,250,0.15) 50%, transparent 100%)', 
          clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)',
          filter: 'blur(6px)',
          zIndex: 1,
        }} 
      />

      {/* ── Subtle Watermark ── */}
      <div 
        className="absolute inset-0 flex items-center justify-center pointer-events-none" 
        style={{ opacity: isLight ? 0.07 : 0.04 }}
      >
        <svg width="420" height="420" viewBox="0 0 100 100" fill="none">
          <circle cx="50" cy="50" r="46" stroke="#F6B17A" strokeWidth="0.5" strokeDasharray="3,3" />
          <circle cx="50" cy="50" r="38" stroke="#60A5FA" strokeWidth="0.3" />
          <circle cx="50" cy="50" r="28" stroke="#F6B17A" strokeWidth="0.2" strokeDasharray="2,4" />
          <path d="M38,18 L46,14 L56,16 L66,18 L74,26 L80,36 L81,48 L78,60 L73,70 L66,79 L58,86 L50,90 L42,88 L35,82 L26,76 L20,66 L18,54 L20,42 L24,32 L30,24 Z" fill="none" stroke="#F6B17A" strokeWidth="0.5" />
        </svg>
      </div>

      {/* ── Floating Particles ── */}
      {[...Array(16)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full pointer-events-none"
          style={{
            width: i % 3 === 0 ? 3 : 1.8,
            height: i % 3 === 0 ? 3 : 1.8,
            background: i % 4 === 0 ? '#F6B17A' : i % 2 === 0 ? '#60A5FA' : '#4ADE80',
            left: `${8 + (i * 35) % 82}%`,
            top: `${10 + (i * 47) % 78}%`,
            boxShadow: i % 4 === 0 ? '0 0 8px #F6B17A' : '0 0 6px #60A5FA',
          }}
          animate={{
            y: [0, -(10 + (i % 5) * 5), 0],
            opacity: isLight ? [0.3, 0.85, 0.3] : [0.2, 0.7, 0.2],
          }}
          transition={{
            duration: 4.5 + (i % 4),
            repeat: Infinity,
            delay: i * 0.3,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* ── TOP LEFT BRANDING & BULLET POINTS ── */}
      <div className="absolute z-10" style={{ top: 36, left: 36, maxWidth: 380 }}>
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {/* Live Status Badge */}
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px',
            background: isLight ? 'rgba(255,255,255,0.85)' : 'rgba(45,50,80,0.8)',
            border: isLight ? '1px solid rgba(45,140,255,0.3)' : '1px solid rgba(246,177,122,0.3)',
            boxShadow: isLight ? '0 2px 8px rgba(0,0,0,0.04)' : '0 4px 12px rgba(0,0,0,0.2)',
            borderRadius: 20, marginBottom: 14
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', boxShadow: '0 0 8px #4ADE80' }} className="animate-pulse" />
            <span style={{ fontSize: 10, color: isLight ? '#1E293B' : '#C9CBD7', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              Government of Karnataka • LIVE Platform
            </span>
          </div>

          {/* Heading */}
          <h2 style={{ color: isLight ? '#0F172A' : '#FFFFFF', fontSize: 32, fontWeight: 900, lineHeight: 1.15, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
            KSP Intelligence
          </h2>

          {/* Subtitle */}
          <p style={{ color: isLight ? '#0284C7' : '#F6B17A', fontSize: 13, fontWeight: 600, margin: '0 0 20px', letterSpacing: '0.02em' }}>
            AI Powered Crime Intelligence Platform
          </p>

          {/* Bullet Points */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {bulletPoints.map((text, idx) => (
              <motion.div
                key={text}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35 + idx * 0.08, duration: 0.4 }}
                style={{ display: 'flex', alignItems: 'center', gap: 9 }}
              >
                <div style={{
                  width: 18, height: 18, borderRadius: '50%',
                  background: isLight ? 'rgba(2,132,199,0.12)' : 'rgba(246,177,122,0.15)',
                  border: isLight ? '1px solid rgba(2,132,199,0.3)' : '1px solid rgba(246,177,122,0.35)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                }}>
                  <CheckCircle2 size={11} color={isLight ? '#0284C7' : '#F6B17A'} />
                </div>
                <span style={{ fontSize: 12, color: isLight ? '#334155' : '#C9CBD7', fontWeight: 600, letterSpacing: '0.01em' }}>
                  {text}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── CENTER HERO: LOGO BEHIND TEXT (zIndex 0, REDUCED BRIGHTNESS) & FOREGROUND KSP INTELLIGENCE TEXT (zIndex 10) ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
        
        {/* 1. Floating Logo Emblem Element (BEHIND TEXT - zIndex: 0, REDUCED BRIGHTNESS) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.88 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex flex-col items-center justify-center"
          style={{ transform: 'translateY(-6px)', zIndex: 0 }}
        >
          {/* Outer Glass Aura Ring */}
          <div 
            style={{ 
              position: 'absolute', 
              width: 340, height: 340, 
              borderRadius: '50%', 
              border: isLight ? '1px solid rgba(45,140,255,0.2)' : '1px solid rgba(246,177,122,0.25)', 
              background: isLight
                ? 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(66,71,105,0.4) 0%, transparent 70%)',
              boxShadow: isLight
                ? '0 0 30px rgba(45,140,255,0.1), inset 0 0 20px rgba(246,179,82,0.05)'
                : '0 0 40px rgba(246,177,122,0.12), inset 0 0 20px rgba(96,165,250,0.08)',
            }} 
          />

          {/* Golden Rim Orbit Line */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
            style={{
              position: 'absolute',
              width: 320, height: 320,
              borderRadius: '50%',
              border: '1px stroke transparent',
              borderTop: '2px solid rgba(246,177,122,0.6)',
              borderBottom: '2px solid rgba(96,165,250,0.5)',
            }}
          />

          {/* Floating Logo Image (BEHIND TEXT - Reduced Brightness / Opacity) */}
          <motion.div
            animate={{
              y: [0, -10, 0],
              rotate: [0, 1, -1, 0],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isLight ? 0.55 : 0.52,
              filter: isLight
                ? 'brightness(0.85) contrast(1.05) drop-shadow(0 10px 25px rgba(15,23,42,0.15))'
                : 'brightness(0.72) contrast(1.1) drop-shadow(0 0 25px rgba(246,177,122,0.3))',
            }}
          >
            <img
              src={kspLogo}
              alt="Karnataka State Police Hero Emblem"
              style={{
                width: 240,
                height: 240,
                objectFit: 'contain',
              }}
            />
          </motion.div>

          {/* Soft Shadow Underneath */}
          <motion.div
            animate={{
              scale: [1, 0.85, 1],
              opacity: isLight ? [0.25, 0.12, 0.25] : [0.4, 0.22, 0.4],
            }}
            transition={{
              duration: 5.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            style={{
              width: 140,
              height: 16,
              borderRadius: '50%',
              background: isLight
                ? 'radial-gradient(ellipse at center, rgba(15,23,42,0.25) 0%, transparent 70%)'
                : 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, transparent 70%)',
              marginTop: 14,
            }}
          />
        </motion.div>

        {/* 2. Foreground Large Text Watermark IN FRONT OF LOGO (zIndex: 10) */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: 'clamp(28px, 3.4vw, 44px)',
            fontWeight: 900,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          <span
            className="bg-clip-text text-transparent"
            style={{
              display: 'inline-block',
              backgroundImage: isLight
                ? 'linear-gradient(180deg, #0F172A 0%, #1E3A8A 55%, #1D4ED8 100%)'
                : 'linear-gradient(180deg, #FFFFFF 0%, #F6B17A 50%, #60A5FA 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextStroke: isLight ? '1.5px rgba(15, 23, 42, 0.6)' : '1.5px rgba(255, 255, 255, 0.6)',
              filter: isLight
                ? 'drop-shadow(0 4px 16px rgba(15, 23, 42, 0.3)) drop-shadow(0 2px 4px rgba(255, 255, 255, 0.8))'
                : 'drop-shadow(0 0 30px rgba(246, 177, 122, 0.6)) drop-shadow(0 4px 20px rgba(0, 0, 0, 0.8))',
            }}
          >
            KSP INTELLIGENCE
          </span>
        </div>

        {/* 3. Soft Spotlight Shade directly over the Logo Center */}
        <div 
          style={{ 
            position: 'absolute',
            top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
            width: '480px', height: '480px', 
            background: isLight 
              ? 'radial-gradient(circle, rgba(96,165,250,0.25) 0%, rgba(246,177,122,0.12) 45%, transparent 70%)'
              : 'radial-gradient(circle, rgba(246,177,122,0.25) 0%, rgba(96,165,250,0.18) 50%, transparent 75%)', 
            pointerEvents: 'none', borderRadius: '50%', filter: 'blur(28px)', 
            zIndex: 3 
          }} 
        />
      </div>

      {/* ── BOTTOM SECTION: THREE SMALL FLOATING GLASS CARDS ── */}
      <div 
        className="absolute z-10" 
        style={{ bottom: 28, left: 28, right: 28, display: 'flex', gap: 14 }}
      >
        {[
          { 
            icon: <Cpu size={18} color={isLight ? '#0284C7' : '#F6B17A'} />, 
            title: 'AI Investigation', 
            sub: 'Real-Time Analysis', 
            accent: isLight ? '#0284C7' : '#F6B17A', 
            delay: 0.6 
          },
          { 
            icon: <Activity size={18} color={isLight ? '#2D8CFF' : '#60A5FA'} />, 
            title: 'Crime Prediction', 
            sub: 'Machine Learning', 
            accent: isLight ? '#2D8CFF' : '#60A5FA', 
            delay: 0.7 
          },
          { 
            icon: <FileSearch size={18} color={isLight ? '#D97706' : '#4ADE80'} />, 
            title: 'Digital Evidence', 
            sub: 'AI Forensics', 
            accent: isLight ? '#D97706' : '#4ADE80', 
            delay: 0.8 
          },
        ].map((card) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: card.delay, duration: 0.5 }}
            whileHover={{ y: -3, transition: { duration: 0.2 } }}
            style={{
              flex: 1,
              background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(42, 47, 77, 0.75)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              border: isLight ? '1px solid rgba(0, 0, 0, 0.08)' : '1px solid rgba(255, 255, 255, 0.1)',
              borderTop: `2px solid ${card.accent}`,
              borderRadius: 16,
              padding: '14px 16px',
              boxShadow: isLight ? '0 10px 30px rgba(0, 0, 0, 0.06)' : '0 10px 30px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: `${card.accent}18`,
                border: `1px solid ${card.accent}35`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {card.icon}
            </div>
            <div>
              <div style={{ fontSize: 13, color: isLight ? '#0F172A' : '#FFFFFF', fontWeight: 600, lineHeight: 1.2 }}>
                {card.title}
              </div>
              <div style={{ fontSize: 10, color: card.accent, fontWeight: 600, marginTop: 2, letterSpacing: '0.02em' }}>
                {card.sub}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Login Page ──────────────────────────────────────────────────────────
export default function LoginPage() {
  /* ── Preserved original state & logic ── */
  const { theme, toggleTheme, language, setLanguage } = useUIStore();
  const isLight = theme === 'light';

  const [email, setEmail] = useState('admin@ksp.gov.in');
  const [password, setPassword] = useState('demo123');
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState('Admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();

  const isKn = language === 'kn';

  const DEMO_ACCOUNTS = [
    {
      label: isKn ? 'ನಿರ್ವಾಹಕ (SP ಸುರೇಶ್ ರಾವ್)' : 'Admin (SP Suresh Rao)',
      email: 'admin@ksp.gov.in',
      role: 'Admin',
      badge: isKn ? 'ನಿರ್ವಾಹಕ' : 'Admin',
      badgeColor: '#EF4444',
      icon: '🛡️',
    },
    {
      label: isKn ? 'ಅಧಿಕಾರಿ (SI ಕವಿತಾ ನಾಯರ್)' : 'Officer (SI Kavitha Nair)',
      email: 'kavitha.nair@ksp.gov.in',
      role: 'Officer',
      badge: isKn ? 'ಅಧಿಕಾರಿ' : 'Officer',
      badgeColor: '#60A5FA',
      icon: '👮',
    },
    {
      label: isKn ? 'ವಿಶ್ಲೇಷಕ (ಪ್ರಿಯಾ ಶರ್ಮಾ)' : 'Analyst (Priya Sharma)',
      email: 'priya.sharma@ksp.gov.in',
      role: 'Analyst',
      badge: isKn ? 'ವಿಶ್ಲೇಷಕ' : 'Analyst',
      badgeColor: '#4ADE80',
      icon: '📊',
    },
  ];

  /* ── Preserved original handlers ── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password, role);
    } catch {
      setError(isKn ? 'ಲಾಗಿನ್ ವಿಫಲವಾಗಿದೆ. ದಯವಿಟ್ಟು ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ.' : 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const quickLogin = async (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setRole(acc.role);
    setLoading(true);
    try {
      await login(acc.email, 'demo', acc.role);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        background: isLight
          ? '#f8fafc'
          : '#2D3250',
        minHeight: '100vh',
        fontFamily: "'Inter', 'SF Pro Display', system-ui, sans-serif"
      }}
      className="flex overflow-hidden transition-colors duration-300"
    >
      {/* ── LEFT PANEL — Illustration (hidden on mobile) ── */}
      <div className="hidden lg:block relative" style={{ width: '60%', flexShrink: 0 }}>
        <IntelligenceIllustration />
      </div>

      {/* ── RIGHT PANEL — Login ── */}
      <div
        className="flex-1 flex flex-col items-center justify-center relative overflow-y-auto transition-colors duration-300"
        style={{
          background: isLight
            ? 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)'
            : 'linear-gradient(135deg, #232742 0%, #2D3250 50%, #373C5E 100%)',
          minWidth: 0
        }}
      >
        {/* Top-right controls (Theme & Language) */}
        <div className="absolute top-5 right-5 flex items-center gap-2 z-50">
          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={toggleTheme}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              color: isLight ? '#1E293B' : '#C9CBD7',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            title={isLight ? 'Switch to Dark Theme' : 'Switch to Light Theme'}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = isLight ? 'rgba(246,177,122,0.15)' : 'rgba(246,177,122,0.15)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(246,177,122,0.4)';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)';
              (e.currentTarget as HTMLButtonElement).style.borderColor = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)';
            }}
          >
            {isLight ? <Moon size={14} color="#1E293B" /> : <Sun size={14} color="#F6B17A" />}
            <span>{isLight ? (isKn ? 'ಡಾರ್ಕ್ ಮೋಡ್' : 'Dark Mode') : (isKn ? 'ಲೈಟ್ ಮೋಡ್' : 'Light Mode')}</span>
          </button>

          {/* Language Toggle Button */}
          <button
            type="button"
            onClick={() => setLanguage(isKn ? 'en' : 'kn')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              border: isLight ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10,
              color: isLight ? '#1E293B' : '#C9CBD7',
              fontSize: 12,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(246,177,122,0.15)'; (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(246,177,122,0.4)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)'; (e.currentTarget as HTMLButtonElement).style.borderColor = isLight ? 'rgba(0,0,0,0.12)' : 'rgba(255,255,255,0.15)'; }}
          >
            <Globe size={13} color={isLight ? '#1E293B' : '#C9CBD7'} />
            <span>{isKn ? 'English' : 'ಕನ್ನಡ'}</span>
          </button>
        </div>

        {/* Login card */}
        <motion.div
          initial={{ opacity: 0, y: 32, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ width: '100%', maxWidth: 480, padding: '0 20px' }}
        >
          {/* Demo notice */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{
              marginBottom: 16,
              padding: '10px 14px',
              borderRadius: 12,
              border: isLight ? '1px solid rgba(245,158,11,0.35)' : '1px solid rgba(246,177,122,0.35)',
              background: isLight ? 'rgba(245,158,11,0.1)' : 'rgba(246,177,122,0.1)',
              display: 'flex', alignItems: 'flex-start', gap: 8,
            }}
          >
            <AlertCircle size={13} color={isLight ? '#D97706' : '#F6B17A'} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: 11, color: isLight ? '#92400E' : '#F6B17A', margin: 0, lineHeight: 1.5, fontWeight: 500 }}>
              <strong style={{ fontWeight: 700 }}>{isKn ? 'ಡೆಮೋ ಆವೃತ್ತಿ' : 'Demo Mode'}</strong> —{' '}
              {isKn
                ? 'ಕೃತಕ ಡೇಟಾ ಮಾತ್ರ. ನಿಜವಾದ ರುಜುವಾತುಗಳು ಅಗತ್ಯವಿಲ್ಲ. ಯಾವುದೇ ಪಾಸ್‌ವರ್ಡ್ ಸ್ವೀಕಾರಾರ್ಹ.'
                : 'Synthetic data only. No real credentials required. Any password will work.'}
            </p>
          </motion.div>

          {/* Main card */}
          <div style={{
            background: isLight ? 'rgba(255,255,255,0.92)' : 'rgba(66, 71, 105, 0.88)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.12)',
            borderRadius: 24,
            boxShadow: isLight
              ? '0 20px 60px rgba(15,23,42,0.08), 0 0 0 1px rgba(0,0,0,0.04)'
              : '0 32px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(246,177,122,0.15), inset 0 1px 0 rgba(255,255,255,0.08)',
            overflow: 'hidden',
          }}>
            {/* Card header */}
            <div style={{
              padding: '36px 40px 28px',
              textAlign: 'center',
              borderBottom: isLight ? '1px solid rgba(0,0,0,0.06)' : '1px solid rgba(255,255,255,0.08)',
              background: isLight
                ? 'linear-gradient(180deg, rgba(45,140,255,0.08) 0%, transparent 100%)'
                : 'linear-gradient(180deg, rgba(246,177,122,0.08) 0%, transparent 100%)',
              position: 'relative',
            }}>
              {/* Secure badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '4px 12px',
                background: 'rgba(74,222,128,0.12)',
                border: '1px solid rgba(74,222,128,0.25)',
                borderRadius: 20,
                marginBottom: 20,
              }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80' }} className="animate-pulse" />
                <span style={{ fontSize: 10, color: isLight ? '#15803D' : '#4ADE80', fontWeight: 600, letterSpacing: '0.1em' }}>
                  {isKn ? 'ಸುರಕ್ಷಿತ ಗುಪ್ತಚರ ವ್ಯವಸ್ಥೆ' : 'SECURE INTELLIGENCE SYSTEM'}
                </span>
              </div>

              {/* Emblem */}
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.25, duration: 0.5, ease: 'backOut' }}
                style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}
              >
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute', inset: -8,
                    background: 'radial-gradient(circle, rgba(246,177,122,0.18) 0%, transparent 70%)',
                    borderRadius: '50%',
                  }} />
                  <KSPEmblem size={88} />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <h1 style={{ color: isLight ? '#0F172A' : '#FFFFFF', fontSize: 25, fontWeight: 900, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                  {isKn ? 'KSP ಗುಪ್ತಚರ ವ್ಯವಸ್ಥೆ' : 'KSP Intelligence'}
                </h1>
                <p style={{ color: isLight ? '#1E293B' : '#FFFFFF', fontSize: 14, fontWeight: 600, margin: '0 0 2px' }}>
                  {isKn ? 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್' : 'Karnataka State Police'}
                </p>
                <p style={{ color: isLight ? '#475569' : '#C9CBD7', fontSize: 12, margin: '0 0 4px', letterSpacing: '0.02em' }}>
                  {isKn ? 'ಕರ್ನಾಟಕ ಸರ್ಕಾರ' : 'Government of Karnataka'}
                </p>
                <p style={{ color: isLight ? '#0284C7' : '#F6B17A', fontSize: 11, fontWeight: 600, margin: 0, letterSpacing: '0.04em' }}>
                  {isKn ? 'ಕೃತಕ ಬುದ್ಧಿಮತ್ತೆ ಆಧಾರಿತ ಅಪರಾಧ ತನಿಖಾ ವೇದಿಕೆ' : 'AI Powered Crime Intelligence Platform'}
                </p>
              </motion.div>
            </div>

            {/* Login form */}
            <form onSubmit={handleSubmit} style={{ padding: '28px 40px 20px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* Email field */}
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                  <label style={{ display: 'block', fontSize: 11, color: isLight ? '#334155' : '#C9CBD7', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>
                    {isKn ? 'ಬ್ಯಾಡ್ಜ್ / ಇಮೇಲ್' : 'BADGE / EMAIL'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <User size={16} color={isLight ? '#0284C7' : '#F6B17A'} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 10 }} />
                    <input
                      type="text"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="officer@ksp.gov.in"
                      className="login-input w-full text-sm rounded-xl outline-none transition-all duration-200"
                      autoComplete="chrome-off"
                      style={{
                        width: '100%',
                        backgroundColor: isLight ? '#FFFFFF' : '#2D3250',
                        border: isLight ? '1px solid #CBD5E1' : '1px solid #50567D',
                        borderRadius: '12px',
                        color: isLight ? '#0F172A' : '#FFFFFF',
                        colorScheme: isLight ? 'light' : 'dark',
                        fontSize: '14px',
                        paddingTop: '13px',
                        paddingBottom: '13px',
                        paddingLeft: '44px',
                        paddingRight: '16px',
                        textIndent: '30px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      required
                      onFocus={e => { e.currentTarget.style.borderColor = '#F6B17A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(246,177,122,0.2)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = isLight ? '#CBD5E1' : '#50567D'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                  </div>
                </motion.div>

                {/* Password field */}
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.47 }}>
                  <label style={{ display: 'block', fontSize: 11, color: isLight ? '#334155' : '#C9CBD7', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>
                    {isKn ? 'ಪಾಸ್‌ವರ್ಡ್' : 'PASSWORD'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Lock size={16} color={isLight ? '#0284C7' : '#F6B17A'} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 10 }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={isKn ? 'ಯಾವುದೇ ಪಾಸ್‌ವರ್ಡ್ (ಡೆಮೋ)' : 'Any password (demo)'}
                      className="login-input w-full text-sm rounded-xl outline-none transition-all duration-200"
                      autoComplete="new-password"
                      style={{
                        width: '100%',
                        backgroundColor: isLight ? '#FFFFFF' : '#2D3250',
                        border: isLight ? '1px solid #CBD5E1' : '1px solid #50567D',
                        borderRadius: '12px',
                        color: isLight ? '#0F172A' : '#FFFFFF',
                        colorScheme: isLight ? 'light' : 'dark',
                        fontSize: '14px',
                        paddingTop: '13px',
                        paddingBottom: '13px',
                        paddingLeft: '44px',
                        paddingRight: '44px',
                        textIndent: '30px',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#F6B17A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(246,177,122,0.2)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = isLight ? '#CBD5E1' : '#50567D'; e.currentTarget.style.boxShadow = 'none'; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{
                        position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: isLight ? '#64748B' : '#C9CBD7',
                        padding: 0, display: 'flex', alignItems: 'center', zIndex: 10
                      }}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </motion.div>

                {/* Role selector */}
                <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.54 }}>
                  <label style={{ display: 'block', fontSize: 11, color: isLight ? '#334155' : '#C9CBD7', fontWeight: 600, marginBottom: 6, letterSpacing: '0.05em' }}>
                    {isKn ? 'ಪಾತ್ರ' : 'ROLE'}
                  </label>
                  <div style={{ position: 'relative' }}>
                    <Shield size={16} color={isLight ? '#0284C7' : '#F6B17A'} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', zIndex: 10 }} />
                    <select
                      value={role}
                      onChange={e => setRole(e.target.value)}
                      className="login-input w-full text-sm rounded-xl outline-none transition-all duration-200 cursor-pointer"
                      style={{
                        width: '100%',
                        backgroundColor: isLight ? '#FFFFFF' : '#2D3250',
                        border: isLight ? '1px solid #CBD5E1' : '1px solid #50567D',
                        borderRadius: '12px',
                        color: isLight ? '#0F172A' : '#FFFFFF',
                        colorScheme: isLight ? 'light' : 'dark',
                        fontSize: '14px',
                        paddingTop: '13px',
                        paddingBottom: '13px',
                        paddingLeft: '44px',
                        paddingRight: '36px',
                        textIndent: '28px',
                        outline: 'none',
                        boxSizing: 'border-box',
                        appearance: 'none',
                        WebkitAppearance: 'none',
                        MozAppearance: 'none',
                      }}
                      onFocus={e => { e.currentTarget.style.borderColor = '#F6B17A'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(246,177,122,0.2)'; }}
                      onBlur={e => { e.currentTarget.style.borderColor = isLight ? '#CBD5E1' : '#50567D'; e.currentTarget.style.boxShadow = 'none'; }}
                    >
                      <option value="Admin" style={{ background: isLight ? '#FFFFFF' : '#2D3250', color: isLight ? '#0F172A' : '#FFFFFF' }}>{isKn ? 'ನಿರ್ವಾಹಕ' : 'Admin'}</option>
                      <option value="Officer" style={{ background: isLight ? '#FFFFFF' : '#2D3250', color: isLight ? '#0F172A' : '#FFFFFF' }}>{isKn ? 'ಅಧಿಕಾರಿ' : 'Officer'}</option>
                      <option value="Analyst" style={{ background: isLight ? '#FFFFFF' : '#2D3250', color: isLight ? '#0F172A' : '#FFFFFF' }}>{isKn ? 'ವಿಶ್ಲೇಷಕರು' : 'Analyst'}</option>
                    </select>
                    <div style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: isLight ? '#64748B' : '#C9CBD7', zIndex: 10 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
                        <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </motion.div>

                {/* Error message */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '10px 14px',
                      background: 'rgba(239,68,68,0.08)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      borderRadius: 10,
                      color: '#EF4444',
                      fontSize: 12,
                    }}
                  >
                    <AlertCircle size={13} />
                    {error}
                  </motion.div>
                )}

                {/* Submit button */}
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <motion.button
                    type="submit"
                    disabled={loading}
                    whileHover={!loading ? { scale: 1.02, y: -1 } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    style={{
                      width: '100%',
                      height: 52,
                      borderRadius: 14,
                      border: 'none',
                      background: loading
                        ? 'rgba(246,177,122,0.4)'
                        : 'linear-gradient(135deg, #F6B17A 0%, #e89b5f 50%, #F6B17A 100%)',
                      color: '#1F2937',
                      fontSize: 15,
                      fontWeight: 700,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      boxShadow: loading ? 'none' : '0 4px 24px rgba(246,177,122,0.35), 0 1px 0 rgba(255,255,255,0.2) inset',
                      transition: 'box-shadow 0.2s, background 0.2s',
                      letterSpacing: '0.01em',
                    }}
                  >
                    {loading ? (
                      <>
                        <div style={{ width: 16, height: 16, border: '2px solid rgba(31,41,55,0.25)', borderTopColor: '#1F2937', borderRadius: '50%' }} className="animate-spin" />
                        <span>{isKn ? 'ದೃಢೀಕರಿಸಲಾಗುತ್ತಿದೆ…' : 'Authenticating...'}</span>
                      </>
                    ) : (
                      <>
                        <Shield size={16} color="#1F2937" />
                        <span>{isKn ? 'ದೃಢೀಕರಿಸಿ ಮತ್ತು ಪ್ರವೇಶಿಸಿ' : 'Authenticate & Enter'}</span>
                      </>
                    )}
                  </motion.button>
                </motion.div>
              </div>
            </form>

            {/* Quick demo login */}
            <div style={{ padding: '0 40px 32px' }}>
              {/* Divider */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                <div style={{ flex: 1, height: 1, background: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.1)' }} />
                <span style={{ fontSize: 10, color: isLight ? '#64748B' : '#C9CBD7', letterSpacing: '0.1em', whiteSpace: 'nowrap', fontWeight: 600 }}>
                  {isKn ? 'ತ್ವರಿತ ಡೆಮೋ ಲಾಗಿನ್' : 'QUICK DEMO LOGIN'}
                </span>
                <div style={{ flex: 1, height: 1, background: isLight ? '#E2E8F0' : 'rgba(255,255,255,0.1)' }} />
              </div>

              {/* Demo account cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {DEMO_ACCOUNTS.map((acc, i) => (
                  <motion.button
                    key={acc.email}
                    onClick={() => quickLogin(acc)}
                    disabled={loading}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.7 + i * 0.07 }}
                    whileHover={!loading ? {
                      x: 4,
                      backgroundColor: 'rgba(246,177,122,0.12)',
                      borderColor: 'rgba(246,177,122,0.3)'
                    } : {}}
                    whileTap={!loading ? { scale: 0.98 } : {}}
                    style={{
                      width: '100%',
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '10px 14px',
                      background: isLight ? '#F8FAFC' : 'rgba(45,50,80,0.6)',
                      border: isLight ? '1px solid #E2E8F0' : '1px solid rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      opacity: loading ? 0.5 : 1,
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `${acc.badgeColor}18`,
                        border: `1px solid ${acc.badgeColor}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, flexShrink: 0,
                      }}>
                        {acc.icon}
                      </div>
                      <div>
                        <div style={{ fontSize: 12, color: isLight ? '#0F172A' : '#FFFFFF', fontWeight: 600, lineHeight: 1.3 }}>{acc.label}</div>
                        <div style={{ fontSize: 10, color: isLight ? '#64748B' : '#C9CBD7', marginTop: 1 }}>{acc.email}</div>
                      </div>
                    </div>
                    <span style={{
                      fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                      color: acc.badgeColor,
                      background: `${acc.badgeColor}15`,
                      border: `1px solid ${acc.badgeColor}30`,
                      borderRadius: 6,
                      padding: '3px 8px',
                      flexShrink: 0,
                    }}>
                      {acc.badge}
                    </span>
                  </motion.button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            style={{ textAlign: 'center', fontSize: 10, color: isLight ? '#64748B' : '#2a3a52', marginTop: 16, lineHeight: 1.6 }}
          >
            ⚠️{' '}
            {isKn
              ? 'ಇದು ಕೃತಕ ಡೇಟಾ ಡೆಮೋ ವ್ಯವಸ್ಥೆಯಾಗಿದೆ. ಇದು ನಿಜವಾದ ಕಾನೂನು ಜಾರಿ ಸಾಧನವಲ್ಲ.'
              : 'This is a synthetic data demo platform. It is not a real law enforcement tool.'}
          </motion.p>
        </motion.div>
      </div>
    </div>
  );
}

