import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl, type AnalysisInput, type AnalysisResponse } from "@shared/routes";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

export function useAnalysisHistory() {
  return useQuery({
    queryKey: [api.analysis.list.path],
    queryFn: async () => {
      const res = await fetch(api.analysis.list.path, { credentials: "include" });
      if (!res.ok) {
        if (res.status === 401) throw new Error("Unauthorized");
        throw new Error("Failed to fetch history");
      }
      return api.analysis.list.responses[200].parse(await res.json());
    },
  });
}

export function useAnalysisResult(id: number) {
  return useQuery({
    queryKey: [api.analysis.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.analysis.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch result");
      return api.analysis.get.responses[200].parse(await res.json());
    },
    enabled: !!id,
  });
}

export function useUploadAnalysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  return useMutation({
    mutationFn: async (data: AnalysisInput) => {
      const validated = api.analysis.upload.input.parse(data);
      const res = await fetch(api.analysis.upload.path, {
        method: api.analysis.upload.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to analyze file");
      }
      return api.analysis.upload.responses[201].parse(await res.json());
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [api.analysis.list.path] });
      toast({
        title: "Analysis Complete",
        description: `Successfully analyzed ${data.fileName}`,
      });
      setLocation(`/analysis/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    },
  });
}

export function useDeleteAnalysis() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.analysis.delete.path, { id });
      const res = await fetch(url, {
        method: api.analysis.delete.method,
        credentials: "include"
      });
      if (!res.ok) throw new Error("Failed to delete record");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.analysis.list.path] });
      toast({
        title: "Record Deleted",
        description: "Analysis history item removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not delete record.",
        variant: "destructive",
      });
    },
  });
}
