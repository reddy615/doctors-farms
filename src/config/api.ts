/**
 * API Configuration
 * 
 * Determines the correct API base URL with priority:
 * 1. Environment variable VITE_API_URL (production deployment)
 * 2. Window origin (same domain as frontend)
 * 3. Fallback to localhost:5003 (local development)
 */

export const getApiBaseUrl = (): string => {
  // First priority: Environment variable (set in .env, .env.production, or deployment)
  // Use this for deployed backends: https://doctors-farms-backend.up.railway.app
  const envUrl = import.meta.env.VITE_API_URL;
  
  if (envUrl) {
    return envUrl.replace(/\/$/, ''); // Remove trailing slash if present
  }

  // Second priority: For production builds, use window.location.origin
  // This works on any domain (localhost, IP address, production domain)
  if (import.meta.env.PROD) {
    // In production, API is typically on the same origin
    return window.location.origin;
  }

  // Third priority: Development fallback
  // Check if running on custom host/IP, otherwise use standard localhost
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  
  // If already on a specific host/IP (not plain localhost), use that
  if (host !== 'localhost' && host !== '127.0.0.1') {
    return `${protocol}//${host}:5003`;
  }

  // Default to localhost:5003 for development
  return 'http://localhost:5003';
};

export const API_BASE_URL = getApiBaseUrl();

// Helper function to construct API endpoints with error handling
export const getApiEndpoint = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

/**
 * Fetch wrapper with better error handling
 * Shows "Server not reachable" instead of generic "Failed to fetch"
 */
export const apiFetch = async (
  endpoint: string,
  options?: RequestInit
): Promise<Response> => {
  try {
    const url = getApiEndpoint(endpoint);
    console.log(`[API] ${options?.method || 'GET'} ${url}`);
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response;
  } catch (error) {
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error(
        `Server not reachable. Please check if the API server is running at ${API_BASE_URL}`
      );
    }
    throw error;
  }
};
