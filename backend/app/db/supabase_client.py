"""
backend/app/db/supabase_client.py

Lightweight Supabase client using httpx (no JWT dependency).
Supports the new sb_secret_/sb_publishable_ key format.
"""
import os
import httpx
from typing import Any, Dict, List, Optional

_client = None


class SupabaseTable:
    """Minimal PostgREST-compatible query builder."""

    def __init__(self, base_url: str, table: str, headers: dict):
        self._base_url = base_url
        self._table = table
        self._headers = headers
        self._params: Dict[str, Any] = {}
        self._select_cols = "*"
        self._order: Optional[str] = None
        self._limit_val: Optional[int] = None
        self._range_from: Optional[int] = None
        self._range_to: Optional[int] = None
        self._filters: List[str] = []
        self._count: Optional[str] = None
        self._body: Optional[dict] = None
        self._method = "GET"

    def select(self, columns: str = "*", count: Optional[str] = None):
        self._select_cols = columns
        if count:
            self._count = count
        return self

    def insert(self, data: dict):
        self._method = "POST"
        self._body = data
        return self

    def update(self, data: dict):
        self._method = "PATCH"
        self._body = data
        return self

    def delete(self):
        self._method = "DELETE"
        return self

    def eq(self, col: str, val: Any):
        self._filters.append(f"{col}=eq.{val}")
        return self

    def neq(self, col: str, val: Any):
        self._filters.append(f"{col}=neq.{val}")
        return self

    def ilike(self, col: str, pattern: str):
        self._filters.append(f"{col}=ilike.{pattern}")
        return self

    def in_(self, col: str, vals: list):
        csv = ",".join(str(v) for v in vals)
        self._filters.append(f"{col}=in.({csv})")
        return self

    def order(self, col: str, ascending: bool = True, desc: bool = False):
        direction = "asc" if ascending and not desc else "desc"
        self._order = f"{col}.{direction}"
        return self

    def limit(self, n: int):
        self._limit_val = n
        return self

    def range(self, start: int, end: int):
        self._range_from = start
        self._range_to = end
        return self

    def execute(self):
        params: Dict[str, str] = {}
        params["select"] = self._select_cols

        for f in self._filters:
            k, v = f.split("=", 1)
            params[k] = v

        if self._order:
            params["order"] = self._order
        if self._limit_val is not None:
            params["limit"] = str(self._limit_val)

        headers = dict(self._headers)
        prefer_parts = []
        if self._count:
            prefer_parts.append(f"count={self._count}")
        if self._range_from is not None:
            prefer_parts.append("return=representation")
        if prefer_parts:
            headers["Prefer"] = ",".join(prefer_parts)
        if self._range_from is not None:
            headers["Range"] = f"{self._range_from}-{self._range_to}"
            headers["Range-Unit"] = "items"

        url = f"{self._base_url}/rest/v1/{self._table}"
        with httpx.Client(timeout=30) as client:
            # Use HEAD for count-only queries (no data needed, avoids limit conflicts)
            if self._count and self._method == "GET" and self._limit_val is None and self._range_from is None:
                resp = client.head(url, params=params, headers=headers)
                resp.raise_for_status()
                cr = resp.headers.get("content-range")
                count = None
                if cr and "/" in cr:
                    try:
                        count = int(cr.split("/")[1])
                    except Exception:
                        count = 0
                return _SupabaseResult(data=[], count=count)

            if self._method == "GET":
                resp = client.get(url, params=params, headers=headers)
            elif self._method == "POST":
                headers["Prefer"] = "return=representation"
                resp = client.post(url, json=self._body, params=params, headers=headers)
            elif self._method == "PATCH":
                headers["Prefer"] = "return=representation"
                resp = client.patch(url, json=self._body, params=params, headers=headers)
            elif self._method == "DELETE":
                resp = client.delete(url, params=params, headers=headers)
            else:
                resp = client.get(url, params=params, headers=headers)

        resp.raise_for_status()

        data = resp.json() if resp.content else []
        if not isinstance(data, list):
            data = [data]

        # Parse count from Content-Range header: "0-9/1234"
        count = None
        cr = resp.headers.get("content-range")
        if cr and "/" in cr:
            try:
                count = int(cr.split("/")[1])
            except Exception:
                count = len(data)

        return _SupabaseResult(data=data, count=count)


class _SupabaseResult:
    def __init__(self, data: list, count: Optional[int] = None):
        self.data = data
        self.count = count
        self.error = None


class SupabaseClient:
    """Minimal Supabase client using httpx."""

    def __init__(self, url: str, key: str):
        self.supabase_url = url.rstrip("/")
        self.supabase_key = key
        self._headers = {
            "apikey": key,
            "Authorization": f"Bearer {key}",
            "Content-Type": "application/json",
        }

    def table(self, name: str) -> SupabaseTable:
        return SupabaseTable(self.supabase_url, name, self._headers)


def get_supabase() -> SupabaseClient:
    """Return a cached Supabase client with service role access."""
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_KEY", "")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend environment."
            )
        _client = SupabaseClient(url, key)
    return _client
