import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ContractRequest {
  application_id: string;
  unit_id: string;
  tenant_id: string;
  landlord_id: string;
  monthly_rent: number;
  rent_currency: string;
  property_address: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const {
      application_id,
      unit_id,
      tenant_id,
      landlord_id,
      monthly_rent,
      rent_currency,
      property_address,
    }: ContractRequest = await req.json();

    // Fetch tenant and landlord details
    const { data: tenant } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", tenant_id)
      .single();

    const { data: landlord } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", landlord_id)
      .single();

    // Generate contract using Lovable AI
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    
    const prompt = `Generate a professional residential rental agreement contract for the following property.

FORMATTING RULES (CRITICAL):
- Use UPPERCASE for section headings (e.g., "SECTION 1: PREMISES")
- Number all sections sequentially (1, 2, 3...)
- Use sub-numbering for clauses (1.1, 1.2, 2.1, etc.)
- Do NOT use any markdown formatting (no #, **, *, bullet symbols)
- Use plain text only with clear paragraph spacing
- Use "---" on its own line between major sections
- Format currency amounts with commas and two decimal places
- Keep lines under 90 characters for readability

DOCUMENT HEADER:
CRIBHUB PROPERTY MANAGEMENT
RESIDENTIAL RENTAL AGREEMENT
Facilitated by CribHub Property Management Platform

PROPERTY AND PARTY DETAILS:
Property Address: ${property_address}
Monthly Rent: ${rent_currency} ${monthly_rent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
Landlord: ${landlord?.full_name} (${landlord?.email})
Tenant: ${tenant?.full_name} (${tenant?.email})
Commencement Date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
Lease Duration: 12 months

Include these sections in order:
1. PARTIES TO THE AGREEMENT - Full details of landlord and tenant
2. PREMISES - Property address and description
3. TERM OF LEASE - Start date, duration, renewal terms
4. RENT AND PAYMENT - Amount, due dates, late fees, accepted methods
5. SECURITY DEPOSIT - Amount, conditions for return, timeline
6. TENANT OBLIGATIONS - Care of property, restrictions, compliance
7. LANDLORD OBLIGATIONS - Maintenance, repairs, habitability
8. MAINTENANCE AND REPAIRS - Reporting procedures, responsibilities
9. TERMINATION AND RENEWAL - Notice periods, conditions
10. GOVERNING LAW - Applicable jurisdiction
11. SIGNATURES - Landlord, Tenant, and Witness signature blocks with date lines

DOCUMENT FOOTER:
This agreement was facilitated through CribHub Property Management Platform
www.cribhub.com | support@cribhub.com`;

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: "You are a legal document expert for CribHub Property Management. Generate professional, legally sound contracts using plain text only — no markdown syntax (no #, **, *, etc.). Use UPPERCASE for section headings, numbered sections (1, 2, 3...), and sub-numbered clauses (1.1, 1.2...). Format all currency amounts with commas and two decimal places. Always include CribHub branding in header and footer.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    });

    if (!aiResponse.ok) {
      if (aiResponse.status === 429) {
        throw new Error("Rate limit exceeded. Please try again later.");
      }
      if (aiResponse.status === 402) {
        throw new Error("AI credits depleted. Please add funds to continue.");
      }
      throw new Error(`AI Gateway error: ${aiResponse.statusText}`);
    }

    const aiData = await aiResponse.json();
    const contractContent = aiData.choices[0].message.content;

    // Calculate lease dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1); // 1 year lease

    // Save contract to database
    const { data: contract, error: contractError } = await supabase
      .from("rental_contracts")
      .insert({
        unit_id,
        tenant_id,
        landlord_id,
        monthly_rent,
        rent_currency,
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        content: contractContent,
        status: "pending_signature",
        contract_type: "ai_generated",
      })
      .select()
      .single();

    if (contractError) throw contractError;

    console.log("Contract generated successfully:", contract.id);

    return new Response(
      JSON.stringify({
        success: true,
        contract_id: contract.id,
        message: "Contract generated successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("Error generating contract:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
