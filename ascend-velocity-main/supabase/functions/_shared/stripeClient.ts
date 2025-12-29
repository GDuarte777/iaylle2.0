import Stripe from "https://esm.sh/stripe@15.12.0?target=deno";

const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY") ?? "";

export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2024-06-20"
});

