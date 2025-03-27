import { Stripe } from 'stripe';

interface Env {
  STRIPE_SECRET_KEY: string;
}

// Define request body interface
interface PurchaseCreditsRequest {
  productId: string;
  sessionId: string;
}

// Credit products configuration
const CREDIT_PRODUCTS = {
  "credit-50": {
    price: 500, // in cents
    credits: 50,
  },
  "credit-100": {
    price: 900,
    credits: 100,
  },
  "credit-200": {
    price: 1500,
    credits: 200,
  },
};

export async function onRequest(context: { 
  request: Request; 
  env: Env;
}) {
  // Handle OPTIONS requests for CORS
  if (context.request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400", 
      }
    });
  }

  // Handle POST requests
  if (context.request.method === "POST") {
    try {
      const body = await context.request.json() as PurchaseCreditsRequest;
      const { productId, sessionId } = body;

      if (!productId || !sessionId) {
        return new Response(JSON.stringify({ error: "Missing required fields" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Type-safe check for product
      if (!(productId in CREDIT_PRODUCTS)) {
        return new Response(JSON.stringify({ error: "Invalid product" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      const product = CREDIT_PRODUCTS[productId as keyof typeof CREDIT_PRODUCTS];
      console.log(`Processing credit purchase: ${productId} for session ${sessionId}`);

      // Initialize Stripe
      const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: product.price,
        currency: "usd",
        metadata: {
          productId,
          credits: product.credits.toString(),
          sessionId
        }
      });

      console.log(`Created payment intent: ${paymentIntent.id}`);
      return new Response(JSON.stringify({ clientSecret: paymentIntent.client_secret }), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error: any) {
      console.error("Payment error:", error);
      return new Response(JSON.stringify({ error: error.message || "Payment processing error" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }

  // If not OPTIONS or POST, return method not allowed
  return new Response(JSON.stringify({ error: "Method not allowed" }), {
    status: 405,
    headers: { "Content-Type": "application/json" }
  });
}