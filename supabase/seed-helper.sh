#!/bin/bash

# Helper script to seed Supabase database
# This script helps you get user IDs and run the seed file

echo "🌱 CribHub Database Seeding Helper"
echo "===================================="
echo ""

# Check if Supabase is linked
if ! supabase projects list &>/dev/null; then
  echo "⚠️  Supabase CLI is not linked to a project."
  echo "   Linking to project: wqtnmwuvpkvcwttxdgvv"
  supabase link --project-ref wqtnmwuvpkvcwttxdgvv
fi

echo ""
echo "Step 1: Getting user IDs from database..."
echo "-------------------------------------------"
echo ""
echo "Run this query in Supabase SQL Editor to get user IDs:"
echo ""
cat supabase/get-user-ids.sql
echo ""
echo ""
echo "OR run directly:"
echo "  supabase db execute < supabase/get-user-ids.sql"
echo ""
read -p "Have you updated the UUIDs in supabase/seed.sql? (y/n) " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo ""
  echo "Step 2: Running seed file..."
  echo "------------------------------"
  supabase db execute < supabase/seed.sql
  echo ""
  echo "✅ Seed complete!"
else
  echo ""
  echo "⚠️  Please update the UUIDs in supabase/seed.sql first."
  echo "   See supabase/SEED_INSTRUCTIONS.md for details."
fi
