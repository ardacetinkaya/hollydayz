-- ============================================================
-- HollyDayz Database Teardown/Cleanup Script
-- ============================================================
-- This script removes ALL HollyDayz database objects including:
-- - All RLS policies
-- - All tables (and their data)
-- - All triggers
-- - All functions
-- 
-- WARNING: This will DELETE ALL DATA permanently!
-- Use this script only when you want a completely fresh start.
-- 
-- Run this script in your Supabase SQL Editor before running
-- complete_setup.sql for a fresh installation.
-- ============================================================

-- ============================================================
-- DROP RLS POLICIES
-- ============================================================

-- Users table policies
DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can be created on first login" ON public.users;
DROP POLICY IF EXISTS "Users can update profiles" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
DROP POLICY IF EXISTS "Users can update their own profiles" ON public.users;
DROP POLICY IF EXISTS "Admins can manage users" ON public.users;

-- Time off requests table policies
DROP POLICY IF EXISTS "Users can view all time off requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Users can create time off requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Time off requests can be updated" ON public.time_off_requests;
DROP POLICY IF EXISTS "Users can delete pending time off requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Users can create their own time off requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Users can update their own pending time off requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Users can update their own pending requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Users can delete their own pending requests" ON public.time_off_requests;

-- Holidays table policies
DROP POLICY IF EXISTS "Users can view holidays" ON public.holidays;
DROP POLICY IF EXISTS "Allow SELECT for all users" ON public.holidays;
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON public.holidays;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users" ON public.holidays;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users" ON public.holidays;
DROP POLICY IF EXISTS "Admins can manage holidays" ON public.holidays;

-- Company settings table policies
DROP POLICY IF EXISTS "Users can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Admins can update company settings" ON public.company_settings;

-- ============================================================
-- DROP TRIGGERS
-- ============================================================

DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS set_time_off_requests_updated_at ON public.time_off_requests;
DROP TRIGGER IF EXISTS set_company_settings_updated_at ON public.company_settings;

-- ============================================================
-- DROP TABLES (CASCADE will remove foreign key constraints)
-- ============================================================

DROP TABLE IF EXISTS public.time_off_requests CASCADE;
DROP TABLE IF EXISTS public.holidays CASCADE;
DROP TABLE IF EXISTS public.company_settings CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;

-- ============================================================
-- DROP FUNCTIONS
-- ============================================================

DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.is_user_admin(TEXT) CASCADE;

-- ============================================================
-- CLEANUP COMPLETE
-- ============================================================

SELECT 'Cleanup complete! All HollyDayz database objects removed.' AS status;

-- Verify cleanup
SELECT 'Remaining tables (should be empty):' AS status;
SELECT tablename FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('users', 'time_off_requests', 'holidays', 'company_settings');

SELECT 'Remaining policies (should be empty):' AS status;
SELECT tablename, policyname FROM pg_policies 
WHERE schemaname = 'public'
AND tablename IN ('users', 'time_off_requests', 'holidays', 'company_settings');

SELECT 'Remaining functions (should be empty):' AS status;
SELECT proname FROM pg_proc 
WHERE proname = 'handle_updated_at';
