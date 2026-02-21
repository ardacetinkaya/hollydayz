# HollyDayz Database Setup

This folder contains SQL scripts for setting up and managing the HollyDayz database in Supabase.

## 📁 Files

### `complete_setup.sql` ⭐
**Complete database schema with all required objects**

Includes:
- All table definitions (users, time_off_requests, holidays, company_settings)
- Indexes for performance
- RLS (Row Level Security) policies
- Triggers for updated_at timestamps
- Database functions (is_user_admin)
- Default company settings including admin_emails

**When to use**: Fresh installation or complete database rebuild

### `seed_data.sql`
**Sample data for development and testing**

Includes:
- 7 test users across 3 projects (Alpha, Beta, Gamma)
- 21 time-off requests (approved, pending, rejected)
- 8 holidays for 2026 (national + company)

**When to use**: After running complete_setup.sql, populate with test data

### `teardown.sql` ⚠️
**Complete database cleanup script**

Drops:
- All RLS policies
- All tables (⚠️ **deletes all data permanently**)
- All triggers
- All functions

**When to use**: Before fresh installation to ensure clean slate

## 🚀 Setup Instructions

### Option 1: Fresh Installation (Recommended)

Run these scripts in **Supabase SQL Editor** in this order:

```sql
-- Step 1: Clean slate (skip if this is a new database)
-- Run: teardown.sql

-- Step 2: Create all database objects
-- Run: complete_setup.sql

-- Step 3: (Optional) Add sample data for testing
-- Run: seed_data.sql
```

### Option 2: Update Existing Database

If you already have data and just need to update schema:

1. **Backup your data first!**
2. Review changes in `complete_setup.sql`
3. Run only the specific ALTER/CREATE statements you need
4. Test thoroughly

## 🔐 Admin Configuration

After running `complete_setup.sql`, set your admin emails:

```sql
-- Replace with your actual admin email(s)
UPDATE company_settings
SET setting_value = '["your-email@company.com"]'::jsonb
WHERE setting_key = 'admin_emails';
```

Or update via the Settings page in the application (requires admin access).

## ✅ Verification

After running setup, verify everything is created:

```sql
-- Check tables
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'time_off_requests', 'holidays', 'company_settings');

-- Check RLS policies
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public';

-- Check functions
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public';

-- Check admin emails setting
SELECT setting_key, setting_value FROM company_settings 
WHERE setting_key = 'admin_emails';
```

## 🔄 Troubleshooting

### RLS Blocking Queries (500 Errors)

If you get 500 errors when accessing the app:

```sql
-- Temporarily disable RLS (not recommended for production)
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings DISABLE ROW LEVEL SECURITY;
```

Then re-run `complete_setup.sql` to properly configure RLS.

### Duplicate Policy Errors

If you get "policy already exists" errors:

```sql
-- Run teardown.sql first to remove all policies
-- Then run complete_setup.sql
```

### Function Not Found

If `is_user_admin` function doesn't exist:

```sql
-- Check if function exists
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' AND routine_name = 'is_user_admin';

-- Re-run complete_setup.sql if missing
```

## 📝 Notes

- All scripts use `IF EXISTS` and `IF NOT EXISTS` to be idempotent
- Seed data uses `ON CONFLICT DO NOTHING` to prevent duplicates
- Seed user IDs are prefixed with `seed-` for easy identification/cleanup
- Default admin email is `admin@example.com` - **change this immediately!**
- RLS policies are configured to allow all authenticated users (can be restricted later)

## 🗑️ Cleanup Seed Data

To remove test data:

```sql
DELETE FROM public.time_off_requests WHERE user_id LIKE 'seed-%';
DELETE FROM public.users WHERE id LIKE 'seed-%';
DELETE FROM public.holidays WHERE name IN ('Company Foundation Day', 'Summer Company Picnic');
```
