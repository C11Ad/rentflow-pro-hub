-- Script to automatically update user IDs in seed.sql
-- This creates a temporary seed file with actual user IDs from your database

-- First, get all user IDs and display them
SELECT 
  email,
  id,
  'UPDATE THIS LINE IN seed.sql: Line ' || 
  CASE 
    WHEN email = 'admin@cribhub.com' THEN '30: admin_user_id'
    WHEN email = 'landlord1@cribhub.com' THEN '31: landlord1_id'
    WHEN email = 'landlord2@cribhub.com' THEN '32: landlord2_id'
    WHEN email = 'manager1@cribhub.com' THEN '33: manager1_id'
    WHEN email = 'tenant1@cribhub.com' THEN '34: tenant1_id'
    WHEN email = 'tenant2@cribhub.com' THEN '35: tenant2_id'
    WHEN email = 'tenant3@cribhub.com' THEN '36: tenant3_id'
  END as instruction
FROM auth.users
WHERE email IN (
  'admin@cribhub.com',
  'landlord1@cribhub.com',
  'landlord2@cribhub.com',
  'manager1@cribhub.com',
  'tenant1@cribhub.com',
  'tenant2@cribhub.com',
  'tenant3@cribhub.com'
)
ORDER BY email;

-- Copy the IDs above and replace them in seed.sql lines 30-36
