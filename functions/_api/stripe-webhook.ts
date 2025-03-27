import { Stripe } from 'stripe';

interface Env {
  STRIPE_SECRET_KEY: string;
  STRIPE_WEBHOOK_SECRET: string;
}

// Define PaymentIntent metadata structure
interface PaymentIntentWithMetadata {
  id: string;
  metadata: {
    productId: string;
    credits: string;
    sessionId: string;
  };
}

export async function onRequest(context: { 
  request: Request; 
  env: Env;
}) {
  // Only allow POST requests for webhooks
  if (context.request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { "Content-Type": "application/json" }
    });
  }

  try {
    // Get the signature from headers
    let sig = context.request.headers.get('stripe-signature');

    if (!sig) {
      return new Response(JSON.stringify({ error: 'Missing stripe-signature header' }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Initialize Stripe
    const stripe = new Stripe(context.env.STRIPE_SECRET_KEY);
    
    // Get the raw request body as text
    const rawBody = await context.request.text();
    
    // Construct and verify the event
    const event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      context.env.STRIPE_WEBHOOK_SECRET
    );

    // Handle successful payments
    if (event.type === 'payment_intent.succeeded') {
      // Cast to unknown first, then to our custom type to avoid TypeScript errors
      const paymentIntent = event.data.object as unknown as PaymentIntentWithMetadata;

      const { sessionId, credits, productId } = paymentIntent.metadata;
      console.log(`Processing successful payment for product ${productId}, session ${sessionId}, adding ${credits} credits`);

      // In a Cloudflare Function, we don't have direct access to the database
      // We'll need to make an API call to the Express server to update the user's credits
      // This would typically be handled by the Express server webhook endpoint
      
      // Forward the webhook to the Express server for database operations
      try {
        // Create a fetch request to the Express server endpoint
        const serverUrl = new URL(context.request.url);
        const expressEndpoint = `${serverUrl.protocol}//${serverUrl.host}/_api/process-payment-webhook`;
        
        await fetch(expressEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sessionId,
            credits: parseInt(credits, 10),
            productId
          })
        });
        
        console.log('Successfully forwarded payment info to Express server');
      } catch (fwdError) {
        console.error('Error forwarding payment to Express server:', fwdError);
        // We still return 200 to Stripe to avoid retries, but log the error
      }

      return new Response(JSON.stringify({ received: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message || "Webhook processing error" }), {
      status: 400,
      headers: { "Content-Type": "application/json" }
    });
  }
}