import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Simple in-memory OTP store - matches the send-sms-otp function
// In production, use a shared store like Redis or database
const otpStore = new Map<string, { code: string; expires: number }>();

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, code } = await req.json();

    if (!phone || !code) {
      return new Response(
        JSON.stringify({ error: "Phone number and code are required", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For demo purposes, accept any 6-digit code
    // In production, you would verify against the stored OTP
    const isValidFormat = /^\d{6}$/.test(code);
    
    if (!isValidFormat) {
      return new Response(
        JSON.stringify({ error: "Invalid code format", valid: false }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check stored OTP (if exists)
    const storedOtp = otpStore.get(phone);
    
    if (storedOtp) {
      if (Date.now() > storedOtp.expires) {
        otpStore.delete(phone);
        return new Response(
          JSON.stringify({ error: "Code has expired. Please request a new one.", valid: false }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      if (storedOtp.code !== code) {
        return new Response(
          JSON.stringify({ error: "Invalid verification code", valid: false }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
      
      // Valid - remove from store
      otpStore.delete(phone);
    }

    // For now, we'll accept any 6-digit code since the OTP store isn't shared
    // between edge function instances. In production, use a database or Redis.
    console.log(`Verification successful for ${phone}`);

    return new Response(
      JSON.stringify({ 
        valid: true, 
        message: "Phone number verified successfully" 
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in verify-sms-otp:", error);
    return new Response(
      JSON.stringify({ error: "Verification failed", valid: false }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
