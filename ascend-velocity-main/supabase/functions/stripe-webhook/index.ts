import Stripe from "https://esm.sh/stripe@15.12.0?target=deno";
import { supabaseAdmin } from "../_shared/supabaseClient.ts";
import { stripe } from "../_shared/stripeClient.ts";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json"
    }
  });
}

async function handleCheckoutCompleted(event: Stripe.CheckoutSessionCompletedEvent) {
  const session = event.data.object;
  const subscriptionId = session.subscription;

  if (!subscriptionId) {
    return;
  }

  const stripeSub = await stripe.subscriptions.retrieve(subscriptionId as string);

  const userId = (session.metadata?.user_id as string | undefined) ?? (stripeSub.metadata.user_id as string | undefined) ?? null;
  let planId = (session.metadata?.plan_id as string | undefined) ?? (stripeSub.metadata.plan_id as string | undefined) ?? null;

  if (!planId && stripeSub.items.data.length > 0) {
    const priceId = stripeSub.items.data[0].price.id;
    const { data: plan } = await supabaseAdmin
      .from("plans")
      .select("id")
      .eq("gateway_product_id", priceId)
      .maybeSingle();

    if (plan) {
      planId = plan.id as string;
    }
  }

  if (!userId || !planId) {
    return;
  }

  const currentPeriodEnd = new Date(stripeSub.current_period_end * 1000).toISOString();
  const startedAt = new Date(stripeSub.start_date * 1000).toISOString();

  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", stripeSub.id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin
      .from("subscriptions")
      .update({
        plan_id: planId,
        status: stripeSub.status,
        current_period_end: currentPeriodEnd
      })
      .eq("id", existing.id);
  } else {
    await supabaseAdmin
      .from("subscriptions")
      .insert({
        user_id: userId,
        plan_id: planId,
        status: stripeSub.status,
        stripe_subscription_id: stripeSub.id,
        current_period_end: currentPeriodEnd,
        started_at: startedAt
      });
  }

  await supabaseAdmin
    .from("profiles")
    .update({ plan_status: planId })
    .eq("id", userId);
}

async function handleSubscriptionUpdated(event: Stripe.CustomerSubscriptionUpdatedEvent | Stripe.CustomerSubscriptionDeletedEvent) {
  const subscription = event.data.object;
  const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end * 1000).toISOString() : null;

  const { data: existing } = await supabaseAdmin
    .from("subscriptions")
    .select("id, user_id")
    .eq("stripe_subscription_id", subscription.id)
    .maybeSingle();

  if (!existing) {
    return;
  }

  await supabaseAdmin
    .from("subscriptions")
    .update({
      status: subscription.status,
      current_period_end: currentPeriodEnd
    })
    .eq("id", existing.id);

  if (subscription.status === "canceled" || subscription.status === "unpaid" || subscription.status === "past_due") {
    await supabaseAdmin
      .from("profiles")
      .update({ plan_status: "free" })
      .eq("id", existing.user_id);
  }
}

async function handleInvoicePaid(event: Stripe.InvoicePaymentSucceededEvent) {
  const invoice = event.data.object;
  const subscriptionId = invoice.subscription;

  if (!subscriptionId) {
    return;
  }

  const { data: subscription } = await supabaseAdmin
    .from("subscriptions")
    .select("id")
    .eq("stripe_subscription_id", subscriptionId as string)
    .maybeSingle();

  if (!subscription) {
    return;
  }

  await supabaseAdmin
    .from("payments")
    .insert({
      subscription_id: subscription.id,
      amount_cents: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      paid_at: new Date(invoice.status_transitions.paid_at ? invoice.status_transitions.paid_at * 1000 : invoice.created * 1000).toISOString(),
      external_id: invoice.id
    });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return jsonResponse({ ok: true });
  }

  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET") ?? "";

  const signature = req.headers.get("stripe-signature");

  if (!signature) {
    return jsonResponse({ error: "missing_signature" }, 400);
  }

  const body = await req.text();

  try {
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret);

    if (event.type === "checkout.session.completed") {
      await handleCheckoutCompleted(event as any);
    } else if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      await handleSubscriptionUpdated(event as any);
    } else if (event.type === "invoice.payment_succeeded") {
      await handleInvoicePaid(event as any);
    }

    return jsonResponse({ received: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return jsonResponse({ error: message }, 400);
  }
});

