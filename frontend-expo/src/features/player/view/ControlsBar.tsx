import React from 'react';
import {Platform} from 'react-native';
import {default as styled} from 'styled-components/native';
import {ThemedText} from '@/src/features/shared/view/themed-text';
import {SeekBar} from '@/src/features/player/view/SeekBar';
import type {PlayerController} from '@/src/features/player/domain/usePlayerController';

export type ControlsBarProps = {
  controller: PlayerController;
  duration?: number;
};

export function ControlsBar({controller, duration}: ControlsBarProps) {
  const {paused, togglePlay, position, onSeek, setVolume, volume, player, toggleFullscreen} = controller;

  return (
    <Controls>
      <Btn onPress={togglePlay} accessibilityRole="button"><ThemedText>{paused ? 'Play' : 'Pause'}</ThemedText></Btn>
      <Row>
        <Time>{formatTime(position + player.currentTime)}</Time>
        <SeekBar
          min={0}
          max={duration || 0}
          value={position + player.currentTime || 0.01}
          onComplete={onSeek}
        />
        <Time>{formatTime(duration || 0)}</Time>
      </Row>
      <Row>
        <Btn onPress={() => setVolume(volume > 0 ? 0 : 1)} accessibilityRole="button">
          <ThemedText>{volume > 0 ? 'Mute' : 'Unmute'}</ThemedText>
        </Btn>
        {Platform.OS === 'web' && (
          <Btn onPress={() => toggleFullscreen()} accessibilityRole="button"><ThemedText>Fullscreen</ThemedText></Btn>
        )}
      </Row>
    </Controls>
  );
}

function formatTime(totalSeconds?: number) {
  const s = Math.floor(totalSeconds || 0);
  const mm = Math.floor(s / 60).toString().padStart(2, '0');
  const ss = Math.floor(s % 60).toString().padStart(2, '0');
  return `${mm}:${ss}`;
}

const Controls = styled.View`
  padding: 12px;
  background-color: #111;
  gap: 8px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const Btn = styled.Pressable`
  padding-vertical: 8px;
  padding-horizontal: 12px;
  background-color: #333;
  border-radius: 4px;
`;

const Time = styled(ThemedText)`
  color: white;
  width: 48px;
  text-align: center;
`;
