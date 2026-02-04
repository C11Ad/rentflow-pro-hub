# Seed Database - Quick Commands

## Option 1: Using Supabase CLI with stdin

```bash
# Get user IDs
supabase db execute < supabase/get-user-ids.sql

# Run seed file (after updating UUIDs)
supabase db execute < supabase/seed.sql
```

## Option 2: Using Supabase Dashboard SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `supabase/seed.sql`
4. Replace the UUIDs with actual user IDs
5. Click "Run"

## Option 3: Using psql (if connected directly)

```bash
psql <connection-string> < supabase/seed.sql
```

## Quick Start

1. **Create users** in Supabase Auth Dashboard first
2. **Get user IDs**: 
   ```bash
   supabase db execute < supabase/get-user-ids.sql
   ```
3. **Update UUIDs** in `supabase/seed.sql` (lines 30-36)
4. **Run seed**:
   ```bash
   supabase db execute < supabase/seed.sql
   ```
