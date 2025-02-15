import { ExecutionContext } from "@cloudflare/workers-types";

interface Env {
  GEMINI_API_KEY: string;
}

export async function onRequest({ request, waitUntil, next }: { 
  request: Request; 
  waitUntil: ExecutionContext['waitUntil'];
  next: () => Promise<Response>;
}) {
  // Serve static files and handle client-side routing
  return next();
}
