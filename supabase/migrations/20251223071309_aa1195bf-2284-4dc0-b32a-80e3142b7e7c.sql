-- Add columns to maintenance_requests for property-wide maintenance and cost tracking
ALTER TABLE public.maintenance_requests 
ADD COLUMN IF NOT EXISTS is_property_wide boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS cost_amount numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cost_currency text DEFAULT 'GHS',
ADD COLUMN IF NOT EXISTS cost_paid_by text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS cost_notes text DEFAULT NULL;