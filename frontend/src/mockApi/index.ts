/**
 * Mock API Layer — simulates FastAPI/Neo4j/Qdrant/Elasticsearch/Redis
 * All responses include artificial network delay (300–800ms)
 */

import {
  MOCK_FIRS, MOCK_PERSONS, MOCK_EVIDENCE, MOCK_ALERTS,
  MOCK_PREDICTIONS, MOCK_NETWORK_NODES, MOCK_NETWORK_EDGES, MOCK_KPIS,
  MOCK_OFFICERS, MOCK_AUDIT_LOGS, LIVE_ACTIVITY_ITEMS, MOCK_CHAT_RESPONSES,
  AI_SUGGESTED_QUESTIONS, getCrimeTrend, getHourlyTrend, getCrimeDistribution,
  getDistrictComparison, getWeaponAnalysis, getAgeDistribution, getGenderDistribution,
} from './mockData';
import type { FIR, Alert, ChatMessage } from '../types';

const delay = (ms?: number) =>
  new Promise(r => setTimeout(r, ms ?? Math.floor(Math.random() * 500) + 300));

// ─── FIR API ─────────────────────────────────────────────────────────────────
export const firApi = {
  async getAll(filters?: {
    district?: string; station?: string; crimeType?: string;
    status?: string; search?: string; page?: number; pageSize?: number;
  }) {
    await delay();
    let data = [...MOCK_FIRS];
    if (filters?.district) data = data.filter(f => f.district === filters.district);
    if (filters?.station)  data = data.filter(f => f.station  === filters.station);
    if (filters?.crimeType) data = data.filter(f => f.crimeType === filters.crimeType);
    if (filters?.status)   data = data.filter(f => f.status   === filters.status);
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      data = data.filter(f =>
        f.firNumber.toLowerCase().includes(q) ||
        f.crimeType.toLowerCase().includes(q) ||
        f.victimName.toLowerCase().includes(q) ||
        f.suspectName.toLowerCase().includes(q) ||
        f.location.toLowerCase().includes(q)
      );
    }
    const page = filters?.page ?? 1;
    const pageSize = filters?.pageSize ?? 10;
    const total = data.length;
    const items = data.slice((page - 1) * pageSize, page * pageSize);
    return { items, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
  },

  async getById(id: string) {
    await delay(200);
    return MOCK_FIRS.find(f => f.id === id) ?? null;
  },

  async update(id: string, patch: Partial<FIR>) {
    await delay(400);
    const idx = MOCK_FIRS.findIndex(f => f.id === id);
    if (idx !== -1) Object.assign(MOCK_FIRS[idx], patch);
    return MOCK_FIRS[idx];
  },

  async delete(id: string) {
    await delay(300);
    const idx = MOCK_FIRS.findIndex(f => f.id === id);
    if (idx !== -1) MOCK_FIRS.splice(idx, 1);
    return { success: true };
  },
};

// ─── Analytics API ────────────────────────────────────────────────────────────
export const analyticsApi = {
  async getKPIs() { await delay(300); return MOCK_KPIS; },
  async getCrimeTrend() { await delay(400); return getCrimeTrend(); },
  async getHourlyTrend() { await delay(350); return getHourlyTrend(); },
  async getCrimeDistribution() { await delay(300); return getCrimeDistribution(); },
  async getDistrictComparison() { await delay(400); return getDistrictComparison(); },
  async getWeaponAnalysis() { await delay(300); return getWeaponAnalysis(); },
  async getAgeDistribution() { await delay(250); return getAgeDistribution(); },
  async getGenderDistribution() { await delay(250); return getGenderDistribution(); },
  async getActivityFeed() { await delay(200); return LIVE_ACTIVITY_ITEMS; },
  async getHeatmapData() {
    await delay(500);
    return MOCK_FIRS.map(f => ({ lat: f.latitude, lng: f.longitude, intensity: f.severity === 'Critical' ? 1 : f.severity === 'High' ? 0.7 : f.severity === 'Medium' ? 0.4 : 0.2 }));
  },
};

// ─── Network/Graph API (Neo4j sim) ────────────────────────────────────────────
export const networkApi = {
  async getGraph() {
    await delay(600);
    return { nodes: MOCK_NETWORK_NODES, edges: MOCK_NETWORK_EDGES };
  },
  async getNodeDetails(id: string) {
    await delay(300);
    const node = MOCK_NETWORK_NODES.find(n => n.id === id);
    const person = MOCK_PERSONS.find(p => p.id === id);
    const firs = person ? MOCK_FIRS.filter(f => person.linkedFIRs.includes(f.id)) : [];
    return { node, person, linkedFIRs: firs };
  },
};

// ─── Predictions API (ML sim) ─────────────────────────────────────────────────
export const predictionApi = {
  async getAll() { await delay(600); return MOCK_PREDICTIONS; },
  async getForecast() {
    await delay(500);
    const weeks = ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8'];
    return weeks.map(w => ({
      name: w,
      predicted: Math.floor(Math.random() * 50) + 40,
      actual: Math.floor(Math.random() * 45) + 35,
    }));
  },
  async getRiskGauge() {
    await delay(300);
    return { riskScore: 72, trend: 'increasing', factors: ['Weekend approaching', 'Two upcoming events', 'Historical spike pattern'] };
  },
};

// ─── Alerts API ───────────────────────────────────────────────────────────────
export const alertsApi = {
  async getAll(filters?: { type?: string; severity?: Alert['severity'] }) {
    await delay(300);
    let data = [...MOCK_ALERTS];
    if (filters?.type) data = data.filter(a => a.type === filters.type);
    if (filters?.severity) data = data.filter(a => a.severity === filters.severity);
    return data.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },
  async markRead(id: string) {
    await delay(150);
    const a = MOCK_ALERTS.find(a => a.id === id);
    if (a) a.isRead = true;
    return { success: true };
  },
};

// ─── Evidence API ─────────────────────────────────────────────────────────────
export const evidenceApi = {
  async getAll(firId?: string) {
    await delay(400);
    if (firId) return MOCK_EVIDENCE.filter(e => e.firId === firId);
    return MOCK_EVIDENCE;
  },
  async upload(file: File, firId: string, uploadedBy: string) {
    await delay(800);
    return {
      id: `ev-${Date.now()}`,
      firId,
      type: 'Document' as const,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      description: `Uploaded file for FIR ${firId}`,
      tags: ['uploaded'],
    };
  },
};

import { searchApi as supabaseSearchApi } from '../lib/supabaseApi';
export const searchApi = supabaseSearchApi;

// ─── AI Chat API (Mistral AI sim) ─────────────────────────────────────────────
let _chatHistory: ChatMessage[] = [];
export const chatApi = {
  getSuggestedQuestions() { return AI_SUGGESTED_QUESTIONS; },
  async sendMessage(_content: string): Promise<ChatMessage> {
    await delay(1500 + Math.random() * 1000);
    const response = MOCK_CHAT_RESPONSES[Math.floor(Math.random() * MOCK_CHAT_RESPONSES.length)];
    const msg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'assistant',
      content: response.content,
      timestamp: new Date().toISOString(),
      sources: response.sources,
    };
    _chatHistory.push(msg);
    return msg;
  },
  getHistory() { return _chatHistory; },
  clearHistory() { _chatHistory = []; },
};

const OFFICERS_STORAGE_KEY = 'ksp_officers_data_v1';

function loadOfficers(): typeof MOCK_OFFICERS {
  try {
    const raw = localStorage.getItem(OFFICERS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    console.error('Error loading officers:', e);
  }
  return [...MOCK_OFFICERS];
}

function saveOfficers(list: typeof MOCK_OFFICERS) {
  try {
    localStorage.setItem(OFFICERS_STORAGE_KEY, JSON.stringify(list));
  } catch (e) {
    console.error('Error saving officers:', e);
  }
}

// ─── Officers/Users API ───────────────────────────────────────────────────────
export const usersApi = {
  async getAll() {
    await delay(400);
    return loadOfficers();
  },
  async getById(id: string) {
    await delay(200);
    const list = loadOfficers();
    return list.find(o => o.id === id) ?? null;
  },
  async getAuditLogs() {
    await delay(500);
    return MOCK_AUDIT_LOGS;
  },
  async create(data: Partial<typeof MOCK_OFFICERS[0]>) {
    await delay(600);
    const list = loadOfficers();
    const newOfficer = {
      id: `off-${Date.now()}`,
      badgeNumber: `KSP${Math.floor(10000 + Math.random() * 90000)}`,
      status: 'Active' as const,
      ...data
    } as any;
    list.unshift(newOfficer);
    saveOfficers(list);
    return newOfficer;
  },
  async update(id: string, patch: Partial<typeof MOCK_OFFICERS[0]>) {
    await delay(500);
    const list = loadOfficers();
    const idx = list.findIndex(o => o.id === id);
    if (idx !== -1) {
      list[idx] = { ...list[idx], ...patch };
      saveOfficers(list);
      return list[idx];
    }
    return null;
  },
  async delete(id: string) {
    await delay(400);
    const list = loadOfficers();
    const updated = list.filter(o => o.id !== id);
    saveOfficers(updated);
    return { success: true };
  },
};

// ─── Reports API ──────────────────────────────────────────────────────────────
export const reportsApi = {
  async generate(type: string, options: { district?: string; dateFrom?: string; dateTo?: string } = {}) {
    await delay(700);

    let firSlice = MOCK_FIRS.slice(0, 20);
    let kpiMod = { ...MOCK_KPIS };
    
    if (type === 'Daily') {
      firSlice = MOCK_FIRS.slice(0, 5);
      kpiMod.totalFIRs = Math.max(1, Math.floor(MOCK_KPIS.totalFIRs / 30));
      kpiMod.openCases = Math.max(1, Math.floor(MOCK_KPIS.openCases / 30));
      kpiMod.solvedCases = Math.max(1, Math.floor(MOCK_KPIS.solvedCases / 30));
    } else if (type === 'Weekly') {
      firSlice = MOCK_FIRS.slice(5, 15);
      kpiMod.totalFIRs = Math.max(1, Math.floor(MOCK_KPIS.totalFIRs / 4));
      kpiMod.openCases = Math.max(1, Math.floor(MOCK_KPIS.openCases / 4));
      kpiMod.solvedCases = Math.max(1, Math.floor(MOCK_KPIS.solvedCases / 4));
    } else if (type === 'Monthly') {
      firSlice = MOCK_FIRS.slice(10, 30);
    } else if (type === 'District') {
      if (options.district) {
        firSlice = MOCK_FIRS.filter(f => f.district === options.district).slice(0, 20);
        kpiMod.totalFIRs = Math.floor(MOCK_KPIS.totalFIRs / 10);
        kpiMod.openCases = Math.floor(MOCK_KPIS.openCases / 10);
      } else {
        firSlice = MOCK_FIRS.slice(20, 40);
        kpiMod.totalFIRs = Math.floor(MOCK_KPIS.totalFIRs / 10);
      }
    } else if (type === 'Officer') {
      firSlice = MOCK_FIRS.filter(f => f.officerName.includes('Ramesh') || f.officerName.includes('Kavitha')).slice(0, 15);
      kpiMod.totalFIRs = 45;
      kpiMod.openCases = 12;
      kpiMod.solvedCases = 33;
    } else if (type === 'Crime Summary') {
      firSlice = MOCK_FIRS.filter(f => f.crimeType === 'Robbery' || f.crimeType === 'Vehicle Theft' || f.crimeType === 'Burglary').slice(0, 20);
    } else if (type === 'Prediction') {
      firSlice = MOCK_FIRS.filter(f => f.severity === 'Critical' || f.severity === 'High').slice(0, 15);
      kpiMod.crimeRiskScore = 92;
    }

    const data = {
      type, options,
      firs: firSlice,
      kpis: kpiMod,
      trend: getCrimeTrend(),
      distribution: getCrimeDistribution(),
      generatedAt: new Date().toISOString(),
    };
    return data;
  },
};

// ─── DB Health (mock) ─────────────────────────────────────────────────────────
export const healthApi = {
  async getStatus() {
    await delay(400);
    return {
      postgresql: { status: 'online', latency: 12, version: '15.4' },
      neo4j:      { status: 'online', latency: 18, version: '5.12' },
      qdrant:     { status: 'online', latency: 8,  version: '1.7.0' },
      elasticsearch: { status: 'degraded', latency: 145, version: '8.10.0' },
      redis:      { status: 'online', latency: 2,  version: '7.2.0' },
    };
  },
};
