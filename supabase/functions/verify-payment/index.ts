import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface VerificationRequest {
  reference: string;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reference }: VerificationRequest = await req.json();

    console.log('Verifying payment:', reference);

    if (!reference) {
      throw new Error('Payment reference is required');
    }

    // Verify payment with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Paystack verification error:', data);
      throw new Error(data.message || 'Payment verification failed');
    }

    const transactionData = data.data;
    
    console.log('Payment verification result:', {
      reference: transactionData.reference,
      status: transactionData.status,
      amount: transactionData.amount / 100,
      channel: transactionData.channel,
    });

    return new Response(
      JSON.stringify({
        success: true,
        verified: transactionData.status === 'success',
        transaction: {
          reference: transactionData.reference,
          amount: transactionData.amount / 100, // Convert from kobo back to GHS
          status: transactionData.status,
          paid_at: transactionData.paid_at,
          channel: transactionData.channel, // Will show 'card' or 'mobile_money'
          currency: transactionData.currency,
          customer: {
            email: transactionData.customer.email,
          },
          metadata: transactionData.metadata,
        },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in verify-payment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false,
        verified: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
