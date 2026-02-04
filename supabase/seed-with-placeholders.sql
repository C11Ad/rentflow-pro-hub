-- Alternative seed file that uses a function to look up user IDs by email
-- This avoids needing to manually update UUIDs

DO $$
DECLARE
  -- Function to get user ID by email
  FUNCTION get_user_id(user_email TEXT) RETURNS UUID AS $$
    SELECT id FROM auth.users WHERE email = user_email LIMIT 1;
  $$ LANGUAGE SQL STABLE;
  
  -- Get user IDs dynamically
  admin_user_id UUID;
  landlord1_id UUID;
  landlord2_id UUID;
  manager1_id UUID;
  tenant1_id UUID;
  tenant2_id UUID;
  tenant3_id UUID;
  
  -- Property and unit IDs
  prop1_id UUID;
  prop2_id UUID;
  prop3_id UUID;
  unit1_id UUID;
  unit2_id UUID;
  unit3_main_id UUID;
  vacant_unit1_id UUID;
  vacant_unit2_id UUID;
BEGIN
  -- Get user IDs by email
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@cribhub.com';
  SELECT id INTO landlord1_id FROM auth.users WHERE email = 'landlord1@cribhub.com';
  SELECT id INTO landlord2_id FROM auth.users WHERE email = 'landlord2@cribhub.com';
  SELECT id INTO manager1_id FROM auth.users WHERE email = 'manager1@cribhub.com';
  SELECT id INTO tenant1_id FROM auth.users WHERE email = 'tenant1@cribhub.com';
  SELECT id INTO tenant2_id FROM auth.users WHERE email = 'tenant2@cribhub.com';
  SELECT id INTO tenant3_id FROM auth.users WHERE email = 'tenant3@cribhub.com';

  -- Check if all users exist
  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'User admin@cribhub.com not found. Please create this user first.';
  END IF;
  IF landlord1_id IS NULL THEN
    RAISE EXCEPTION 'User landlord1@cribhub.com not found. Please create this user first.';
  END IF;
  -- (add checks for other users as needed)

-- =====================================================
-- STEP 2: Update Profiles (Add missing data)
-- =====================================================

UPDATE public.profiles 
SET 
  full_name = 'Super Admin',
  phone = '+233241234567',
  default_currency = 'GHS'
WHERE id = admin_user_id;

UPDATE public.profiles 
SET 
  full_name = 'Kwame Asante',
  phone = '+233501234567',
  default_currency = 'GHS'
WHERE id = landlord1_id;

UPDATE public.profiles 
SET 
  full_name = 'Ama Mensah',
  phone = '+233242345678',
  default_currency = 'USD'
WHERE id = landlord2_id;

UPDATE public.profiles 
SET 
  full_name = 'John Kofi',
  phone = '+233503456789',
  default_currency = 'GHS'
WHERE id = manager1_id;

UPDATE public.profiles 
SET 
  full_name = 'Akosua Bonsu',
  phone = '+233244567890',
  default_currency = 'GHS'
WHERE id = tenant1_id;

UPDATE public.profiles 
SET 
  full_name = 'Kofi Adu',
  phone = '+233505678901',
  default_currency = 'GHS'
WHERE id = tenant2_id;

UPDATE public.profiles 
SET 
  full_name = 'Abena Owusu',
  phone = '+233246789012',
  default_currency = 'GHS'
WHERE id = tenant3_id;

-- =====================================================
-- STEP 3: Assign User Roles
-- =====================================================

-- Remove auto-assigned tenant role for non-tenants (if exists)
DELETE FROM public.user_roles 
WHERE user_id IN (admin_user_id, landlord1_id, landlord2_id, manager1_id)
AND role = 'tenant';

-- Admin role
INSERT INTO public.user_roles (user_id, role)
VALUES (admin_user_id, 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Landlord roles
INSERT INTO public.user_roles (user_id, role)
VALUES (landlord1_id, 'landlord')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES (landlord2_id, 'landlord')
ON CONFLICT (user_id, role) DO NOTHING;

-- Property Manager role
INSERT INTO public.user_roles (user_id, role)
VALUES (manager1_id, 'property_manager')
ON CONFLICT (user_id, role) DO NOTHING;

-- Tenant roles
INSERT INTO public.user_roles (user_id, role)
VALUES (tenant1_id, 'tenant')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES (tenant2_id, 'tenant')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES (tenant3_id, 'tenant')
ON CONFLICT (user_id, role) DO NOTHING;

-- (Continue with rest of seed data...)

END $$;
