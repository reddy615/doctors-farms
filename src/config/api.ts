/**
 * API Configuration
 * 
 * This utility determines the correct API base URL depending on the environment:
 * - Development: Uses environment variable or falls back to current origin
 * - Production: Uses environment variable VITE_API_URL
 */

export const getApiBaseUrl = (): string => {
  // First priority: Environment variable (set in .env or .env.local)
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

// Helper function to construct API endpoints
export const getApiEndpoint = (path: string): string => {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${cleanPath}`;
};
