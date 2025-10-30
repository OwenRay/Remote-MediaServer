import {useEffect, useState} from 'react';
import {Platform} from 'react-native';
import {castService} from '@/src/features/cast/domain/castService';

export type CastState = {available: boolean; casting: boolean};

export function useCast() {
  const [state, setState] = useState<CastState>({available: false, casting: false});

  useEffect(() => {
    if (Platform.OS !== 'web') return;
    castService.init();
    const listener = (s: CastState) => setState(s);
    castService.addListener(listener);
    return () => castService.removeListener(listener);
  }, []);

  return {
    ...state,
    start: () => castService.startCasting(),
    stop: () => castService.stopCasting(),
    play: () => castService.play(),
    pause: () => castService.pause(),
    setVolume: (v: number) => castService.setVolume(v),
    loadMedia: (url: string, contentType: string, title?: string, imageUrl?: string, startTimeSec?: number) =>
      castService.loadMedia(url, contentType, title, imageUrl, startTimeSec),
  };
}
