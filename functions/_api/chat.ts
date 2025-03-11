import { GoogleGenAI } from "@google/genai";
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

interface ChatRequest {
  content: string;
  selectedSages: Sage[];
  messageId: string;
}

export async function onRequest({
  request,
  env,
}: {
  request: Request;
  env: Env;
}) {
  try {
    // Handle preflight requests for CORS
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      });
    }

    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { content, selectedSages, messageId } =
      (await request.json()) as ChatRequest;

    if (!env.GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const genAI = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });

    const responses: Record<string, string> = {};

    // Generate responses from each sage in parallel
    await Promise.all(
      selectedSages.map(async (sage: Sage) => {
        const prompt = `
        You are ${sage.name}, ${sage.title}.
        ${sage.prompt}

        Seeker's question: ${content}

        Please provide wisdom and guidance according to your spiritual tradition and perspective.
        Keep the response respectful, focused, and within safe content guidelines.
        Limit the response to 2-3 paragraphs maximum.
      `.trim();

        try {
          const result = await genAI.models.generateContent({
            model: "gemini-2.0-flash-001",
            contents: prompt,
          });
          const response = result.text;
          if (!response) {
            throw new Error("Empty response received");
          }
          responses[sage.id] = response;
        } catch (error: any) {
          console.error(`Error generating response for ${sage.name}:`, error);
          if (error.message?.includes("SAFETY")) {
            throw new Error(
              "Your question touches on sensitive topics. Please rephrase it focusing on spiritual guidance and wisdom.",
            );
          }
          responses[sage.id] =
            `${sage.name} is currently in deep meditation and unable to respond.`;
        }
      }),
    );

    // If no responses were generated successfully, handle the error
    if (Object.keys(responses).length === 0) {
      return new Response(
        JSON.stringify({ error: "Failed to generate responses from any sage" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ responses, messageId }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error: any) {
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: error.message?.includes("SAFETY") ? 400 : 500,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
      },
    );
  }
}
