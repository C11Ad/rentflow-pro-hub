-- Quick query to get all user IDs for seed file
-- Run this first in Supabase SQL Editor to get your user IDs

SELECT 
  id,
  email,
  CASE 
    WHEN email = 'admin@cribhub.com' THEN 'admin_user_id'
    WHEN email = 'landlord1@cribhub.com' THEN 'landlord1_id'
    WHEN email = 'landlord2@cribhub.com' THEN 'landlord2_id'
    WHEN email = 'manager1@cribhub.com' THEN 'manager1_id'
    WHEN email = 'tenant1@cribhub.com' THEN 'tenant1_id'
    WHEN email = 'tenant2@cribhub.com' THEN 'tenant2_id'
    WHEN email = 'tenant3@cribhub.com' THEN 'tenant3_id'
    ELSE 'other'
  END as variable_name
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
