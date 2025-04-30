import { users, type User, type InsertUser, transcripts, type Transcript, type InsertTranscript, orders, type Order, type InsertOrder, callSummaries, type CallSummary, type InsertCallSummary } from "@shared/schema";
import { db } from "./db";
import { eq, and, gte, sql } from "drizzle-orm";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Transcript methods
  addTranscript(transcript: InsertTranscript): Promise<Transcript>;
  getTranscriptsByCallId(callId: string): Promise<Transcript[]>;
  
  // Order methods
  createOrder(order: InsertOrder): Promise<Order>;
  getOrderById(id: number): Promise<Order | undefined>;
  getOrdersByRoomNumber(roomNumber: string): Promise<Order[]>;
  updateOrderStatus(id: number, status: string): Promise<Order | undefined>;
  getAllOrders(filter: { status?: string; roomNumber?: string }): Promise<Order[]>;
  
  // Call Summary methods
  addCallSummary(summary: InsertCallSummary): Promise<CallSummary>;
  getCallSummaryByCallId(callId: string): Promise<CallSummary | undefined>;
  getRecentCallSummaries(hours: number): Promise<CallSummary[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result.length > 0 ? result[0] : undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }
  
  async addTranscript(insertTranscript: InsertTranscript): Promise<Transcript> {
    const result = await db.insert(transcripts).values(insertTranscript).returning();
    return result[0];
  }
  
  async getTranscriptsByCallId(callId: string): Promise<Transcript[]> {
    return await db.select().from(transcripts).where(eq(transcripts.callId, callId));
  }
  
  async createOrder(insertOrder: InsertOrder): Promise<Order> {
    const result = await db.insert(orders).values({
      ...insertOrder,
      status: "pending"
    }).returning();
    return result[0];
  }
  
  async getOrderById(id: number): Promise<Order | undefined> {
    const result = await db.select().from(orders).where(eq(orders.id, id));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getOrdersByRoomNumber(roomNumber: string): Promise<Order[]> {
    return await db.select().from(orders).where(eq(orders.roomNumber, roomNumber));
  }
  
  async updateOrderStatus(id: number, status: string): Promise<Order | undefined> {
    const result = await db
      .update(orders)
      .set({ status })
      .where(eq(orders.id, id))
      .returning();
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getAllOrders(filter: { status?: string; roomNumber?: string }): Promise<Order[]> {
    const query = db.select().from(orders);
    if (filter.status) {
      query.where(eq(orders.status, filter.status));
    }
    if (filter.roomNumber) {
      query.where(eq(orders.roomNumber, filter.roomNumber));
    }
    return await query;
  }
  
  async addCallSummary(insertCallSummary: InsertCallSummary): Promise<CallSummary> {
    const result = await db.insert(callSummaries).values(insertCallSummary).returning();
    return result[0];
  }
  
  async getCallSummaryByCallId(callId: string): Promise<CallSummary | undefined> {
    const result = await db.select().from(callSummaries).where(eq(callSummaries.callId, callId));
    return result.length > 0 ? result[0] : undefined;
  }
  
  async getRecentCallSummaries(hours: number): Promise<CallSummary[]> {
    // Calculate the timestamp from 'hours' ago
    const hoursAgo = new Date();
    hoursAgo.setHours(hoursAgo.getHours() - hours);
    
    // Query summaries newer than the calculated timestamp
    return await db.select()
      .from(callSummaries)
      .where(gte(callSummaries.timestamp, hoursAgo))
      .orderBy(sql`${callSummaries.timestamp} DESC`);
  }
}

export const storage = new DatabaseStorage();
