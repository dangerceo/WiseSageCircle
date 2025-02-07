import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertUserSchema, insertMessageSchema, sages } from "@shared/schema";
import { z } from "zod";
import { generateSageResponses } from "./lib/gemini";
import { stripe, CREDIT_PRODUCTS } from "./lib/stripe";
import * as express from 'express';

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

  app.post("/api/create-checkout-session", async (req, res) => {
    try {
      const { priceId } = req.body;
      const product = CREDIT_PRODUCTS[priceId as keyof typeof CREDIT_PRODUCTS];

      if (!product) {
        return res.status(400).json({ message: "Invalid product" });
      }

      const session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: `${product.credits} Spiritual Council Credits`,
                description: `Package of ${product.credits} credits for spiritual guidance`,
              },
              unit_amount: product.price,
            },
            quantity: 1,
          },
        ],
        mode: "payment",
        success_url: `${req.protocol}://${req.get("host")}/chat?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${req.protocol}://${req.get("host")}/chat`,
        metadata: {
          credits: product.credits.toString(),
          userId: req.body.sessionId,
        },
      });

      res.json({ url: session.url });
    } catch (error) {
      console.error("Stripe session creation error:", error);
      res.status(500).json({ message: "Failed to create checkout session" });
    }
  });

  app.post("/api/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    try {
      const sig = req.headers["stripe-signature"];
      const event = stripe.webhooks.constructEvent(
        req.body,
        sig as string,
        process.env.STRIPE_WEBHOOK_SECRET as string
      );

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.userId;
        const credits = parseInt(session.metadata?.credits || "0");

        if (userId && credits) {
          const user = await storage.getUser(userId);
          if (user) {
            await storage.updateUserCredits(user.id, user.credits + credits);
          }
        }
      }

      res.json({ received: true });
    } catch (error: unknown) {
      console.error("Webhook error:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      res.status(400).send(`Webhook Error: ${errorMessage}`);
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
      const message = await storage.createMessage(user.id, {
        ...messageData,
        responses: {}
      });

      const selectedSages = sages.filter(sage =>
        (messageData.sages as string[]).includes(sage.id)
      );

      // Initial empty responses will be updated via WebSocket
      res.json(message);

      // Update credits immediately
      await storage.updateUserCredits(user.id, user.credits - 1);

      // Generate responses asynchronously
      const responses = await generateSageResponses(
        messageData.content,
        selectedSages,
        null,
        message.id
      );
      await storage.updateMessageResponses(message.id, responses);
    } catch (error: unknown) {
      if (error instanceof z.ZodError) {
        res.status(400).json(error);
      } else {
        console.error("Error handling message:", error);
        const errorMessage = error instanceof Error ? error.message : "Internal server error";
        res.status(500).json({ message: errorMessage });
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

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });

  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');

    ws.on('message', async (data) => {
      try {
        const message = JSON.parse(data.toString());
        if (message.type === 'start_chat') {
          const { sessionId, messageId, content, selectedSages } = message;

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
  });

  return httpServer;
}