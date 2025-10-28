import React, { useState } from 'react';
import {Image, Platform, View} from 'react-native';
import {default as styled} from 'styled-components/native';
import {ThemedText} from '@/src/features/shared/view/themed-text';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import {SeekBar} from '@/src/features/player/view/SeekBar';
import type {PlayerController} from '@/src/features/player/domain/usePlayerController';
import { MaterialIcons } from '@expo/vector-icons';

export type ControlsBarProps = {
  controller: PlayerController;
  duration?: number;
  visible?: boolean;
  title?: string;
  posterUri?: string;
  onToggleFullscreen?: () => void;
};

export function ControlsBar({controller, duration, visible = true, title, posterUri, onToggleFullscreen}: ControlsBarProps) {
  const {paused, togglePlay, position, onSeek, setVolume, volume, player, toggleFullscreen} = controller;
  const [openMenu, setOpenMenu] = useState<null | 'audio' | 'video' | 'subtitles'>(null);

  if (!visible) return null;

  const current = position + player.currentTime || 0;

  return (
    <Controls>
      <TopRow>
        <Left>
          {posterUri ? (
            <Poster source={{uri: posterUri}} resizeMode="cover" />
          ) : (
            <PosterPlaceholder />
          )}
          <Title numberOfLines={1}>{title || ''}</Title>
        </Left>
        <CenterControls>
          <IconBtn disabled>
            <MaterialIcons name="skip-previous" size={20} color="#fff" />
          </IconBtn>
          <IconBtn onPress={togglePlay} accessibilityRole="button">
            <MaterialIcons name={paused ? 'play-arrow' : 'pause'} size={24} color="#fff" />
            <HiddenLabel>{paused ? 'Play' : 'Pause'}</HiddenLabel>
          </IconBtn>
          <IconBtn disabled>
            <MaterialIcons name="skip-next" size={20} color="#fff" />
          </IconBtn>
        </CenterControls>
        <Right onMouseLeave={() => setOpenMenu(null)}>
          <MenuAnchor
            onMouseEnter={() => Platform.OS === 'web' && setOpenMenu('audio')}
            onPress={() => setOpenMenu(openMenu === 'audio' ? null : 'audio')}
            accessibilityRole="button"
          >
            <IconBtn>
              <MaterialIcons name="audiotrack" size={20} color="#fff" />
            </IconBtn>
            {openMenu === 'audio' && (
              <Popover>
                <PopoverItem>Default</PopoverItem>
              </Popover>
            )}
          </MenuAnchor>

          <MenuAnchor
            onMouseEnter={() => Platform.OS === 'web' && setOpenMenu('video')}
            onPress={() => setOpenMenu(openMenu === 'video' ? null : 'video')}
            accessibilityRole="button"
          >
            <IconBtn>
              <MaterialIcons name="video-settings" size={20} color="#fff" />
            </IconBtn>
            {openMenu === 'video' && (
              <Popover>
                <PopoverItem>Default</PopoverItem>
              </Popover>
            )}
          </MenuAnchor>

          <MenuAnchor
            onMouseEnter={() => Platform.OS === 'web' && setOpenMenu('subtitles')}
            onPress={() => setOpenMenu(openMenu === 'subtitles' ? null : 'subtitles')}
            accessibilityRole="button"
          >
            <IconBtn>
              <MaterialIcons name="subtitles" size={20} color="#fff" />
            </IconBtn>
            {openMenu === 'subtitles' && (
              <Popover>
                <PopoverItem>Off</PopoverItem>
                <PopoverItem>Default</PopoverItem>
              </Popover>
            )}
          </MenuAnchor>

          {Platform.OS === 'web' && (
            <IconBtn onPress={() => (onToggleFullscreen ? onToggleFullscreen() : toggleFullscreen())} accessibilityRole="button">
              <MaterialIcons name="fullscreen" size={20} color="#fff" />
              <HiddenLabel>Fullscreen</HiddenLabel>
            </IconBtn>
          )}
        </Right>
      </TopRow>

      <Row>
        <Time>{formatTime(current)}</Time>
        <SeekBar
          min={0}
          max={duration || 0}
          value={current || 0.01}
          onComplete={onSeek}
        />
        <Time>{formatTime(duration || 0)}</Time>
        <IconBtn onPress={() => setVolume(volume > 0 ? 0 : 1)} accessibilityRole="button">
          <MaterialIcons name={volume > 0 ? 'volume-up' : 'volume-off'} size={20} color="#fff" />
          <HiddenLabel>{volume > 0 ? 'Mute' : 'Unmute'}</HiddenLabel>
        </IconBtn>
        <VolumeBarContainer>
          <SeekBar min={0} max={1} value={volume} onComplete={setVolume} variant="volume" />
        </VolumeBarContainer>
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

const TopRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Left = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  flex: 1;
`;

const CenterControls = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const Right = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const IconBtn = styled(SecondaryButton)`
  padding-vertical: 6px;
  padding-horizontal: 8px;
  border-radius: 4px;
`;

const Poster = styled(Image)`
  width: 36px;
  height: 54px;
  background-color: #333;
`;

const PosterPlaceholder = styled.View`
  width: 36px;
  height: 54px;
  background-color: #333;
`;

const Title = styled(ThemedText)`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  max-width: 60%;
`;

const Time = styled(ThemedText)`
  color: white;
  width: 48px;
  text-align: center;
`;

const VolumeBarContainer = styled(View)`
  flex: 1;
`;

const HiddenLabel = styled(ThemedText)`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
`;

const MenuAnchor = styled.TouchableOpacity`
  position: relative;
`;

const Popover = styled.View`
  position: absolute;
  top: 34px;
  right: 0;
  background-color: #222;
  border: 1px solid #333;
  border-radius: 6px;
  padding-vertical: 4px;
  min-width: 120px;
  z-index: 9999;
`;

const PopoverItem = styled(ThemedText)`
  color: #fff;
  padding-vertical: 6px;
  padding-horizontal: 10px;
`;
