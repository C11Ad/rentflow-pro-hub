-- Add mortgage eligibility fields to units table for sale listings
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS mortgage_eligible boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS mortgage_partner text DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.units.mortgage_eligible IS 'Whether this unit is eligible for CribHub mortgage brokering';
COMMENT ON COLUMN public.units.mortgage_partner IS 'The mortgage partner (e.g., cribhub) if mortgage is available';