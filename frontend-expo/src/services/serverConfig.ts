// Frontend-only server endpoint configuration (no Redux)
// Persists to AsyncStorage when available, or falls back to localStorage/in-memory.
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'frontend.serverBaseUrl';
const DEFAULT_BASE_URL = 'http://192.168.111.210:8234';

let baseUrl = DEFAULT_BASE_URL;
AsyncStorage.getItem(STORAGE_KEY)
  .then(res => {
    if(!res) return;
    baseUrl = sanitizeUrl(res)
  });



function sanitizeUrl(url: string) {
  let u = (url || '').trim();
  if (!u) return DEFAULT_BASE_URL;
  // Remove trailing slash
  u = u.replace(/\/$/, '');
  // Prepend protocol if missing
  if (!/^https?:\/\//i.test(u)) u = `http://${u}`;
  return u;
}

// Try to hydrate from storage (best-effort, non-blocking)
export function getBaseUrl() {
  return baseUrl;
}

export function getApiBaseUrl() {
  return `${baseUrl}/api`;
}

export async function setBaseUrl(next: string) {
  baseUrl = sanitizeUrl(next);
  await AsyncStorage.setItem(STORAGE_KEY, baseUrl);
}

export function getDefaultBaseUrl() {
  return DEFAULT_BASE_URL;
}
