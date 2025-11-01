import { useCallback, useEffect, useRef, useState } from 'react';
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
  const { item, player, setPaused, onSeek, confirmResumeChoice } = controller;
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const resumePosRef = useRef(0);

  useEffect(() => {
    const pos = item?.playPosition?.position ?? 0;
    const watched = Boolean(item?.playPosition?.watched);
    if (item?.id && pos >= 5 && !watched) {
      resumePosRef.current = pos;
      setShowResumeDialog(true);
      try { player.pause(); } catch { /* noop */ }
      setPaused(true);
    } else {
      setShowResumeDialog(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const close = useCallback(() => setShowResumeDialog(false), []);

  const startFromBeginning = useCallback(() => {
    confirmResumeChoice();
    setShowResumeDialog(false);
    onSeek(0);
    try { player.play(); } catch { /* noop */ }
    setPaused(false);
  }, [confirmResumeChoice, onSeek, player, setPaused]);

  const continueWatching = useCallback(() => {
    confirmResumeChoice();
    setShowResumeDialog(false);
    onSeek(resumePosRef.current || 0);
    try { player.play(); } catch { /* noop */ }
    setPaused(false);
  }, [confirmResumeChoice, onSeek, player, setPaused]);

  return {
    showResumeDialog,
    resumePos: resumePosRef.current,
    startFromBeginning,
    continueWatching,
    close,
  };
}
