export const getApiUrl = (): string => {
    // In development, ALWAYS return empty string to use Vite proxy (forwards to localhost:5000)
    // This overrides any localStorage setting to prevent "Failed to fetch" errors from stale configs
    if (import.meta.env.DEV) {
        return "";
    }

    // Check localStorage for user-configured backend (only in production)
    const stored = localStorage.getItem("api_url");
    if (stored) {
        // Remove trailing slash if present
        return stored.replace(/\/$/, "");
    }

    // Default for production
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

export const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
    const baseUrl = getApiUrl();
    const url = `${baseUrl}${endpoint}`;

    // Ensure credentials are included for CORS requests to work with cookies/sessions
    const defaultOptions: RequestInit = {
        ...options,
        credentials: "include",
        headers: {
            "Content-Type": "application/json",
            ...options.headers,
        },
    };

    const response = await fetch(url, defaultOptions);
    return response;
};
