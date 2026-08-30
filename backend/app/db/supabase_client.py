"""
backend/app/db/supabase_client.py
Server-side Supabase client using the SERVICE ROLE key.
BACKEND-ONLY — never expose to frontend or browser.
"""
import os

_client = None

def get_supabase():
    """Return a cached Supabase client with service role access."""
    global _client
    if _client is None:
        url = os.getenv("SUPABASE_URL", "")
        key = os.getenv("SUPABASE_SERVICE_KEY", "")
        if not url or not key:
            raise RuntimeError(
                "SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in backend environment."
            )
        try:
            from supabase._sync.client import SyncClient
            import jwt
            
            # Monkeypatch SyncClient.__init__ to bypass strict JWT check
            original_init = SyncClient.__init__
            def mock_init(self, supabase_url, supabase_key, options=None):
                # Temporarily patch jwt.decode used inside __init__
                # Just in case it calls `jwt.decode`
                pass
            
            # Since create_client just calls SyncClient.create which calls __init__
            # Let's just create the client manually and bypass the check
            client = SyncClient.__new__(SyncClient)
            
            # Replicate SyncClient.__init__ without the JWT check
            client.supabase_url = url
            client.supabase_key = key
            
            from supabase import ClientOptions
            options = ClientOptions()
            client.options = options
            
            # Replicate headers setup
            client.rest_url = f"{url}/rest/v1"
            client.realtime_url = f"{url}/realtime/v1".replace("http", "ws")
            client.auth_url = f"{url}/auth/v1"
            client.storage_url = f"{url}/storage/v1"
            client.functions_url = f"{url}/functions/v1"
            
            default_headers = {
                "apiKey": key,
                "Authorization": f"Bearer {key}",
            }
            client.options.headers.update(default_headers)
            
            from postgrest import SyncPostgrestClient
            client._postgrest = SyncPostgrestClient(
                client.rest_url,
                headers=client.options.headers,
                schema=client.options.schema,
            )
            
            _client = client
        except Exception as e:
            raise RuntimeError(f"Failed to create Supabase client: {e}")
    return _client
