import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema } from "@shared/schema";
import { z } from "zod";

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

      // Mock Gemini Flash 2.0 integration
      const response = "This is a sample response from the selected sages.";
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
