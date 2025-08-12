-- SUPABASE PROJECT HEALTH CHECK
-- Run this to diagnose the authentication schema issue

-- Check 1: Basic connection
SELECT 'Database connection working' as test_1;

-- Check 2: Auth schema exists
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') 
        THEN 'Auth schema exists ✅'
        ELSE 'Auth schema missing ❌'
    END as test_2;

-- Check 3: Auth tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN 'Exists ✅'
        ELSE 'Missing ❌'
    END as status
FROM information_schema.tables 
WHERE table_schema = 'auth' 
    AND table_name IN ('users', 'sessions', 'refresh_tokens')
ORDER BY table_name;

-- Check 4: Public schema tables
SELECT 
    'Public tables: ' || string_agg(table_name, ', ') as test_4
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check 5: Extensions
SELECT 
    extname as extension_name,
    'Installed ✅' as status
FROM pg_extension 
WHERE extname IN ('pgcrypto', 'pgjwt', 'uuid-ossp');

-- Check 6: Current user and role
SELECT 
    current_user as current_user,
    session_user as session_user;

-- If any of these fail, your Supabase project has issues