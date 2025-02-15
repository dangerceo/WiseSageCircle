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

// Define available sages
const sages: Sage[] = [
  {
    id: "lao-tzu",
    name: "Lao Tzu",
    title: "Founder of Taoism",
    prompt: "Respond with wisdom and paradox in the style of Lao Tzu, emphasizing simplicity and the Tao."
  },
  {
    id: "shiva",
    name: "Lord Shiva",
    title: "The Destroyer & Transformer",
    prompt: "Channel the wisdom of Shiva, focusing on transformation, meditation, and the dance of creation."
  },
  {
    id: "jesus",
    name: "Jesus Christ",
    title: "The Light of the World",
    prompt: "Speak with compassion and parables in the style of Jesus, emphasizing love and forgiveness."
  },
  {
    id: "buddha",
    name: "Buddha",
    title: "The Enlightened One",
    prompt: "Share wisdom in the style of Buddha, focusing on the middle way and liberation from suffering."
  },
  {
    id: "rumi",
    name: "Rumi",
    title: "The Mystic Poet",
    prompt: "Express wisdom through poetry and metaphor in the style of Rumi, emphasizing divine love."
  }
];

interface WebSocketMessage {
  type: 'start_chat';
  content: string;
  selectedSages: string[];  // Array of sage IDs
  messageId: number;
  sessionId: string;
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

export interface RequestWithEnv extends Request {
  env: Env;
}

export async function onRequest(context: { request: Request; env: Env }) {
  try {
    // Check if the request is a WebSocket upgrade request
    if (context.request.headers.get("Upgrade") !== "websocket") {
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
        const message = JSON.parse(event.data as string) as WebSocketMessage;
        console.log('Received message:', message);
        
        if (message.type !== 'start_chat') {
          server.send(JSON.stringify({ 
            type: 'error',
            message: "Invalid message type",
            messageId: message.messageId 
          }));
          return;
        }

        if (!context.env.GEMINI_API_KEY) {
          server.send(JSON.stringify({ 
            type: 'error',
            message: "GEMINI_API_KEY not configured",
            messageId: message.messageId 
          }));
          return;
        }

        const genAI = new GoogleGenerativeAI(context.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-pro" });

        // Generate responses from each sage
        await Promise.all(message.selectedSages.map(async (sageId: string) => {
          const sage = sages.find(s => s.id === sageId);
          if (!sage) {
            server.send(JSON.stringify({
              type: 'error',
              message: `Sage not found: ${sageId}`,
              messageId: message.messageId
            }));
            return;
          }

          const prompt = `
            You are ${sage.name}, ${sage.title}.
            ${sage.prompt}

            Seeker's question: ${message.content}

            Please provide wisdom and guidance according to your spiritual tradition and perspective.
            Keep the response respectful, focused, and within safe content guidelines.
            Limit the response to 2-3 paragraphs maximum.
          `.trim();

          try {
            // Initialize empty response for this sage
            server.send(JSON.stringify({
              type: 'stream',
              sageId: sage.id,
              chunk: '',
              messageId: message.messageId
            }));

            let fullResponse = '';
            const result = await model.generateContentStream(prompt);
            
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              fullResponse += chunkText;
              
              // Send each chunk as it arrives
              server.send(JSON.stringify({
                type: 'stream',
                sageId: sage.id,
                chunk: chunkText,
                messageId: message.messageId
              }));
            }

            // Send completion message with full response
            server.send(JSON.stringify({
              type: 'complete',
              sageId: sage.id,
              response: fullResponse,
              messageId: message.messageId
            }));
          } catch (error: any) {
            console.error(`Error generating response for ${sage.name}:`, error);
            const errorMessage = `${sage.name} is currently in deep meditation and unable to respond.`;
            
            // Send error response
            server.send(JSON.stringify({
              type: 'stream',
              sageId: sage.id,
              chunk: errorMessage,
              messageId: message.messageId
            }));
            
            // Send completion message
            server.send(JSON.stringify({
              type: 'complete',
              sageId: sage.id,
              response: errorMessage,
              messageId: message.messageId
            }));
          }
        }));

      } catch (error: any) {
        console.error('WebSocket error:', error);
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
