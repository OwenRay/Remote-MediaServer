// Web/test stub for react-native-google-cast integration
// This avoids accessing native modules during Jest tests and on web.
import type { MediaItem } from '@/src/features/library/model/media';

export function useGoogleCast() {
  const startCasting = async (_item?: MediaItem, _onStarted?: () => void) => {};
  const stopCasting = async () => {};
  const castPlay = async () => {};
  const castPause = async () => {};
  const castSeek = async (_pos: number) => {};
  const castSetVolume = async (_v: number) => {};
  const castLoadItem = async (_item: MediaItem) => {};
  const CastButtonComponent = null as any;

  return {
    devices: [] as any[],
    isCasting: false,
    startCasting,
    stopCasting,
    CastButtonComponent,
    client: undefined,
    castPlay,
    castPause,
    castSeek,
    castSetVolume,
    castLoadItem,
  } as const;
}
