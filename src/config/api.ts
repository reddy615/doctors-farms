/**
 * API Configuration
 * 
 * CRITICAL: Always uses VITE_API_URL environment variable
 * 
 * Configuration Priority:
 * 1. VITE_API_URL env var (REQUIRED for production)
 * 2. localhost:5003 (development fallback only)
 * 
 * ⚠️  Production deployments MUST set VITE_API_URL to backend URL
 * Example: VITE_API_URL=https://doctors-farms-backend.up.railway.app
 */

export const getApiBaseUrl = (): string => {
  // Priority 1: Environment variable (SET THIS IN PRODUCTION)
  const envUrl = import.meta.env.VITE_API_URL?.trim();

  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/$/, ''); // Remove trailing slash
    console.log(`✅ [API Config] Using VITE_API_URL: ${cleanUrl}`);
    return cleanUrl;
  }

  // Production mode REQUIRES VITE_API_URL - throw error if missing
  if (import.meta.env.PROD) {
    const errorMsg =
      '❌ CRITICAL: VITE_API_URL environment variable is NOT SET in production!\n' +
      'API calls will fail. Please set VITE_API_URL in:\n' +
      '- Railway Dashboard → Variables\n' +
      '- .env.production file\n' +
      '- Or your deployment platform environment variables\n' +
      'Example: VITE_API_URL=https://doctors-farms-backend.up.railway.app';
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  // Development fallback to production backend (for testing)
  const localUrl = 'https://doctors-farms-backend.up.railway.app';
  console.warn(`⚠️  [API Config] Development mode: VITE_API_URL missing, using fallback: ${localUrl}`);
  return localUrl;
};

export const API_BASE_URL = getApiBaseUrl();

// Log configuration on load
console.log('🔧 [API Configuration]');
console.log(`   Base URL: ${API_BASE_URL}`);
console.log(`   Environment: ${import.meta.env.MODE}`);
console.log(`   VITE_API_URL env var: ${import.meta.env.VITE_API_URL ? '✅ SET' : '❌ NOT SET'}`);
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.error('⚠️  WARNING: Production mode without VITE_API_URL will cause API failures!');
}

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
