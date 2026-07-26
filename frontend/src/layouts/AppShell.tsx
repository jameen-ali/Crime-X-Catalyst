import { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, MessageSquare, FileText, Search, BarChart2, Map,
  Share2, Brain, Bell, Archive, BookOpen, User, Settings, Users,
  ChevronLeft, ChevronRight, Shield, Sun, Moon, Volume2, LogOut,
  Globe, Menu, X, Zap, AlertTriangle, Compass
} from 'lucide-react';
import { useAuthStore } from '../context/authStore';
import { useUIStore } from '../context/uiStore';
import { MOCK_ALERTS } from '../mockApi/mockData';
import { formatDistanceToNow } from 'date-fns';

const NAV_ITEMS = [
  { path: '/',                icon: LayoutDashboard, label: 'Dashboard',            labelKn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್' },
  { path: '/ai-assistant',    icon: MessageSquare,   label: 'AI Investigation',      labelKn: 'AI ತನಿಖೆ' },
  { path: '/fir',             icon: FileText,        label: 'FIR Management',        labelKn: 'FIR ನಿರ್ವಹಣೆ' },
  { path: '/search',          icon: Search,          label: 'Smart Search',          labelKn: 'ಸ್ಮಾರ್ಟ್ ಹುಡುಕಾಟ' },
  { path: '/analytics',       icon: BarChart2,       label: 'Crime Analytics',       labelKn: 'ಅಪರಾಧ ವಿಶ್ಲೇಷಣೆ' },
  { path: '/heatmap',         icon: Map,             label: 'Crime Heatmap',         labelKn: 'ಅಪರಾಧ ಹೀಟ್‌ಮ್ಯಾಪ್' },
  { path: '/patrol',          icon: Compass,         label: 'Patrol Telemetry',      labelKn: 'ಗಸ್ತು ಟೆಲಿಮೆಟ್ರಿ' },
  { path: '/network',         icon: Share2,          label: 'Criminal Network',      labelKn: 'ಕ್ರಿಮಿನಲ್ ನೆಟ್‌ವರ್ಕ್' },
  { path: '/predictions',     icon: Brain,           label: 'Prediction Engine',     labelKn: 'ಮುನ್ಸೂಚನೆ' },
  { path: '/alerts',          icon: Bell,            label: 'Live Crime Alerts',     labelKn: 'ಲೈವ್ ಎಚ್ಚರಿಕೆಗಳು' },
  { path: '/evidence',        icon: Archive,         label: 'Evidence Explorer',     labelKn: 'ಸಾಕ್ಷ್ಯ ಶೋಧಕ', adminOnly: true },
  { path: '/reports',         icon: BookOpen,        label: 'Reports',               labelKn: 'ವರದಿಗಳು', adminOrAnalystOnly: true },
  { path: '/workspace',       icon: User,            label: 'Officer Workspace',     labelKn: 'ಅಧಿಕಾರಿ ವರ್ಕ್‌ಸ್ಪೇಸ್' },
  { path: '/users',           icon: Users,           label: 'User Management',       labelKn: 'ಬಳಕೆದಾರ ನಿರ್ವಹಣೆ', adminOnly: true },
  { path: '/settings',        icon: Settings,        label: 'Settings',              labelKn: 'ಸೆಟ್ಟಿಂಗ್ಗಳು' },
];

const TECH_BADGES = ['FastAPI', 'PostgreSQL', 'Neo4j', 'Qdrant', 'Elasticsearch', 'Redis', 'Mistral AI'];

interface AppShellProps { children: React.ReactNode; }

export default function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuthStore();
  const { sidebarCollapsed, toggleSidebar, theme, toggleTheme, language, setLanguage } = useUIStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const unreadAlerts = MOCK_ALERTS.filter(a => !a.isRead).length;

  // Debounced search suggestions
  useEffect(() => {
    clearTimeout(debounceRef.current);
    if (searchQuery.length < 2) { setSearchSuggestions([]); setShowSuggestions(false); return; }
    debounceRef.current = setTimeout(async () => {
      const { searchApi } = await import('../mockApi');
      const sug = await searchApi.getSuggestions(searchQuery);
      setSearchSuggestions(sug);
      setShowSuggestions(true);
    }, 300);
  }, [searchQuery]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setShowSuggestions(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  // Voice search
  const handleVoiceSearch = () => {
    if (!('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      alert('Voice search not supported in this browser.');
      return;
    }
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.lang = 'en-IN';
    recognition.onresult = (e: any) => {
      const transcript = e.results[0][0].transcript;
      setSearchQuery(transcript);
    };
    recognition.start();
  };

  const navItems = NAV_ITEMS.filter(item => {
    if (item.adminOnly && user?.role !== 'Admin') return false;
    if (item.adminOrAnalystOnly && user?.role !== 'Admin' && user?.role !== 'Analyst') return false;
    return true;
  });

  const [isHovered, setIsHovered] = useState(false);
  const isExpanded = !sidebarCollapsed || isHovered;

  return (
    <div className={`flex h-screen overflow-hidden bg-bg p-2 ${theme === 'light' ? 'light' : ''}`}>
      {/* ── Floating Sidebar ── */}
      <div className="hidden md:flex flex-col flex-shrink-0 relative z-20 my-2 ml-2">
        <motion.aside
          initial={false}
          animate={{ width: isExpanded ? 240 : 80 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className="flex flex-col h-full bg-[var(--sidebar-bg)] border border-[var(--border)] overflow-hidden rounded-[24px] shadow-[0_8px_32px_rgba(0,0,0,0.1)]"
        >
          {/* Logo */}
          <div className="flex items-center gap-3 px-5 py-5 border-b border-[var(--border)] min-h-[68px]">
            <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center flex-shrink-0 shadow-lg shadow-[var(--accent)]/25">
              <Shield size={20} className="text-white" />
            </div>
            <AnimatePresence>
              {isExpanded && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }}>
                  <div className="text-sm font-bold text-white leading-tight">{language === 'kn' ? 'KSP ಗುಪ್ತಚರ' : 'KSP Intelligence'}</div>
                  <div className="text-[10px] text-[var(--accent)] font-medium">{language === 'kn' ? 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್' : 'Karnataka State Police'}</div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-4 overflow-y-auto overflow-x-hidden">
            {navItems.map(item => {
              const Icon = item.icon;
              const active = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
              const label = language === 'kn' ? item.labelKn : item.label;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  aria-label={item.label}
                  className={`flex items-center gap-3 px-4 py-3 mx-3 rounded-[14px] mb-1.5 transition-all duration-300 group relative
                    ${active
                      ? 'bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/20 shadow-[0_0_15px_rgba(var(--accent-rgb),0.15)]'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white border border-transparent'}`}
                >
                  <Icon size={18} className={`flex-shrink-0 transition-transform duration-300 group-hover:scale-105 ${active ? 'text-[var(--accent)]' : 'text-gray-500 group-hover:text-white'}`} />
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.span
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -8 }}
                        transition={{ duration: 0.15 }}
                        className="text-sm font-medium truncate"
                      >
                        {label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                  {/* Tooltip for collapsed */}
                  {!isExpanded && (
                    <div className="absolute left-full ml-3 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 border border-white/10 shadow-lg">
                      {item.label}
                    </div>
                  )}
                  {item.adminOnly && isExpanded && (
                    <span className="ml-auto text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.5 rounded-full border border-amber-500/30">{language === 'kn' ? 'ನಿರ್ವಾಹಕ' : 'Admin'}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User info at bottom */}
          {isExpanded && (
            <div className="px-4 py-4 border-t border-[var(--border)]">
              <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl bg-[var(--surface-2)] border border-[var(--border)]">
                <div className="w-8 h-8 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0 shadow-md">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="overflow-hidden">
                  <div className="text-xs font-semibold text-white truncate">{user?.name}</div>
                  <div className="text-[10px] text-gray-400 truncate">{user?.role}</div>
                </div>
                <div className="ml-auto w-2.5 h-2.5 rounded-full bg-green-400 flex-shrink-0 shadow-[0_0_8px_rgba(74,222,128,0.5)]" title="Online" />
              </div>
            </div>
          )}
        </motion.aside>

        {/* Toggle button - Placed outside motion.aside to prevent overflow clipping */}
        <button
          onClick={toggleSidebar}
          aria-label="Toggle sidebar"
          className="absolute -right-3 top-[72px] w-6 h-6 bg-[var(--surface-2)] border border-[var(--border)] rounded-full flex items-center justify-center text-gray-400 hover:text-white transition-colors z-30 shadow-md"
        >
          {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </div>

      {/* ── Mobile sidebar overlay ── */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 z-40 md:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }} animate={{ x: 0 }} exit={{ x: -280 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-y-0 left-0 w-[260px] bg-[var(--sidebar-bg)] border-r border-[var(--border)] z-50 md:hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-4 py-5 border-b border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[var(--accent)] flex items-center justify-center shadow-lg">
                    <Shield size={20} className="text-white" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{language === 'kn' ? 'KSP ಗುಪ್ತಚರ' : 'KSP Intelligence'}</div>
                    <div className="text-[10px] text-[var(--accent)]">{language === 'kn' ? 'ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್' : 'Karnataka State Police'}</div>
                  </div>
                </div>
                <button onClick={() => setMobileMenuOpen(false)} className="text-gray-400 hover:text-white p-1">
                  <X size={18} />
                </button>
              </div>
              <nav className="flex-1 py-3 overflow-y-auto">
                {navItems.map(item => {
                  const Icon = item.icon;
                  const active = location.pathname === item.path;
                  const label = language === 'kn' ? item.labelKn : item.label;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-4 py-3 mx-2 rounded-xl mb-0.5 transition-all
                        ${active ? 'bg-[var(--accent)]/20 text-[var(--accent)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                    >
                      <Icon size={18} className="flex-shrink-0" />
                      <span className="text-sm font-medium">{label}</span>
                    </Link>
                  );
                })}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ── Main column ── */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden h-full gap-2 p-2">
        {/* ── Top Navbar ── */}
        <header className="h-16 flex-shrink-0 bg-[var(--navbar-bg)] border border-[var(--border)] rounded-2xl flex items-center justify-between px-4 z-10 relative shadow-[0_8px_32px_rgba(0,0,0,0.03)]">
          {/* Mobile menu button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-400 hover:text-white p-1.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl"
            aria-label="Open menu"
          >
            <Menu size={20} />
          </button>

          {/* Global search */}
          <form onSubmit={handleSearch} className="relative flex-1 max-w-md hidden sm:block">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none" />
            <input
              ref={searchRef}
              type="text"
              placeholder={language === 'kn' ? 'FIR, ವ್ಯಕ್ತಿ, ವಾಹನ ಹುಡುಕಿ…' : 'Search FIR, person, vehicle...'}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onFocus={() => searchQuery.length >= 2 && setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              className="w-full bg-[var(--surface-2)] border border-[var(--border)] text-sm text-[var(--text)] placeholder-[var(--text-muted)] rounded-full pl-10 pr-10 py-2 focus:bg-[var(--surface)] focus:border-[var(--accent)] focus:ring-2 focus:ring-[var(--accent)]/10 transition-all outline-none"
            />
            <button
              type="button"
              onClick={handleVoiceSearch}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-[var(--accent)] transition-colors"
              aria-label="Voice search"
            >
              <Volume2 size={14} />
            </button>
            {/* Suggestions dropdown */}
            <AnimatePresence>
              {showSuggestions && searchSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-2 left-0 right-0 bg-[var(--surface)] rounded-2xl shadow-xl z-50 overflow-hidden border border-[var(--border)]"
                >
                  {searchSuggestions.map((s, i) => (
                    <button
                      key={i}
                      type="button"
                      className="w-full flex items-center gap-2 px-4 py-2.5 hover:bg-[var(--hover)] text-left text-sm"
                      onMouseDown={() => { setSearchQuery(s.label); navigate(`/search?q=${encodeURIComponent(s.label)}`); }}
                    >
                      <span className="text-[10px] bg-[var(--accent)]/20 text-[var(--accent)] px-1.5 py-0.5 rounded-full">{s.type}</span>
                      <span className="text-[var(--text)]">{s.label}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </form>

          <div className="flex items-center gap-2 ml-auto">
            {/* Language toggle */}
            <div className="relative">
              <button
                onClick={() => setLangOpen(!langOpen)}
                className="p-2 rounded-xl text-gray-400 hover:text-white bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--hover)] hover:border-[var(--border)] transition-all flex items-center gap-1.5 text-xs font-medium"
                aria-label="Language"
              >
                <Globe size={16} />
                <span className="hidden sm:inline">{language === 'en' ? 'EN' : 'KN'}</span>
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="absolute right-0 top-full mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden w-36"
                  >
                    {(['en', 'kn'] as const).map(l => (
                      <button key={l} onClick={() => { setLanguage(l); setLangOpen(false); }}
                        className={`w-full px-4 py-2.5 text-sm text-left hover:bg-[var(--hover)] ${language === l ? 'text-[var(--accent)] font-semibold' : 'text-[var(--text-muted)]'}`}>
                        {l === 'en' ? '🇬🇧 English' : '🇮🇳 ಕನ್ನಡ'}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-400 hover:text-white bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--hover)] hover:border-[var(--border)] transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-xl text-gray-400 hover:text-white bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--hover)] hover:border-[var(--border)] transition-all"
                aria-label={`Notifications — ${unreadAlerts} unread`}
              >
                <Bell size={16} />
                {unreadAlerts > 0 && (
                  <span className="notif-badge">{unreadAlerts > 9 ? '9+' : unreadAlerts}</span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-80 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[var(--border)] flex items-center justify-between">
                      <span className="text-sm font-semibold text-white">{language === 'kn' ? 'ಅಧಿಸೂಚನೆಗಳು' : 'Notifications'}</span>
                      <span className="text-xs text-[var(--accent)] font-medium">{language === 'kn' ? `${unreadAlerts} ಓದದ` : `${unreadAlerts} unread`}</span>
                    </div>
                    <div className="overflow-y-auto max-h-72">
                      {MOCK_ALERTS.slice(0, 6).map(alert => (
                        <div key={alert.id} className={`px-4 py-3 border-b border-[var(--border)] hover:bg-[var(--hover)] transition-colors ${!alert.isRead ? 'bg-[var(--accent)]/5' : ''}`}>
                          <div className="flex items-start gap-2">
                            <AlertTriangle size={14} className={`mt-0.5 flex-shrink-0 ${alert.severity === 'Critical' ? 'text-red-400' : alert.severity === 'High' ? 'text-amber-400' : 'text-[var(--accent)]'}`} />
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-white">{alert.title}</div>
                              <div className="text-xs text-gray-400 mt-0.5 line-clamp-1">{alert.description}</div>
                              <div className="text-[10px] text-gray-500 mt-1">{formatDistanceToNow(new Date(alert.timestamp), { addSuffix: true })}</div>
                            </div>
                            {!alert.isRead && <div className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] flex-shrink-0 mt-1" />}
                          </div>
                        </div>
                      ))}
                    </div>
                    <Link to="/alerts" onClick={() => setNotifOpen(false)}
                      className="block px-4 py-2.5 text-center text-xs text-[var(--accent)] hover:text-[var(--accent-hover)] hover:bg-[var(--hover)] transition-colors">
                      {language === 'kn' ? 'ಎಲ್ಲಾ ಎಚ್ಚರಿಕೆಗಳನ್ನು ನೋಡಿ →' : 'View all alerts →'}
                    </Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] hover:bg-[var(--hover)] hover:border-[var(--border)] transition-all text-left"
                aria-label="Profile menu"
              >
                <div className="w-7 h-7 rounded-full bg-[var(--accent)] flex items-center justify-center text-xs font-bold text-white">
                  {user?.name?.split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div className="hidden sm:block">
                  <div className="text-xs font-medium text-white">{user?.name}</div>
                  <div className="text-[10px] text-gray-400">{user?.rank}</div>
                </div>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 bg-[var(--surface)] border border-[var(--border)] rounded-2xl shadow-xl z-50 overflow-hidden"
                  >
                    <div className="px-4 py-3 border-b border-[var(--border)]">
                      <div className="text-sm font-semibold text-white">{user?.name}</div>
                      <div className="text-xs text-gray-400">{user?.email}</div>
                      <div className="text-[10px] text-[var(--accent)] mt-0.5">{user?.rank} · {language === 'kn' ? 'ಬ್ಯಾಡ್ಜ್ ' + user?.badgeNumber : 'Badge ' + user?.badgeNumber}</div>
                    </div>
                    <Link to="/workspace" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[var(--hover)] transition-colors">
                      <User size={14} /> {language === 'kn' ? 'ಅಧಿಕಾರಿ ವರ್ಕ್‌ಸ್ಪೇಸ್' : 'Officer Workspace'}
                    </Link>
                    <Link to="/settings" onClick={() => setProfileOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-[var(--hover)] transition-colors">
                      <Settings size={14} /> {language === 'kn' ? 'ಸೆಟ್ಟಿಂಗ್ಗಳು' : 'Settings'}
                    </Link>
                    <div className="border-t border-[var(--border)]" />
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/5 transition-colors">
                      <LogOut size={14} /> {language === 'kn' ? 'ಸೈನ್ ಔಟ್' : 'Sign Out'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* ── Page content ── */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="min-h-[calc(100vh-170px)] pb-6"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* ── Floating Footer ── */}
        <footer className="flex-shrink-0 h-10 bg-[var(--surface-2)] border border-[var(--border)] flex items-center justify-between px-6 text-[10px] text-gray-500 overflow-hidden mx-4 mb-2 rounded-xl">
          <div className="flex items-center gap-1.5">
            <Zap size={10} className="text-[var(--accent)]" />
            <span>{language === 'kn' ? 'ಉದ್ದೇಶಿತ ಉತ್ಪಾದನಾ ಸ್ಟಾಕ್:' : 'Target Production Stack:'}</span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto flex-1 ml-3">
            {TECH_BADGES.map(b => (
              <span key={b} className="px-2 py-0.5 bg-[var(--surface)] border border-[var(--border)] rounded-full whitespace-nowrap text-[var(--text-muted)] hover:text-[var(--accent)] transition-colors">
                {b}
              </span>
            ))}
          </div>
          <span className="hidden sm:block text-gray-600 ml-3 whitespace-nowrap">{language === 'kn' ? '© KSP ಡೆಮೋ 2024' : '© KSP Demo 2024'}</span>
        </footer>
      </div>
    </div>
  );
}
