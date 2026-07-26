import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface UIState {
  // UI-only state (safe to persist)
  sidebarCollapsed: boolean;
  theme: 'dark' | 'light';
  language: 'en' | 'kn';
  notificationsOpen: boolean;

  // Lightweight "last viewed" pointers — refetch on mount
  lastConversationId: string | null;
  lastCaseId: string | null;
  lastEvidencePage: number;
  lastFIRFilters: {
    statusId?: number;
    districtId?: number;
    crimeHeadId?: number;
    search?: string;
    page?: number;
  };
  lastAnalyticsDateRange: { from: string; to: string } | null;
  activeTab: string | null;

  // Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (v: boolean) => void;
  toggleTheme: () => void;
  setTheme: (t: 'dark' | 'light') => void;
  setLanguage: (l: 'en' | 'kn') => void;
  setNotificationsOpen: (v: boolean) => void;
  setLastConversationId: (id: string | null) => void;
  setLastCaseId: (id: string | null) => void;
  setLastEvidencePage: (page: number) => void;
  setLastFIRFilters: (filters: UIState['lastFIRFilters']) => void;
  setLastAnalyticsDateRange: (range: { from: string; to: string } | null) => void;
  setActiveTab: (tab: string | null) => void;
}

function applyTheme(theme: 'dark' | 'light') {
  if (theme === 'light') {
    document.documentElement.classList.add('light');
    document.documentElement.classList.remove('dark');
  } else {
    document.documentElement.classList.add('dark');
    document.documentElement.classList.remove('light');
  }
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      theme: 'dark',
      language: 'en',
      notificationsOpen: false,
      lastConversationId: null,
      lastCaseId: null,
      lastEvidencePage: 1,
      lastFIRFilters: {},
      lastAnalyticsDateRange: null,
      activeTab: null,

      toggleSidebar: () => set(s => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (v) => set({ sidebarCollapsed: v }),
      toggleTheme: () => set(s => {
        const next = s.theme === 'dark' ? 'light' : 'dark';
        applyTheme(next);
        return { theme: next };
      }),
      setTheme: (t) => {
        applyTheme(t);
        set({ theme: t });
      },
      setLanguage: (language) => set({ language }),
      setNotificationsOpen: (v) => set({ notificationsOpen: v }),
      setLastConversationId: (id) => set({ lastConversationId: id }),
      setLastCaseId: (id) => set({ lastCaseId: id }),
      setLastEvidencePage: (page) => set({ lastEvidencePage: page }),
      setLastFIRFilters: (filters) => set({ lastFIRFilters: filters }),
      setLastAnalyticsDateRange: (range) => set({ lastAnalyticsDateRange: range }),
      setActiveTab: (tab) => set({ activeTab: tab }),
    }),
    {
      name: 'ksp-ui',
      onRehydrateStorage: () => (state) => {
        if (state) applyTheme(state.theme);
      },
    }
  )
);
