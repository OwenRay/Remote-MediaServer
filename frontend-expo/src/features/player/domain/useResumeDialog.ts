import { useCallback, useEffect, useState } from 'react';
import type { PlayerController } from './usePlayerController';

export type ResumeDialogState = {
  showResumeDialog: boolean;
  resumePos: number;
  startFromBeginning: () => void;
  continueWatching: () => void;
  close: () => void;
};

// Handles resume modal visibility and actions
export function useResumeDialog(controller: PlayerController): ResumeDialogState {
  const { item, onSeek } = controller;
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const [isDone, setIsDone] = useState(false);

  useEffect(() => {
    if(!item?.id) return;
    if(isDone) return;

    const pos = item?.playPosition?.position ?? 0;
    const watched = Boolean(item?.playPosition?.watched);
    if(pos <= 5 || watched) {
      setIsDone(true);
      controller.togglePlay();
      return;
    } else if(!showResumeDialog) {
      setShowResumeDialog(true);
      setIsDone(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id, isDone, showResumeDialog]);

  const close = useCallback(() => setShowResumeDialog(false), []);

  const startFromBeginning = useCallback(() => {
    setShowResumeDialog(false);
    onSeek(0);
  }, [onSeek]);

  const continueWatching = useCallback(() => {
    setShowResumeDialog(false);
    onSeek(item?.playPosition?.position || 0);
  }, [onSeek, item?.playPosition?.position]);

  return {
    showResumeDialog,
    resumePos: item?.playPosition?.position || 0,
    startFromBeginning,
    continueWatching,
    close,
  };
}
