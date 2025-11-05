import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import {default as styled} from 'styled-components/native';
import type { PlayerController } from '@/src/features/player/domain/usePlayerController';
import { usePlayQueue } from '@/src/features/playqueue/domain/usePlayQueue';

export type TransportControlsProps = {
  controller: PlayerController;
};

export function TransportControls({ controller }: TransportControlsProps) {
  const { state: queue, actions: queueActions } = usePlayQueue();
  const { paused, togglePlay } = controller;

  return (
    <CenterControls>
      <IconBtn onPress={() => queueActions.skip(-1)} disabled={!queue.hasPrev} accessibilityLabel={'previous'} accessibilityRole="button">
        <MaterialIcons name="skip-previous" size={20} color="#fff" />
      </IconBtn>
      <IconBtn onPress={togglePlay} accessibilityLabel={'play'} accessibilityRole="button">
        <MaterialIcons name={paused ? 'play-arrow' : 'pause'} size={40} color="#fff" />
      </IconBtn>
      <IconBtn onPress={() => queueActions.skip(1)} disabled={!queue.hasNext} accessibilityLabel={'next'} accessibilityRole="button">
        <MaterialIcons name="skip-next" size={20} color="#fff" />
      </IconBtn>
    </CenterControls>
  );
}

const CenterControls = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  position: absolute;
  left: 50%;
  margin-left: -100px;
  top: -36px;
`;

const IconBtn = styled(SecondaryButton)`
  padding-vertical: 6px;
  padding-horizontal: 8px;
  border-radius: 50%;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
`;
