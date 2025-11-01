import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';
import { useVideoPlayer } from 'expo-video';
import { useWritePlayPositionMutation } from '@/src/features/player/model/playback';
import { MediaItem, useGetItemQuery } from '@/src/features/library/model/media';
import { useOfflineUri } from '@/src/features/player/domain/useOfflineUri';
import { usePlayerSource } from '@/src/features/player/domain/usePlayerSource';
import { useResumeGate } from '@/src/features/player/domain/useResumeGate';

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
  const lastPositionSave = useRef(0);

  // Resolve offline availability for this id and build the source
  const offlineUri = useOfflineUri(id);
  const source = usePlayerSource(id, position, offlineUri);

  const player = useVideoPlayer(source);
  // player.stat

  // Keep an interval to force view updates based on currentTime changes
  const [, setReRender] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setReRender(Math.random()), 1000);
    return () => clearInterval(interval);
  }, [player]);

  // Decide if we should hold autoplay to show a resume dialog
  const shouldHoldForResume = useResumeGate(data, resumeConfirmed);

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
    try {
      const newTime = position + player.currentTime;
      const diff = Math.abs(newTime - lastPositionSave.current)
      if (id && data?.fileduration && diff > 5) {
        lastPositionSave.current = position + player.currentTime;
        writePos({mediaItemId: String(id), position: newTime, duration: data.fileduration});
      }
    }catch (e) {}
  }, [id, data?.fileduration, position, player, player.currentTime, writePos]);

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
  }, []);

  const retry = useCallback(() => {
    console.log('retry!!');
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
    position: position + player.currentTime || 0
  };
}
