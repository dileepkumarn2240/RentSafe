/**
 * Single source of truth for the backend API base URL.
 * - Development with Vite proxy: set VITE_API_BASE_URL=/api in .env.development
 * - Production or LAN: set full URL, e.g. https://api.example.com/api
 */
const raw = import.meta.env.VITE_API_BASE_URL as string | undefined;
const trimmed = raw?.replace(/\/$/, '') ?? '';

export const API_BASE =
  trimmed ||
  (typeof window !== 'undefined' ? 'http://localhost:8080/api' : 'http://localhost:8080/api');
