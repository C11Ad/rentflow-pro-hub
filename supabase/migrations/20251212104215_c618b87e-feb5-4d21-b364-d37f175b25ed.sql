-- Create payments table for tracking rent payments
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  unit_id UUID NOT NULL REFERENCES public.units(id) ON DELETE CASCADE,
  tenant_id UUID NOT NULL,
  landlord_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT DEFAULT 'cash',
  reference_number TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- Landlords can manage payments for their properties
CREATE POLICY "Landlords can manage payments for their properties"
ON public.payments
FOR ALL
USING (auth.uid() = landlord_id);

-- Tenants can view their own payments
CREATE POLICY "Tenants can view their own payments"
ON public.payments
FOR SELECT
USING (auth.uid() = tenant_id);

-- Property managers can view payments
CREATE POLICY "Property managers can view payments"
ON public.payments
FOR SELECT
USING (has_role(auth.uid(), 'property_manager') OR has_role(auth.uid(), 'admin'));

-- Create trigger for updated_at
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();