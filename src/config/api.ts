/**
 * API Configuration
 * 
 * API base URL strategy supports both split and combined deployments.
 * 
 * Configuration Priority:
 * 1. VITE_API_URL env var (preferred for split frontend/backend)
 * 2. Relative same-origin API paths (works for combined deployment)
 * 
 * ⚠️  In combined deployments, leave VITE_API_URL unset.
 * Example: VITE_API_URL=https://doctors-farms-backend.up.railway.app
 */

export const getApiBaseUrl = (): string => {
  // Priority 1: Environment variable (for separate deployments)
  const envUrl = import.meta.env.VITE_API_URL?.trim();
  
  if (envUrl) {
    const cleanUrl = envUrl.replace(/\/$/, '');
    console.log(`✅ [API Config] Using VITE_API_URL: ${cleanUrl}`);
    return cleanUrl;
  }

  // Priority 2: Use relative paths during local development when the backend is proxied on the same origin.
  console.log(`✅ [API Config] Using relative API paths (local same-origin fallback)`);
  return '';
};

export const API_BASE_URL = getApiBaseUrl();

// Log configuration on load
console.log('🔧 [API Configuration]');
console.log(`   Base URL: ${API_BASE_URL}`);
console.log(`   Environment: ${import.meta.env.MODE}`);
console.log(`   VITE_API_URL env var: ${import.meta.env.VITE_API_URL ? '✅ SET' : '❌ NOT SET'}`);
if (!import.meta.env.VITE_API_URL && import.meta.env.PROD) {
  console.log('ℹ️  [API Config] Production mode without VITE_API_URL: using same-origin APIs.');
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
  const cleanPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const primaryUrl = getApiEndpoint(cleanPath);
  const fallbackUrl = cleanPath;
  const method = options?.method || 'GET';
  
  console.log(`[API] ${method} ${primaryUrl}`);

  // Retry once with same-origin when an external API URL is configured but unreachable.
  // This keeps combined deployments working even if VITE_API_URL points to an old backend domain.
  const allowSameOriginFallback =
    !!API_BASE_URL && API_BASE_URL !== '' && API_BASE_URL !== window.location.origin;
  const urlsToTry = allowSameOriginFallback ? [primaryUrl, fallbackUrl] : [primaryUrl];

  let lastNetworkError: Error | null = null;

  for (let attempt = 0; attempt < urlsToTry.length; attempt++) {
    const url = urlsToTry[attempt];
    const isFallbackAttempt = attempt > 0;

    if (isFallbackAttempt) {
      console.warn(`[API] Retrying with same-origin fallback: ${url}`);
    }

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
        let backendError = '';
        if (text) {
          try {
            const parsed = JSON.parse(text);
            backendError = parsed?.error || parsed?.message || '';
          } catch {
            backendError = text;
          }
        }

        throw new Error(
          backendError
            ? `Server returned ${response.status}: ${backendError}`
            : `Server returned ${response.status}: ${response.statusText}`
        );
      }

      const contentType = response.headers.get('content-type') || '';
      const expectsJson = cleanPath.startsWith('/api') || cleanPath.includes('/api/');
      if (expectsJson && !contentType.toLowerCase().includes('application/json')) {
        const preview = (await response.text()).slice(0, 160).replace(/\s+/g, ' ').trim();
        throw new Error(
          `Expected JSON from API but received ${contentType || 'unknown content type'}. ` +
            `This usually means the request hit the frontend app URL instead of backend API. ` +
            `Set VITE_API_URL to your backend Railway URL and redeploy. ` +
            `Response preview: ${preview}`
        );
      }

      console.log(`[API] ✅ ${method} ${url} succeeded`);
      return response;
    } catch (error) {
      if (error instanceof Error) {
        console.error(`[API Error] ${method} ${url}:`, error.message);

        const isNetworkFailure =
          error.message === 'Failed to fetch' ||
          error.name === 'TypeError' ||
          error.message.includes('NetworkError');

        if (isNetworkFailure && attempt < urlsToTry.length - 1) {
          lastNetworkError = error;
          continue;
        }

        // Better error messages
        if (error.message === 'Failed to fetch') {
          const targetForMessage = API_BASE_URL || window.location.origin;
          throw new Error(
            `Cannot reach server at ${targetForMessage}\n\n` +
              `Possible causes:\n` +
              `• Backend server is not running\n` +
              `• Incorrect backend URL: ${targetForMessage}\n` +
              `• Network connectivity issue\n` +
              `• CORS policy blocking the request\n\n` +
              `${import.meta.env.PROD ? '• In Railway split deployment, ensure VITE_API_URL points to backend service URL\n• In combined deployment, remove VITE_API_URL and redeploy\n\n' : ''}` +
              `Try:\n` +
              `1. Check if backend is running\n` +
              `2. Visit ${targetForMessage}/health in your browser\n` +
              `3. Check browser DevTools > Network tab for CORS errors`
          );
        } else if (error.message.includes('AbortError') || error.name === 'AbortError') {
          throw new Error(
            `Request timeout after ${timeoutMs}ms\n\n` +
              `The server took too long to respond.\n` +
              `Backend may be sleeping or overloaded.`
          );
        } else if (error.message.includes('CORS') || error.message.includes('blocked')) {
          throw new Error(
            `CORS Error: Browser blocked the request\n\n` +
              `This usually means:\n` +
              `• Backend CORS not properly configured\n` +
              `• Frontend and backend on different origins\n` +
              `• Check browser console for details\n\n` +
              `Visit: ${API_BASE_URL || ''}/api/debug/cors`
          );
        }
        throw error;
      }
      
      throw new Error('Unknown error occurred');
    }
  }

  throw (
    lastNetworkError ||
    new Error('Cannot reach backend using either configured API URL or same-origin fallback.')
  );
};
