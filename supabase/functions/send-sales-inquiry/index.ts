import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SalesInquiryRequest {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  message: string;
}

// HTML escape function to prevent XSS/injection attacks
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Validate input length and format
function validateInput(value: string, maxLength: number, fieldName: string): { valid: boolean; error?: string } {
  if (value && value.length > maxLength) {
    return { valid: false, error: `${fieldName} exceeds maximum length of ${maxLength} characters` };
  }
  return { valid: true };
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { name, email, company, phone, message }: SalesInquiryRequest = await req.json();

    console.log("Processing sales inquiry from:", email);

    // Validate required fields
    if (!name || !email || !message) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: name, email, and message are required" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate input lengths
    const validations = [
      validateInput(name, 100, "Name"),
      validateInput(email, 255, "Email"),
      validateInput(company || "", 200, "Company"),
      validateInput(phone || "", 20, "Phone"),
      validateInput(message, 2000, "Message"),
    ];

    const invalidValidation = validations.find(v => !v.valid);
    if (invalidValidation) {
      return new Response(
        JSON.stringify({ error: invalidValidation.error }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate phone format if provided
    if (phone && !/^[\d\s\-\+\(\)]+$/.test(phone)) {
      return new Response(
        JSON.stringify({ error: "Invalid phone number format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Escape all user inputs before embedding in HTML
    const safeName = escapeHtml(name);
    const safeEmail = escapeHtml(email);
    const safeCompany = escapeHtml(company || "");
    const safePhone = escapeHtml(phone || "");
    const safeMessage = escapeHtml(message);

    // Send email to sales team with sanitized content
    const emailResponse = await resend.emails.send({
      from: "Cribhub Sales <onboarding@resend.dev>",
      to: ["support@cribhub-gh.com"],
      reply_to: email,
      subject: `New Sales Inquiry from ${safeName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0ea5e9; border-bottom: 2px solid #0ea5e9; padding-bottom: 10px;">
            New Sales Inquiry
          </h2>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #333;">Contact Information</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Name:</td>
                <td style="padding: 8px 0; color: #333;">${safeName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Email:</td>
                <td style="padding: 8px 0; color: #333;">${safeEmail}</td>
              </tr>
              ${safeCompany ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Company:</td>
                <td style="padding: 8px 0; color: #333;">${safeCompany}</td>
              </tr>
              ` : ''}
              ${safePhone ? `
              <tr>
                <td style="padding: 8px 0; font-weight: bold; color: #666;">Phone:</td>
                <td style="padding: 8px 0; color: #333;">${safePhone}</td>
              </tr>
              ` : ''}
            </table>
          </div>
          
          <div style="background-color: #fff; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #333;">Message</h3>
            <p style="color: #555; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
            <p>This inquiry was submitted via Cribhub sales contact form</p>
            <p>Reply directly to this email to respond to ${safeName}</p>
          </div>
        </div>
      `,
    });

    console.log("Sales inquiry email sent successfully:", emailResponse);

    // Send confirmation email to the customer with sanitized content
    await resend.emails.send({
      from: "Cribhub <onboarding@resend.dev>",
      to: [email],
      subject: "Thank you for contacting Cribhub Sales",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #0ea5e9;">Thank you for your interest!</h2>
          
          <p style="color: #555; line-height: 1.6;">Hi ${safeName},</p>
          
          <p style="color: #555; line-height: 1.6;">
            We've received your inquiry and our sales team will get back to you within 24 hours.
          </p>
          
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666; font-size: 14px;">
              <strong>Your message:</strong>
            </p>
            <p style="color: #555; line-height: 1.6; margin-top: 10px; white-space: pre-wrap;">${safeMessage}</p>
          </div>
          
          <p style="color: #555; line-height: 1.6;">
            In the meantime, feel free to explore our platform and learn more about how Cribhub can help streamline your property management operations.
          </p>
          
          <p style="color: #555; line-height: 1.6;">
            Best regards,<br>
            <strong>The Cribhub Team</strong>
          </p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0; color: #999; font-size: 12px; text-align: center;">
            <p>Cribhub - Effortless Property Management That Scales</p>
          </div>
        </div>
      `,
    });

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Your inquiry has been sent successfully" 
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-sales-inquiry function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send inquiry. Please try again later."
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
