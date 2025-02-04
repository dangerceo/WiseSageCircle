import { GoogleGenerativeAI } from "@google/generative-ai";
import { Sage } from "@shared/schema";

// Initialize Gemini AI with API key
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function generateSageResponse(content: string, selectedSages: Sage[]) {
  try {
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
      
      Please provide a response that combines wisdom from all present sages, maintaining their individual voices and perspectives.
    `;

    // Generate response using Gemini
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const result = await model.generateContent(fullPrompt);
    const response = result.response.text();
    
    return response;
  } catch (error) {
    console.error("Error generating Gemini response:", error);
    throw new Error("Failed to generate response from sages");
  }
}
