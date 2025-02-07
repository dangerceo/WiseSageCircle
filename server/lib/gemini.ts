import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sage } from "@shared/schema";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function generateSingleSageResponse(content: string, sage: Sage): Promise<string> {
  try {
    const prompt = `
      You are ${sage.name}, ${sage.title}.
      ${sage.prompt}

      Seeker's question: ${content}

      Please provide wisdom and guidance according to your spiritual tradition and perspective.
      Keep the response respectful, focused, and within safe content guidelines.
    `.trim();

    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(prompt);
    const response = result.response.text();

    if (!response) {
      throw new Error("No response received from the sage. Please try rephrasing your question.");
    }

    return response;
  } catch (error: any) {
    console.error(`Error generating response for ${sage.name}:`, error);
    if (error.message?.includes("SAFETY")) {
      throw new Error("Your question touches on sensitive topics. Please rephrase it focusing on spiritual guidance and wisdom.");
    }
    throw error;
  }
}

export async function generateSageResponses(content: string, selectedSages: Sage[]): Promise<Record<string, string>> {
  if (!selectedSages.length) {
    throw new Error("No sages selected");
  }

  const responses: Record<string, string> = {};
  const errors: Error[] = [];

  // Generate responses from each sage in parallel
  await Promise.all(
    selectedSages.map(async (sage) => {
      try {
        const response = await generateSingleSageResponse(content, sage);
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