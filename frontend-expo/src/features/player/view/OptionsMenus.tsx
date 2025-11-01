import React, { useState } from 'react';
import { Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import {default as styled} from 'styled-components/native';

export type OptionsMenusProps = { onToggleFullscreen: () => void };

export function OptionsMenus({ onToggleFullscreen }: OptionsMenusProps) {
  const [openMenu, setOpenMenu] = useState<null | 'audio' | 'video' | 'subtitles'>(
    null,
  );
  return (
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
        <IconBtn onPress={onToggleFullscreen} accessibilityRole="button">
          <MaterialIcons name="fullscreen" size={20} color="#fff" />
          <HiddenLabel>Fullscreen</HiddenLabel>
        </IconBtn>
      )}
    </Right>
  );
}

const Right = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
  position: absolute;
  right: 10px;
  top: -24px;
`;

const IconBtn = styled(SecondaryButton)`
  padding-vertical: 6px;
  padding-horizontal: 8px;
  border-radius: 50%;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
`;

const HiddenLabel = styled(ThemedText)`
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
`;

const MenuAnchor = styled.View`
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
