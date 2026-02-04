-- Create storage bucket for unit images
INSERT INTO storage.buckets (id, name, public) VALUES ('unit-images', 'unit-images', true);

-- Create RLS policies for unit images bucket
CREATE POLICY "Landlords can upload unit images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'unit-images' 
  AND auth.role() = 'authenticated'
);

CREATE POLICY "Landlords can update their unit images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'unit-images' AND auth.role() = 'authenticated');

CREATE POLICY "Landlords can delete their unit images"
ON storage.objects FOR DELETE
USING (bucket_id = 'unit-images' AND auth.role() = 'authenticated');

CREATE POLICY "Unit images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'unit-images');