import { ExecutionContext } from "@cloudflare/workers-types";

interface Env {
  GEMINI_API_KEY: string;
}

export async function onRequest(context: { 
  request: Request;
  env: Env;
  next: () => Promise<Response>;
}) {
  // Add CORS headers for API routes
  const response = await context.next();
  if (context.request.url.includes('/_api')) {
    response.headers.set("Access-Control-Allow-Origin", "*");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type");
  }

  return response;
}