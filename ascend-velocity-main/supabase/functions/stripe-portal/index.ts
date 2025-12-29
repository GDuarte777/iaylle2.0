import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseClient.ts";
import { stripe } from "../_shared/stripeClient.ts";

interface RequestBody {
  returnUrl: string;
}

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}

async function requireUser(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return { error: "missing_auth", userId: null as string | null };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return { error: "invalid_auth", userId: null as string | null };
  }

  return { error: null as string | null, userId: data.user.id };
}

async function getOrCreateCustomer(userId: string) {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("id, email, full_name, stripe_customer_id")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    throw new Error("profile_not_found");
  }

  if (profile.stripe_customer_id) {
    return { customerId: profile.stripe_customer_id as string, profile };
  }

  const customer = await stripe.customers.create({
    email: profile.email ?? undefined,
    name: profile.full_name ?? undefined,
    metadata: {
      profile_id: profile.id
    }
  });

  const { error: updateError } = await supabaseAdmin
    .from("profiles")
    .update({ stripe_customer_id: customer.id })
    .eq("id", userId);

  if (updateError) {
    throw new Error("profile_update_failed");
  }

  return { customerId: customer.id, profile: { ...profile, stripe_customer_id: customer.id } };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { error, userId } = await requireUser(req);

  if (!userId && error) {
    if (error === "missing_auth") {
      return jsonResponse({ error: "missing_auth" }, 401);
    }

    return jsonResponse({ error: "invalid_auth" }, 401);
  }

  try {
    const body = (await req.json()) as RequestBody;

    const { customerId } = await getOrCreateCustomer(userId as string);

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: body.returnUrl
    });

    return jsonResponse({ url: session.url });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});

