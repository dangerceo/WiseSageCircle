import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sage } from "@shared/schema";
import { WebSocket } from "ws";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

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
    `.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision-flash-8b-1.5" });
    const result = await model.generateContentStream(prompt);
    let fullResponse = '';

    if (ws?.readyState === WebSocket.OPEN) {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        fullResponse += text;
        ws.send(JSON.stringify({
          type: 'stream',
          messageId,
          sageId: sage.id,
          chunk: text
        }));
        // Add a small delay between chunks to simulate natural typing
        await new Promise(resolve => setTimeout(resolve, 30));
      }
      ws.send(JSON.stringify({
        type: 'complete',
        messageId,
        sageId: sage.id
      }));
    } else {
      for await (const chunk of result.stream) {
        fullResponse += chunk.text();
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