import { useCallback, useEffect, useRef, useState } from 'react';

export type ControlsVisibility = {
  controlsVisible: boolean;
  showControls: () => void;
  setControlsVisible: (v: boolean | ((v: boolean) => boolean)) => void;
  onSurfacePress: () => void;
};

// Handles auto-hide/show of player controls and tap behavior per platform
export function useControlsVisibility(): ControlsVisibility {
  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHideTimer = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const scheduleHide = useCallback(() => {
    clearHideTimer();
    hideTimer.current = setTimeout(() => setControlsVisible(false), 2000);
  }, [clearHideTimer]);

  const showControls = useCallback(() => {
    setControlsVisible(true);
    scheduleHide();
  }, [scheduleHide]);

  const onSurfacePress = useCallback(() => {
    // Toggle visibility; when showing, (re)start auto-hide timer
    setControlsVisible(prev => {
      const next = !prev;
      if (next) scheduleHide();
      return next;
    });
  }, [scheduleHide]);

  useEffect(() => {
    // start auto-hide after mount
    scheduleHide();
    return () => clearHideTimer();
  }, [scheduleHide, clearHideTimer]);

  return { controlsVisible, showControls, setControlsVisible, onSurfacePress };
}
