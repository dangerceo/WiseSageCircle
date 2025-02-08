// This will handle all non-API routes by serving the SPA
export async function onRequest({ request, next }) {
  try {
    // Try the original request first
    const response = await next();
    if (response.status === 404) {
      // If not found, serve index.html for client-side routing
      return new Response(
        await fetch(new URL('/index.html', request.url)).then(res => res.text()),
        {
          headers: { 'Content-Type': 'text/html' },
        },
      );
    }
    return response;
  } catch {
    // If anything fails, serve index.html
    return new Response(
      await fetch(new URL('/index.html', request.url)).then(res => res.text()),
      {
        headers: { 'Content-Type': 'text/html' },
      },
    );
  }
}
