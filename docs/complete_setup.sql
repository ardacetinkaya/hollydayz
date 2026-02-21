-- ============================================================
-- HollyDayz Complete Database Setup
-- ============================================================
-- This script contains the complete database schema and all
-- necessary RLS policies for the HollyDayz application.
-- 
-- Run this script in your Supabase SQL Editor to set up
-- the entire database from scratch.
-- ============================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLE CREATION
-- ============================================================

-- Users table (synced from EntraID)
CREATE TABLE IF NOT EXISTS public.users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    project TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    is_active BOOLEAN DEFAULT true
);

-- Time off requests table
CREATE TABLE IF NOT EXISTS public.time_off_requests (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id TEXT REFERENCES public.users(id) ON DELETE CASCADE,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('vacation', 'sick', 'personal', 'emergency')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
    notes TEXT,
    approved_by TEXT REFERENCES public.users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Holidays table (red days)
CREATE TABLE IF NOT EXISTS public.holidays (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    date DATE NOT NULL,
    year INTEGER NOT NULL,
    country TEXT NOT NULL DEFAULT 'ALL',
    type TEXT NOT NULL DEFAULT 'national' CHECK (type IN ('national', 'company', 'regional', 'religious')),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(date, country, type)
);

-- Company settings table
CREATE TABLE IF NOT EXISTS public.company_settings (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    setting_key TEXT UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    updated_by TEXT REFERENCES public.users(id),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- ============================================================
-- INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_time_off_user_id ON public.time_off_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_time_off_dates ON public.time_off_requests(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_time_off_status ON public.time_off_requests(status);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON public.holidays(date);
CREATE INDEX IF NOT EXISTS idx_holidays_year ON public.holidays(year);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- ============================================================
-- DEFAULT DATA
-- ============================================================

-- Insert default company settings (only if table is empty)
INSERT INTO public.company_settings (setting_key, setting_value, description)
SELECT * FROM (VALUES
    ('weekend_days', '["saturday", "sunday"]'::jsonb, 'Days considered as weekends'),
    ('default_country', '"US"'::jsonb, 'Default country for holidays'),
    ('max_consecutive_days', '14'::jsonb, 'Maximum consecutive days off allowed'),
    ('admin_emails', '["admin@example.com"]'::jsonb, 'List of admin email addresses (replace with actual admin emails)')
) AS v(setting_key, setting_value, description)
WHERE NOT EXISTS (SELECT 1 FROM public.company_settings);

-- ============================================================
-- TRIGGERS
-- ============================================================

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to check if an email is an admin (server-side only)
CREATE OR REPLACE FUNCTION public.is_user_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
    admin_list JSONB;
    is_admin BOOLEAN;
BEGIN
    -- Get admin emails from settings
    SELECT setting_value INTO admin_list
    FROM public.company_settings
    WHERE setting_key = 'admin_emails';
    
    -- Check if email is in admin list or contains 'admin'
    is_admin := (
        admin_list ? user_email OR 
        user_email ILIKE '%admin%'
    );
    
    RETURN is_admin;
END;
$$;

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS set_users_updated_at ON public.users;
DROP TRIGGER IF EXISTS set_time_off_requests_updated_at ON public.time_off_requests;
DROP TRIGGER IF EXISTS set_company_settings_updated_at ON public.company_settings;

-- Apply updated_at triggers
CREATE TRIGGER set_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_time_off_requests_updated_at
    BEFORE UPDATE ON public.time_off_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_company_settings_updated_at
    BEFORE UPDATE ON public.company_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_off_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_settings ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- RLS POLICIES - USERS TABLE
-- ============================================================

DROP POLICY IF EXISTS "Users can view all users" ON public.users;
DROP POLICY IF EXISTS "Users can be created on first login" ON public.users;
DROP POLICY IF EXISTS "Users can update profiles" ON public.users;

CREATE POLICY "Users can view all users" 
ON public.users
FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Users can be created on first login" 
ON public.users
FOR INSERT 
TO authenticated, anon
WITH CHECK (true);

CREATE POLICY "Users can update profiles" 
ON public.users
FOR UPDATE 
TO authenticated, anon
USING (true) 
WITH CHECK (true);

-- ============================================================
-- RLS POLICIES - TIME OFF REQUESTS TABLE
-- ============================================================

DROP POLICY IF EXISTS "Users can view all time off requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Users can create time off requests" ON public.time_off_requests;
DROP POLICY IF EXISTS "Time off requests can be updated" ON public.time_off_requests;
DROP POLICY IF EXISTS "Users can delete pending time off requests" ON public.time_off_requests;

CREATE POLICY "Users can view all time off requests" 
ON public.time_off_requests
FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Users can create time off requests" 
ON public.time_off_requests
FOR INSERT 
TO authenticated, anon
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.users 
        WHERE users.id = time_off_requests.user_id 
        AND users.is_active = true
    )
);

CREATE POLICY "Time off requests can be updated" 
ON public.time_off_requests
FOR UPDATE 
TO authenticated, anon
USING (
    status = 'pending' OR 
    status = 'approved' OR 
    status = 'rejected'
) 
WITH CHECK (true);

CREATE POLICY "Users can delete pending time off requests" 
ON public.time_off_requests
FOR DELETE 
TO authenticated, anon
USING (status = 'pending');

-- ============================================================
-- RLS POLICIES - HOLIDAYS TABLE
-- ============================================================

DROP POLICY IF EXISTS "Users can view holidays" ON public.holidays;
DROP POLICY IF EXISTS "Allow SELECT for all users" ON public.holidays;
DROP POLICY IF EXISTS "Allow INSERT for authenticated users" ON public.holidays;
DROP POLICY IF EXISTS "Allow UPDATE for authenticated users" ON public.holidays;
DROP POLICY IF EXISTS "Allow DELETE for authenticated users" ON public.holidays;

CREATE POLICY "Users can view holidays" 
ON public.holidays
FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Allow INSERT for authenticated users" 
ON public.holidays
FOR INSERT 
TO authenticated, anon
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.is_active = true
    )
);

CREATE POLICY "Allow UPDATE for authenticated users" 
ON public.holidays
FOR UPDATE 
TO authenticated, anon
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.is_active = true
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.is_active = true
    )
);

CREATE POLICY "Allow DELETE for authenticated users" 
ON public.holidays
FOR DELETE 
TO authenticated, anon
USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE users.is_active = true
    )
);

-- ============================================================
-- RLS POLICIES - COMPANY SETTINGS TABLE
-- ============================================================

DROP POLICY IF EXISTS "Users can view company settings" ON public.company_settings;
DROP POLICY IF EXISTS "Users can update company settings" ON public.company_settings;

CREATE POLICY "Users can view company settings" 
ON public.company_settings
FOR SELECT 
TO authenticated, anon
USING (true);

CREATE POLICY "Users can update company settings" 
ON public.company_settings
FOR UPDATE 
TO authenticated, anon
USING (true) 
WITH CHECK (true);

-- ============================================================
-- TABLE COMMENTS
-- ============================================================

COMMENT ON TABLE public.users IS 'User profiles synced from EntraID';
COMMENT ON TABLE public.time_off_requests IS 'Employee time-off requests and approvals';
COMMENT ON TABLE public.holidays IS 'Company and national holidays (red days)';
COMMENT ON TABLE public.company_settings IS 'Configurable company-wide settings';

-- ============================================================
-- SETUP COMPLETE
-- ============================================================

-- Verify setup
SELECT 'Setup complete! Tables created:' AS status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('users', 'time_off_requests', 'holidays', 'company_settings');

SELECT 'RLS policies created:' AS status;
SELECT tablename, policyname FROM pg_policies WHERE schemaname = 'public';
