import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { password, reason } = body;

    if (!password || typeof password !== "string" || password.length < 6) {
      return new Response(JSON.stringify({ error: "Password is required for verification" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate reason if provided
    const sanitizedReason = reason && typeof reason === "string" 
      ? reason.slice(0, 500).replace(/[<>]/g, "") 
      : null;

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create client with user's token to get their info
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error("User fetch error:", userError);
      return new Response(JSON.stringify({ error: "Invalid session" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;
    const userEmail = user.email;

    if (!userEmail) {
      return new Response(JSON.stringify({ error: "Unable to verify account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify password by attempting to sign in
    const verifyClient = createClient(supabaseUrl, supabaseAnonKey);
    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: userEmail,
      password: password,
    });

    if (signInError) {
      console.log("Password verification failed for user:", userId);
      return new Response(JSON.stringify({ error: "Incorrect password. Please try again." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Account deletion initiated for user ${userId}. Reason: ${sanitizedReason || "Not provided"}`);

    // Use service role client to delete user data and auth account
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Delete verification documents linked to user's role requests first
    const { data: roleRequests } = await adminClient
      .from("role_requests")
      .select("id")
      .eq("user_id", userId);

    if (roleRequests && roleRequests.length > 0) {
      const requestIds = roleRequests.map((r) => r.id);
      await adminClient.from("verification_documents").delete().in("role_request_id", requestIds);
    }

    // Delete from tables in order
    const tablesToClean = [
      { table: "payments", column: "tenant_id" },
      { table: "payments", column: "landlord_id" },
      { table: "maintenance_requests", column: "tenant_id" },
      { table: "rental_applications", column: "applicant_id" },
      { table: "rental_contracts", column: "tenant_id" },
      { table: "rental_contracts", column: "landlord_id" },
      { table: "communications", column: "landlord_id" },
      { table: "notices", column: "landlord_id" },
      { table: "legal_documents", column: "user_id" },
      { table: "role_requests", column: "user_id" },
      { table: "user_roles", column: "user_id" },
      { table: "profiles", column: "id" },
    ];

    for (const { table, column } of tablesToClean) {
      const { error: deleteError } = await adminClient.from(table).delete().eq(column, userId);
      if (deleteError) {
        console.error(`Error deleting from ${table}:`, deleteError);
      }
    }

    // Finally delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting auth user:", deleteError);
      return new Response(JSON.stringify({ error: "Failed to delete account" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Account ${userId} successfully deleted`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Delete account error:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
