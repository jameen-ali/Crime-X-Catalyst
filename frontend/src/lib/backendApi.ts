/**
 * backendApi.ts
 * Frontend client for the Zoho Catalyst AppSail backend.
 * All privileged operations (Mistral, service-role DB writes, etc.) go here.
 * The backend URL is set via VITE_API_BASE_URL environment variable.
 */

// In development, Vite proxies /api → http://localhost:8000
// In production, VITE_API_BASE_URL points to the Catalyst AppSail domain
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '';

async function apiCall<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = BASE_URL ? `${BASE_URL}${path}` : path;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => `HTTP ${res.status}`);
    throw new Error(`Backend API error [${res.status}]: ${errText}`);
  }
  return res.json() as Promise<T>;
}

// ── Analytics ──────────────────────────────────────────────────────────────────
export const backendAnalyticsApi = {
  getKPIs:            () => apiCall<any>('/api/analytics/kpis'),
  getCrimeTrend:      () => apiCall<any[]>('/api/analytics/crime-trend'),
  getCrimeDistribution: () => apiCall<any[]>('/api/analytics/crime-distribution'),
  getDistrictComparison: () => apiCall<any[]>('/api/analytics/district-comparison'),
  getActivityFeed:    () => apiCall<any[]>('/api/analytics/activity-feed'),
  getHeatmap:         () => apiCall<any[]>('/api/analytics/heatmap'),
  getRecentEvidence:  () => apiCall<any[]>('/api/analytics/recent-evidence'),
};

// ── FIRs / Cases ───────────────────────────────────────────────────────────────
export const backendFirsApi = {
  getAll: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as any).toString() : '';
    return apiCall<any>(`/api/firs${qs}`);
  },
  getById: (id: string | number) => apiCall<any>(`/api/firs/${id}`),
  update:  (id: string | number, patch: Record<string, any>) =>
    apiCall<any>(`/api/firs/${id}`, { method: 'PATCH', body: JSON.stringify(patch) }),
};

// ── Search ─────────────────────────────────────────────────────────────────────
export const backendSearchApi = {
  search: (q: string, filters?: Record<string, string>) => {
    const params = { q, ...(filters || {}) };
    const qs = '?' + new URLSearchParams(params).toString();
    return apiCall<any>(`/api/search${qs}`);
  },
  getSuggestions: (q: string) => apiCall<any[]>(`/api/search/suggestions?q=${encodeURIComponent(q)}`),
};

// ── AI Chat ────────────────────────────────────────────────────────────────────
export const backendChatApi = {
  sendMessage: (conversationId: string, content: string, userId?: string) =>
    apiCall<{ reply: string; conversation_id: string }>('/api/chat/send', {
      method: 'POST',
      body: JSON.stringify({ conversation_id: conversationId, content, user_id: userId }),
    }),
  getHistory: (conversationId: string) =>
    apiCall<any[]>(`/api/chat/history/${encodeURIComponent(conversationId)}`),
  getConversations: (userId?: string) =>
    apiCall<any[]>(`/api/chat/conversations${userId ? `?user_id=${userId}` : ''}`),
  subscribeToConversation: (conversationId: string, callback: () => void) => {
    // Dummy subscription since we don't have websockets setup for the backend right now.
    // The sendMessage function manually triggers a fetch after sending, so this is fine.
    return () => {};
  },
  clearHistory: (conversationId: string) =>
    apiCall<{ success: boolean }>(`/api/chat/history/${encodeURIComponent(conversationId)}`, { method: 'DELETE' }),
  getSuggestedQuestions: () => apiCall<any[]>('/api/chat/suggested'),
  /** Proxy arbitrary Mistral requests (for prediction engine, case comparison) */
  proxyMistral: (body: Record<string, any>) =>
    apiCall<any>('/api/chat/mistral', { method: 'POST', body: JSON.stringify(body) }),
};

// ── Health ─────────────────────────────────────────────────────────────────────
export const backendHealthApi = {
  getHealth: () => apiCall<any>('/api/health'),
};
