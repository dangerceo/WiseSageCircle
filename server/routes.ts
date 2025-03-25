import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, sages } from "@shared/schema";
import { z } from "zod";
import { generateSageResponses } from "./lib/gemini";
import { stripe, CREDIT_PRODUCTS } from "./lib/stripe";

// Track active WebSocket connections by session ID
const activeConnections: Map<string, WebSocket> = new Map();

export function registerRoutes(app: Express): Server {
  const httpServer = createServer(app);

  // Set up WebSocket server with explicit path
  const wss = new WebSocketServer({ 
    server: httpServer, 
    path: '/_api/ws',
    // Allow connections from any origin
    verifyClient: () => true
  });

  console.log('WebSocket server initialized at /_api/ws');

  // Credit purchase endpoint
  app.post("/_api/purchase-credits", async (req, res) => {
    try {
      const { productId, sessionId } = req.body;

      if (!productId || !sessionId) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Type-safe check for product
      if (!(productId in CREDIT_PRODUCTS)) {
        return res.status(400).json({ error: "Invalid product" });
      }

      const product = CREDIT_PRODUCTS[productId as keyof typeof CREDIT_PRODUCTS];
      console.log(`Processing credit purchase: ${productId} for session ${sessionId}`);

      const paymentIntent = await stripe.paymentIntents.create({
        amount: product.price,
        currency: "usd",
        metadata: {
          productId,
          credits: product.credits.toString(),
          sessionId
        }
      });

      console.log(`Created payment intent: ${paymentIntent.id}`);
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      console.error("Payment error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Webhook endpoint to handle successful payments
  app.post("/_api/stripe-webhook", async (req, res) => {
    let sig = req.headers['stripe-signature'];

    // Ensure sig is a string
    if (Array.isArray(sig)) {
      sig = sig[0];
    }

    if (!sig) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    try {
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET ?? ''
      );

      if (event.type === 'payment_intent.succeeded') {
        const paymentIntent = event.data.object as {
          metadata: {
            productId: string;
            credits: string;
            sessionId: string;
          };
        };

        const { sessionId, credits } = paymentIntent.metadata;
        console.log(`Processing successful payment for session ${sessionId}, adding ${credits} credits`);

        const user = await storage.getUser(sessionId);
        if (user) {
          await storage.updateUserCredits(
            user.id,
            user.credits + parseInt(credits, 10)
          );
          console.log(`Updated credits for user ${user.id}: ${user.credits} -> ${user.credits + parseInt(credits, 10)}`);
        }
      }

      res.json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error);
      res.status(400).json({ error: error.message });
    }
  });

  // Regular HTTP routes
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

  // WebSocket connection handling
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    let userSessionId: string | null = null;

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        console.log('Received WebSocket message:', message);

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

          // Filter sages based on selected IDs
          const filteredSages = sages.filter(sage => selectedSages.includes(sage.id));
          console.log('Starting chat with sages:', filteredSages.map(s => s.name));

          try {
            await generateSageResponses(content, filteredSages, ws, messageId);
          } catch (error) {
            console.error('Error generating responses:', error);
            ws.send(JSON.stringify({ 
              type: 'error', 
              message: error instanceof Error ? error.message : 'Failed to generate responses' 
            }));
          }
        }
      } catch (error) {
        console.error('WebSocket message handling error:', error);
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'error', message: 'Internal server error' }));
        }
      }
    });

    ws.on('close', () => {
      if (userSessionId) {
        if (activeConnections.get(userSessionId) === ws) {
          activeConnections.delete(userSessionId);
        }
      }
      console.log('WebSocket client disconnected');
    });
  });

  return httpServer;
}