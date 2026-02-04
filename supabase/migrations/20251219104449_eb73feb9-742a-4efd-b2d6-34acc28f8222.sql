-- Add is_manual_entry column to payments table to track manual vs online payments
ALTER TABLE public.payments 
ADD COLUMN is_manual_entry boolean NOT NULL DEFAULT false;

-- Add payer_name column for manual entries where tenant may not be in system
ALTER TABLE public.payments 
ADD COLUMN payer_name text;

-- Add payer_phone column for manual entries
ALTER TABLE public.payments 
ADD COLUMN payer_phone text;

-- Comment for clarity
COMMENT ON COLUMN public.payments.is_manual_entry IS 'True if payment was manually recorded by landlord, false if recorded via online payment system';
COMMENT ON COLUMN public.payments.payer_name IS 'Name of payer for manual entries';
COMMENT ON COLUMN public.payments.payer_phone IS 'Phone number of payer for manual entries';