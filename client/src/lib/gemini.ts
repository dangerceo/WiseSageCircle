import { Sage } from "@shared/schema";

export interface GenerateResponse {
  text: string;
}

export async function generateSageResponse(content: string, sage: Sage): Promise<GenerateResponse> {
  const prompt = `
    You are ${sage.name}, ${sage.title}.
    ${sage.prompt}

    Seeker's question: ${content}

    Please provide wisdom and guidance according to your spiritual tradition and perspective.
    Keep the response respectful, focused, and within safe content guidelines.
  `.trim();

  try {
    const response = await fetch('https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_GEMINI_API_KEY}`
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        safetySettings: [
          {
            category: "HARM_CATEGORY_DANGEROUS",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Gemini API error:', errorData);
      throw new Error(errorData.error?.message || 'Failed to generate response');
    }

    const result = await response.json();
    
    if (!result.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Invalid response format from Gemini API');
    }

    return {
      text: result.candidates[0].content.parts[0].text
    };
  } catch (error) {
    console.error(`Error generating response for ${sage.name}:`, error);
    throw error;
  }
}
