import { analysisResults, type AnalysisResult, type InsertAnalysisResult } from "@shared/schema";
import { db } from "./db";
import { eq, desc } from "drizzle-orm";
import { authStorage } from "./replit_integrations/auth";
import { chatStorage } from "./replit_integrations/chat";

export interface IStorage {
  // Analysis Operations
  getAnalysis(id: number): Promise<AnalysisResult | undefined>;
  getAnalysesByUser(userId: string): Promise<AnalysisResult[]>;
  createAnalysis(analysis: InsertAnalysisResult): Promise<AnalysisResult>;
  deleteAnalysis(id: number): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getAnalysis(id: number): Promise<AnalysisResult | undefined> {
    const [result] = await db.select().from(analysisResults).where(eq(analysisResults.id, id));
    return result;
  }

  async getAnalysesByUser(userId: string): Promise<AnalysisResult[]> {
    return await db
      .select()
      .from(analysisResults)
      .where(eq(analysisResults.userId, userId))
      .orderBy(desc(analysisResults.createdAt));
  }

  async createAnalysis(analysis: InsertAnalysisResult): Promise<AnalysisResult> {
    const [result] = await db.insert(analysisResults).values(analysis).returning();
    return result;
  }

  async deleteAnalysis(id: number): Promise<void> {
    await db.delete(analysisResults).where(eq(analysisResults.id, id));
  }
}

export const storage = new DatabaseStorage();
// Re-export integration storages for convenience if needed, 
// though they are usually imported directly.
export { authStorage, chatStorage };
