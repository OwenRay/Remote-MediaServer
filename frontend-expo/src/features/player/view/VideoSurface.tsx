import React from 'react';
import {default as styled} from 'styled-components/native';
import {VideoView} from 'expo-video';
import {ThemedText} from '@/src/features/shared/view/ThemedText';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import type {PlayerController} from '@/src/features/player/domain/usePlayerController';

export type VideoSurfaceProps = {
  controller: PlayerController;
  onTogglePlay: () => void;
};

export function VideoSurface({controller, onTogglePlay}: VideoSurfaceProps) {
  const {player, error, retry} = controller;
  return (
    <VideoContainer onPress={onTogglePlay} testID="video-surface">
      <StyledVideoView nativeControls={false} player={player} />
      {error && (
        <OverlayCenter>
          <ErrorBox>
            <ErrorText>Playback error. Tap retry.</ErrorText>
            <RetryBtn onPress={retry}><RetryText>Retry</RetryText></RetryBtn>
          </ErrorBox>
        </OverlayCenter>
      )}
    </VideoContainer>
  );
}

const VideoContainer = styled.Pressable`
  flex: 1;
  background-color: black;
  justify-content: center;
`;

const StyledVideoView = styled(VideoView)`
  width: 100%;
  height: 100%;
`;

const OverlayCenter = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  align-items: center;
  justify-content: center;
`;

const ErrorBox = styled.View`
  background-color: rgba(0,0,0,0.6);
  padding: 12px;
  border-radius: 8px;
`;

const RetryBtn = styled(SecondaryButton)`
  margin-top: 8px;
  padding: 8px;
  border-radius: 4px;
`;

const RetryText = styled(ThemedText)`
  color: white;
`;

const ErrorText = styled(ThemedText)`
  color: white;
`;
