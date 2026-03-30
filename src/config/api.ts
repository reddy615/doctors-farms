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
    console.log(`[API Config] Using VITE_API_URL: ${envUrl}`);
    return envUrl.replace(/\/$/, ''); // Remove trailing slash if present
  }

  // Second priority: For production builds, use window.location.origin
  // This works on any domain (localhost, IP address, production domain)
  if (import.meta.env.PROD) {
    console.log(`[API Config] Using window.location.origin: ${window.location.origin}`);
    return window.location.origin;
  }

  // Third priority: Development fallback
  // Check if running on custom host/IP, otherwise use standard localhost
  const host = window.location.hostname;
  const protocol = window.location.protocol;
  
  // If already on a specific host/IP (not plain localhost), use that
  if (host !== 'localhost' && host !== '127.0.0.1') {
    const url = `${protocol}//${host}:5003`;
    console.log(`[API Config] Using auto-detected IP: ${url}`);
    return url;
  }

  // Default to localhost:5003 for development
  const localUrl = 'http://localhost:5003';
  console.log(`[API Config] Using localhost: ${localUrl}`);
  return localUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// Log configuration on load
console.log('\ud83d\udd13 [API Configuration]');
console.log(`   Base URL: ${API_BASE_URL}`);
console.log(`   Environment: ${import.meta.env.MODE}`);
console.log(`   VITE_API_URL set: ${!!import.meta.env.VITE_API_URL}`);

// Helper function to construct API endpoints with error handling
export const getApiEndpoint = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};

/**
 * Fetch wrapper with better error handling and timeout
 * Shows user-friendly error messages
 */
export const apiFetch = async (
  endpoint: string,
  options?: RequestInit,
  timeoutMs: number = 30000
): Promise<Response> => {
  const url = getApiEndpoint(endpoint);
  const method = options?.method || 'GET';
  
  console.log(`[API] ${method} ${url}`);

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      console.error(`[API Error] ${response.status} ${response.statusText}:`, text);
      throw new Error(
        `Server returned ${response.status}: ${response.statusText}`
      );
    }

    console.log(`[API] ✅ ${method} ${url} succeeded`);
    return response;
  } catch (error) {
    if (error instanceof Error) {
      console.error(`[API Error] ${method} ${url}:`, error.message);

      // Better error messages
      if (error.message === 'Failed to fetch') {
        throw new Error(
          `Cannot reach server at ${API_BASE_URL}\n\n` +
          `Possible causes:\n` +
          `• Backend server is not running\n` +
          `• Incorrect backend URL: ${API_BASE_URL}\n` +
          `• Network connectivity issue\n` +
          `• CORS policy blocking the request\n\n` +
          `Try:\n` +
          `1. Check if backend is running\n` +
          `2. Visit ${API_BASE_URL}/health in your browser\n` +
          `3. Check browser DevTools > Network tab for CORS errors`
        );
      } else if (error.message.includes('AbortError') || error.name === 'AbortError') {
        throw new Error(
          `Request timeout after ${timeoutMs}ms\n\n` +
          `The server at ${API_BASE_URL} took too long to respond.\n` +
          `Backend may be sleeping or overloaded.`
        );
      } else if (error.message.includes('CORS') || error.message.includes('blocked')) {
        throw new Error(
          `CORS Error: Browser blocked the request\n\n` +
          `This usually means:\n` +
          `• Backend CORS not properly configured\n` +
          `• Frontend and backend on different origins\n` +
          `• Check browser console for details\n\n` +
          `Visit: ${API_BASE_URL}/api/debug/cors`
        );
      }
      
      throw error;
    }
    
    throw new Error('Unknown error occurred');
  }
};
