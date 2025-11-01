import React from 'react';
import { MaterialIcons } from '@expo/vector-icons';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import {default as styled} from 'styled-components/native';

export type TransportControlsProps = { paused: boolean; onTogglePlay: () => void };

export function TransportControls({ paused, onTogglePlay }: TransportControlsProps) {
  return (
    <CenterControls>
      <IconBtn disabled>
        <MaterialIcons name="skip-previous" size={20} color="#fff" />
      </IconBtn>
      <IconBtn onPress={onTogglePlay} accessibilityLabel={'play'} accessibilityRole="button">
        <MaterialIcons name={paused ? 'play-arrow' : 'pause'} size={40} color="#fff" />
      </IconBtn>
      <IconBtn disabled>
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
