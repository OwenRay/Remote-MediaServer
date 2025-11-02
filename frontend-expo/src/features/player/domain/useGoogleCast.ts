import {useCallback, useEffect, useState} from 'react';
import { useCastState, useRemoteMediaClient, CastState, useDevices } from 'react-native-google-cast';
import type { MediaItem } from '@/src/features/library/model/media';
import { getBaseUrl } from '@/src/features/shared/model/api/base';
import type {PlayerController} from "@/src/features/player/domain/usePlayerController";

export type CastingController = PlayerController & {
  available:boolean;
}

export function useGoogleCast(controller:PlayerController): CastingController {
  const castState = useCastState();
  const client = useRemoteMediaClient();
  const [paused, setPaused] = useState(true);
  const [volume, setVolumeState] = useState(1);
  const [progressOffset, setProgressOffset] = useState(0);
  const [progress, setProgress] = useState(0);
  const devices = useDevices();
  const [loaded, setLoaded] = useState(-1);

  const isCasting = !!client && castState === CastState.CONNECTED;

  useEffect(() => {
    return () => {
      if(!client) return;
      // stop when unmounting
      console.log('usecast stop');
      client.stop();
    }
  }, [client])

  useEffect(() => {
    client?.onMediaProgressUpdated((progress, duration) => {
      console.log('usecast progress', progress, duration);
      setProgress(progress);
    });
    client?.onMediaPlaybackStarted((status) => {
      setPaused(false);
    });
    client?.onMediaStatusUpdated((status) => {
      setPaused(status?.playerState === 'paused');
      setVolumeState(status?.volume || 1);
    });
  }, [client]);

  useEffect(() => {
    // we disconnected and need to start the regular player again
    if(loaded!==-1 && castState === CastState.NOT_CONNECTED && progress !== 0) {
      setLoaded(-1);
      setProgress(0);
      setProgressOffset(0);
      setPaused(true);
      controller.onSeek(progress + progressOffset);
    }

  }, [castState, controller, isCasting, loaded, progress, progressOffset])

  const loadMediaForItem = useCallback(async (item: MediaItem, position: number, startPaused:boolean) => {
    if (!client) return;
    const mediaInfo = {
      contentUrl: `${getBaseUrl()}/ply/${item.id}/${Math.floor(position)}`,
      contentType: 'video/mp4',
      metadata: {
        type: 'movie',
        title: item.title,
        images: item.backdropUrl ? [{ url: item.backdropUrl }] : undefined,
      },
      streamDuration: Number(item.fileduration ?? 0),
    } as const;
    console.log('usecast load media', mediaInfo, !startPaused);
    await client.loadMedia({
      mediaInfo,
      autoplay: !startPaused,
    });
    const status = await client.getMediaStatus();
    setVolumeState(status?.volume || 1);

  }, [client]);

  useEffect(() => {
    // When client becomes available and a pending offset exists, load it
    const shouldLoadFrom = progressOffset || controller.position;
    if (client && controller.item && castState === CastState.CONNECTED && loaded !== shouldLoadFrom) {
      if(!controller.paused)
        controller.togglePlay();
      setProgressOffset(shouldLoadFrom);
      setLoaded(shouldLoadFrom);
      setPaused(controller.paused && paused);
      console.log('usecast start casting');
      void loadMediaForItem(controller.item, shouldLoadFrom, controller.paused && paused);
    }
  }, [client, loadMediaForItem, castState, controller.item, loaded, controller.position, progressOffset, controller, paused]);

  // const CastButtonComponent = useMemo(() => RNCastButton as any, []);

  // Control helpers routed to Chromecast
  const togglePlay = useCallback(async () => {
    console.log('usecast toggle play', paused);
    if(paused) client?.play();
    else client?.pause();
    setPaused(!paused);
  }, [client, paused]);
  const onSeek = useCallback(async (position: number) => {
    setPaused(false);
    setProgressOffset(position);
  }, []);
  const setVolume = useCallback(async (v: number) => {
    await client?.setStreamVolume(v);
    setVolumeState(v);
  }, [client]);
  // const castLoadItem = useCallback(async (item: MediaItem) => { await loadMediaForItem(item); }, [loadMediaForItem]);

  return {
    ...controller,
    paused,
    togglePlay,
    onSeek,
    setVolume,
    volume,
    isCasting,
    currentTime: progressOffset,
    position: progressOffset + progress,
    item:controller.item,
    available: devices.length > 0,
};
}
