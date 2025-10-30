import React, { useEffect, useState } from 'react';
import {Image, Platform, View} from 'react-native';
import {default as styled, DefaultTheme} from 'styled-components/native';
import {ThemedText} from '@/src/features/shared/view/ThemedText';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import {SeekBar} from '@/src/features/player/view/SeekBar';
import type {PlayerController} from '@/src/features/player/domain/usePlayerController';
import { MaterialIcons } from '@expo/vector-icons';
import {useCast} from '@/src/features/cast/domain/useCast';
import {getBaseUrl} from '@/src/features/shared/model/api/base';

export type ControlsBarProps = {
  controller: PlayerController;
  visible?: boolean;
  onToggleFullscreen?: () => void;
};

export function ControlsBar({controller, visible = true, onToggleFullscreen}: ControlsBarProps) {
  const {paused, togglePlay, position, onSeek, setVolume, volume, player, toggleFullscreen, item, setPaused} = controller as PlayerController & {setPaused?: (p:boolean)=>void};
  const [openMenu, setOpenMenu] = useState<null | 'audio' | 'video' | 'subtitles'>(null);
  const cast = useCast();

  const current = position + player.currentTime || 0;

  // When casting starts, load current media into receiver and pause local playback
  useEffect(() => {
    if (!cast.casting || !item?.id) return;
    const url = `${getBaseUrl()}/ply/${item.id}/${Math.floor(current)}`;
    cast.loadMedia(url, 'video/mp4', item.title, item.posterUrl, 0);
    try { cast.play(); } catch {}
    try { player.pause(); } catch {}
    try { setPaused?.(true); } catch {}
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cast.casting, item?.id]);

  const onPressPlay = () => {
    if (cast.casting) {
      if (paused) cast.play(); else cast.pause();
    } else {
      togglePlay();
    }
  };


  return (
    <Controls visible={visible}>
      <CenterControls>
        <IconBtn disabled>
          <MaterialIcons name="skip-previous" size={20} color="#fff" />
        </IconBtn>
        <IconBtn onPress={onPressPlay} accessibilityLabel={'play'} accessibilityRole="button">
          <MaterialIcons name={paused ? 'play-arrow' : 'pause'} size={40} color="#fff" />
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

        {Platform.OS === 'web' && cast.available && (
          <IconBtn onPress={() => (cast.casting ? cast.stop() : cast.start())} accessibilityRole="button">
            <MaterialIcons name={cast.casting ? 'cast-connected' : 'cast'} size={20} color="#fff" />
            <HiddenLabel>{cast.casting ? 'Stop casting' : 'Cast'}</HiddenLabel>
          </IconBtn>
        )}
        {Platform.OS === 'web' && (
          <IconBtn onPress={() => (onToggleFullscreen ? onToggleFullscreen() : toggleFullscreen())} accessibilityRole="button">
            <MaterialIcons name="fullscreen" size={20} color="#fff" />
            <HiddenLabel>Fullscreen</HiddenLabel>
          </IconBtn>
        )}
      </Right>

      <Row>
          {item?.posterUrl ? (
            <Poster source={{uri: item.posterUrl}} resizeMode="cover" />
          ) : (
            <PosterPlaceholder />
          )}
        <Time>{formatTime(current)}</Time>
        <SeekBar
          min={0}
          max={item?.fileduration || 0}
          value={current || 0.01}
          onComplete={onSeek}
        />
        <Time>{formatTime(item?.fileduration || 0)}</Time>
        <IconBtn onPress={() => setVolume(volume > 0 ? 0 : 1)} accessibilityRole="button">
          <MaterialIcons name={volume > 0 ? 'volume-up' : 'volume-off'} size={20} color="#fff" />
          <HiddenLabel>{volume > 0 ? 'Mute' : 'Unmute'}</HiddenLabel>
        </IconBtn>
        <VolumeBarContainer>
          <SeekBar min={0} max={1} value={volume} onComplete={setVolume}/>
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

const Controls = styled.View<{visible:boolean}>`
  padding: 12px;
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.card};

  gap: 8px;
  opacity: ${(props: { visible: boolean }) => props.visible ? 1 : 0};
  transition: margin-bottom 0.2s ease-out, opacity 0.2s ease-out;
  margin-bottom: ${(props: { visible: boolean }) => props.visible ? 0 : '-100px'};
`;

const CenterControls = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  position: absolute;
  left: 50%;
  margin-left: -100px;
  top: -36px;
`;

const Right = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  position: absolute;
  right: 10px;
  top: -24px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
  marginTop: 10px;
  padding-left: calc(10% + 10px);
`;

const IconBtn = styled(SecondaryButton)`
  padding-vertical: 6px;
  padding-horizontal: 8px;
  border-radius: 50%;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
`;

const Poster = styled(Image)`
  background-color: #333;
  position:absolute;
  left:0px;
  bottom:0px;
  aspect-ratio: 9/15;
  width: 10%;
  border-radius: 6px;
`;

const PosterPlaceholder = styled.View`
  width: 36px;
  height: 54px;
  background-color: #333;
`;

const Time = styled(ThemedText)`
  color: white;
  width: 48px;
  text-align: center;
`;

const VolumeBarContainer = styled(View)`
  flex: 1;
  flex-grow: 0.2;
  max-width: 110px;
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
  bottom: 34px;
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
