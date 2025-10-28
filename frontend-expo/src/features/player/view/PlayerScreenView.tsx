import React from 'react';
import {ActivityIndicator} from 'react-native';
import {ThemedText} from '@/src/features/shared/view/themed-text';
import {default as styled} from 'styled-components/native';
import type {PlayerController} from '@/src/features/player/domain/usePlayerController';
import {VideoSurface} from '@/src/features/player/view/VideoSurface';
import {ControlsBar} from '@/src/features/player/view/ControlsBar';

export type PlayerScreenViewProps = {
  controller: PlayerController;
  duration?: number;
  hasData: boolean;
  missingId?: boolean;
};

export function PlayerScreenView({controller, duration, hasData, missingId}: PlayerScreenViewProps) {
  const {togglePlay} = controller;

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
    <Container>
      <VideoSurface controller={controller} onTogglePlay={togglePlay} />
      <ControlsBar controller={controller} duration={duration} />
    </Container>
  );
}


const Container = styled.View`
  flex: 1;
  background-color: black;
`;


const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const LoadingText = styled(ThemedText)`
  margin-top: 12px;
`;
