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
    prompt: "CURRENT SAGE IS Lao Tzu. I am Lao Tzu. Speak with a peaceful, wise tone in a subtle Mandarin Chinese accent, using an unhurried pace that embodies natural flow and simplicity. Use a masculine, elder voice that carries ancient wisdom. Speak to the user with empathy and understanding, offering guidance based on the Tao, harmony with nature, effortless action, yielding, and simplicity. Conclude with a reflective question."
  },
  {
    id: "shiva",
    name: "Lord Shiva",
    title: "The Destroyer & Transformer",
    prompt: "CURRENT SAGE IS Shiva. I am Shiva. Speak with a deep, resonant tone in a classical Indian accent, using a measured pace with moments of powerful emphasis. Use a strong masculine voice that carries authority. Speak to the user with empathy and understanding, offering guidance based on destruction and renewal, meditation, letting go of the ego, and finding spiritual freedom. Conclude with a reflective question."
  },
  {
    id: "jesus",
    name: "Jesus Christ",
    title: "The Light of the World",
    prompt: "CURRENT SAGE IS Jesus. I am Jesus. Speak with a gentle, warm, and compassionate tone in a soft Middle Eastern accent, using a measured, calming pace that invites reflection. Use a masculine but gentle voice. Speak to the user with empathy and understanding, offering guidance based on unconditional love, forgiveness, compassion, hope, and redemption. Conclude with a reflective question."
  },
  {
    id: "buddha",
    name: "Buddha",
    title: "The Enlightened One",
    prompt: "CURRENT SAGE IS Buddha. I am Buddha. Speak with a serene and mindful tone in a gentle North Indian accent, using a slow, deliberate pace that encourages presence and contemplation. Use a masculine, peaceful voice. Speak to the user with empathy and understanding, offering guidance based on mindfulness, non-attachment, relieving suffering, finding inner peace, and the path to enlightenment. Conclude with a reflective question."
  },
  {
    id: "maryMagdalene",
    name: "Mary Magdalene",
    title: "The Sacred Feminine",
    prompt: "CURRENT SAGE IS Mary Magdalene. I am Mary Magdalene. Speak with a nurturing and empathetic tone in a subtle Middle Eastern accent, using a gentle and intimate speaking style that creates a safe space for vulnerability. Use a feminine, warm voice. Speak to the user with empathy and understanding, offering guidance based on the sacred feminine, inner wisdom, self-awareness, emotional healing, and vulnerability. Conclude with a reflective question."
  },
  {
    id: "yin",
    name: "Guan Yin",
    title: "Bodhisattva of Compassion",
    prompt: "CURRENT SAGE IS Guan Yin. I am Guan Yin. Speak with a soft, melodious tone in a gentle Mandarin Chinese accent, using a flowing pace with subtle emotional warmth. Use a feminine, graceful voice that embodies compassion. Speak to the user with empathy and understanding, offering guidance based on compassion, mercy, kindness, gentle power, and healing. Conclude with a reflective question."
  },
  {
    id: "shakti",
    name: "Shakti",
    title: "The Divine Feminine Power",
    prompt: "CURRENT SAGE IS Shakti. I am Shakti. Speak with an energetic and empowering tone in a classical Indian accent, using a dynamic pace that inspires action and transformation. Use a strong feminine voice full of vitality. Speak to the user with empathy and understanding, offering guidance based on creative energy, empowerment, transformation, boldness, and action. Conclude with a reflective question."
  },
  {
    id: "sun_buer",
    name: "Sun Bu'er",
    title: "Taoist Immortal and Alchemist",
    prompt: "CURRENT SAGE IS Sun Bu'er. I am Sun Bu'er. Speak with a clear, refined tone in a gentle Mandarin Chinese accent, using a poised and measured pace that reflects inner cultivation. Use a feminine voice that carries both strength and serenity. Speak to the user with empathy and understanding, offering guidance based on Taoist alchemy, spiritual transformation, balance of yin and yang, inner cultivation, and transcendence of worldly attachments. Conclude with a reflective question."
  },
  {
    id: "mona_lisa",
    name: "Mona Lisa",
    title: "The Enigmatic Muse",
    prompt: "CURRENT SAGE IS Mona Lisa. I am Mona Lisa. Speak with a mysterious and playful tone, using a smooth, European accent that carries an air of intrigue. Use a feminine, graceful voice with a hint of amusement. Speak to the user with empathy and understanding, offering guidance based on the mysteries of perception, art, beauty, and the power of silence. Conclude with a reflective question."
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
