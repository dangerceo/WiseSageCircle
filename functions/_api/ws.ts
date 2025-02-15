import { GoogleGenerativeAI } from "@google/generative-ai";
import { ExecutionContext } from "@cloudflare/workers-types";

interface Env {
  GEMINI_API_KEY: string;
}

interface Sage {
  id: string;
  name: string;
  title: string;
  prompt: string;
}

interface WebSocketPair {
  0: WebSocket;
  1: WebSocket;
}

interface CloudflareWebSocket extends WebSocket {
  accept(): void;
}

interface WebSocketResponse extends Response {
  webSocket: CloudflareWebSocket;
}

declare const WebSocketPair: {
  new(): { [key: number]: CloudflareWebSocket };
};

export async function onRequest({ request, env }: { request: Request; env: Env }) {
  try {
    // Check if the request is a WebSocket upgrade request
    if (request.headers.get("Upgrade") !== "websocket") {
      return new Response("Expected WebSocket connection", { status: 426 });
    }

    // Create WebSocket pair
    const pair = new WebSocketPair();
    const [client, server] = [pair[0], pair[1]] as [CloudflareWebSocket, CloudflareWebSocket];

    // Handle WebSocket connection
    server.accept();

    // Set up message handler
    server.addEventListener("message", async (event) => {
      try {
        const { content, selectedSages, messageId } = JSON.parse(event.data as string);

        if (!env.GEMINI_API_KEY) {
          server.send(JSON.stringify({ 
            type: 'error',
            message: "GEMINI_API_KEY not configured",
            messageId 
          }));
          return;
        }

        const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Generate responses from each sage
        await Promise.all(selectedSages.map(async (sage: Sage) => {
          const prompt = `
            You are ${sage.name}, ${sage.title}.
            ${sage.prompt}

            Seeker's question: ${content}

            Please provide wisdom and guidance according to your spiritual tradition and perspective.
            Keep the response respectful, focused, and within safe content guidelines.
            Limit the response to 2-3 paragraphs maximum.
          `.trim();

          try {
            const result = await model.generateContent(prompt);
            const response = result.response;
            if (!response.text()) {
              throw new Error("Empty response received");
            }

            server.send(JSON.stringify({
              type: 'complete',
              sageId: sage.id,
              response: response.text(),
              messageId
            }));
          } catch (error: any) {
            console.error(`Error generating response for ${sage.name}:`, error);
            server.send(JSON.stringify({
              type: 'complete',
              sageId: sage.id,
              response: `${sage.name} is currently in deep meditation and unable to respond.`,
              messageId
            }));
          }
        }));

      } catch (error: any) {
        server.send(JSON.stringify({ 
          type: 'error',
          message: error.message || "Internal server error",
          messageId: JSON.parse(event.data as string).messageId 
        }));
      }
    });

    // Handle WebSocket closure
    server.addEventListener("close", () => {
      console.log("WebSocket connection closed");
    });

    // Handle WebSocket errors
    server.addEventListener("error", (error) => {
      console.error("WebSocket error:", error);
    });

    // Return the client socket
    return new Response(null, {
      status: 101,
      webSocket: client,
    }) as WebSocketResponse;

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message || "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
} 
