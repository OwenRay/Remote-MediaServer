import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {ActivityIndicator, Platform, TouchableWithoutFeedback} from 'react-native';
import {ThemedText} from '@/src/features/shared/view/themed-text';
import {default as styled} from 'styled-components/native';
import type {PlayerController} from '@/src/features/player/domain/usePlayerController';
import {VideoSurface} from '@/src/features/player/view/VideoSurface';
import {ControlsBar} from '@/src/features/player/view/ControlsBar';
import { getBaseUrl } from '@/src/features/shared/model/api/base';

export type PlayerScreenViewProps = {
  controller: PlayerController;
  duration?: number;
  hasData: boolean;
  missingId?: boolean;
};

export function PlayerScreenView({controller, duration, hasData, missingId}: PlayerScreenViewProps) {
  const {togglePlay} = controller;

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

  const mediaTitle = useMemo(() => {
    // Try to read title from controller if available; fallback empty
     
    const anyCtrl: any = controller as any;
    const item = anyCtrl?.item || anyCtrl?.media || anyCtrl?.playing;
    if (!item) return undefined;
    const t = item?.title;
    const season = item?.season;
    const episode = item?.episode;
    if (episode && season) {
      const ep = episode < 10 ? `0${episode}` : `${episode}`;
      const se = season < 10 ? `0${season}` : `${season}`;
      return `${t} - S${se}E${ep}`;
    }
    return t;
  }, [controller]);

  const posterUri = useMemo(() => {
    // Build legacy poster URL if id present
     
    const anyCtrl: any = controller as any;
    const item = anyCtrl?.item || anyCtrl?.media || anyCtrl?.playing;
    const id = item?.id;
    return id ? `${getBaseUrl()}/img/${id}_poster.jpg` : undefined;
  }, [controller]);

  const onToggleFullscreen = useCallback(() => {
    if (Platform.OS !== 'web') {
      controller.toggleFullscreen();
      return;
    }
    const el = document.getElementById('video-surface');
    if (!el) return;
    const docAny: any = document as any;
    if (!docAny.fullscreenElement) {
      (el as any).requestFullscreen?.();
    } else {
      docAny.exitFullscreen?.();
    }
  }, [controller]);

  if (missingId) {
    return (
      <Center>
        <ThemedText>Missing media id.</ThemedText>
      </Center>
    );
  }

  if (!hasData) {
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
      onMouseMove={Platform.OS === 'web' ? showControls : undefined as unknown as never}
    >
      <TouchableWithoutFeedback onPress={onSurfacePress}>
        <SurfaceContainer nativeID="video-surface">
          <VideoSurface controller={controller} onTogglePlay={togglePlay} />
        </SurfaceContainer>
      </TouchableWithoutFeedback>
      <ControlsBar
        controller={controller}
        duration={duration}
        visible={controlsVisible}
        title={mediaTitle}
        posterUri={posterUri}
        onToggleFullscreen={onToggleFullscreen}
      />
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
