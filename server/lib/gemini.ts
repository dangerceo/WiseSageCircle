import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sage } from "@shared/schema";

if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY environment variable is not set");
}

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function generateSageResponse(content: string, selectedSages: Sage[]) {
  try {
    if (!selectedSages.length) {
      throw new Error("No sages selected");
    }

    // Combine the prompts for selected sages
    const combinedPrompt = selectedSages
      .map(sage => `${sage.name} (${sage.title}): ${sage.prompt}`)
      .join('\n\n');

    // Create the full prompt
    const fullPrompt = `
      You are a panel of spiritual sages responding to a seeker's question.
      Each sage should provide wisdom according to their specific tradition and perspective.

      The sages present are:
      ${combinedPrompt}

      Seeker's question: ${content}

      Please provide a response that combines wisdom from all present sages, maintaining their individual voices and perspectives while keeping the total response concise and focused.
      Remember to keep the response respectful and within safe content guidelines.
    `.trim();

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();

    if (!response) {
      throw new Error("No response received from the sages. Please try rephrasing your question.");
    }

    return response;
  } catch (error: any) {
    console.error("Error generating Gemini response:", error);

    // Provide user-friendly error messages
    if (error.message?.includes("SAFETY")) {
      throw new Error("Your question touches on sensitive topics. Please rephrase it focusing on spiritual guidance and wisdom.");
    } else if (error.message?.includes("No response received")) {
      throw new Error("The sages are contemplating deeply. Please try asking your question again.");
    } else {
      throw new Error("The sages are temporarily unavailable. Please try again in a moment.");
    }
  }
}