# Seed Data Instructions

This guide explains how to populate your CribHub database with sample data for development and testing.

## Prerequisites

1. Supabase project set up
2. All migrations have been run
3. Access to Supabase SQL Editor

## Quick Start

### Option 1: Using Supabase Dashboard (Recommended)

1. **Create Test Users** in Supabase Auth Dashboard:
   - Go to Authentication → Users
   - Click "Add User" for each test user:
     - `admin@cribhub.com` / Password: `Admin123!`
     - `landlord1@cribhub.com` / Password: `Landlord123!`
     - `landlord2@cribhub.com` / Password: `Landlord123!`
     - `manager1@cribhub.com` / Password: `Manager123!`
     - `tenant1@cribhub.com` / Password: `Tenant123!`
     - `tenant2@cribhub.com` / Password: `Tenant123!`
     - `tenant3@cribhub.com` / Password: `Tenant123!`

2. **Get User IDs**:
   - Go to SQL Editor
   - Run: `SELECT id, email FROM auth.users ORDER BY email;`
   - Copy the user IDs

3. **Update Seed File**:
   - Open `supabase/seed.sql`
   - Replace the placeholder UUIDs with your actual user IDs
   - Update the DECLARE section at the beginning

4. **Run Seed File**:
   - Go to SQL Editor
   - Paste the entire `seed.sql` file
   - Click "Run"

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Create users via CLI (if possible) or use dashboard

# Run seed file
supabase db execute -f supabase/seed.sql
```

## What Gets Created

### Users & Roles
- ✅ 1 Admin user
- ✅ 2 Landlord users
- ✅ 1 Property Manager user
- ✅ 3 Tenant users

### Properties
- ✅ **Sunset Gardens Apartments** (12 units) - Landlord 1
  - Modern luxury apartments in Airport Residential Area
  - 4 units created: 2 occupied, 1 vacant, 1 maintenance
  
- ✅ **Osu Family Home** (1 unit) - Landlord 1
  - Spacious family home in Osu
  - 1 unit created: occupied

- ✅ **East Legon Condos** (8 units) - Landlord 2
  - Premium condos in East Legon
  - 2 units created: 1 vacant, 1 occupied (manual tenant)

### Units
- ✅ **Unit 1A**: 2BR, 1.5BA - Occupied by Tenant 1 (GH₵ 2,500/month)
- ✅ **Unit 2B**: 3BR, 2BA - Occupied by Tenant 2 (GH₵ 3,500/month)
- ✅ **Unit 3C**: 2BR, 1.5BA - Vacant (GH₵ 2,500/month)
- ✅ **Unit 4D**: 2BR, 1.5BA - Maintenance (GH₵ 2,500/month)
- ✅ **Main**: 4BR, 3BA - Occupied by Tenant 3 (GH₵ 5,000/month)
- ✅ **A1**: 2BR, 2BA - Vacant (USD $800/month)
- ✅ **A2**: 3BR, 2.5BA - Occupied (Manual tenant, USD $1,200/month)

### Payments
- ✅ 10 payment records across different units
- ✅ Mix of completed, pending, and overdue payments
- ✅ Various payment methods (mobile_money, bank_transfer, cash)
- ✅ Different currencies (GHS, USD)

### Rental Contracts
- ✅ 2 active contracts for occupied units
- ✅ AI-generated contract format

### Maintenance Requests
- ✅ 4 maintenance requests:
  - Leaky faucet (pending)
  - AC unit not working (in_progress)
  - Broken window handle (completed)
  - Electrical outlet sparking (urgent)

### Rental Applications
- ✅ 2 applications:
  - 1 pending application for vacant unit
  - 1 approved application

### Role Requests
- ✅ 1 property manager role request (pending)

### Communications
- ✅ 3 communication entries for landlords

### Notices
- ✅ 2 notices (maintenance schedule, rent reminder)

## Verification

After running the seed file, verify the data:

```sql
-- Check all users and their roles
SELECT 
  p.email, 
  p.full_name, 
  STRING_AGG(ur.role::text, ', ') as roles
FROM auth.users u
JOIN profiles p ON p.id = u.id
LEFT JOIN user_roles ur ON ur.user_id = u.id
GROUP BY p.email, p.full_name
ORDER BY p.email;

-- Check properties summary
SELECT 
  p.name,
  COUNT(u.id) as total_units,
  COUNT(CASE WHEN u.status = 'occupied' THEN 1 END) as occupied,
  COUNT(CASE WHEN u.status = 'vacant' THEN 1 END) as vacant
FROM properties p
LEFT JOIN units u ON u.property_id = p.id
GROUP BY p.id, p.name
ORDER BY p.name;

-- Check payments summary
SELECT 
  COUNT(*) as total_payments,
  COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
  COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending,
  COUNT(CASE WHEN status = 'overdue' THEN 1 END) as overdue,
  SUM(CASE WHEN status = 'completed' THEN amount ELSE 0 END) as total_received
FROM payments;
```

## Login Credentials

After seeding, you can log in with:

| Email | Password | Role | Dashboard |
|-------|----------|------|-----------|
| admin@cribhub.com | Admin123! | Admin | Manager Dashboard |
| landlord1@cribhub.com | Landlord123! | Landlord | Landlord Dashboard |
| landlord2@cribhub.com | Landlord123! | Landlord | Landlord Dashboard |
| manager1@cribhub.com | Manager123! | Property Manager | Manager Dashboard |
| tenant1@cribhub.com | Tenant123! | Tenant | Tenant Portal |
| tenant2@cribhub.com | Tenant123! | Tenant | Tenant Portal |
| tenant3@cribhub.com | Tenant123! | Tenant | Tenant Portal |

## Customization

You can customize the seed data by:

1. **Adding more properties**: Copy the property INSERT statement and modify
2. **Adding more units**: Add more unit INSERT statements
3. **Changing amounts**: Modify rent amounts and payment amounts
4. **Adding dates**: Adjust lease dates and payment dates
5. **Changing statuses**: Modify unit statuses, payment statuses, etc.

## Troubleshooting

### "User not found" errors
- Make sure you've created all users in Auth Dashboard first
- Verify user IDs match between auth.users and your seed file

### "Foreign key constraint" errors
- Make sure all migrations have been run
- Check that parent records exist (properties before units, units before payments)

### "Duplicate key" errors
- Remove existing data first: `TRUNCATE TABLE table_name CASCADE;`
- Or use `ON CONFLICT DO NOTHING` clauses

## Clean Up

To remove all seed data:

```sql
-- WARNING: This will delete ALL data, not just seed data
-- Use with caution!

TRUNCATE TABLE 
  payments,
  maintenance_requests,
  rental_applications,
  rental_contracts,
  units,
  properties,
  communications,
  notices,
  role_requests,
  legal_documents
CASCADE;

-- Note: Users and profiles will remain unless you delete them from Auth Dashboard
```

## Next Steps

After seeding:
1. Log in with different user roles to test
2. Explore different dashboards
3. Test features like payments, maintenance requests, contracts
4. Add your own data as needed
