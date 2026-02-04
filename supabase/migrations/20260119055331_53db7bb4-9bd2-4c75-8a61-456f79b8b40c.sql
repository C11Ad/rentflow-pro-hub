-- Create virtual viewing requests table
CREATE TABLE public.virtual_viewing_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_id UUID REFERENCES public.units(id) ON DELETE CASCADE,
  requester_name TEXT NOT NULL,
  requester_email TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  preferred_date DATE NOT NULL,
  preferred_time TEXT NOT NULL,
  listing_type TEXT NOT NULL CHECK (listing_type IN ('rental', 'sale')),
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.virtual_viewing_requests ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert viewing requests (public feature)
CREATE POLICY "Anyone can create viewing requests"
ON public.virtual_viewing_requests
FOR INSERT
WITH CHECK (true);

-- Allow property owners to view their viewing requests
CREATE POLICY "Property owners can view their viewing requests"
ON public.virtual_viewing_requests
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = virtual_viewing_requests.property_id
    AND p.landlord_id = auth.uid()
  )
);

-- Allow property owners to update viewing requests
CREATE POLICY "Property owners can update viewing requests"
ON public.virtual_viewing_requests
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.properties p
    WHERE p.id = virtual_viewing_requests.property_id
    AND p.landlord_id = auth.uid()
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_virtual_viewing_requests_updated_at
BEFORE UPDATE ON public.virtual_viewing_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add listing_type column to units for sale vs rental
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS listing_type TEXT DEFAULT 'rental' CHECK (listing_type IN ('rental', 'sale'));

-- Add sale_price column for properties for sale
ALTER TABLE public.units 
ADD COLUMN IF NOT EXISTS sale_price NUMERIC;