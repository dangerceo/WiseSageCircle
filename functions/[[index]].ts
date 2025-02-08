export async function onRequest({ request, waitUntil, next }) {
  // Serve static files and handle client-side routing
  return next();
}
