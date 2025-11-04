import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useVideoPlayer } from 'expo-video';
import { useWritePlayPositionMutation } from '@/src/features/player/model/playback';
import { MediaItem, useGetItemQuery } from '@/src/features/library/model/media';
import { useOfflineUri } from '@/src/features/player/domain/useOfflineUri';
import { usePlayerSource } from '@/src/features/player/domain/usePlayerSource';

export type PlayerControllerOptions = {
  id: string;
};

export type PlayerController = {
  paused: boolean;
  position: number; // manually tracked seek anchor
  onSeek: (val: number) => void;
  currentTime: number; // player current time
  volume: number;
  setVolume: (v: number) => void;
  togglePlay: () => void;
  error?: string;
  retry: () => void;
  toggleFullscreen: () => void;
  item?:MediaItem;
  isCasting: boolean;
  player: ReturnType<typeof useVideoPlayer>;
  audioChannel?: number;
  videoChannel?: number;
  subtitle?: string | null;
  setAudioChannel: (n: number) => void;
  setVideoChannel: (n: number) => void;
  setSubtitle: (s: string | null) => void;
};

export function usePlayerController({id}: PlayerControllerOptions): PlayerController {
  const {data} = useGetItemQuery(id);
  const [paused, setPaused] = useState(true);
  const [position, setPosition] = useState(0);
  const [volume, setVolume] = useState(1);
  const [error, setError] = useState<string>();
  const [writePos] = useWritePlayPositionMutation();
  const lastPositionSave = useRef(0);

  const [audioChannel, setAudioChannel] = useState<number | undefined>(undefined);
  const [videoChannel, setVideoChannel] = useState<number | undefined>(undefined);
  const [subtitle, setSubtitle] = useState<string | null>(null);

  // Resolve offline availability for this id and build the source
  const offlineUri = useOfflineUri(id);
  const source = usePlayerSource(id, position, offlineUri, audioChannel, videoChannel);

  const player = useVideoPlayer(source, (p) => {
    console.log('player done', paused);
    if(!paused) p.play();
  });

  // Keep an interval to force view updates based on currentTime changes
  const [, setReRender] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setReRender(Math.random()), 1000);
    return () => clearInterval(interval);
  }, [player]);

  // Persist last known position on unmount
  useEffect(() => () => {
    try {
      const newTime = position + player.currentTime;
      const diff = Math.abs(newTime - lastPositionSave.current)
      if (id && data?.fileduration && diff > 5) {
        lastPositionSave.current = position + player.currentTime;
        writePos({mediaItemId: String(id), position: newTime, duration: data.fileduration});
      }
    }catch {
      // ignore persistence errors
    }
  }, [id, data?.fileduration, position, player, player.currentTime, writePos]);

  const togglePlay = useCallback(() => {
    if (paused) player.play();
    else player.pause();
    setPaused(!paused);
  }, [paused, player]);

  const onSeek = useCallback((val: number) => {
    setPaused(false);
    setPosition(val);
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
    paused,
    onSeek,
    currentTime: player.currentTime,
    volume,
    setVolume,
    togglePlay,
    error,
    retry,
    toggleFullscreen,
    item: data,
    position: position + player.currentTime || 0,
    isCasting: false,
    player,
    audioChannel,
    videoChannel,
    subtitle,
    setAudioChannel: (channel:number) => {
      onSeek(position + player.currentTime);
      setAudioChannel(channel);
    },
    setVideoChannel: (channel:number) => {
      onSeek(position + player.currentTime);
      setVideoChannel(channel);
    },
    setSubtitle: (s: string | null) => {
      onSeek(position + player.currentTime);
      setSubtitle(s);
    },
  };
}
