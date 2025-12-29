import { corsHeaders } from "../_shared/cors.ts";
import { supabaseAdmin } from "../_shared/supabaseClient.ts";
import { stripe } from "../_shared/stripeClient.ts";

type Interval = "monthly" | "yearly";

interface PlanPayload {
  name: string;
  price: number;
  interval: Interval;
  description: string;
  features: unknown[];
  color?: string;
  isPopular?: boolean;
}

interface RequestBodyCreate {
  action: "create";
  plan: PlanPayload;
}

interface RequestBodyUpdate {
  action: "update";
  id: string;
  updates: Partial<PlanPayload>;
}

interface RequestBodyDelete {
  action: "delete";
  id: string;
}

interface RequestBodyStatus {
  action: "status";
}

type RequestBody = RequestBodyCreate | RequestBodyUpdate | RequestBodyDelete | RequestBodyStatus;

function isStripeConfigured() {
  const key = Deno.env.get("STRIPE_SECRET_KEY");
  return typeof key === "string" && key.trim().length > 0;
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

async function handleCreate(body: RequestBodyCreate) {
  const plan = body.plan;

  if (!plan?.name || typeof plan.price !== "number" || plan.price <= 0) {
    return jsonResponse({ error: "invalid_plan" }, 400);
  }

  if (plan.interval !== "monthly" && plan.interval !== "yearly") {
    return jsonResponse({ error: "invalid_interval" }, 400);
  }

  const amount = Math.round(plan.price * 100);

  if (!isStripeConfigured()) {
    return jsonResponse({ error: "stripe_not_configured" }, 500);
  }

  let productId: string | null = null;
  let priceId: string | null = null;

  try {
    const product = await stripe.products.create({
      name: plan.name,
      description: plan.description
    });
    productId = product.id;

    const interval = plan.interval === "yearly" ? "year" : "month";

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: amount,
      currency: "brl",
      recurring: {
        interval
      }
    });
    priceId = price.id;
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }

  const { data, error } = await supabaseAdmin
    .from("plans")
    .insert({
      name: plan.name,
      price_cents: amount,
      interval: plan.interval,
      description: plan.description,
      features: plan.features,
      is_popular: plan.isPopular ?? false,
      color: plan.color,
      gateway_product_id: priceId
    })
    .select("*")
    .single();

  if (error) {
    if (priceId) {
      try {
        await stripe.prices.update(priceId, { active: false });
      } catch {
      }
    }

    if (productId) {
      try {
        await stripe.products.update(productId, { active: false });
      } catch {
      }
    }

    return jsonResponse({ error: error.message }, 400);
  }

  return jsonResponse({ plan: data });
}

async function handleUpdate(body: RequestBodyUpdate) {
  const id = body.id;
  const updates = body.updates;

  const { data: existing, error: fetchError } = await supabaseAdmin
    .from("plans")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError || !existing) {
    return jsonResponse({ error: "plan_not_found" }, 404);
  }

  let gatewayProductId = existing.gateway_product_id as string | null;
  let priceCents = existing.price_cents as number;
  let intervalDb = existing.interval as Interval;

  const nameDb = existing.name as string;
  const descriptionDb = (existing.description as string | null) ?? "";

  const priceChanged = typeof updates.price === "number" && updates.price > 0;
  const intervalChanged = typeof updates.interval === "string" && updates.interval !== existing.interval;

  if (intervalChanged && updates.interval !== "monthly" && updates.interval !== "yearly") {
    return jsonResponse({ error: "invalid_interval" }, 400);
  }

  if (priceChanged) {
    priceCents = Math.round(updates.price! * 100);
  }

  if (intervalChanged) {
    intervalDb = updates.interval as Interval;
  }

  const nameNext = updates.name !== undefined ? (updates.name as string) : nameDb;
  const descriptionNext = updates.description !== undefined ? (updates.description as string) : descriptionDb;

  const needsStripeSync =
    gatewayProductId !== null ||
    updates.name !== undefined ||
    updates.description !== undefined ||
    priceChanged ||
    intervalChanged;

  if (needsStripeSync && !isStripeConfigured()) {
    return jsonResponse({ error: "stripe_not_configured" }, 500);
  }

  if (!gatewayProductId && isStripeConfigured() && needsStripeSync) {
    const interval = intervalDb === "yearly" ? "year" : "month";

    const product = await stripe.products.create({
      name: nameNext,
      description: descriptionNext
    });

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: priceCents,
      currency: "brl",
      recurring: {
        interval
      }
    });

    gatewayProductId = price.id;
  }

  if (gatewayProductId && (priceChanged || intervalChanged)) {
    const currentPrice = await stripe.prices.retrieve(gatewayProductId);
    const productId = typeof currentPrice.product === "string" ? currentPrice.product : currentPrice.product.id;

    const stripeInterval = intervalDb === "yearly" ? "year" : "month";

    const newPrice = await stripe.prices.create({
      product: productId,
      unit_amount: priceCents,
      currency: "brl",
      recurring: {
        interval: stripeInterval
      }
    });

    gatewayProductId = newPrice.id;
  }

  if (gatewayProductId && (updates.name !== undefined || updates.description !== undefined)) {
    const currentPrice = await stripe.prices.retrieve(gatewayProductId);
    const productId = typeof currentPrice.product === "string" ? currentPrice.product : currentPrice.product.id;

    await stripe.products.update(productId, {
      name: nameNext,
      description: descriptionNext
    });
  }

  const dbUpdates: Record<string, unknown> = {};

  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.description !== undefined) dbUpdates.description = updates.description;
  if (updates.features !== undefined) dbUpdates.features = updates.features;
  if (updates.color !== undefined) dbUpdates.color = updates.color;
  if (updates.isPopular !== undefined) dbUpdates.is_popular = updates.isPopular;

  dbUpdates.price_cents = priceCents;
  dbUpdates.interval = intervalDb;
  dbUpdates.gateway_product_id = gatewayProductId;

  const { data, error } = await supabaseAdmin
    .from("plans")
    .update(dbUpdates)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    return jsonResponse({ error: error.message }, 400);
  }

  return jsonResponse({ plan: data });
}

async function handleDelete(body: RequestBodyDelete) {
  const id = body.id;

  const { data: existing } = await supabaseAdmin
    .from("plans")
    .select("gateway_product_id")
    .eq("id", id)
    .maybeSingle();

  if (existing && existing.gateway_product_id) {
    if (!isStripeConfigured()) {
      return jsonResponse({ error: "stripe_not_configured" }, 500);
    }

    try {
      await stripe.prices.update(existing.gateway_product_id as string, {
        active: false
      });
    } catch {
    }
  }

  const { error } = await supabaseAdmin
    .from("plans")
    .delete()
    .eq("id", id);

  if (error) {
    return jsonResponse({ error: error.message }, 400);
  }

  return jsonResponse({ success: true });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const body = (await req.json()) as RequestBody;

    if (body.action === "create") {
      return await handleCreate(body);
    }

    if (body.action === "update") {
      return await handleUpdate(body);
    }

    if (body.action === "delete") {
      return await handleDelete(body);
    }

    if (body.action === "status") {
      return jsonResponse({ stripeConfigured: isStripeConfigured() });
    }

    return jsonResponse({ error: "invalid_action" }, 400);
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 500);
  }
});
