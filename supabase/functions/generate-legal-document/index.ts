import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.86.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DocumentRequest {
  documentType: string;
  location: string;
  parties: {
    landlordName: string;
    landlordAddress: string;
    tenantName: string;
    tenantAddress: string;
  };
  property: {
    address: string;
    description: string;
    rentAmount: number;
    currency: string;
  };
  terms: {
    startDate: string;
    endDate?: string;
    duration?: string;
    paymentDue: string;
    securityDeposit?: number;
    additionalTerms?: string;
  };
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    // Verify the user
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: DocumentRequest = await req.json();
    console.log('Document generation request:', { 
      documentType: requestData.documentType, 
      location: requestData.location,
      userId: user.id 
    });

    // Build the AI prompt based on document type and location
    const systemPrompt = `You are a professional legal document generator for CribHub Property Management platform, specialized in property rental and tenancy agreements.

IMPORTANT FORMATTING REQUIREMENTS:
- Use UPPERCASE for section headings (e.g., "SECTION 1: PARTIES TO THE AGREEMENT")
- Number all major sections sequentially (1, 2, 3...)
- Use sub-numbering for clauses (1.1, 1.2, 2.1, etc.)
- Use clear paragraph breaks between sections
- Do NOT use markdown formatting (no #, **, *, etc.)
- Use plain text only — no markdown syntax whatsoever
- Write in clean, well-spaced paragraphs
- Use "---" on its own line to separate major document sections
- Keep lines under 90 characters for readability

IMPORTANT BRANDING REQUIREMENTS:
- Start the document with:
  "CRIBHUB PROPERTY MANAGEMENT"
  "Facilitated by CribHub Property Management Platform"
- End the document with:
  "This document was generated through CribHub Property Management Platform"
  "www.cribhub.com | support@cribhub.com"

CRITICAL: Generate this document in strict compliance with the tenancy laws, rental regulations, and legal requirements of ${requestData.location}.

For ${requestData.location}, include:
1. All mandatory clauses required by local tenancy/rental laws
2. Proper legal terminology and references specific to ${requestData.location}
3. Required statutory notices and disclosures
4. Landlord and tenant rights as defined by law
5. Proper eviction procedures and notice periods
6. Security deposit limits and return requirements
7. Maintenance and repair obligations
8. Rent control or increase limitations if applicable
9. Dispute resolution mechanisms

Structure the document with these sections:
- Document title and date
- Parties identification with full details
- Property description
- Financial terms (rent, deposits, fees) with amounts formatted using commas and two decimal places
- Duration and renewal terms
- Rights and obligations of both parties
- Termination clauses
- Signature blocks for all parties
- Witness sections if required by ${requestData.location} law

Use formal legal language appropriate for ${requestData.location} jurisdiction.`;

    const userPrompt = buildDocumentPrompt(requestData);

    // Call Lovable AI Gateway
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI Gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), 
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }), 
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const aiResponse = await response.json();
    const generatedContent = aiResponse.choices[0].message.content;
    
    console.log('Document generated successfully');

    // Save the document to the database
    const { data: document, error: dbError } = await supabase
      .from('legal_documents')
      .insert({
        user_id: user.id,
        document_type: mapDocumentType(requestData.documentType),
        title: generateDocumentTitle(requestData),
        content: generatedContent,
        location: requestData.location,
        metadata: {
          parties: requestData.parties,
          property: requestData.property,
          terms: requestData.terms,
        },
        status: 'generated',
      })
      .select()
      .single();

    if (dbError) {
      console.error('Database error:', dbError);
      throw new Error('Failed to save document');
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        document: {
          id: document.id,
          content: generatedContent,
          title: document.title,
          created_at: document.created_at,
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in generate-legal-document:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error occurred' 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});

function buildDocumentPrompt(request: DocumentRequest): string {
  const { documentType, parties, property, terms } = request;
  
  return `Generate a ${documentType} for a property located in ${request.location}.

═══════════════════════════════════════════════════════════════
                         CRIBHUB
              Property Management Platform
═══════════════════════════════════════════════════════════════

JURISDICTION: ${request.location}
DOCUMENT TYPE: ${documentType}
═══════════════════════════════════════════════════════════════

PARTIES TO THE AGREEMENT:

LANDLORD/LESSOR:
Full Name: ${parties.landlordName}
Address: ${parties.landlordAddress || 'To be provided'}

TENANT/LESSEE:
Full Name: ${parties.tenantName}
Address: ${parties.tenantAddress || 'To be provided'}

PROPERTY DETAILS:
Full Address: ${property.address}
Description: ${property.description || 'Residential property'}

FINANCIAL TERMS:
Monthly Rent: ${property.currency} ${property.rentAmount.toLocaleString()}
${terms.securityDeposit ? `Security Deposit: ${property.currency} ${terms.securityDeposit.toLocaleString()}` : 'Security Deposit: As per local regulations'}
Payment Due Date: ${terms.paymentDue}

LEASE DURATION:
Commencement Date: ${terms.startDate}
${terms.endDate ? `Expiration Date: ${terms.endDate}` : `Duration: ${terms.duration || 'Month-to-month / Periodic Tenancy'}`}

${terms.additionalTerms ? `SPECIAL CONDITIONS:\n${terms.additionalTerms}` : ''}

═══════════════════════════════════════════════════════════════
IMPORTANT: This document MUST comply with all applicable laws, regulations, and legal requirements of ${request.location}. Include all mandatory clauses, statutory notices, and required disclosures specific to ${request.location} tenancy law.

BRANDING: Include "Facilitated by CribHub Property Management" in the header and "Generated through CribHub - www.cribhub.com" in the footer.
═══════════════════════════════════════════════════════════════`;
}

function mapDocumentType(type: string): string {
  const typeMap: Record<string, string> = {
    'Lease Agreement': 'lease_agreement',
    'Renewal Notice': 'renewal_notice',
    'Termination Notice': 'termination_notice',
    'Eviction Notice': 'eviction_notice',
    'Rent Increase Notice': 'rent_increase_notice',
    'Maintenance Notice': 'maintenance_notice',
    'Custom Agreement': 'custom_agreement',
  };
  return typeMap[type] || 'custom_agreement';
}

function generateDocumentTitle(request: DocumentRequest): string {
  return `${request.documentType} - ${request.parties.tenantName} - ${request.property.address}`;
}