-- =====================================================
-- CribHub Property Management - Seed Data
-- =====================================================
-- This seed file creates users AND seed data automatically
-- Run: supabase db execute < supabase/seed.sql
-- =====================================================

-- =====================================================
-- STEP 1: Create Users in auth.users
-- =====================================================
-- Creates users if they don't exist
DO $$
DECLARE
  admin_user_id UUID;
  landlord1_id UUID;
  landlord2_id UUID;
  manager1_id UUID;
  tenant1_id UUID;
  tenant2_id UUID;
  tenant3_id UUID;
  -- Property and unit IDs (will be populated later)
  prop1_id UUID;
  prop2_id UUID;
  prop3_id UUID;
  unit1_id UUID;
  unit2_id UUID;
  unit3_main_id UUID;
  vacant_unit1_id UUID;
  vacant_unit2_id UUID;
BEGIN
  -- Helper function to create or get user
  -- Check if user exists, if not create it
  SELECT id INTO admin_user_id FROM auth.users WHERE email = 'admin@cribhub.com' LIMIT 1;
  IF admin_user_id IS NULL THEN
    -- Create user using extensions.auth functions (requires service role)
    -- Note: Direct insert into auth.users requires encrypted passwords
    -- Using crypt function to hash password
    INSERT INTO auth.users (
      instance_id,
      id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      recovery_sent_at,
      last_sign_in_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      gen_random_uuid(),
      'authenticated',
      'authenticated',
      'admin@cribhub.com',
      crypt('Admin123!', gen_salt('bf')),
      NOW(),
      NOW(),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"full_name":"Super Admin"}',
      NOW(),
      NOW(),
      '',
      '',
      '',
      ''
    ) RETURNING id INTO admin_user_id;
  END IF;

  SELECT id INTO landlord1_id FROM auth.users WHERE email = 'landlord1@cribhub.com' LIMIT 1;
  IF landlord1_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'landlord1@cribhub.com', crypt('Landlord123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Kwame Asante"}',
      NOW(), NOW(), '', '', '', ''
    ) RETURNING id INTO landlord1_id;
  END IF;

  SELECT id INTO landlord2_id FROM auth.users WHERE email = 'landlord2@cribhub.com' LIMIT 1;
  IF landlord2_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'landlord2@cribhub.com', crypt('Landlord123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Ama Mensah"}',
      NOW(), NOW(), '', '', '', ''
    ) RETURNING id INTO landlord2_id;
  END IF;

  SELECT id INTO manager1_id FROM auth.users WHERE email = 'manager1@cribhub.com' LIMIT 1;
  IF manager1_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'manager1@cribhub.com', crypt('Manager123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"John Kofi"}',
      NOW(), NOW(), '', '', '', ''
    ) RETURNING id INTO manager1_id;
  END IF;

  SELECT id INTO tenant1_id FROM auth.users WHERE email = 'tenant1@cribhub.com' LIMIT 1;
  IF tenant1_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'tenant1@cribhub.com', crypt('Tenant123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Akosua Bonsu"}',
      NOW(), NOW(), '', '', '', ''
    ) RETURNING id INTO tenant1_id;
  END IF;

  SELECT id INTO tenant2_id FROM auth.users WHERE email = 'tenant2@cribhub.com' LIMIT 1;
  IF tenant2_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'tenant2@cribhub.com', crypt('Tenant123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Kofi Adu"}',
      NOW(), NOW(), '', '', '', ''
    ) RETURNING id INTO tenant2_id;
  END IF;

  SELECT id INTO tenant3_id FROM auth.users WHERE email = 'tenant3@cribhub.com' LIMIT 1;
  IF tenant3_id IS NULL THEN
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, recovery_sent_at, last_sign_in_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
      'tenant3@cribhub.com', crypt('Tenant123!', gen_salt('bf')),
      NOW(), NOW(), NOW(),
      '{"provider":"email","providers":["email"]}', '{"full_name":"Abena Owusu"}',
      NOW(), NOW(), '', '', '', ''
    ) RETURNING id INTO tenant3_id;
  END IF;

  -- Now continue with seed data using the user IDs
  -- Property and unit IDs (will be populated later)
  -- Variables are declared at the top level above

-- =====================================================
-- STEP 2: Update Profiles (Add missing data)
-- =====================================================
-- Profiles are auto-created via trigger, but we'll update them with additional info

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
-- Note: New users automatically get 'tenant' role via trigger
-- We'll remove it for non-tenants and assign correct roles

-- Remove auto-assigned tenant role for non-tenants (if exists)
DELETE FROM public.user_roles 
WHERE user_id IN (admin_user_id, landlord1_id, landlord2_id, manager1_id)
AND role = 'tenant';

-- Admin role (full system access)
INSERT INTO public.user_roles (user_id, role)
VALUES (admin_user_id, 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Landlord roles (property owners)
INSERT INTO public.user_roles (user_id, role)
VALUES (landlord1_id, 'landlord')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES (landlord2_id, 'landlord')
ON CONFLICT (user_id, role) DO NOTHING;

-- Property Manager role (can manage properties)
INSERT INTO public.user_roles (user_id, role)
VALUES (manager1_id, 'property_manager')
ON CONFLICT (user_id, role) DO NOTHING;

-- Tenant roles (renters - already assigned by trigger, but ensure they exist)
INSERT INTO public.user_roles (user_id, role)
VALUES (tenant1_id, 'tenant')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES (tenant2_id, 'tenant')
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
VALUES (tenant3_id, 'tenant')
ON CONFLICT (user_id, role) DO NOTHING;

-- =====================================================
-- STEP 4: Create Properties
-- =====================================================

-- Property 1: Luxury Apartment Complex (Landlord 1)
INSERT INTO public.properties (
  id, landlord_id, name, address, city, state, country, postal_code,
  property_type, total_units, description, amenities
) VALUES (
  gen_random_uuid(),
  landlord1_id,
  'Sunset Gardens Apartments',
  '123 Airport Residential Road',
  'Accra',
  'Greater Accra',
  'Ghana',
  'GA-123-4567',
  'apartment',
  12,
  'Modern luxury apartment complex in the heart of Airport Residential Area. Features include swimming pool, gym, and 24/7 security.',
  ARRAY['Swimming Pool', 'Gym', '24/7 Security', 'Parking', 'Elevator', 'Generator']
);

-- Property 2: Family House (Landlord 1)
INSERT INTO public.properties (
  id, landlord_id, name, address, city, state, country, postal_code,
  property_type, total_units, description, amenities
) VALUES (
  gen_random_uuid(),
  landlord1_id,
  'Osu Family Home',
  '45 Osu Oxford Street',
  'Accra',
  'Greater Accra',
  'Ghana',
  'GA-789-0123',
  'house',
  1,
  'Spacious family home in vibrant Osu neighborhood, close to restaurants and shops.',
  ARRAY['Parking', 'Garden', 'Security Gate']
);

-- Property 3: Condo Complex (Landlord 2)
INSERT INTO public.properties (
  id, landlord_id, name, address, city, state, country, postal_code,
  property_type, total_units, description, amenities
) VALUES (
  gen_random_uuid(),
  landlord2_id,
  'East Legon Condos',
  '78 East Legon Road',
  'Accra',
  'Greater Accra',
  'Ghana',
  'GA-456-7890',
  'condo',
  8,
  'Premium condominiums with modern amenities in prestigious East Legon area.',
  ARRAY['Swimming Pool', 'Gym', 'Concierge', 'Parking', 'Elevator']
);

-- =====================================================
-- STEP 5: Get Property IDs and Create Units
-- =====================================================

-- Get property IDs (variables already declared at top)
SELECT id INTO prop1_id FROM public.properties WHERE name = 'Sunset Gardens Apartments';
SELECT id INTO prop2_id FROM public.properties WHERE name = 'Osu Family Home';
SELECT id INTO prop3_id FROM public.properties WHERE name = 'East Legon Condos';

-- Sunset Gardens Units
-- Unit 1A - Occupied by Tenant 1
INSERT INTO public.units (
    property_id, unit_number, bedrooms, bathrooms, square_feet,
    rent_amount, rent_currency, status, tenant_id,
    lease_start, lease_end
  ) VALUES (
    prop1_id, '1A', 2, 1.5, 850,
    2500, 'GHS', 'occupied', tenant1_id,
    CURRENT_DATE - INTERVAL '6 months', CURRENT_DATE + INTERVAL '6 months'
  );

-- Unit 2B - Occupied by Tenant 2
INSERT INTO public.units (
    property_id, unit_number, bedrooms, bathrooms, square_feet,
    rent_amount, rent_currency, status, tenant_id,
    lease_start, lease_end
  ) VALUES (
    prop1_id, '2B', 3, 2, 1200,
    3500, 'GHS', 'occupied', tenant2_id,
    CURRENT_DATE - INTERVAL '3 months', CURRENT_DATE + INTERVAL '9 months'
  );

-- Unit 3C - Vacant
INSERT INTO public.units (
    property_id, unit_number, bedrooms, bathrooms, square_feet,
    rent_amount, rent_currency, status
  ) VALUES (
    prop1_id, '3C', 2, 1.5, 850,
    2500, 'GHS', 'vacant'
  );

-- Unit 4D - Maintenance
INSERT INTO public.units (
    property_id, unit_number, bedrooms, bathrooms, square_feet,
    rent_amount, rent_currency, status
  ) VALUES (
    prop1_id, '4D', 2, 1.5, 850,
    2500, 'GHS', 'maintenance'
  );

-- Osu Family Home - Occupied
INSERT INTO public.units (
    property_id, unit_number, bedrooms, bathrooms, square_feet,
    rent_amount, rent_currency, status, tenant_id,
    lease_start, lease_end
  ) VALUES (
    prop2_id, 'Main', 4, 3, 2000,
    5000, 'GHS', 'occupied', tenant3_id,
    CURRENT_DATE - INTERVAL '2 months', CURRENT_DATE + INTERVAL '10 months'
  );

-- East Legon Condos
-- Unit A1 - Vacant
INSERT INTO public.units (
    property_id, unit_number, bedrooms, bathrooms, square_feet,
    rent_amount, rent_currency, status
  ) VALUES (
    prop3_id, 'A1', 2, 2, 1000,
    800, 'USD', 'vacant'
  );

-- Unit A2 - Occupied (Manual tenant)
INSERT INTO public.units (
    property_id, unit_number, bedrooms, bathrooms, square_feet,
    rent_amount, rent_currency, status,
    is_manual_tenant, manual_tenant_name, manual_tenant_email, manual_tenant_phone
  ) VALUES (
    prop3_id, 'A2', 3, 2.5, 1500,
    1200, 'USD', 'occupied',
    true, 'David Thompson', 'david.thompson@email.com', '+1234567890'
  );

-- =====================================================
-- STEP 6: Get Unit IDs and Create Payments
-- =====================================================

-- Get unit IDs (already declared above)
SELECT id INTO unit1_id FROM public.units WHERE property_id = prop1_id AND unit_number = '1A';
SELECT id INTO unit2_id FROM public.units WHERE property_id = prop1_id AND unit_number = '2B';
SELECT id INTO unit3_main_id FROM public.units WHERE property_id = prop2_id AND unit_number = 'Main';

-- Payments for Tenant 1 (Unit 1A)
    INSERT INTO public.payments (
      unit_id, tenant_id, landlord_id, amount, currency,
      payment_date, payment_method, reference_number, status
    ) VALUES
    (unit1_id, tenant1_id, landlord1_id, 2500, 'GHS', CURRENT_DATE - INTERVAL '2 months', 'mobile_money', 'MTN-001234', 'completed'),
    (unit1_id, tenant1_id, landlord1_id, 2500, 'GHS', CURRENT_DATE - INTERVAL '1 month', 'bank_transfer', 'GTB-567890', 'completed'),
    (unit1_id, tenant1_id, landlord1_id, 2500, 'GHS', CURRENT_DATE, 'cash', 'CASH-001', 'completed'),
    (unit1_id, tenant1_id, landlord1_id, 2500, 'GHS', CURRENT_DATE + INTERVAL '1 month', 'mobile_money', NULL, 'pending');

-- Payments for Tenant 2 (Unit 2B)
    INSERT INTO public.payments (
      unit_id, tenant_id, landlord_id, amount, currency,
      payment_date, payment_method, reference_number, status
    ) VALUES
    (unit2_id, tenant2_id, landlord1_id, 3500, 'GHS', CURRENT_DATE - INTERVAL '2 months', 'bank_transfer', 'ECOBANK-111', 'completed'),
    (unit2_id, tenant2_id, landlord1_id, 3500, 'GHS', CURRENT_DATE - INTERVAL '1 month', 'mobile_money', 'VODAFONE-222', 'completed'),
    (unit2_id, tenant2_id, landlord1_id, 3500, 'GHS', CURRENT_DATE, 'bank_transfer', NULL, 'pending');

-- Payments for Tenant 3 (Osu Family Home)
    INSERT INTO public.payments (
      unit_id, tenant_id, landlord_id, amount, currency,
      payment_date, payment_method, reference_number, status
    ) VALUES
    (unit3_main_id, tenant3_id, landlord1_id, 5000, 'GHS', CURRENT_DATE - INTERVAL '2 months', 'bank_transfer', 'STANBIC-333', 'completed'),
    (unit3_main_id, tenant3_id, landlord1_id, 5000, 'GHS', CURRENT_DATE - INTERVAL '1 month', 'cash', 'CASH-002', 'completed'),
    (unit3_main_id, tenant3_id, landlord1_id, 5000, 'GHS', CURRENT_DATE, 'bank_transfer', NULL, 'overdue');

-- =====================================================
-- STEP 7: Create Rental Contracts
-- =====================================================

INSERT INTO public.rental_contracts (
      unit_id, landlord_id, tenant_id, contract_type, content,
      status, start_date, end_date, monthly_rent, rent_currency
    ) VALUES
    (
      unit1_id, landlord1_id, tenant1_id, 'ai_generated',
      'RESIDENTIAL RENTAL AGREEMENT

This Rental Agreement is entered into on ' || TO_CHAR(CURRENT_DATE - INTERVAL '6 months', 'Month DD, YYYY') || ' between:
LANDLORD: Kwame Asante (landlord1@cribhub.com)
TENANT: Akosua Bonsu (tenant1@cribhub.com)

PROPERTY: Sunset Gardens Apartments, Unit 1A
ADDRESS: 123 Airport Residential Road, Accra, Ghana

TERMS:
- Lease Term: 12 months
- Monthly Rent: GH₵ 2,500.00
- Security Deposit: GH₵ 5,000.00
- Rent Due Date: 1st of each month

Tenant Responsibilities:
- Maintain property in good condition
- Pay rent on time
- Follow community rules

Landlord Responsibilities:
- Maintain building structure
- Provide essential services
- Respect tenant privacy

Facilitated by CribHub Property Management Platform
www.cribhub.com | support@cribhub.com',
      'active',
      CURRENT_DATE - INTERVAL '6 months',
      CURRENT_DATE + INTERVAL '6 months',
      2500,
      'GHS'
    ),
    (
      unit2_id, landlord1_id, tenant2_id, 'ai_generated',
      'RESIDENTIAL RENTAL AGREEMENT

This Rental Agreement is entered into on ' || TO_CHAR(CURRENT_DATE - INTERVAL '3 months', 'Month DD, YYYY') || ' between:
LANDLORD: Kwame Asante (landlord1@cribhub.com)
TENANT: Kofi Adu (tenant2@cribhub.com)

PROPERTY: Sunset Gardens Apartments, Unit 2B
ADDRESS: 123 Airport Residential Road, Accra, Ghana

TERMS:
- Lease Term: 12 months
- Monthly Rent: GH₵ 3,500.00
- Security Deposit: GH₵ 7,000.00
- Rent Due Date: 1st of each month

Facilitated by CribHub Property Management Platform
www.cribhub.com | support@cribhub.com',
      'active',
      CURRENT_DATE - INTERVAL '3 months',
      CURRENT_DATE + INTERVAL '9 months',
      3500,
      'GHS'
    );

-- =====================================================
-- STEP 8: Create Maintenance Requests
-- =====================================================

INSERT INTO public.maintenance_requests (
      unit_id, tenant_id, title, description, category, priority, status
    ) VALUES
    (
      unit1_id, tenant1_id,
      'Leaky Faucet in Kitchen',
      'The kitchen faucet has been leaking continuously for the past week. Water is dripping and needs to be fixed.',
      'plumbing',
      'medium',
      'pending'
    ),
    (
      unit2_id, tenant2_id,
      'AC Unit Not Working',
      'The air conditioning unit in the living room stopped working. It makes a strange noise when turned on.',
      'hvac',
      'high',
      'in_progress'
    ),
    (
      unit1_id, tenant1_id,
      'Broken Window Handle',
      'The handle on the bedroom window is broken and cannot be locked properly.',
      'general',
      'low',
      'completed'
    ),
    (
      unit3_main_id, tenant3_id,
      'Electrical Outlet Sparking',
      'One of the electrical outlets in the kitchen is sparking when plugs are inserted. This is a safety concern.',
      'electrical',
      'urgent',
      'pending'
    );

-- =====================================================
-- STEP 9: Get Vacant Unit IDs and Create Rental Applications
-- =====================================================

-- Get vacant unit IDs (already declared above)
SELECT id INTO vacant_unit1_id FROM public.units WHERE property_id = prop1_id AND unit_number = '3C';
SELECT id INTO vacant_unit2_id FROM public.units WHERE property_id = prop3_id AND unit_number = 'A1';

-- Application 1: Pending
    INSERT INTO public.rental_applications (
      unit_id, applicant_id, status, application_data
    ) VALUES (
      vacant_unit1_id,
      tenant3_id,
      'pending',
      '{"employment_status": "employed", "monthly_income": 8000, "references": [{"name": "John Doe", "phone": "+233501111111"}]}'::jsonb
    );

-- Application 2: Approved (but unit still vacant for demo)
    INSERT INTO public.rental_applications (
      unit_id, applicant_id, status, application_data,
      reviewed_by, reviewed_at, review_notes
    ) VALUES (
      vacant_unit2_id,
      tenant2_id,
      'approved',
      '{"employment_status": "self_employed", "monthly_income": 15000, "references": [{"name": "Jane Smith", "phone": "+233502222222"}]}'::jsonb,
      landlord2_id,
      CURRENT_DATE - INTERVAL '5 days',
        'Application approved. Ready to proceed with lease signing.'
      );

-- =====================================================
-- STEP 10: Create Role Requests
-- =====================================================

  -- Example: Tenant requesting landlord role (for demo)
  INSERT INTO public.role_requests (
    user_id, requested_role, status, verification_notes
  ) VALUES (
    tenant1_id,
    'landlord',
    'pending',
    'Requesting landlord role. I own property in Kumasi and want to list it on CribHub.'
  )
  ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 11: Create Communications (for Landlords)
-- =====================================================

  INSERT INTO public.communications (
    landlord_id, type, from_name, property, message, is_read, is_manual_entry
  ) VALUES
  (
    landlord1_id,
    'payment',
    'Akosua Bonsu',
    'Sunset Gardens Apartments - Unit 1A',
    'Rent payment received for March 2024. Amount: GH₵ 2,500.00',
    false,
    false
  ),
  (
    landlord1_id,
    'maintenance',
    'Kofi Adu',
    'Sunset Gardens Apartments - Unit 2B',
    'New maintenance request submitted: AC Unit Not Working',
    false,
    false
  ),
  (
    landlord1_id,
    'general',
    'Property Manager',
    'Sunset Gardens Apartments',
    'Monthly inspection scheduled for next week.',
    true,
    true
  )
  ON CONFLICT DO NOTHING;

-- =====================================================
-- STEP 12: Create Notices
-- =====================================================

  INSERT INTO public.notices (
    landlord_id, title, content, type, author, is_manual_entry, sms_sent
  ) VALUES
  (
    landlord1_id,
    'Maintenance Schedule - April 2024',
    'Scheduled maintenance for all units will take place on April 15th, 2024. Water supply will be temporarily interrupted from 9 AM to 12 PM.',
    'info',
    'Kwame Asante',
    true,
    false
  ),
  (
    landlord1_id,
    'Rent Payment Reminder',
    'This is a friendly reminder that rent payments are due on the 1st of each month. Late payments may incur a fee.',
    'reminder',
    'Kwame Asante',
    true,
    true
  )
  ON CONFLICT DO NOTHING;
END $$;

-- =====================================================
-- VERIFICATION QUERIES
-- =====================================================

-- Run these queries to verify seed data:

-- Check users and roles
-- SELECT p.email, p.full_name, ur.role 
-- FROM auth.users u
-- JOIN profiles p ON p.id = u.id
-- LEFT JOIN user_roles ur ON ur.user_id = u.id
-- ORDER BY p.email;

-- Check properties
-- SELECT name, address, city, property_type, total_units 
-- FROM properties 
-- ORDER BY created_at;

-- Check units
-- SELECT u.unit_number, p.name as property, u.status, u.rent_amount, u.rent_currency
-- FROM units u
-- JOIN properties p ON p.id = u.property_id
-- ORDER BY p.name, u.unit_number;

-- Check payments
-- SELECT u.unit_number, p.name as property, pay.amount, pay.currency, pay.status, pay.payment_date
-- FROM payments pay
-- JOIN units u ON u.id = pay.unit_id
-- JOIN properties p ON p.id = u.property_id
-- ORDER BY pay.payment_date DESC;

-- Check contracts
-- SELECT u.unit_number, rc.status, rc.start_date, rc.end_date, rc.monthly_rent
-- FROM rental_contracts rc
-- JOIN units u ON u.id = rc.unit_id
-- ORDER BY rc.created_at DESC;

-- Check maintenance requests
-- SELECT u.unit_number, mr.title, mr.category, mr.priority, mr.status
-- FROM maintenance_requests mr
-- JOIN units u ON u.id = mr.unit_id
-- ORDER BY mr.created_at DESC;
