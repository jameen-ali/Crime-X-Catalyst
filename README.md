# Crime X — Root

This monorepo contains two separate projects:

```
Crime X/
├── frontend/    # React + Vite + TypeScript (KSP Intelligence Dashboard UI)
└── backend/     # Python FastAPI (REST API server)
```

## Quick Start

### Frontend
```bash
cd frontend
npm install
npm run dev        # → http://localhost:5173
```

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate          # Windows
pip install -r requirements.txt
copy .env.example .env
uvicorn run:app --reload --port 8000   # → http://localhost:8000
# Swagger docs → http://localhost:8000/docs
```

## API ↔ Frontend Contract

The backend routers mirror the frontend `src/mockApi/` contract exactly:

| Frontend mock | Backend endpoint |
|---|---|
| `firApi.getAll()`        | `GET  /api/firs` |
| `firApi.getById()`       | `GET  /api/firs/{id}` |
| `analyticsApi.getKPIs()` | `GET  /api/analytics/kpis` |
| `networkApi.getGraph()`  | `GET  /api/network` |
| `predictionApi.getAll()` | `GET  /api/predictions` |
| `alertsApi.getAll()`     | `GET  /api/alerts` |
| `evidenceApi.getAll()`   | `GET  /api/evidence` |
| `searchApi.search()`     | `GET  /api/search?q=` |
| `usersApi.getAll()`      | `GET  /api/users` |
| `reportsApi.generate()`  | `POST /api/reports/generate` |
| `healthApi.getStatus()`  | `GET  /api/health` |
