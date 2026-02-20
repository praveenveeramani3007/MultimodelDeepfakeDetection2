// ── Session Token Helpers ──────────────────────────────────────────────────
// We store the session token in localStorage so it persists across page
// refreshes and can be sent as an Authorization header on cross-origin
// requests (GitHub Pages → Render). Cookies with SameSite=Lax are silently
// blocked by browsers on cross-origin requests, so we cannot rely on them.

export const getSessionToken = (): string | null => localStorage.getItem("session_token");

export const setSessionToken = (token: string | null) => {
    if (token) {
        localStorage.setItem("session_token", token);
    } else {
        localStorage.removeItem("session_token");
    }
};

// ── API Base URL ───────────────────────────────────────────────────────────
export const getApiUrl = (): string => {
    // In development, ALWAYS return empty string to use Vite proxy (forwards to localhost:5000)
    // This overrides any localStorage setting to prevent "Failed to fetch" errors from stale configs
    if (import.meta.env.DEV) {
        return "";
    }

    // Check localStorage for user-configured backend (only in production)
    const stored = localStorage.getItem("api_url");
    if (stored) {
        // SAFETY CHECK: In production, ignore 'localhost' or '127.0.0.1'
        if (stored.includes("localhost") || stored.includes("127.0.0.1")) {
            console.warn("Ignoring invalid local API URL in production:", stored);
            localStorage.removeItem("api_url"); // Auto-cleanup
        } else {
            // Remove trailing slash if present
            return stored.replace(/\/$/, "");
        }
    }

    // Default production backend (Render)
    const prodUrl = "https://multimodeldeepfakedetection2.onrender.com";
    console.log("API URL configured as:", prodUrl);
    return prodUrl;
};

export const setApiUrl = (url: string) => {
    if (!url) {
        localStorage.removeItem("api_url");
        return;
    }
    localStorage.setItem("api_url", url);
};

// ── Core Request Function ──────────────────────────────────────────────────
export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = getApiUrl();
    const url = `${baseUrl}${endpoint}`;

    // Get stored token for cross-origin Authorization header
    const token = getSessionToken();

    const defaultOptions: RequestInit = {
        ...options,
        // credentials: "include" still allows cookies in same-origin / local dev
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            // Send token as Authorization header — this is the key fix for cross-origin.
            // Cookies (SameSite=Lax) are blocked by browsers on cross-origin requests,
            // but Authorization headers work fine with proper CORS allow_headers.
            ...(token ? { "Authorization": `Bearer ${token}` } : {}),
            ...options.headers,
        },
    };

    const response = await fetch(url, defaultOptions);
    return response;
};
