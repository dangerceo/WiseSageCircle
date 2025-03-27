import { ExecutionContext } from "@cloudflare/workers-types";

interface Env {
  GEMINI_API_KEY: string;
}

export async function onRequest(context: { 
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}) {
  // Handle OPTIONS requests for CORS pre-flight
  if (context.request.method === "OPTIONS" && context.request.url.includes('/_api')) {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, stripe-signature",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  // For non-OPTIONS requests, add CORS headers to the response
  const response = await context.next();
  if (context.request.url.includes('/_api')) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, stripe-signature");
  }

  return response;
}