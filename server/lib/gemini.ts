import { GoogleGenAI} from "@google/genai";
import { Sage } from "@shared/schema";
import { WebSocket } from "ws";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

async function generateSingleSageResponse(
  content: string,
  sage: Sage,
  ws: WebSocket | null,
  messageId: number
): Promise<string> {
  try {
    const prompt = `
      You are ${sage.name}, ${sage.title}.
      ${sage.prompt}

      Seeker's question: ${content}

      Please provide wisdom and guidance according to your spiritual tradition and perspective.
      Keep the response respectful, focused, and within safe content guidelines.
      Limit the response to 2-3 paragraphs maximum.
    `.trim();

    const result = await genAI.models.generateContentStream({
      model: 'gemini-2.0-flash-001',
      contents: prompt,
    });
    let fullResponse = '';

    if (ws?.readyState === WebSocket.OPEN) {
      for await (const chunk of result) {
        const text = chunk.text;
        fullResponse += text;
        ws.send(JSON.stringify({
          type: 'stream',
          messageId,
          sageId: sage.id,
          chunk: text
        }));
      }

      // Send complete message with full response after stream ends
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'complete',
          messageId,
          sageId: sage.id,
          response: fullResponse
        }));
      }
    } else {
      for await (const chunk of result) {
        fullResponse += chunk.text;
      }
    }

    return fullResponse;
  } catch (error: any) {
    console.error(`Error generating response for ${sage.name}:`, error);
    if (error.message?.includes("SAFETY")) {
      throw new Error("Your question touches on sensitive topics. Please rephrase it focusing on spiritual guidance and wisdom.");
    }
    throw error;
  }
}

export async function generateSageResponses(
  content: string,
  selectedSages: Sage[],
  ws: WebSocket | null = null,
  messageId: number
): Promise<Record<string, string>> {
  if (!selectedSages.length) {
    throw new Error("No sages selected");
  }

  const responses: Record<string, string> = {};
  const errors: Error[] = [];

  // Generate responses from each sage in parallel
  await Promise.all(
    selectedSages.map(async (sage) => {
      try {
        const response = await generateSingleSageResponse(content, sage, ws, messageId);
        responses[sage.id] = response;
      } catch (error) {
        errors.push(error as Error);
      }
    })
  );

  if (Object.keys(responses).length === 0) {
    if (errors.length > 0) {
      throw errors[0];
    }
    throw new Error("The sages are temporarily unavailable. Please try again in a moment.");
  }

  return responses;
}
