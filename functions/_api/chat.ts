import { GoogleGenerativeAI } from "@google/generative-ai";

export async function onRequestPost({ request, env }) {
  try {
    const { content, selectedSages, messageId } = await request.json();
    
    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const responses: Record<string, string> = {};
    
    // Generate responses from each sage
    for (const sage of selectedSages) {
      const prompt = `
        You are ${sage.name}, ${sage.title}.
        ${sage.prompt}

        Seeker's question: ${content}

        Please provide wisdom and guidance according to your spiritual tradition and perspective.
        Keep the response respectful, focused, and within safe content guidelines.
      `.trim();

      try {
        const result = await model.generateContent(prompt);
        responses[sage.id] = result.response.text();
      } catch (error: any) {
        console.error(`Error generating response for ${sage.name}:`, error);
        if (error.message?.includes("SAFETY")) {
          throw new Error("Your question touches on sensitive topics. Please rephrase it focusing on spiritual guidance and wisdom.");
        }
      }
    }

    return new Response(
      JSON.stringify({ responses, messageId }),
      { headers: { "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      { 
        status: error.message?.includes("SAFETY") ? 400 : 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}
