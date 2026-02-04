-- Add columns to units table to support manual tenant entries
ALTER TABLE public.units 
ADD COLUMN is_manual_tenant boolean NOT NULL DEFAULT false,
ADD COLUMN manual_tenant_name text,
ADD COLUMN manual_tenant_email text,
ADD COLUMN manual_tenant_phone text;

-- Add comment for documentation
COMMENT ON COLUMN public.units.is_manual_tenant IS 'True if tenant was manually added by landlord rather than having an online account';
COMMENT ON COLUMN public.units.manual_tenant_name IS 'Name of manually added tenant (not linked to profiles)';
COMMENT ON COLUMN public.units.manual_tenant_email IS 'Email of manually added tenant (not linked to profiles)';
COMMENT ON COLUMN public.units.manual_tenant_phone IS 'Phone of manually added tenant (not linked to profiles)';