# Quick Seed Guide - Fixed Version

The seed file now **automatically looks up user IDs by email**, so you don't need to manually update UUIDs!

## Steps

### 1. Create Users in Supabase Auth Dashboard

Go to **Authentication → Users → Add User** and create:

- `admin@cribhub.com` / Password: `Admin123!`
- `landlord1@cribhub.com` / Password: `Landlord123!`
- `landlord2@cribhub.com` / Password: `Landlord123!`
- `manager1@cribhub.com` / Password: `Manager123!`
- `tenant1@cribhub.com` / Password: `Tenant123!`
- `tenant2@cribhub.com` / Password: `Tenant123!`
- `tenant3@cribhub.com` / Password: `Tenant123!`

### 2. Run Seed File

```bash
supabase db execute < supabase/seed.sql
```

That's it! The seed file will:
- ✅ Automatically find user IDs by email
- ✅ Validate that all users exist
- ✅ Create all seed data

## What Gets Created

- ✅ 3 Properties (Sunset Gardens, Osu Home, East Legon Condos)
- ✅ 7 Units (occupied, vacant, maintenance)
- ✅ 10 Payments (completed, pending, overdue)
- ✅ 2 Rental Contracts
- ✅ 4 Maintenance Requests
- ✅ 2 Rental Applications
- ✅ Role Requests, Communications, Notices

## If You Get Errors

**"User X not found"** → Create that user in Auth Dashboard first

**"Foreign key constraint"** → Make sure all migrations have been run

**Other errors** → Check that all users exist and profiles were created automatically
