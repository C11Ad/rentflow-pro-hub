# Create Test Users for Seeding

Before running the seed file, you need to create these users in Supabase Auth.

## Option 1: Using Supabase Dashboard (Easiest)

1. Go to your Supabase project dashboard
2. Navigate to **Authentication → Users**
3. Click **"Add User"** (or **"Create User"**)
4. Create each user with these credentials:

### Users to Create:

| Email | Password | Role |
|-------|----------|------|
| admin@cribhub.com | Admin123! | Will be assigned 'admin' |
| landlord1@cribhub.com | Landlord123! | Will be assigned 'landlord' |
| landlord2@cribhub.com | Landlord123! | Will be assigned 'landlord' |
| manager1@cribhub.com | Manager123! | Will be assigned 'property_manager' |
| tenant1@cribhub.com | Tenant123! | Will be assigned 'tenant' |
| tenant2@cribhub.com | Tenant123! | Will be assigned 'tenant' |
| tenant3@cribhub.com | Tenant123! | Will be assigned 'tenant' |

**Note:** When creating users, you can leave "Email Confirmed" checked since these are test users.

## Option 2: Using Supabase CLI

If you have the Supabase CLI set up, you can create users via the management API. However, the easiest way is through the dashboard.

## Option 3: Create Users via Signup Flow

You can also use your app's signup flow to create the users, but make sure to use the exact emails listed above.

## After Creating Users

Once all 7 users are created, run:

```bash
supabase db execute < supabase/seed.sql
```

The seed file will automatically find these users by email and create all the seed data.
