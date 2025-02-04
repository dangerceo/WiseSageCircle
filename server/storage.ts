import { User, InsertUser, Message, InsertMessage } from "@shared/schema";

export interface IStorage {
  getUser(sessionId: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(id: number, credits: number): Promise<void>;
  getUserMessages(userId: number): Promise<Message[]>;
  createMessage(userId: number, message: InsertMessage): Promise<Message>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private messages: Map<number, Message>;
  private currentUserId: number;
  private currentMessageId: number;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.currentUserId = 1;
    this.currentMessageId = 1;
  }

  async getUser(sessionId: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.sessionId === sessionId
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = {
      id,
      sessionId: insertUser.sessionId,
      username: insertUser.username,
      credits: 10,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async updateUserCredits(id: number, credits: number): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, credits });
    }
  }

  async getUserMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      (message) => message.userId === userId
    );
  }

  async createMessage(userId: number, insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      id,
      userId,
      content: insertMessage.content,
      response: "",
      sages: insertMessage.sages,
      createdAt: new Date()
    };
    this.messages.set(id, message);
    return message;
  }
}

export const storage = new MemStorage();
