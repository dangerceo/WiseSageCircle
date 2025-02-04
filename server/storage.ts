import { User, InsertUser, Message, InsertMessage, users, messages } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  getUser(sessionId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(id: number, credits: number): Promise<void>;
  getUserMessages(userId: number): Promise<Message[]>;
  createMessage(userId: number, message: InsertMessage): Promise<Message>;
  updateMessageResponse(id: number, response: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(sessionId: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.sessionId, sessionId));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserCredits(id: number, credits: number): Promise<void> {
    await db
      .update(users)
      .set({ credits })
      .where(eq(users.id, id));
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(messages.createdAt);
  }

  async createMessage(userId: number, insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values({
        userId,
        content: insertMessage.content,
        response: "",
        sages: insertMessage.sages,
      })
      .returning();
    return message;
  }

  async updateMessageResponse(id: number, response: string): Promise<void> {
    await db
      .update(messages)
      .set({ response })
      .where(eq(messages.id, id));
  }
}

export const storage = new DatabaseStorage();