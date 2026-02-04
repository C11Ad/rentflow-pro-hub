-- Create properties table
CREATE TABLE public.properties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  property_type TEXT NOT NULL, -- apartment, house, condo, etc
  total_units INTEGER NOT NULL DEFAULT 1,
  description TEXT,
  amenities TEXT[],
  images TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create units table (for multi-unit properties)
CREATE TABLE public.units (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  unit_number TEXT NOT NULL,
  bedrooms INTEGER NOT NULL,
  bathrooms NUMERIC(3,1) NOT NULL,
  square_feet INTEGER,
  rent_amount NUMERIC(10,2) NOT NULL,
  rent_currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL DEFAULT 'vacant', -- vacant, occupied, maintenance
  tenant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  lease_start DATE,
  lease_end DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(property_id, unit_number)
);

-- Create rental applications table
CREATE TABLE public.rental_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  application_data JSONB NOT NULL, -- stores all application form data
  documents TEXT[], -- URLs to uploaded documents
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create maintenance requests table
CREATE TABLE public.maintenance_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL, -- plumbing, electrical, hvac, etc
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT NOT NULL DEFAULT 'pending', -- pending, in_progress, completed
  images TEXT[],
  assigned_to UUID REFERENCES auth.users(id),
  estimated_completion DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create contracts table
CREATE TABLE public.rental_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  landlord_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL DEFAULT 'ai_generated', -- ai_generated, manual_upload
  content TEXT, -- AI-generated contract content
  document_url TEXT, -- URL for manually uploaded contract
  status TEXT NOT NULL DEFAULT 'draft', -- draft, sent, signed, active, expired
  landlord_signed_at TIMESTAMP WITH TIME ZONE,
  tenant_signed_at TIMESTAMP WITH TIME ZONE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  monthly_rent NUMERIC(10,2) NOT NULL,
  rent_currency TEXT NOT NULL DEFAULT 'USD',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;

-- Properties RLS policies
CREATE POLICY "Landlords can manage their own properties"
ON public.properties FOR ALL
USING (auth.uid() = landlord_id);

CREATE POLICY "Property managers can view assigned properties"
ON public.properties FOR SELECT
USING (
  has_role(auth.uid(), 'property_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Units RLS policies
CREATE POLICY "Landlords can manage units in their properties"
ON public.units FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.properties
    WHERE properties.id = units.property_id
    AND properties.landlord_id = auth.uid()
  )
);

CREATE POLICY "Tenants can view their own units"
ON public.units FOR SELECT
USING (auth.uid() = tenant_id);

CREATE POLICY "Property managers can view and update units"
ON public.units FOR SELECT
USING (
  has_role(auth.uid(), 'property_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Property managers can update units"
ON public.units FOR UPDATE
USING (
  has_role(auth.uid(), 'property_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Rental applications RLS policies
CREATE POLICY "Applicants can create and view their applications"
ON public.rental_applications FOR INSERT
WITH CHECK (auth.uid() = applicant_id);

CREATE POLICY "Applicants can view their own applications"
ON public.rental_applications FOR SELECT
USING (auth.uid() = applicant_id);

CREATE POLICY "Landlords can view applications for their properties"
ON public.rental_applications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.units
    JOIN public.properties ON properties.id = units.property_id
    WHERE units.id = rental_applications.unit_id
    AND properties.landlord_id = auth.uid()
  )
);

CREATE POLICY "Landlords can update applications for their properties"
ON public.rental_applications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.units
    JOIN public.properties ON properties.id = units.property_id
    WHERE units.id = rental_applications.unit_id
    AND properties.landlord_id = auth.uid()
  )
);

-- Maintenance requests RLS policies
CREATE POLICY "Tenants can create and view their maintenance requests"
ON public.maintenance_requests FOR INSERT
WITH CHECK (auth.uid() = tenant_id);

CREATE POLICY "Tenants can view their own maintenance requests"
ON public.maintenance_requests FOR SELECT
USING (auth.uid() = tenant_id);

CREATE POLICY "Landlords can view maintenance requests for their properties"
ON public.maintenance_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.units
    JOIN public.properties ON properties.id = units.property_id
    WHERE units.id = maintenance_requests.unit_id
    AND properties.landlord_id = auth.uid()
  )
);

CREATE POLICY "Property managers can view and manage maintenance requests"
ON public.maintenance_requests FOR ALL
USING (
  has_role(auth.uid(), 'property_manager'::app_role) OR
  has_role(auth.uid(), 'admin'::app_role)
);

-- Rental contracts RLS policies
CREATE POLICY "Landlords can manage contracts for their properties"
ON public.rental_contracts FOR ALL
USING (auth.uid() = landlord_id);

CREATE POLICY "Tenants can view their own contracts"
ON public.rental_contracts FOR SELECT
USING (auth.uid() = tenant_id);

CREATE POLICY "Tenants can update their own contracts for signing"
ON public.rental_contracts FOR UPDATE
USING (auth.uid() = tenant_id);

-- Create triggers for updated_at
CREATE TRIGGER update_properties_updated_at
BEFORE UPDATE ON public.properties
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_units_updated_at
BEFORE UPDATE ON public.units
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_applications_updated_at
BEFORE UPDATE ON public.rental_applications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_maintenance_requests_updated_at
BEFORE UPDATE ON public.maintenance_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_rental_contracts_updated_at
BEFORE UPDATE ON public.rental_contracts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();