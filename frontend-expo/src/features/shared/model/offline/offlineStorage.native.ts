 
import * as FileSystem from 'expo-file-system';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {getBaseUrl} from '@/src/features/shared/model/api/base';

export type OfflineEntry = { id: string; uri: string; size?: number };

const REGISTRY_KEY = 'offline-media-registry-v1';

async function loadRegistry(): Promise<Record<string, OfflineEntry>> {
  try {
    const raw = await AsyncStorage.getItem(REGISTRY_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

async function saveRegistry(reg: Record<string, OfflineEntry>) {
  await AsyncStorage.setItem(REGISTRY_KEY, JSON.stringify(reg));
}

async function ensureDir(): Promise<string> {
  const dir = (FileSystem as any).documentDirectory + 'offline-media/';
  const info = await FileSystem.getInfoAsync(dir);
  if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
  return dir;
}

export async function isAvailable(id: string): Promise<boolean> {
  const reg = await loadRegistry();
  const entry = reg[String(id)];
  if (!entry) return false;
  const info = await FileSystem.getInfoAsync(entry.uri);
  return info.exists;
}

export async function getUri(id: string): Promise<string | undefined> {
  const reg = await loadRegistry();
  const entry = reg[String(id)];
  const exists = entry ? (await FileSystem.getInfoAsync(entry.uri)).exists : false;
  return exists ? entry.uri : undefined;
}

export async function download(id: string): Promise<boolean> {
  try {
    const dir = await ensureDir();
    const dest = `${dir}${id}`; // no extension needed
    const url = `${getBaseUrl()}/download/${id}`;
    const res = await FileSystem.downloadAsync(url, dest);
    if (!res || !res.uri) return false;
    const reg = await loadRegistry();
    reg[String(id)] = { id: String(id), uri: res.uri, size: res.headers ? Number(res.headers['Content-Length'] ?? 0) : undefined };
    await saveRegistry(reg);
    return true;
  } catch {
    return false;
  }
}

export async function remove(id: string): Promise<void> {
  const reg = await loadRegistry();
  const entry = reg[String(id)];
  try {
    if (entry) await FileSystem.deleteAsync(entry.uri, { idempotent: true });
  } catch {}
  delete reg[String(id)];
  await saveRegistry(reg);
}

export async function list(): Promise<OfflineEntry[]> {
  const reg = await loadRegistry();
  return Object.values(reg);
}

export const isSupported = true;
