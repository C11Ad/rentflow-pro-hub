-- Create enum for document types
CREATE TYPE public.document_type AS ENUM (
  'lease_agreement',
  'renewal_notice',
  'termination_notice',
  'eviction_notice',
  'rent_increase_notice',
  'maintenance_notice',
  'custom_agreement'
);

-- Create enum for document status
CREATE TYPE public.document_status AS ENUM (
  'draft',
  'generated',
  'signed',
  'archived'
);

-- Create legal_documents table
CREATE TABLE public.legal_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  document_type document_type NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  location TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  status document_status NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  parent_document_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  signed_at TIMESTAMP WITH TIME ZONE,
  signed_by UUID
);

-- Add foreign key to parent document for versioning
ALTER TABLE public.legal_documents
ADD CONSTRAINT legal_documents_parent_fkey 
FOREIGN KEY (parent_document_id) 
REFERENCES public.legal_documents(id) 
ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own documents
CREATE POLICY "Users can view their own documents"
ON public.legal_documents
FOR SELECT
USING (auth.uid() = user_id);

-- Landlords and property managers can view all documents
CREATE POLICY "Landlords and managers can view all documents"
ON public.legal_documents
FOR SELECT
USING (
  has_role(auth.uid(), 'landlord'::app_role) OR 
  has_role(auth.uid(), 'property_manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Users can create their own documents
CREATE POLICY "Users can create their own documents"
ON public.legal_documents
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own draft documents
CREATE POLICY "Users can update their own draft documents"
ON public.legal_documents
FOR UPDATE
USING (auth.uid() = user_id AND status = 'draft')
WITH CHECK (auth.uid() = user_id);

-- Landlords and managers can update all documents
CREATE POLICY "Landlords and managers can update documents"
ON public.legal_documents
FOR UPDATE
USING (
  has_role(auth.uid(), 'landlord'::app_role) OR 
  has_role(auth.uid(), 'property_manager'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Users can delete their own draft documents
CREATE POLICY "Users can delete their own draft documents"
ON public.legal_documents
FOR DELETE
USING (auth.uid() = user_id AND status = 'draft');

-- Create index for faster queries
CREATE INDEX idx_legal_documents_user_id ON public.legal_documents(user_id);
CREATE INDEX idx_legal_documents_status ON public.legal_documents(status);
CREATE INDEX idx_legal_documents_created_at ON public.legal_documents(created_at DESC);

-- Add trigger for updated_at
CREATE TRIGGER update_legal_documents_updated_at
BEFORE UPDATE ON public.legal_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();