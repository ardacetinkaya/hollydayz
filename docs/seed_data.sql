-- ============================================================
-- HollyDayz Seed Data
-- ============================================================
-- Sample users, projects, and time-off requests for testing
-- Run this after complete_setup.sql
-- ============================================================

-- ============================================================
-- SEED USERS (6-7 users across 3 projects)
-- ============================================================

-- Clear existing seed data (optional - comment out if you want to keep existing data)
-- DELETE FROM public.time_off_requests WHERE user_id LIKE 'seed-%';
-- DELETE FROM public.users WHERE id LIKE 'seed-%';

-- Project Alpha Team (3 users)
INSERT INTO public.users (id, email, name, project, is_active)
VALUES 
    ('seed-user-001', 'sarah.johnson@company.com', 'Sarah Johnson', 'Project Alpha', true),
    ('seed-user-002', 'michael.chen@company.com', 'Michael Chen', 'Project Alpha', true),
    ('seed-user-003', 'emma.davis@company.com', 'Emma Davis', 'Project Alpha', true)
ON CONFLICT (id) DO NOTHING;

-- Project Beta Team (2 users)
INSERT INTO public.users (id, email, name, project, is_active)
VALUES 
    ('seed-user-004', 'james.wilson@company.com', 'James Wilson', 'Project Beta', true),
    ('seed-user-005', 'olivia.martinez@company.com', 'Olivia Martinez', 'Project Beta', true)
ON CONFLICT (id) DO NOTHING;

-- Project Gamma Team (2 users)
INSERT INTO public.users (id, email, name, project, is_active)
VALUES 
    ('seed-user-006', 'david.anderson@company.com', 'David Anderson', 'Project Gamma', true),
    ('seed-user-007', 'sophia.taylor@company.com', 'Sophia Taylor', 'Project Gamma', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- SEED TIME-OFF REQUESTS (March - December 2026)
-- ============================================================

-- Sarah Johnson - Project Alpha
INSERT INTO public.time_off_requests (user_id, start_date, end_date, type, status, notes, approved_at)
VALUES 
    -- Approved vacation in March
    ('seed-user-001', '2026-03-10', '2026-03-14', 'vacation', 'approved', 'Spring break vacation', NOW()),
    -- Pending vacation in June
    ('seed-user-001', '2026-06-15', '2026-06-20', 'vacation', 'pending', 'Summer vacation request', NULL),
    -- Approved sick day
    ('seed-user-001', '2026-04-22', '2026-04-22', 'sick', 'approved', 'Doctor appointment', NOW());

-- Michael Chen - Project Alpha
INSERT INTO public.time_off_requests (user_id, start_date, end_date, type, status, notes, approved_at)
VALUES 
    -- Approved personal days in April
    ('seed-user-002', '2026-04-07', '2026-04-09', 'personal', 'approved', 'Family matters', NOW()),
    -- Approved vacation in July
    ('seed-user-002', '2026-07-20', '2026-07-31', 'vacation', 'approved', 'Summer holidays', NOW()),
    -- Pending vacation in December
    ('seed-user-002', '2026-12-23', '2026-12-31', 'vacation', 'pending', 'Year-end holidays', NULL);

-- Emma Davis - Project Alpha
INSERT INTO public.time_off_requests (user_id, start_date, end_date, type, status, notes, approved_at)
VALUES 
    -- Approved vacation in May
    ('seed-user-003', '2026-05-04', '2026-05-08', 'vacation', 'approved', 'Long weekend trip', NOW()),
    -- Rejected vacation (conflict with team needs)
    ('seed-user-003', '2026-07-20', '2026-07-25', 'vacation', 'rejected', 'Team coverage needed during this period', NULL),
    -- Pending vacation in August
    ('seed-user-003', '2026-08-17', '2026-08-28', 'vacation', 'pending', 'Summer vacation', NULL);

-- James Wilson - Project Beta
INSERT INTO public.time_off_requests (user_id, start_date, end_date, type, status, notes, approved_at)
VALUES 
    -- Approved emergency leave
    ('seed-user-004', '2026-03-15', '2026-03-16', 'emergency', 'approved', 'Family emergency', NOW()),
    -- Approved vacation in June
    ('seed-user-004', '2026-06-08', '2026-06-12', 'vacation', 'approved', 'Beach vacation', NOW()),
    -- Pending sick leave
    ('seed-user-004', '2026-09-10', '2026-09-11', 'sick', 'pending', 'Medical procedure', NULL);

-- Olivia Martinez - Project Beta
INSERT INTO public.time_off_requests (user_id, start_date, end_date, type, status, notes, approved_at)
VALUES 
    -- Approved vacation in April
    ('seed-user-005', '2026-04-20', '2026-04-25', 'vacation', 'approved', 'Spring vacation', NOW()),
    -- Approved personal day
    ('seed-user-005', '2026-05-15', '2026-05-15', 'personal', 'approved', 'Personal appointment', NOW()),
    -- Pending vacation in September
    ('seed-user-005', '2026-09-15', '2026-09-26', 'vacation', 'pending', 'Fall vacation', NULL);

-- David Anderson - Project Gamma
INSERT INTO public.time_off_requests (user_id, start_date, end_date, type, status, notes, approved_at)
VALUES 
    -- Approved vacation in March
    ('seed-user-006', '2026-03-23', '2026-03-27', 'vacation', 'approved', 'Spring break', NOW()),
    -- Approved sick days
    ('seed-user-006', '2026-05-20', '2026-05-21', 'sick', 'approved', 'Flu recovery', NOW()),
    -- Pending vacation in November
    ('seed-user-006', '2026-11-23', '2026-11-27', 'vacation', 'pending', 'Thanksgiving week', NULL);

-- Sophia Taylor - Project Gamma
INSERT INTO public.time_off_requests (user_id, start_date, end_date, type, status, notes, approved_at)
VALUES 
    -- Approved vacation in April
    ('seed-user-007', '2026-04-13', '2026-04-17', 'vacation', 'approved', 'Easter holidays', NOW()),
    -- Approved vacation in August
    ('seed-user-007', '2026-08-03', '2026-08-14', 'vacation', 'approved', 'Summer trip', NOW()),
    -- Rejected vacation (staffing needs)
    ('seed-user-007', '2026-12-15', '2026-12-22', 'vacation', 'rejected', 'Project deadline approaching', NULL);

-- ============================================================
-- SEED HOLIDAYS (2026)
-- ============================================================

INSERT INTO public.holidays (name, date, year, country, type, is_active)
VALUES 
    -- Standard US Holidays 2026
    ('New Year''s Day', '2026-01-01', 2026, 'US', 'national', true),
    ('Memorial Day', '2026-05-25', 2026, 'US', 'national', true),
    ('Independence Day', '2026-07-04', 2026, 'US', 'national', true),
    ('Labor Day', '2026-09-07', 2026, 'US', 'national', true),
    ('Thanksgiving', '2026-11-26', 2026, 'US', 'national', true),
    ('Christmas', '2026-12-25', 2026, 'US', 'national', true),
    
    -- Company Holidays
    ('Company Foundation Day', '2026-03-15', 2026, 'ALL', 'company', true),
    ('Summer Company Picnic', '2026-07-17', 2026, 'ALL', 'company', true)
ON CONFLICT (date, country, type) DO NOTHING;

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Show inserted users
SELECT 'Seed Users Created:' as status;
SELECT id, email, name, project 
FROM public.users 
WHERE id LIKE 'seed-%'
ORDER BY project, name;

-- Show time-off requests summary
SELECT 'Time-Off Requests Summary:' as status;
SELECT 
    u.name,
    u.project,
    COUNT(*) as total_requests,
    SUM(CASE WHEN tor.status = 'approved' THEN 1 ELSE 0 END) as approved,
    SUM(CASE WHEN tor.status = 'pending' THEN 1 ELSE 0 END) as pending,
    SUM(CASE WHEN tor.status = 'rejected' THEN 1 ELSE 0 END) as rejected
FROM public.users u
LEFT JOIN public.time_off_requests tor ON u.id = tor.user_id
WHERE u.id LIKE 'seed-%'
GROUP BY u.name, u.project
ORDER BY u.project, u.name;

-- Show holidays
SELECT 'Holidays Created:' as status;
SELECT name, date, type FROM public.holidays WHERE year = 2026 ORDER BY date;

-- ============================================================
-- CLEANUP SCRIPT (if needed)
-- ============================================================
-- To remove all seed data, run:
-- DELETE FROM public.time_off_requests WHERE user_id LIKE 'seed-%';
-- DELETE FROM public.users WHERE id LIKE 'seed-%';
-- DELETE FROM public.holidays WHERE name IN ('Company Foundation Day', 'Summer Company Picnic');
