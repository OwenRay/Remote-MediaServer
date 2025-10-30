import {useCallback, useEffect, useMemo, useState} from 'react';
import {Platform} from 'react-native';
import {useVideoPlayer} from 'expo-video';
import {getBaseUrl} from '@/src/features/shared/model/api/base';
import {useWritePlayPositionMutation} from '@/src/features/player/model/playback';
import {MediaItem, useGetItemQuery} from "@/src/features/library/model/media";
import * as offline from '@/src/features/shared/model/offline';

export type PlayerControllerOptions = {
  id: string;
};

export type PlayerController = {
  player: ReturnType<typeof useVideoPlayer>;
  paused: boolean;
  setPaused: (p: boolean) => void;
  position: number; // manually tracked seek anchor
  onSeek: (val: number) => void;
  currentTime: number; // player current time
  volume: number;
  setVolume: (v: number) => void;
  togglePlay: () => void;
  error?: string;
  retry: () => void;
  toggleFullscreen: () => void;
  confirmResumeChoice: () => void;
  item?:MediaItem;
};

export function usePlayerController({id}: PlayerControllerOptions): PlayerController {
  const {data} = useGetItemQuery(id);
  const [paused, setPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string>();
  const [writePos] = useWritePlayPositionMutation();
  const [resumeConfirmed, setResumeConfirmed] = useState(false);
  const [offlineUri, setOfflineUri] = useState<string | undefined>();

  // Resolve offline availability for this id
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!id) return setOfflineUri(undefined);
        const uri = await offline.getUri(String(id));
        if (mounted) setOfflineUri(uri);
      } catch {
        if (mounted) setOfflineUri(undefined);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  // The source prefers offline file when present; otherwise stream with seek anchor
  const source = useMemo(() => {
    if (offlineUri) return { uri: offlineUri };
    const seek = Math.floor(position);
    return {uri: `${getBaseUrl()}/ply/${id}/${seek}`};
  }, [id, position, offlineUri]);

  const player = useVideoPlayer(source, () => {
    // no-op, but keeps parity with previous implementation
    // console.log('video player created');
  });

  // Keep an interval to force view updates based on currentTime changes
  const [, setReRender] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setReRender(Math.random()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Decide if we should hold autoplay to show a resume dialog
  const shouldHoldForResume = useMemo(() => {
    const resumePos = data?.playPosition?.position ?? 0;
    const watched = Boolean(data?.playPosition?.watched);
    return resumePos >= 5 && !watched && !resumeConfirmed;
  }, [data?.playPosition?.position, data?.playPosition?.watched, resumeConfirmed]);

  // Auto play once we have a player and we're not waiting on the resume dialog
  useEffect(() => {
    if (!shouldHoldForResume) {
      player.play();
      setPaused(false);
    } else {
      // ensure paused when waiting
      try { player.pause(); } catch { /* noop */ }
      setPaused(true);
    }

  }, [id, data?.fileduration, player, position, shouldHoldForResume]);

  // Persist last known position on unmount
  useEffect(() => () => {
    if (id && data?.fileduration && data?.fileduration > 0) {
      writePos({mediaItemId: String(id), position, duration: data?.fileduration});
    }
  }, [id, data?.fileduration, position, writePos]);

  // When using offline playback, we cannot pass a seek anchor via URL; attempt to seek after player is (re)created
  useEffect(() => {
    if (!offlineUri) return; // only for offline
    const seekTo = Math.floor(position);
    try {
      // expo-video 6 exposes a "seek" method on the player
      // @ts-ignore
      if (typeof (player as any).seek === 'function') {
        (player as any).seek(seekTo);
      }
    } catch { /* noop */ }
  }, [offlineUri, position, player]);

  const togglePlay = useCallback(() => {
    setPaused((p) => {
      const next = !p;
      if (player.playing) player.pause();
      else player.play();
      return next;
    });
  }, [player]);

  const onSeek = useCallback((val: number) => {
    setPosition(val);
    setPaused(false);
    // switching source with new seek anchor will cause player to continue from there
  }, []);

  const retry = useCallback(() => {
    setError(undefined);
    setPosition((p) => p + 0.001);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (Platform.OS !== 'web') return;
    const el: any = (document as any).fullscreenElement ? document : document.documentElement;
    if (!(document as any).fullscreenElement) el?.requestFullscreen?.();
    else el?.exitFullscreen?.();
  }, []);

  // Reset resume confirmation when item changes
  useEffect(() => {
    setResumeConfirmed(false);
  }, [id]);

  const confirmResumeChoice = useCallback(() => {
    setResumeConfirmed(true);
  }, []);

  return {
    player,
    paused,
    setPaused,
    position,
    onSeek,
    currentTime: player.currentTime,
    volume,
    setVolume,
    togglePlay,
    error,
    retry,
    toggleFullscreen,
    confirmResumeChoice,
    item: data,
  };
}
