import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const PAYSTACK_SECRET_KEY = Deno.env.get('PAYSTACK_SECRET_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PaymentRequest {
  email: string;
  amount: number;
  billId: string;
  billDescription: string;
  currency?: string; // Currency code (GHS, USD, EUR, GBP, NGN)
  paymentChannel?: string[]; // Optional: specify channels like ['card', 'mobile_money']
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, amount, billId, billDescription, currency, paymentChannel }: PaymentRequest = await req.json();

    console.log('Initializing payment:', { email, amount, billId, billDescription, currency });

    // Validate inputs
    if (!email || !amount || !billId) {
      throw new Error('Missing required fields: email, amount, or billId');
    }
    
    // Use provided currency or default to GHS
    const paymentCurrency = currency || 'GHS';

    // Initialize payment with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Paystack amount is in smallest unit (kobo/pesewas/cents)
        currency: paymentCurrency,
        reference: `RENT-${billId}-${Date.now()}`,
        callback_url: `${req.headers.get('origin')}/tenant-portal`,
        metadata: {
          bill_id: billId,
          bill_description: billDescription,
          currency: paymentCurrency,
          custom_fields: [
            {
              display_name: "Bill Description",
              variable_name: "bill_description",
              value: billDescription
            }
          ]
        },
        channels: paymentChannel || ['card', 'mobile_money', 'bank'], // Support all payment methods by default
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Paystack API error:', data);
      throw new Error(data.message || 'Payment initialization failed');
    }

    console.log('Payment initialized successfully:', data.data.reference);

    return new Response(
      JSON.stringify({
        success: true,
        authorization_url: data.data.authorization_url,
        access_code: data.data.access_code,
        reference: data.data.reference,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in initialize-payment function:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
