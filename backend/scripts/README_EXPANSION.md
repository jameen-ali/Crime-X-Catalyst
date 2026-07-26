# Database Expansion & Missing Tables

To support the advanced features of the KSP Smart Police Intelligence Platform (such as Live Telemetry Patrol Map, Notifications, and Alerts), you need to create the missing tables in your Supabase database and run the expansion script to populate them.

## Step 1: Create the Missing Tables in Supabase

1. Open your browser and navigate to the **Supabase Dashboard** for your project.
2. Go to the **SQL Editor** on the left sidebar.
3. Click **New Query**.
4. Open the SQL file [backend/scripts/create_missing_tables.sql](create_missing_tables.sql) in your code editor.
5. Copy all its contents and paste them into the SQL editor window.
6. Click **Run** (or press Ctrl+Enter).

You should see a success message. This will create the following tables:
- `patrol_vehicles` (20 exact vehicle records)
- `patrol_logs` (4,000 patrol log entries)
- `notifications` (3,000 notification records)
- `alerts` (50 alert entries)

It also enables RLS and sets permissive policies on these tables, matching the user roles configuration.

## Step 2: Run the Seeding Script to Populate the New Tables

Once the tables are created, run the database expansion script again from the terminal in the root directory:

```bash
backend/venv/Scripts/python backend/scripts/expand_db.py
```

The script will automatically detect that these tables now exist, generate the synthetic records with `is_synthetic = true`, and batch-insert them.
