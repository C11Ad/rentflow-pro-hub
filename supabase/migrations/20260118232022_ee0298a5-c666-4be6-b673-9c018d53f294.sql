-- Add images column to units table for storing unit photos
ALTER TABLE public.units ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- Add a comment to document the requirement
COMMENT ON COLUMN public.units.images IS 'Required: 5 photos (exterior and interior) of the unit';