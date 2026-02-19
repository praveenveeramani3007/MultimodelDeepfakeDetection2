import { z } from 'zod';
import { insertAnalysisSchema, analysisResults } from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  analysis: {
    list: {
      method: 'GET' as const,
      path: '/api/analysis',
      responses: {
        200: z.array(z.custom<typeof analysisResults.$inferSelect>()),
        401: errorSchemas.unauthorized,
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/analysis/:id',
      responses: {
        200: z.custom<typeof analysisResults.$inferSelect>(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
    upload: {
      method: 'POST' as const,
      path: '/api/analysis/upload',
      input: z.object({
        fileName: z.string(),
        fileType: z.enum(['image', 'audio', 'video', 'text']),
        fileData: z.string().describe("Base64 encoded file data"),
      }),
      responses: {
        201: z.custom<typeof analysisResults.$inferSelect>(),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
        500: errorSchemas.internal,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/analysis/:id',
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

// ============================================
// HELPER FUNCTIONS
// ============================================
export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

// ============================================
// TYPE HELPERS
// ============================================
export type AnalysisInput = z.infer<typeof api.analysis.upload.input>;
export type AnalysisResponse = z.infer<typeof api.analysis.upload.responses[201]>;
export type AnalysisListResponse = z.infer<typeof api.analysis.list.responses[200]>;
