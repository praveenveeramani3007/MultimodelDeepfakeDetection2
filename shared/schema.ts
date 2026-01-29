import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Import Auth and Chat models from integrations
export * from "./models/auth";
export * from "./models/chat";

// Import users table to reference it
import { users } from "./models/auth";

// === ANALYSIS RESULT TABLE ===
export const analysisResults = pgTable("analysis_results", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id), // Link to Replit Auth user
  fileName: text("file_name").notNull(),
  fileUrl: text("file_url").notNull(), // URL or base64 data URI (if small)
  fileType: text("file_type").notNull(), // 'image', 'audio', 'video'
  
  // Sentiment Analysis
  sentimentLabel: text("sentiment_label"), // Positive, Negative, Neutral
  sentimentScore: integer("sentiment_score"), // 0-100 confidence
  
  // Authenticity/Deepfake Analysis
  authenticityLabel: text("authenticity_label"), // Real, Fake
  authenticityScore: integer("authenticity_score"), // 0-100 confidence (probability of being Real)
  
  // Detailed JSON results (frame analysis, transcript, etc.)
  details: jsonb("details").$type<{
    transcript?: string;
    detectedFaces?: number;
    audioFeatures?: string[];
    frameSentiments?: { time: number; label: string }[];
    reasoning?: string;
  }>(),
  
  createdAt: timestamp("created_at").defaultNow(),
});

// === RELATIONS ===
export const analysisResultsRelations = relations(analysisResults, ({ one }) => ({
  user: one(users, {
    fields: [analysisResults.userId],
    references: [users.id],
  }),
}));

// === BASE SCHEMAS ===
export const insertAnalysisSchema = createInsertSchema(analysisResults).omit({ 
  id: true, 
  createdAt: true 
});

// === EXPLICIT API CONTRACT TYPES ===
export type AnalysisResult = typeof analysisResults.$inferSelect;
export type InsertAnalysisResult = z.infer<typeof insertAnalysisSchema>;

// Request types
export type CreateAnalysisRequest = {
  fileName: string;
  fileType: 'image' | 'audio' | 'video';
  fileData: string; // Base64 encoded data
};

// Response types
export type AnalysisResponse = AnalysisResult;
export type AnalysisListResponse = AnalysisResult[];
