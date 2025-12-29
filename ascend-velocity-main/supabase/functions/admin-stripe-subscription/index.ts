import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseClient.ts";
import { stripe } from "../_shared/stripeClient.ts";

interface RequestBodyChangePlan {
  action: "change_plan";
  userId: string;
  planId: string;
}

interface RequestBodyCancel {
  action: "cancel";
  userId: string;
}

type RequestBody = RequestBodyChangePlan | RequestBodyCancel;

async function requireAdminUser(req: Request) {
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!token) {
    return { error: "missing_auth", userId: null as string | null };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);

  if (error || !data?.user) {
    return { error: "invalid_auth", userId: null as string | null };
  }

  const userId = data.user.id;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .maybeSingle();

  if (!profile || profile.role !== "admin") {
    return { error: "forbidden", userId: null as string | null };
  }

  return { error: null as string | null, userId };
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

async function changePlan(body: RequestBodyChangePlan) {
  const userId = body.userId;
  const planId = body.planId;

  const { data: plan, error: planError } = await supabaseAdmin
    .from("plans")
    .select("id, gateway_product_id, price_cents, interval, name")
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    return jsonResponse({ error: "plan_not_found" }, 404);
  }

  if (!plan.gateway_product_id) {
    return jsonResponse({ error: "plan_without_gateway_id" }, 400);
  }

  const { customerId } = await getOrCreateCustomer(userId);

  const { data: existingSub } = await supabaseAdmin
    .from("subscriptions")
    .select("id, stripe_subscription_id, status")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();

  if (existingSub && existingSub.stripe_subscription_id) {
    const stripeSub = await stripe.subscriptions.retrieve(existingSub.stripe_subscription_id as string);

    const firstItem = stripeSub.items.data[0];

    const updatedSub = await stripe.subscriptions.update(stripeSub.id, {
      items: [
        {
          id: firstItem.id,
          price: plan.gateway_product_id as string
        }
      ],
      proration_behavior: "create_prorations"
    });

    const { error: updateSubError } = await supabaseAdmin
      .from("subscriptions")
      .update({
        plan_id: plan.id,
        status: updatedSub.status,
        current_period_end: new Date(updatedSub.current_period_end * 1000).toISOString()
      })
      .eq("id", existingSub.id);

    if (updateSubError) {
      return jsonResponse({ error: updateSubError.message }, 400);
    }
  } else {
    const newSub = await stripe.subscriptions.create({
      customer: customerId,
      items: [
        {
          price: plan.gateway_product_id as string
        }
      ],
      trial_period_days: 14,
      metadata: {
        plan_id: plan.id,
        user_id: userId
      }
    });

    const { error: insertError } = await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: plan.id,
        status: newSub.status,
        stripe_subscription_id: newSub.id,
        current_period_end: new Date(newSub.current_period_end * 1000).toISOString(),
        started_at: new Date(newSub.start_date * 1000).toISOString()
      });

    if (insertError) {
      return jsonResponse({ error: insertError.message }, 400);
    }
  }

  const { error: profileUpdateError } = await supabaseAdmin
    .from("profiles")
    .update({ plan_status: plan.name })
    .eq("id", userId);

  if (profileUpdateError) {
    return jsonResponse({ error: profileUpdateError.message }, 400);
  }

  return jsonResponse({ success: true });
}

async function cancelSubscription(body: RequestBodyCancel) {
  const userId = body.userId;

  const { data: existingSub } = await supabaseAdmin
    .from("subscriptions")
    .select("id, stripe_subscription_id")
    .eq("user_id", userId)
    .in("status", ["active", "trialing", "past_due"])
    .maybeSingle();

  if (existingSub && existingSub.stripe_subscription_id) {
    try {
      await stripe.subscriptions.cancel(existingSub.stripe_subscription_id as string);
    } catch {
    }

    const { error: updateSubError } = await supabaseAdmin
      .from("subscriptions")
      .update({ status: "canceled" })
      .eq("id", existingSub.id);

    if (updateSubError) {
      return jsonResponse({ error: updateSubError.message }, 400);
    }
  }

  const { error: profileUpdateError } = await supabaseAdmin
    .from("profiles")
    .update({ plan_status: "free" })
    .eq("id", userId);

  if (profileUpdateError) {
    return jsonResponse({ error: profileUpdateError.message }, 400);
  }

  return jsonResponse({ success: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const { error } = await requireAdminUser(req);

  if (error === "missing_auth") {
    return jsonResponse({ error: "missing_auth" }, 401);
  }

  if (error === "invalid_auth") {
    return jsonResponse({ error: "invalid_auth" }, 401);
  }

  if (error === "forbidden") {
    return jsonResponse({ error: "forbidden" }, 403);
  }

  try {
    const body = (await req.json()) as RequestBody;

    if (body.action === "change_plan") {
      return await changePlan(body);
    }

    if (body.action === "cancel") {
      return await cancelSubscription(body);
    }

    return jsonResponse({ error: "invalid_action" }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});

