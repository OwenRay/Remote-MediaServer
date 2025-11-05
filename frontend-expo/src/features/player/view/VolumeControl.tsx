import React from 'react';
import {default as styled} from 'styled-components/native';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { MaterialIcons } from '@expo/vector-icons';
import { SeekBar } from '@/src/features/player/view/SeekBar';
import type { PlayerController } from '@/src/features/player/domain/usePlayerController';

export type VolumeControlProps = { controller: PlayerController };

export function VolumeControl({ controller }: VolumeControlProps) {
  const { volume, setVolume } = controller;
  return (
    <Container>
      <IconBtn onPress={() => setVolume(volume > 0 ? 0 : 1)} accessibilityRole="button">
        <MaterialIcons name={volume > 0 ? 'volume-up' : 'volume-off'} size={20} color="#fff" />
        <HiddenLabel>{volume > 0 ? 'Mute' : 'Unmute'}</HiddenLabel>
      </IconBtn>
      <SeekBar min={0} max={1} value={volume} onComplete={setVolume} />
    </Container>
  );
}

const Container = styled.View`
  flex-direction: row;
  align-items: center;
  flex-grow: 0.1;
  max-width: 155px;
`;

const IconBtn = styled(SecondaryButton)`
  padding-vertical: 6px;
  padding-horizontal: 8px;
  border-radius: 50%;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  margin-right: 8px;
`;

const HiddenLabel = styled(ThemedText)`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
`;
