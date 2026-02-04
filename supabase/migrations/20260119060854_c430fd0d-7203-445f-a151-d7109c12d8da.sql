-- Create storage bucket for verification documents (National IDs)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'verification-documents', 
  'verification-documents', 
  false, 
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: Allow authenticated users to upload their own verification documents
CREATE POLICY "Users can upload their own verification documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'verification-documents' 
  AND auth.role() = 'authenticated'
);

-- Storage policy: Allow property owners/managers to view verification documents
CREATE POLICY "Property owners can view verification documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'verification-documents'
  AND (
    has_role(auth.uid(), 'landlord'::app_role) 
    OR has_role(auth.uid(), 'property_manager'::app_role)
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);

-- Add amenities field for better property descriptions (if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'properties' 
    AND column_name = 'amenities'
  ) THEN
    ALTER TABLE public.properties ADD COLUMN amenities text[] DEFAULT '{}';
  END IF;
END $$;