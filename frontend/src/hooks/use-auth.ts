import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";

async function fetchUser(): Promise<User | null> {
  try {
    const response = await apiRequest("/api/auth/user");

    if (response.status === 401 || response.status === 404) {
      return null;
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      // If we get HTML (like a 404 page from GitHub Pages), treat as not logged in
      return null;
    }

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn("Auth check failed:", error);
    return null;
  }
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: user, isLoading } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiRequest("/api/login", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        // Try to parse JSON, fail gracefully if it's not JSON (e.g. 404 HTML)
        try {
          const error = await res.json();
          throw new Error(error.message || "Login failed");
        } catch (e: any) {
          throw new Error(`Login failed:Server Connection Error (${res.status})`);
        }
      }
      return res.json();
    },
    onSuccess: (user: User) => {
      queryClient.setQueryData(["/api/auth/user"], user);
      toast({ title: "Welcome back!", description: `Logged in as ${user.username}` });
    },
    onError: (error: Error) => {
      toast({ title: "Login Failed", description: error.message, variant: "destructive" });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: any) => {
      const res = await apiRequest("/api/register", {
        method: "POST",
        body: JSON.stringify(credentials),
      });
      if (!res.ok) {
        try {
          const error = await res.json();
          throw new Error(error.message || "Registration failed");
        } catch (e: any) {
          throw new Error(`Registration failed: Server Connection Error (${res.status})`);
        }
      }
      return res.json();
    },
    onSuccess: async (data, variables) => {
      toast({ title: "Registration Successful", description: "Logging you in now..." });
      // Auto-login with the same credentials
      loginMutation.mutate({ username: variables.username, password: variables.password });
    },
    onError: (error: Error) => {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("/api/logout", { method: "POST" });
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/user"], null);
      window.location.href = "/"; // Refresh to clear state
    },
  });

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    loginMutation,
    registerMutation,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}

