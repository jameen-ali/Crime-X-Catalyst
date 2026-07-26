import psycopg2
try:
    conn = psycopg2.connect("postgresql://postgres.ewzifvudriauuydrgiax:password123@aws-0-eu-central-1.pooler.supabase.com:6543/postgres")
    print("SUCCESS with password123!")
    conn.close()
except Exception as e:
    print("FAILED with password123:", e)
