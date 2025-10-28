import {useCallback, useEffect, useMemo, useState} from 'react';
import {Platform} from 'react-native';
import {useVideoPlayer} from 'expo-video';
import {getBaseUrl} from '@/src/features/shared/model/api/base';
import {useWritePlayPositionMutation} from '@/src/features/player/model/playback';

export type PlayerControllerOptions = {
  id: string;
  duration?: number;
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
};

export function usePlayerController({id, duration}: PlayerControllerOptions): PlayerController {
  const [paused, setPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string>();
  const [writePos] = useWritePlayPositionMutation();

  // The stream source depends on id and our last committed seek anchor
  const source = useMemo(() => {
    const seek = Math.floor(position);
    return {uri: `${getBaseUrl()}/ply/${id}/${seek}`};
  }, [id, position]);

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

  // Auto play once we have a player and duration information available
  useEffect(() => {
    player.play();
    setPaused(false);
    return () => {
      if (id && (duration ?? 0) > 0) {
        writePos({mediaItemId: String(id), position, duration: duration!}).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, duration, player, position]);

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
  };
}
