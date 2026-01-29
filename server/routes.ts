import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import { z } from "zod";
import { setupAuth, registerAuthRoutes, isAuthenticated } from "./replit_integrations/auth";
import { registerChatRoutes } from "./replit_integrations/chat";
import { registerImageRoutes } from "./replit_integrations/image";
import { ai } from "./replit_integrations/image"; // Re-using the initialized AI client

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // 1. Setup Authentication
  await setupAuth(app);
  registerAuthRoutes(app);

  // 2. Register Integration Routes
  registerChatRoutes(app);
  registerImageRoutes(app);

  // 3. Application Routes (Protected)
  
  // List Analyses
  app.get(api.analysis.list.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const results = await storage.getAnalysesByUser(userId);
      res.json(results);
    } catch (error) {
      console.error("List analysis error:", error);
      res.status(500).json({ message: "Failed to list analyses" });
    }
  });

  // Get Analysis
  app.get(api.analysis.get.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.getAnalysis(id);
      
      if (!result) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      // Check ownership
      if (result.userId !== req.user.claims.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      res.json(result);
    } catch (error) {
      console.error("Get analysis error:", error);
      res.status(500).json({ message: "Failed to get analysis" });
    }
  });

  // Delete Analysis
  app.delete(api.analysis.delete.path, isAuthenticated, async (req: any, res) => {
    try {
      const id = Number(req.params.id);
      const result = await storage.getAnalysis(id);
      
      if (!result) {
        return res.status(404).json({ message: "Analysis not found" });
      }
      
      if (result.userId !== req.user.claims.sub) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      await storage.deleteAnalysis(id);
      res.status(204).send();
    } catch (error) {
      console.error("Delete analysis error:", error);
      res.status(500).json({ message: "Failed to delete analysis" });
    }
  });

  // Upload and Analyze
  app.post(api.analysis.upload.path, isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { fileName, fileType, fileData } = api.analysis.upload.input.parse(req.body);

      // Extract Base64 data and mime type
      // Format: "data:image/png;base64,..."
      const matches = fileData.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
      
      if (!matches) {
        return res.status(400).json({ message: "Invalid file data format" });
      }

      const mimeType = matches[1];
      const base64Content = matches[2];

      // Prepare Gemini Prompt
      const prompt = `
        Analyze this ${fileType} file for sentiment and authenticity. 
        Determine if it is Real or Fake/Deepfake. 
        Provide a sentiment score (0-100) and label (Positive/Negative/Neutral).
        Provide an authenticity score (0-100, where 100 is definitely Real, 0 is definitely Fake) and label (Real/Fake).
        Provide detailed reasoning for your decision, citing specific visual or audio cues if possible.
        
        Return ONLY a JSON object with this structure:
        {
          "sentiment_score": number,
          "sentiment_label": string,
          "authenticity_score": number,
          "authenticity_label": string,
          "reasoning": string,
          "details": {
             "transcript": string (if audio/video),
             "visual_cues": string[] (if image/video),
             "audio_cues": string[] (if audio/video)
          }
        }
      `;

      // Call Gemini
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [
              { text: prompt },
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Content
                }
              }
            ]
          }
        ],
        generationConfig: {
          responseMimeType: "application/json"
        }
      });

      const responseText = response.candidates?.[0]?.content?.parts?.[0]?.text;
      
      if (!responseText) {
        throw new Error("Empty response from AI");
      }

      const aiResult = JSON.parse(responseText);

      // Store in DB
      const analysis = await storage.createAnalysis({
        userId,
        fileName,
        fileUrl: fileData, // Storing full base64 for now (Lite mode simplification). In prod, use Object Storage!
        fileType,
        sentimentScore: aiResult.sentiment_score,
        sentimentLabel: aiResult.sentiment_label,
        authenticityScore: aiResult.authenticity_score,
        authenticityLabel: aiResult.authenticity_label,
        details: {
          reasoning: aiResult.reasoning,
          ...aiResult.details
        }
      });

      res.status(201).json(analysis);

    } catch (error) {
      console.error("Analysis upload error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.errors[0].message });
      }
      res.status(500).json({ message: "Failed to analyze file. " + (error as Error).message });
    }
  });

  return httpServer;
}
