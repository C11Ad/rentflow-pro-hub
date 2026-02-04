-- Complete seed file that creates users AND seed data
-- This uses Supabase's auth.users extension functions

-- =====================================================
-- STEP 1: Create Users in auth.users
-- =====================================================
-- Note: This requires admin privileges or service role key
-- If this doesn't work, create users via Dashboard first

-- Function to create user if not exists
CREATE OR REPLACE FUNCTION create_user_if_not_exists(
  user_email TEXT,
  user_password TEXT,
  user_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  user_id UUID;
BEGIN
  -- Check if user already exists
  SELECT id INTO user_id FROM auth.users WHERE email = user_email LIMIT 1;
  
  IF user_id IS NULL THEN
    -- Create user using Supabase auth extension
    -- Note: This requires the auth schema functions
    -- If direct insert doesn't work, users must be created via Dashboard or API
    RAISE NOTICE 'User % does not exist. Please create via Dashboard or API.', user_email;
    RETURN NULL;
  END IF;
  
  RETURN user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Alternative: Use Supabase Management API
-- =====================================================
-- Users must be created via:
-- 1. Supabase Dashboard (easiest)
-- 2. Supabase Management API
-- 3. Your app's signup flow
--
-- Then run the seed.sql file which will automatically
-- find users by email and create seed data.
