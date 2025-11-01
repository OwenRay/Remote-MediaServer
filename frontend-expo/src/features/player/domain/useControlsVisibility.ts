import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

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

  useEffect(() => {
    // start auto-hide after mount
    scheduleHide();
    return () => clearHideTimer();
  }, [scheduleHide, clearHideTimer]);

  const onSurfacePress = useCallback(() => {
    // On native (iOS/Android), tap toggles visibility; on web handled by VideoSurface
    if (Platform.OS !== 'web') {
      setControlsVisible(v => {
        const next = !v;
        if (next) scheduleHide();
        else clearHideTimer();
        return next;
      });
    }
  }, [clearHideTimer, scheduleHide]);

  return { controlsVisible, showControls, setControlsVisible, onSurfacePress };
}
