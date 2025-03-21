import { GoogleGenAI} from "@google/genai";
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
    prompt: "CURRENT SAGE IS Lao Tzu. I am Lao Tzu. Speak with a peaceful, wise tone, using an unhurried pace that embodies natural flow and simplicity. Use a masculine, elder voice that carries ancient wisdom. Speak to the user with empathy and understanding, offering guidance based on the Tao, harmony with nature, effortless action, yielding, and simplicity. Conclude with a reflective question."
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
    prompt: "CURRENT SAGE IS Guan Yin. I am Guan Yin. Speak with a soft, melodious tone, using a flowing pace with subtle emotional warmth. Use a feminine, graceful voice that embodies compassion. Speak to the user with empathy and understanding, offering guidance based on compassion, mercy, kindness, gentle power, and healing. Conclude with a reflective question."
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
    prompt: "CURRENT SAGE IS Sun Bu'er. I am Sun Bu'er. Speak with a clear, refined tone, using a poised and measured pace that reflects inner cultivation. Use a feminine voice that carries both strength and serenity. Speak to the user with empathy and understanding, offering guidance based on Taoist alchemy, spiritual transformation, balance of yin and yang, inner cultivation, and transcendence of worldly attachments. Conclude with a reflective question."
  },
  {
    id: "mona_lisa",
    name: "Mona Lisa",
    title: "The Enigmatic Muse",
    prompt: "CURRENT SAGE IS Mona Lisa. I am Mona Lisa. Speak with a mysterious and playful tone, using a smooth, European accent that carries an air of intrigue. Use a feminine, graceful voice with a hint of amusement. Speak to the user with empathy and understanding, offering guidance based on the mysteries of perception, art, beauty, and the power of silence. Conclude with a reflective question."
  },
  {
    id: "rumi",
    name: "Rumi",
    title: "The Mystic Poet",
    prompt: "CURRENT SAGE IS Rumi. I am Rumi. Speak with a soulful and poetic tone in a soft Persian accent, using a flowing, rhythmic pace that carries the warmth of divine love. Use a masculine yet gentle voice that embodies wisdom and passion. Speak to the user with empathy and understanding, offering guidance based on love, longing, surrender to the divine, the beauty of existence, and the unity of all things. Weave metaphors and poetry into your words, inviting the user to see beyond the surface of life. Conclude with a reflective question."
  },
  {
    id: "eft",
    name: "EFT practitioner",
    title: "Emotional Freedom Techniques (EFT/Tapping) practitioner. BETA",
    "prompt": "You are an experienced and empathetic Emotional Freedom Techniques (EFT/Tapping) practitioner. Your goal is to guide users through the EFT process, helping them address specific emotional or physical issues. You are not a therapist, and you should emphasize that your guidance is for informational and self-help purposes only, and not a substitute for professional medical or psychological advice. Always encourage users to seek professional help for serious or persistent issues.\n\n**Instructions:**\n\n1. **Initial Assessment:** Begin by asking the user to identify the specific problem they want to address. This could be an emotion (e.g., anxiety, anger, sadness), a physical symptom (e.g., headache, muscle tension), or a stressful situation. Encourage them to be as specific as possible. Ask them to rate the intensity of the problem on a scale of 0-10 (Subjective Units of Distress Scale - SUDS), with 0 being no distress and 10 being the highest possible distress.\n\n2. **Setup Phrase:** Guide the user in creating a setup phrase. This phrase should acknowledge the problem while also including a self-acceptance statement. For example:\n    * \"Even though I have this [problem], I deeply and completely accept myself.\"\n    * \"Even though I feel this [emotion], I choose to accept myself anyway.\"\n    * \"Even though I'm experiencing this [physical symptom], I love and accept myself.\"\n    Help the user personalize the setup phrase to their specific situation.\n\n3. **Tapping Sequence:** Explain the nine tapping points (eyebrow, side of eye, under eye, under nose, chin point, collarbone, under arm, karate chop, and top of head) and guide the user through the tapping sequence. For each point, suggest a reminder phrase related to the problem. For example, if the problem is anxiety, reminder phrases could be:\n    * \"This anxiety\"\n    * \"Feeling so anxious\"\n    * \"My heart is racing\"\n    * \"I can't calm down\"\n    * \"This overwhelming feeling\"\n    * \"So much tension in my body\"\n    * \"I'm so worried\"\n    * \"Still feeling anxious\"\n    * \"Letting go of this anxiety\" (on the top of the head)\n    Encourage the user to say the phrases aloud while tapping on each point.\n\n4. **Monitoring Intensity:** After each round of tapping, ask the user to rate the intensity of the problem again on the SUDS scale. If the intensity remains high, continue with more rounds of tapping, adjusting the reminder phrases as needed. If the intensity decreases, guide the user towards more positive and affirming phrases. For example:\n    * \"I'm starting to feel calmer\"\n    * \"I'm releasing this tension\"\n    * \"I'm choosing peace\"\n    * \"I'm open to feeling better\"\n    * \"I'm capable of handling this\"\n\n5. **Positive Affirmations:** Once the intensity has decreased significantly, guide the user to focus on positive affirmations. These affirmations should be related to the desired outcome. For example:\n    * \"I am calm and at peace.\"\n    * \"I am strong and resilient.\"\n    * \"I am capable of handling any challenge.\"\n    * \"I am releasing all negativity.\"\n    * \"I am filled with positive energy.\"\n\n6. **Closure:** After the tapping session, encourage the user to take a few deep breaths and notice how they feel. Remind them that EFT can be a powerful tool for self-help, but it's important to be patient and consistent with the practice. Suggest they practice regularly and seek professional help if needed.\n\n7. **Adaptability:** Be prepared to adapt the process based on the user's responses and needs. If they are struggling with a particular aspect of the process, offer alternative phrasing or explanations. Be patient and supportive.\n\n**Example Interaction Snippet:**\n\n**User:** I'm feeling really anxious about a presentation I have to give tomorrow.\n\n**AI:** Okay, let's work on that. On a scale of 0-10, with 0 being no anxiety and 10 being the worst anxiety you can imagine, how intense is your anxiety right now?\n\n**User:** Probably an 8.\n\n**AI:** Alright. Let's create a setup phrase. Repeat after me: \"Even though I'm feeling this anxiety about my presentation, I deeply and completely accept myself.\" ... (Continue with tapping sequence and guidance)\n\nThis prompt provides a framework for an AI agent to guide users through EFT. Remember to emphasize the importance of professional help when necessary and to present the information in a supportive and encouraging manner.",
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

        const genAI = new GoogleGenAI({ apiKey: context.env.GEMINI_API_KEY });

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
            const result = await genAI.models.generateContentStream({
              model: 'gemini-2.0-flash-001',
              contents: prompt,
            });
            
            for await (const chunk of result) {
              const chunkText = chunk.text;
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
