-- =====================================================
-- Campaign Management Application - Seed Data
-- =====================================================
-- Run this SQL script AFTER running supabase-setup.sql
-- 
-- IMPORTANT: Before running this script:
-- 1. Generate a bcrypt hash for your admin password
--    Use: https://bcrypt-generator.com/ (12 rounds)
--    Or run: node -e "require('bcryptjs').hash('YourPassword', 12).then(h => console.log(h))"
-- 2. Replace the placeholder values below with your actual values
-- =====================================================

-- =====================================================
-- CONFIGURATION - UPDATE THESE VALUES
-- =====================================================

-- Super Admin Configuration
-- Replace these with your actual values!

DO $$
DECLARE
  v_admin_name VARCHAR := 'Super Admin';
  v_admin_email VARCHAR := 'admin@example.com';
  -- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  -- IMPORTANT: YOU MUST REPLACE THIS HASH BEFORE RUNNING!
  -- !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
  -- 
  -- Generate a bcrypt hash of your password using ONE of these methods:
  -- 1. Online: https://bcrypt-generator.com/ (use 12 rounds)
  -- 2. Node.js: node -e "require('bcryptjs').hash('YourPassword', 12).then(h => console.log(h))"
  --
  -- The value below is a PLACEHOLDER and will NOT work for login!
  -- Replace 'PLACEHOLDER...' with your actual bcrypt hash starting with '$2a$12$...'
  --
  v_admin_password_hash VARCHAR := 'PLACEHOLDER_REPLACE_WITH_BCRYPT_HASH';
  v_admin_id UUID;
BEGIN
  -- Validate that password hash was replaced
  IF v_admin_password_hash LIKE 'PLACEHOLDER%' THEN
    RAISE EXCEPTION 'ERROR: You must replace the placeholder password hash with an actual bcrypt hash before running this script!';
  END IF;

  -- Check if Super Admin already exists
  SELECT id INTO v_admin_id FROM users WHERE email = v_admin_email;
  
  IF v_admin_id IS NULL THEN
    -- Create Super Admin
    INSERT INTO users (name, email, password_hash, role, active)
    VALUES (v_admin_name, v_admin_email, v_admin_password_hash, 'SUPER_ADMIN', true)
    RETURNING id INTO v_admin_id;
    
    RAISE NOTICE 'Super Admin created with email: %', v_admin_email;
  ELSE
    RAISE NOTICE 'Super Admin already exists with email: %', v_admin_email;
  END IF;
END $$;

-- =====================================================
-- OPTIONAL: Create additional sample users
-- Uncomment the following section if you want sample users
-- =====================================================

/*
-- Sample Admin User
INSERT INTO users (name, email, password_hash, role, active)
VALUES (
  'Admin User',
  'admin-user@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4FQxqQZmfLf9.K.e', -- Password: AdminPass123!
  'ADMIN',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Sample Campaign Creator
INSERT INTO users (name, email, password_hash, role, active)
VALUES (
  'Campaign Creator',
  'creator@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4FQxqQZmfLf9.K.e', -- Password: CreatorPass123!
  'CAMPAIGN_CREATOR',
  true
)
ON CONFLICT (email) DO NOTHING;

-- Sample Campaign Manager
INSERT INTO users (name, email, password_hash, role, active)
VALUES (
  'Campaign Manager',
  'manager@example.com',
  '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4FQxqQZmfLf9.K.e', -- Password: ManagerPass123!
  'CAMPAIGN_MANAGER',
  true
)
ON CONFLICT (email) DO NOTHING;
*/

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE 'Seed completed!';
  RAISE NOTICE 'You can now log in with your Super Admin credentials.';
  RAISE NOTICE '----------------------------------------';
END $$;
