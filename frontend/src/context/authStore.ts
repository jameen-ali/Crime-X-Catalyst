import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, _password: string, role?: string) => Promise<void>;
  logout: () => void;
}

// Demo users — any password accepted
const DEMO_USERS: Record<string, User> = {
  admin: {
    id: 'user-1',
    name: 'SP Suresh Rao',
    email: 'admin@ksp.gov.in',
    role: 'Admin',
    rank: 'Superintendent of Police',
    badgeNumber: 'KSP10001',
    district: 'Bengaluru Urban',
    station: 'Cubbon Park PS',
  },
  officer: {
    id: 'user-2',
    name: 'SI Kavitha Nair',
    email: 'kavitha.nair@ksp.gov.in',
    role: 'Officer',
    rank: 'Sub-Inspector',
    badgeNumber: 'KSP20045',
    district: 'Bengaluru Urban',
    station: 'Koramangala PS',
  },
  analyst: {
    id: 'user-3',
    name: 'Analyst Priya Sharma',
    email: 'priya.sharma@ksp.gov.in',
    role: 'Analyst',
    rank: 'Crime Analyst',
    badgeNumber: 'KSP30012',
    district: 'Bengaluru Urban',
    station: 'Cubbon Park PS',
  },
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      login: async (email: string, _password: string, role = 'admin') => {
        // Simulate JWT auth — any password accepted in demo
        await new Promise(r => setTimeout(r, 600));
        const key = email.includes('officer') ? 'officer' : email.includes('analyst') ? 'analyst' : role === 'Officer' ? 'officer' : role === 'Analyst' ? 'analyst' : 'admin';
        const user = DEMO_USERS[key] ?? DEMO_USERS.admin;
        const token = `demo-jwt-${btoa(user.email)}-${Date.now()}`;
        set({ user, token, isAuthenticated: true });
      },

      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    { name: 'ksp-auth' }
  )
);
