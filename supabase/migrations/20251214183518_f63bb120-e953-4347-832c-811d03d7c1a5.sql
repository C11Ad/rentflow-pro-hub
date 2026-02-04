-- Add default_currency column to profiles table for landlord currency control
ALTER TABLE public.profiles 
ADD COLUMN default_currency text NOT NULL DEFAULT 'GHS';

-- Add comment for clarity
COMMENT ON COLUMN public.profiles.default_currency IS 'Default operating currency for landlord accounts (e.g., GHS, USD, EUR, GBP, NGN)';