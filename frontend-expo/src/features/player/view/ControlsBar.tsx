import React from 'react';
import { Platform } from 'react-native';
import {default as styled, DefaultTheme} from 'styled-components/native';
import type {PlayerController} from '@/src/features/player/domain/usePlayerController';
import {useSafeAreaInsets} from "react-native-safe-area-context";
import { TransportControls } from './TransportControls';
import { OptionsMenus } from './OptionsMenus';
import { TimelineBar } from './TimelineBar';
import { VolumeControl } from './VolumeControl';

export type ControlsBarProps = {
  controller: PlayerController;
  visible?: boolean;
  onToggleFullscreen?: () => void;
};

export function ControlsBar({controller, visible = true, onToggleFullscreen}: ControlsBarProps) {
  const {bottom} = useSafeAreaInsets();
  const {paused, togglePlay, onSeek, setVolume, volume, toggleFullscreen, item} = controller as PlayerController & {setPaused?: (p:boolean)=>void};

  return (
    <Controls style={{paddingBottom:bottom + 8}} visible={visible}>
      <TransportControls paused={paused} onTogglePlay={togglePlay} />
      <OptionsMenus onToggleFullscreen={onToggleFullscreen ?? toggleFullscreen} />
      <TimelineBar
        itemPosterUrl={item?.posterUrl}
        currentPosition={controller.position}
        duration={item?.fileduration || 0}
        onSeek={onSeek}
      >
        {Platform.OS==='web' ? (
          <VolumeControl volume={volume} setVolume={setVolume} />
        ) : undefined}
      </TimelineBar>
    </Controls>
  );
}

const Controls = styled.View<{visible:boolean}>`
  padding: 12px;
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.card};
  gap: 8px;
  opacity: ${(props: { visible: boolean }) => props.visible ? 1 : 0};
  transition: margin-bottom 0.2s ease-out, opacity 0.2s ease-out;
  margin-bottom: ${(props: { visible: boolean }) => props.visible ? 0 : '-100px'};
`;





