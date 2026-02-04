# Roles System Guide

## Available Roles

The CribHub system has **4 user roles**:

### 1. **Admin** (`admin`)
- **Full System Access**
- Can manage all users and roles
- Can view all properties, units, payments, and data
- Can approve/reject all role requests
- Has access to all dashboards and features
- **Dashboard**: Manager Dashboard (`/manager-dashboard`)

### 2. **Landlord** (`landlord`)
- **Property Owner**
- Can create and manage their own properties
- Can create units within their properties
- Can view and manage payments for their properties
- Can approve rental applications
- Can create contracts
- Can manage maintenance requests for their properties
- Can send communications and notices
- **Dashboard**: Landlord Dashboard (`/landlord-dashboard`)

### 3. **Property Manager** (`property_manager`)
- **Property Management Professional**
- Can view all properties (but not manage them directly)
- Can view and update units across properties
- Can view all payments
- Can manage maintenance requests
- Can view all contracts and legal documents
- **Dashboard**: Manager Dashboard (`/manager-dashboard`)

### 4. **Tenant** (`tenant`)
- **Renter**
- Default role assigned to all new signups
- Can view their own unit(s)
- Can make rent payments
- Can submit maintenance requests
- Can view their rental contracts
- Can apply for units
- **Dashboard**: Tenant Portal (`/tenant-portal`)

---

## Role Assignment Flow

### Automatic Assignment
- **New users** are automatically assigned `tenant` role via database trigger
- This happens when they sign up through Supabase Auth

### Manual Assignment (Admin Only)
- **Admins** can assign any role to any user via the database
- Admins can also use the Verification Management page to approve role requests

### Role Requests (Verification Required)
- **Landlord** and **Property Manager** roles require verification
- Users submit role requests through the signup flow
- Admins or Landlords approve/reject these requests

---

## Multi-Role Support

Users can have **multiple roles** simultaneously:
- A user can be both a `landlord` and a `tenant` (e.g., owns property but also rents)
- A user can be an `admin` with additional roles
- Each role is stored separately in `user_roles` table

---

## Seed Data Roles

The seed data creates users with these roles:

| Email | Role | Purpose |
|-------|------|---------|
| admin@cribhub.com | `admin` | Full system administrator |
| landlord1@cribhub.com | `landlord` | Property owner (Sunset Gardens, Osu Home) |
| landlord2@cribhub.com | `landlord` | Property owner (East Legon Condos) |
| manager1@cribhub.com | `property_manager` | Property management professional |
| tenant1@cribhub.com | `tenant` | Renter (Unit 1A) |
| tenant2@cribhub.com | `tenant` | Renter (Unit 2B) |
| tenant3@cribhub.com | `tenant` | Renter (Osu Family Home) |

---

## Role Permissions Matrix

| Feature | Admin | Landlord | Property Manager | Tenant |
|---------|-------|----------|------------------|--------|
| View own profile | ✅ | ✅ | ✅ | ✅ |
| View all profiles | ✅ | ❌ | ❌ | ❌ |
| Manage properties | ✅ | ✅ (own) | ❌ | ❌ |
| View all properties | ✅ | ✅ (own) | ✅ | ❌ |
| Manage units | ✅ | ✅ (own properties) | ✅ (update only) | ❌ |
| View own units | ✅ | ✅ | ✅ | ✅ |
| Create payments | ✅ | ✅ (own properties) | ❌ | ✅ (own) |
| View payments | ✅ | ✅ (own properties) | ✅ | ✅ (own) |
| Approve applications | ✅ | ✅ (own properties) | ❌ | ❌ |
| Manage contracts | ✅ | ✅ (own properties) | ✅ (view only) | ✅ (own) |
| Manage maintenance | ✅ | ✅ (own properties) | ✅ | ✅ (own) |
| Manage roles | ✅ | ❌ | ❌ | ❌ |
| View role requests | ✅ | ✅ (property_manager only) | ❌ | ❌ |

---

## Creating Admin User Manually

To create an admin user in your database:

```sql
-- First, create the user in Supabase Auth Dashboard
-- Then run this SQL (replace USER_ID with actual user ID):

INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID_HERE', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify:
SELECT p.email, ur.role
FROM auth.users u
JOIN profiles p ON p.id = u.id
JOIN user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'admin';
```

---

## Role Request Workflow

1. **User Signs Up** → Automatically gets `tenant` role
2. **User Requests Higher Role** → Creates entry in `role_requests` table
3. **Admin/Landlord Reviews** → Views request on Verification Management page
4. **Admin/Landlord Approves** → Role is assigned, request marked as approved
5. **User Gets Access** → Can now access role-specific features

---

## Changing Roles in Seed Data

To modify roles in the seed file:

```sql
-- Remove a role
DELETE FROM public.user_roles 
WHERE user_id = 'USER_ID' AND role = 'old_role';

-- Add a role
INSERT INTO public.user_roles (user_id, role)
VALUES ('USER_ID', 'new_role')
ON CONFLICT (user_id, role) DO NOTHING;
```

---

## Testing Different Roles

Use these test accounts (after seeding):

| Role | Email | Password | What to Test |
|------|-------|----------|--------------|
| Admin | admin@cribhub.com | Admin123! | Full system access, role management |
| Landlord | landlord1@cribhub.com | Landlord123! | Property management, payments, applications |
| Manager | manager1@cribhub.com | Manager123! | View all properties, manage maintenance |
| Tenant | tenant1@cribhub.com | Tenant123! | View unit, make payments, submit requests |

---

## Troubleshooting Roles

### User can't access dashboard
- Check if user has a role assigned: `SELECT * FROM user_roles WHERE user_id = 'USER_ID';`
- Verify role in frontend: Check browser console for auth context

### Role assignment fails
- Make sure user exists in `auth.users` first
- Check RLS policies aren't blocking the insert
- Verify the role enum value is correct

### Multiple roles not working
- Check that both roles exist in `user_roles` table
- Verify `AuthContext` fetches all roles (it should use most recent)
