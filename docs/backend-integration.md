# Backend Integration Guide

This document maps each mock API endpoint in `src/mockApi/` to its intended production service.

## Architecture Overview

```
React Frontend
     │
     ├── TanStack React Query (hooks in /services)
     │       │
     │       └── mockApi/ (current: in-memory mock)
     │               │
     │               └── [production] axios → FastAPI
     │                       │
     │                       ├── PostgreSQL (FIRs, Officers, Evidence)
     │                       ├── Neo4j (Criminal Network Graph)
     │                       ├── Qdrant (Vector Search)
     │                       ├── Elasticsearch (Full-text Search)
     │                       ├── Redis (Caching, Real-time Alerts)
     │                       └── Mistral AI (AI Chat)
```

## Endpoint Mapping

### FIR API → PostgreSQL (FastAPI)

| Mock Function | Production Endpoint | Notes |
|--------------|---------------------|-------|
| `firApi.getAll(filters)` | `GET /api/v1/firs` | Supports pagination, filtering by district/station/type/status |
| `firApi.getById(id)` | `GET /api/v1/firs/{id}` | Returns full FIR record |
| `firApi.update(id, patch)` | `PATCH /api/v1/firs/{id}` | Partial update, audit logged |

**PostgreSQL Schema**: `firs`, `officers`, `stations`, `districts`, `evidence_links`

**Migration path**: Replace `firApi.*` calls in `src/mockApi/index.ts` with `axios.get(API_BASE + '/firs', { params: filters })`.

### Analytics API → PostgreSQL + Redis

| Mock Function | Production Endpoint | Notes |
|--------------|---------------------|-------|
| `analyticsApi.getKPIs()` | `GET /api/v1/analytics/kpis` | Cached in Redis (TTL: 5 min) |
| `analyticsApi.getCrimeTrend()` | `GET /api/v1/analytics/trend` | Aggregated from PostgreSQL |
| `analyticsApi.getHeatmapData()` | `GET /api/v1/analytics/heatmap` | Returns lat/lng/intensity points |

### Network API → Neo4j (FastAPI + py2neo)

| Mock Function | Production Endpoint | Notes |
|--------------|---------------------|-------|
| `networkApi.getGraph()` | `GET /api/v1/network/graph` | Cypher query to Neo4j |
| `networkApi.getNodeDetails(id)` | `GET /api/v1/network/nodes/{id}` | Node + 1-hop neighborhood |

**Cypher Example**:
```cypher
MATCH (n)-[r]-(m)
WHERE n.id = $nodeId
RETURN n, r, m
LIMIT 50
```

### Search API → Qdrant + Elasticsearch

| Mock Function | Production Endpoint | Notes |
|--------------|---------------------|-------|
| `searchApi.search(query)` | `POST /api/v1/search` | Hybrid: Qdrant vector + ES full-text |
| `searchApi.getSuggestions(q)` | `GET /api/v1/search/suggest` | ES autocomplete |

**Qdrant Collection**: `ksp_firs_embeddings` — 768-dim vectors from Mistral embed model.

**ES Index**: `ksp_firs` with fields: `firNumber`, `crimeType`, `location`, `victimName`, `suspectName`.

### AI Chat API → Mistral AI (via FastAPI)

| Mock Function | Production Endpoint | Notes |
|--------------|---------------------|-------|
| `chatApi.sendMessage(content)` | `POST /api/v1/ai/chat` | RAG pipeline: Qdrant retrieval + Mistral generation |

**RAG Pipeline**:
1. Embed user query with `mistral-embed`
2. Query Qdrant for top-k relevant FIR chunks
3. Pass chunks as context to `mistral-large-latest`
4. Stream response back via Server-Sent Events

### Alerts API → Redis Pub/Sub (FastAPI WebSocket)

| Mock Function | Production Endpoint | Notes |
|--------------|---------------------|-------|
| `alertsApi.getAll()` | `GET /api/v1/alerts` | Stored in PostgreSQL |
| `alertsApi.markRead(id)` | `PATCH /api/v1/alerts/{id}/read` | Updates read status |
| Real-time alerts | `WS /api/v1/ws/alerts` | Redis pub/sub → WebSocket push |

### Predictions API → ML Model Service

| Mock Function | Production Endpoint | Notes |
|--------------|---------------------|-------|
| `predictionApi.getAll()` | `GET /api/v1/predictions` | Served from FastAPI ML module |
| `predictionApi.getForecast()` | `GET /api/v1/predictions/forecast` | Time-series model (Prophet/LSTM) |

### Evidence API → FastAPI + Object Storage

| Mock Function | Production Endpoint | Notes |
|--------------|---------------------|-------|
| `evidenceApi.getAll()` | `GET /api/v1/evidence` | Metadata from PostgreSQL |
| `evidenceApi.upload(file)` | `POST /api/v1/evidence/upload` | Multipart → S3/MinIO storage |

## Authentication

Current: Mock JWT stored in Zustand + localStorage.

Production:
1. `POST /api/v1/auth/login` → returns `{access_token, refresh_token}`
2. Axios interceptor attaches `Authorization: Bearer <token>` to all requests
3. `401` response → auto-refresh via `POST /api/v1/auth/refresh`
4. RBAC enforced server-side via FastAPI dependencies

## Migration Checklist

1. Set `VITE_API_BASE_URL=https://api.ksp-intelligence.gov.in` in `.env.production`
2. Create `src/services/apiClient.ts` — configured axios instance with auth interceptors
3. Replace `import { firApi } from '../mockApi'` with `import { firApi } from '../services/firService'`
4. Wire `firService.ts` to `apiClient` instead of mock functions
5. Enable WebSocket connection for real-time alerts
6. Configure Qdrant collection and run initial embedding ingestion pipeline
