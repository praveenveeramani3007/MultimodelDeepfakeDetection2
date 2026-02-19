export const getApiUrl = (): string => {
    // Check localStorage for user-configured backend
    const stored = localStorage.getItem("api_url");
    if (stored) {
        // Remove trailing slash if present
        return stored.replace(/\/$/, "");
    }

    // Default for development (proxy) or if not set (will fail on GH Pages until set)
    // Hardcoded fallback for immediate user success:
    return "https://multimodeldeepfakedetection2.onrender.com";
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
