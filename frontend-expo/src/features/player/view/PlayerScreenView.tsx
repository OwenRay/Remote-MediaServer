import React, { useEffect } from 'react';
import { ActivityIndicator, Platform, TouchableWithoutFeedback, Modal } from 'react-native';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { default as styled } from 'styled-components/native';
import type { PlayerController } from '@/src/features/player/domain/usePlayerController';
import { VideoSurface } from '@/src/features/player/view/VideoSurface';
import { ControlsBar } from '@/src/features/player/view/ControlsBar';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import { useControlsVisibility } from '@/src/features/player/domain/useControlsVisibility';
import { useFullscreenContainer } from '@/src/features/player/domain/useFullscreenContainer';
import { useResumeDialog } from '@/src/features/player/domain/useResumeDialog';
import {formatTime} from "@/src/features/shared/utils/time";

export type PlayerScreenViewProps = {
  controller: PlayerController;
  onControlsVisibilityChange?: (visible: boolean) => void;
};

export function PlayerScreenView({ controller, onControlsVisibilityChange }: PlayerScreenViewProps) {
  const { controlsVisible, showControls, setControlsVisible, onSurfacePress } = useControlsVisibility();
  const { containerRef, onToggleFullscreen } = useFullscreenContainer(controller);
  const { showResumeDialog, resumePos, startFromBeginning, continueWatching, close } = useResumeDialog(controller);
  const { togglePlay } = controller;

  useEffect(() => {
    onControlsVisibilityChange?.(controlsVisible);
  }, [controlsVisible, onControlsVisibilityChange]);

  if (!controller.item) {
    return (
      <Container>
        <Center>
          <ActivityIndicator size="large" />
          <LoadingText>Loading media...</LoadingText>
        </Center>
      </Container>
    );
  }

  return (
    <Container
      ref={containerRef as any}
      onMouseMove={Platform.OS === 'web' ? showControls : undefined}
    >
      <TouchableWithoutFeedback onPress={onSurfacePress}>
        <SurfaceContainer nativeID="video-surface">
          <VideoSurface
            controller={controller}
            onTogglePlay={() => {
              if (Platform.OS === 'web') return togglePlay();
              setControlsVisible((v) => !v);
            }}
          />
        </SurfaceContainer>
      </TouchableWithoutFeedback>

      <ControlsBar controller={controller} visible={controlsVisible} onToggleFullscreen={onToggleFullscreen} />

      <Modal transparent animationType="fade" visible={showResumeDialog} onRequestClose={close}>
        <DialogBackdrop>
          <DialogCard>
            <DialogTitle>Continue watching?</DialogTitle>
            <DialogRow>
              You watched until <BoldText>{formatTime(resumePos)}</BoldText>, continue watching?
            </DialogRow>
            <DialogButtons>
              <DialogButton onPress={startFromBeginning}>
                <ButtonText>Start from beginning</ButtonText>
              </DialogButton>
              <SecondaryButton onPress={continueWatching}>
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
