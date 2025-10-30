import React, {useCallback, useEffect, useRef, useState} from 'react';
import {ActivityIndicator, Platform, TouchableWithoutFeedback, Modal} from 'react-native';
import {ThemedText} from '@/src/features/shared/view/ThemedText';
import {default as styled} from 'styled-components/native';
import type {PlayerController} from '@/src/features/player/domain/usePlayerController';
import {VideoSurface} from '@/src/features/player/view/VideoSurface';
import {ControlsBar} from '@/src/features/player/view/ControlsBar';
import {SecondaryButton} from "@/src/features/shared/view/SecondaryButton";

export type PlayerScreenViewProps = {
  controller: PlayerController;
  onControlsVisibilityChange?: (visible: boolean) => void;
};

export function PlayerScreenView({controller, onControlsVisibilityChange}: PlayerScreenViewProps) {
  const containerRef = useRef<HTMLElement>(undefined);
  const {togglePlay, onSeek, setPaused, item, player, confirmResumeChoice} = controller;

  const [controlsVisible, setControlsVisible] = useState(true);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showResumeDialog, setShowResumeDialog] = useState(false);
  const resumePosRef = useRef(0);

  // notify parent when visibility changes (e.g., to hide/show top bar)
  useEffect(() => {
    onControlsVisibilityChange?.(controlsVisible);
  }, [controlsVisible, onControlsVisibilityChange]);

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

  // Show resume dialog if there is a saved position
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

  const onSurfacePress = useCallback(() => {
    // mimic legacy: on touch toggle visibility; click to play/pause is handled by VideoSurface via onTogglePlay
    if (Platform.OS !== 'web') {
      setControlsVisible(v => {
        const next = !v;
        if (next) scheduleHide();
        else clearHideTimer();
        return next;
      });
    }
  }, [clearHideTimer, scheduleHide]);

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

  if (!controller.item) {
    return (
      <Container>
        <Center>
          <ActivityIndicator size="large"/>
          <LoadingText>Loading media...</LoadingText>
        </Center>
      </Container>
    );
  }

  return (
    <Container
      // show controls on mouse move (web)
      ref={containerRef}
      // @todo show/hide on tap for mobile
      onMouseMove={Platform.OS === 'web' ? showControls : undefined}
    >
      <TouchableWithoutFeedback onPress={onSurfacePress}>
        <SurfaceContainer nativeID="video-surface">
          <VideoSurface controller={controller} onTogglePlay={() => {
            if(Platform.OS === 'web')
              return togglePlay();
            setControlsVisible(!controlsVisible)
          }} />
        </SurfaceContainer>
      </TouchableWithoutFeedback>

      {Platform.OS === 'web' ? (
        <ControlsBar
          controller={controller}
          visible={controlsVisible}
          onToggleFullscreen={onToggleFullscreen}
        />
      ) : (
        controlsVisible ? (
          <ControlsBar
            controller={controller}
            visible
            onToggleFullscreen={onToggleFullscreen}
          />
        ) : null
      )}

      <Modal
        transparent
        animationType="fade"
        visible={showResumeDialog}
        onRequestClose={() => setShowResumeDialog(false)}
      >
        <DialogBackdrop>
          <DialogCard>
            <DialogTitle>Continue watching?</DialogTitle>
            <DialogRow>
              You watched until <BoldText>{Math.ceil((resumePosRef.current || 0) / 60)}m</BoldText>, continue watching?
            </DialogRow>
            <DialogButtons>
              <DialogButton onPress={() => { confirmResumeChoice(); setShowResumeDialog(false); onSeek(0); try { player.play(); } catch { /* noop */ } setPaused(false); }}>
                <ButtonText>Start from beginning</ButtonText>
              </DialogButton>
              <SecondaryButton onPress={() => { confirmResumeChoice(); setShowResumeDialog(false); onSeek(resumePosRef.current || 0); try { player.play(); } catch { /* noop */ } setPaused(false); }}>
                <ButtonText>Continue watching</ButtonText>
              </SecondaryButton>
            </DialogButtons>
          </DialogCard>
        </DialogBackdrop>
      </Modal>
    </Container>
  );
}


const Container = styled.View`
  flex: 1;
  background-color: black;
`;

const SurfaceContainer = styled.View`
  flex: 1;
`;

const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const LoadingText = styled(ThemedText)`
  margin-top: 12px;
`;

// Inline styled components specific to this view
const DialogBackdrop = styled.View`
  flex: 1;
  background-color: rgba(0,0,0,0.6);
  align-items: center;
  justify-content: center;
`;

const DialogCard = styled.View`
  width: 88%;
  max-width: 520px;
  background-color: #121212;
  border-radius: 12px;
  padding: 20px;
`;

const DialogTitle = styled(ThemedText)`
  font-size: 20px;
  font-weight: 600;
  margin-bottom: 12px;
`;

const DialogRow = styled(ThemedText)`
  font-size: 16px;
  margin-bottom: 16px;
`;

const BoldText = styled(ThemedText)`
  font-weight: bold;
`;

const DialogButtons = styled.View`
  flex-direction: row;
  justify-content: flex-end;
  gap: 12px;
`;

const DialogButton = styled.TouchableOpacity`
  padding: 10px 14px;
  border-radius: 8px;
  background-color: #2a2a2a;
  margin-left: 12px;
`;

const ButtonText = styled(ThemedText)`
  font-size: 14px;
`;
