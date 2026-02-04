import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WelcomeEmailRequest {
  email: string;
  name: string;
  role: string;
}

// HTML escape function to prevent XSS
function escapeHtml(text: string): string {
  if (!text) return "";
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, role }: WelcomeEmailRequest = await req.json();

    console.log("Sending welcome email to:", email);

    // Validate required fields
    if (!email || !name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: email and name are required" }),
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

    // Sanitize inputs
    const safeName = escapeHtml(name);
    const safeRole = escapeHtml(role || "user");

    // Determine role-specific messaging
    const roleMessages: Record<string, { welcome: string; next: string }> = {
      tenant: {
        welcome: "You now have access to browse available properties and apply for units that match your needs.",
        next: "Start exploring available units and submit your first application today!",
      },
      landlord: {
        welcome: "Your landlord verification request has been submitted. Our team will review your application within 24-48 hours.",
        next: "Once verified, you'll have full access to list properties, manage tenants, and track rent payments.",
      },
      property_manager: {
        welcome: "Your property manager verification request has been submitted. Our team will review your application within 24-48 hours.",
        next: "Once verified, you'll be able to manage properties assigned to you by landlords.",
      },
    };

    const roleInfo = roleMessages[role] || roleMessages.tenant;

    // Send welcome email
    const emailResponse = await resend.emails.send({
      from: "Cribhub <support@cribhub-gh.com>",
      to: [email],
      subject: "🎉 Welcome to Cribhub - Your Account is Ready!",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7fa;">
          <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <!-- Header -->
            <div style="background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold;">
                🏠 Cribhub
              </h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">
                Effortless Property Management That Scales
              </p>
            </div>
            
            <!-- Main Content -->
            <div style="padding: 40px 30px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <div style="display: inline-block; background-color: #ecfdf5; border-radius: 50%; padding: 20px; margin-bottom: 20px;">
                  <span style="font-size: 48px;">🎉</span>
                </div>
                <h2 style="color: #1e293b; margin: 0 0 10px 0; font-size: 28px;">
                  Congratulations, ${safeName}!
                </h2>
                <p style="color: #64748b; margin: 0; font-size: 16px;">
                  Your Cribhub account has been successfully created
                </p>
              </div>
              
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 25px; margin-bottom: 25px;">
                <h3 style="color: #0ea5e9; margin: 0 0 15px 0; font-size: 18px;">
                  ✨ What's Next?
                </h3>
                <p style="color: #475569; margin: 0 0 15px 0; line-height: 1.6;">
                  ${roleInfo.welcome}
                </p>
                <p style="color: #475569; margin: 0; line-height: 1.6;">
                  ${roleInfo.next}
                </p>
              </div>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px 20px; margin-bottom: 25px;">
                <p style="color: #92400e; margin: 0; font-size: 14px;">
                  <strong>Account Type:</strong> ${safeRole.charAt(0).toUpperCase() + safeRole.slice(1).replace('_', ' ')}
                </p>
              </div>
              
              <!-- CTA Button -->
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://rentflow-pro-hub.lovable.app/dashboard" 
                   style="display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);">
                  Go to Dashboard →
                </a>
              </div>
              
              <!-- Features Grid -->
              <div style="margin-top: 30px;">
                <h3 style="color: #1e293b; margin: 0 0 20px 0; font-size: 16px; text-align: center;">
                  Why Cribhub?
                </h3>
                <table style="width: 100%; border-collapse: separate; border-spacing: 10px;">
                  <tr>
                    <td style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; width: 33%;">
                      <div style="font-size: 24px; margin-bottom: 8px;">📊</div>
                      <div style="color: #475569; font-size: 12px;">Real-time Analytics</div>
                    </td>
                    <td style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; width: 33%;">
                      <div style="font-size: 24px; margin-bottom: 8px;">💳</div>
                      <div style="color: #475569; font-size: 12px;">Easy Payments</div>
                    </td>
                    <td style="background-color: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; width: 33%;">
                      <div style="font-size: 24px; margin-bottom: 8px;">🔒</div>
                      <div style="color: #475569; font-size: 12px;">Secure & Reliable</div>
                    </td>
                  </tr>
                </table>
              </div>
            </div>
            
            <!-- Footer -->
            <div style="background-color: #1e293b; padding: 30px; text-align: center;">
              <p style="color: #94a3b8; margin: 0 0 15px 0; font-size: 14px;">
                Need help? We're here for you 24/7
              </p>
              <p style="margin: 0;">
                <a href="mailto:support@cribhub-gh.com" style="color: #0ea5e9; text-decoration: none; font-size: 14px;">
                  support@cribhub-gh.com
                </a>
              </p>
              <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #334155;">
                <p style="color: #64748b; margin: 0; font-size: 12px;">
                  © ${new Date().getFullYear()} Cribhub. All rights reserved.
                </p>
                <p style="color: #64748b; margin: 5px 0 0 0; font-size: 12px;">
                  Ghana's Premier Property Management Platform
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Welcome email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ 
        success: true,
        message: "Welcome email sent successfully" 
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
    console.error("Error in send-welcome-email function:", error);
    return new Response(
      JSON.stringify({ 
        error: "Failed to send welcome email"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
