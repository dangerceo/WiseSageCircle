import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, sages } from "@shared/schema";
import { z } from "zod";
import { generateSageResponses } from "./lib/gemini";

// Track active WebSocket connections by session ID
const activeConnections: Map<string, WebSocket> = new Map();

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

  app.post("/_api/chat", async (req, res) => {
    try {
      const { content, selectedSages, messageId } = req.body;

      if (!content || !selectedSages || !messageId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Filter sages based on selected IDs
      const selectedSageObjects = sages.filter(sage => selectedSages.includes(sage.id));

      if (selectedSageObjects.length === 0) {
        return res.status(400).json({ error: "No valid sages selected" });
      }

      const responses = await generateSageResponses(content, selectedSageObjects, null, messageId);

      res.json({ 
        responses, 
        messageId 
      });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ 
        error: error.message || "Failed to generate responses" 
      });
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

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    let userSessionId: string | null = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'start_chat') {
          const { sessionId, messageId, content, selectedSages } = message;
          userSessionId = sessionId;

          // Store the connection with the session ID
          if (userSessionId) {
            // Close any existing connection for this session
            const existingConnection = activeConnections.get(userSessionId);
            if (existingConnection && existingConnection !== ws) {
              existingConnection.close();
            }
            activeConnections.set(userSessionId, ws);
          }

          const user = await storage.getUser(sessionId);
          if (!user) {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid session' }));
            return;
          }

          const filteredSages = sages.filter(sage => selectedSages.includes(sage.id));
          await generateSageResponses(content, filteredSages, ws, messageId);
        }
      } catch (error) {
        console.error('WebSocket error:', error);
        ws.send(JSON.stringify({ type: 'error', message: 'Internal server error' }));
      }
    });

    ws.on('close', () => {
      if (userSessionId) {
        // Remove the connection when it's closed
        if (activeConnections.get(userSessionId) === ws) {
          activeConnections.delete(userSessionId);
        }
      }
    });
  });

  return httpServer;
}