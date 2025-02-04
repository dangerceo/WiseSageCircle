import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema, sages } from "@shared/schema";
import { z } from "zod";

// Mock Gemini Flash 2.0 integration
async function generateGeminiResponse(content: string, selectedSages: string[]) {
  // Get the prompts for selected sages
  const sagesToConsult = sages.filter(sage => selectedSages.includes(sage.id));
  const combinedPrompt = sagesToConsult
    .map(sage => `${sage.name} (${sage.title}): ${sage.prompt}`)
    .join('\n');

  // In a real implementation, this would make an API call to Gemini Flash 2.0
  const mockResponses = {
    "lao-tzu": "In stillness, wisdom flows like a gentle stream. Your question reveals both the seeker and the sought.",
    "shiva": "In the dance of consciousness, transformation occurs. Let go of what binds you to see clearly.",
    "jesus": "Love is the key that unlocks all doors. Seek first understanding, and all else will follow.",
    "buddha": "Observe your thoughts without attachment. The answer lies in the space between your questions.",
    "rumi": "Your heart knows the way. Run in that direction, and let love be your guide."
  };

  // Combine responses from selected sages
  const responses = selectedSages.map(sageId => mockResponses[sageId as keyof typeof mockResponses]);
  return responses.join("\n\n");
}

export function registerRoutes(app: Express): Server {
  app.post("/api/session", async (req, res) => {
    try {
      const sessionId = req.body.sessionId;
      let user = await storage.getUser(sessionId);

      if (!user) {
        const userData = insertUserSchema.parse({ sessionId, username: null });
        user = await storage.createUser(userData);
      }

      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error);
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.post("/api/messages", async (req, res) => {
    try {
      const user = await storage.getUser(req.body.sessionId);
      if (!user) {
        return res.status(401).json({ message: "Invalid session" });
      }

      if (user.credits <= 0) {
        return res.status(403).json({ message: "No credits remaining" });
      }

      const messageData = insertMessageSchema.parse(req.body.message);
      const message = await storage.createMessage(user.id, messageData);

      // Generate response using Gemini Flash 2.0
      const response = await generateGeminiResponse(
        messageData.content,
        messageData.sages as string[]
      );

      // Update message with the generated response
      await storage.updateMessageResponse(message.id, response);
      message.response = response;

      await storage.updateUserCredits(user.id, user.credits - 1);

      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error);
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  });

  app.get("/api/messages/:sessionId", async (req, res) => {
    try {
      const user = await storage.getUser(req.params.sessionId);
      if (!user) {
        return res.status(401).json({ message: "Invalid session" });
      }

      const messages = await storage.getUserMessages(user.id);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}