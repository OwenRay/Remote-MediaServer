import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';
import type { PlayerController } from './usePlayerController';

export type FullscreenContainer = {
  containerRef: React.MutableRefObject<HTMLElement | null>;
  onToggleFullscreen: () => void;
};

// Provides a container ref with a cross‑platform fullscreen toggle handler
export function useFullscreenContainer(controller: PlayerController): FullscreenContainer {
  const containerRef = useRef<HTMLElement | null>(null);

  const onToggleFullscreen = useCallback(() => {
    if (Platform.OS !== 'web') {
      controller.toggleFullscreen();
      return;
    }
    const el = containerRef.current;
    if (!el) return;
    const docAny: any = document as any;
    if (!docAny.fullscreenElement) {
      (el as any).requestFullscreen?.();
    } else {
      docAny.exitFullscreen?.();
    }
  }, [controller]);

  return { containerRef, onToggleFullscreen };
}
