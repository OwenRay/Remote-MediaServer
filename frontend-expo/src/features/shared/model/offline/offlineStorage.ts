import {Platform} from 'react-native';
import * as webImpl from './offlineStorage.web';
import * as nativeImpl from './offlineStorage.native';

const mod: any = Platform.OS === 'web' ? webImpl : nativeImpl;

export type OfflineEntry = { id: string; uri: string; size?: number };

export const isSupported: boolean = mod?.isSupported ?? false;
export const isAvailable: (id: string) => Promise<boolean> = mod?.isAvailable ?? (async () => false);
export const getUri: (id: string) => Promise<string | undefined> = mod?.getUri ?? (async () => undefined);
export const download: (id: string) => Promise<boolean> = mod?.download ?? (async () => false);
export const remove: (id: string) => Promise<void> = mod?.remove ?? (async () => { /* noop */ });
export const list: () => Promise<OfflineEntry[]> = mod?.list ?? (async () => []);
