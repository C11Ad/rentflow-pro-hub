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
    
    const prompt = `Generate a professional rental agreement contract with CribHub branding for the following property:

═══════════════════════════════════════════════════════════════
                         CRIBHUB
              Property Management Platform
═══════════════════════════════════════════════════════════════

Property Address: ${property_address}
Monthly Rent: ${rent_currency} ${monthly_rent}
Landlord: ${landlord?.full_name} (${landlord?.email})
Tenant: ${tenant?.full_name} (${tenant?.email})
Start Date: ${new Date().toLocaleDateString()}
Lease Duration: 12 months

IMPORTANT: This contract is being generated through CribHub Property Management platform. 
Include "Facilitated by CribHub Property Management" in the document header.

Please create a comprehensive rental agreement that includes:
1. CribHub document header with "RESIDENTIAL RENTAL AGREEMENT"
2. Parties involved (landlord and tenant details)
3. Property description and address
4. Lease term (start date and duration)
5. Rent amount and payment terms
6. Security deposit details
7. Tenant responsibilities
8. Landlord responsibilities
9. Maintenance and repairs
10. Termination clause
11. Signatures section with spaces for:
    - Landlord signature and date
    - Tenant signature and date
    - Witness signatures (if applicable)
12. CribHub footer with: "This agreement was facilitated through CribHub Property Management Platform - www.cribhub.com"

Format the contract professionally with proper headings and legal language appropriate for a residential rental agreement.`;

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
            content: "You are a legal document expert for CribHub Property Management. Generate professional, legally sound contracts that include CribHub branding. Always include 'Facilitated by CribHub' in documents and add the CribHub footer: 'www.cribhub.com | support@cribhub.com'",
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
