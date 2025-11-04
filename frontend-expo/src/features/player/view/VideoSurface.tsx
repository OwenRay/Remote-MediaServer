import React from 'react';
import {default as styled} from 'styled-components/native';
import {VideoView} from 'expo-video';
import {ThemedText} from '@/src/features/shared/view/ThemedText';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import type {PlayerController} from '@/src/features/player/domain/usePlayerController';
import {ImageBackground, Pressable} from "react-native";
import { SubtitleOverlay } from '@/src/features/player/view/SubtitleOverlay';

export type VideoSurfaceProps = {
  controller: PlayerController;
  onTogglePlay: () => void;
};

export function VideoSurface({controller, onTogglePlay}: VideoSurfaceProps) {
  const {error, retry, isCasting} = controller;

  const backdrop = controller.item?.backdropUrl;

  return (
    <VideoContainer onPressIn={() => {
      onTogglePlay()
    }} testID="video-surface">
      {isCasting ? (
        <BackdropImage source={{ uri: backdrop }} resizeMode="cover" />
      ) : (
        <StyledVideoView nativeControls={false} player={controller.player} />
      )}
      <SubtitleOverlay controller={controller} />
      {error && !isCasting && (
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

const VideoContainer:typeof Pressable = styled.Pressable`
  flex: 1;
  background-color: black;
  justify-content: center;
  align-items: center;
`;

const StyledVideoView: typeof VideoView = styled(VideoView)`
  width: 100%;
  height: 100%;
`;

const BackdropImage: typeof ImageBackground = styled(ImageBackground)`
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
