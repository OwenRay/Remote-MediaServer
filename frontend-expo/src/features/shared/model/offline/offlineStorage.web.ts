import {getBaseUrl} from '@/src/features/shared/model/api/base';

export type OfflineEntry = { id: string; uri: string; size?: number };

const REG_KEY = 'offline-media-registry-v1';
const CACHE_NAME = 'offline-media-v1';

function loadRegistry(): Record<string, OfflineEntry> {
  try { return JSON.parse(localStorage.getItem(REG_KEY) || '{}'); } catch { return {}; }
}
function saveRegistry(reg: Record<string, OfflineEntry>) {
  localStorage.setItem(REG_KEY, JSON.stringify(reg));
}

const urlMap = new Map<string, string>(); // id -> object URL

export async function isAvailable(id: string): Promise<boolean> {
  const cache = await caches.open(CACHE_NAME);
  const req = new Request(`${getBaseUrl()}/download/${id}`);
  const match = await cache.match(req);
  return !!match;
}

export async function getUri(id: string): Promise<string | undefined> {
  const cache = await caches.open(CACHE_NAME);
  const req = new Request(`${getBaseUrl()}/download/${id}`);
  const match = await cache.match(req);
  if (!match) return undefined;
  const blob = await match.blob();
  // reuse if we already created one
  const existing = urlMap.get(String(id));
  if (existing) return existing;
  const url = URL.createObjectURL(blob);
  urlMap.set(String(id), url);
  return url;
}

export async function download(id: string): Promise<boolean> {
  try {
    const cache = await caches.open(CACHE_NAME);
    const req = new Request(`${getBaseUrl()}/download/${id}`);
    const res = await fetch(req, { credentials: 'include' });
    if (!res.ok) return false;
    await cache.put(req, res.clone());
    const size = Number(res.headers.get('Content-Length') || '0');
    const reg = loadRegistry();
    reg[String(id)] = { id: String(id), uri: req.url, size };
    saveRegistry(reg);
    return true;
  } catch {
    return false;
  }
}

export async function remove(id: string): Promise<void> {
  const cache = await caches.open(CACHE_NAME);
  const req = new Request(`${getBaseUrl()}/download/${id}`);
  await cache.delete(req);
  const old = urlMap.get(String(id));
  if (old) URL.revokeObjectURL(old);
  urlMap.delete(String(id));
  const reg = loadRegistry();
  delete reg[String(id)];
  saveRegistry(reg);
}

export async function list(): Promise<OfflineEntry[]> {
  const reg = loadRegistry();
  return Object.values(reg);
}

export const isSupported = typeof window !== 'undefined' && 'caches' in window;

