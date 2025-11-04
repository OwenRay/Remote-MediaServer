import React, { useState } from 'react';
import {Modal, Platform, TouchableOpacity} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import {default as styled} from 'styled-components/native';
import {CastButtonControl} from "@/src/features/player/view/CastButtonControl";
import {PlayerController} from "@/src/features/player/domain/usePlayerController";
import {CastingController} from "@/src/features/player/domain/useGoogleCast";
import {useGetMediaContentQuery} from "@/src/features/player/model/mediaContent";
import {Card} from "@/src/features/shared/view/Card";

export type OptionsMenusProps = { controller: PlayerController, castingController: CastingController };

export function OptionsMenus({ controller, castingController }: OptionsMenusProps) {
  const [openMenu, setOpenMenu] = useState<null | 'audio' | 'video' | 'subtitles'>(null);
  const id = controller.item?.id ? String(controller.item.id) : undefined;
  const { data: mediaContent } = useGetMediaContentQuery(id ?? '', { skip: !id });

  const hasAudio = (mediaContent?.audio?.length ?? 0) > 1;
  const hasVideo = (mediaContent?.video?.length ?? 0) > 1;

  const onSelectAudio = (v: number) => {
    controller.setAudioChannel(v);
    setOpenMenu(null);
  };
  const onSelectVideo = (v: number) => {
    controller.setVideoChannel(v);
    setOpenMenu(null);
  };

  const renderModalContent = () => {
    if (!openMenu) return null;
    const isAudio = openMenu === 'audio';
    const isVideo = openMenu === 'video';
    const title = isAudio ? 'Audio tracks' : isVideo ? 'Video tracks' : 'Subtitles';
    const subtitleOptions = [{ label: 'None', value: '' }, ...((mediaContent?.subtitles ?? []) as any[])];
    const options = isAudio ? (mediaContent?.audio ?? []) : isVideo ? (mediaContent?.video ?? []) : subtitleOptions;
    const onSelect = isAudio ? onSelectAudio : isVideo ? onSelectVideo : (v?: string | number) => {
      const val = String(v || '');
      controller.setSubtitle(val || null);
      setOpenMenu(null);
    };

    return (
      <Modal backdropColor={'#00000088'} statusBarTranslucent={true}>
        <ModalOverlay>
          <ModalCard>
            <ModalTitle>{title}</ModalTitle>
            <ModalList>
              {options.map((opt) => {
                const value = (isAudio || isVideo) ? Number(opt.value) : String(opt.value ?? '');
                const isSelected = isAudio
                  ? value === (controller.audioChannel || 1)
                  : isVideo
                    ? value === (controller.videoChannel || 1)
                    : String(controller.subtitle || '') === String(value);
                const handlePress = () => onSelect(value as any);
                return (
                  <ModalBtn key={`${openMenu}-${opt.value}`} onPress={handlePress}
                            accessibilityRole="button">
                    <ModalItem
                      style={{
                        backgroundColor: isSelected ? '#333' : undefined}}>
                      {opt.label}
                    </ModalItem>
                  </ModalBtn>
                );
              })}
            </ModalList>
            <Divider />
            <CancelBtn onPress={() => setOpenMenu(null)} accessibilityRole="button">
              <CancelText>Cancel</CancelText>
            </CancelBtn>
          </ModalCard>
        </ModalOverlay>
      </Modal>
    );
  };

  return (
    <Right>
      {hasAudio && (
        <MenuAnchor accessibilityRole="button">
          <IconBtn onPress={() => setOpenMenu('audio')}>
            <MaterialIcons name="audiotrack" size={20} color="#fff" />
          </IconBtn>
        </MenuAnchor>
      )}

      {hasVideo && (
        <MenuAnchor accessibilityRole="button">
          <IconBtn onPress={() => setOpenMenu('video')}>
            <MaterialIcons name="video-settings" size={20} color="#fff" />
          </IconBtn>
        </MenuAnchor>
      )}

      <MenuAnchor accessibilityRole="button">
        <IconBtn onPress={() => setOpenMenu('subtitles')}>
          <MaterialIcons name="subtitles" size={20} color="#fff" />
        </IconBtn>
      </MenuAnchor>

      {Platform.OS === 'web' && (
        <IconBtn onPress={controller.toggleFullscreen} accessibilityRole="button">
          <MaterialIcons name="fullscreen" size={20} color="#fff" />
          <HiddenLabel>Fullscreen</HiddenLabel>
        </IconBtn>
      )}
      <CastButtonControl controller={castingController} />

      {renderModalContent()}
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
  padding: 0;
  border-radius: 50%;
  aspect-ratio: 1;
  align-items: center;
  justify-content: center;
  height: 36px;
  width: 36px;
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

const ModalOverlay = styled.View`
  align-items: center;
  justify-content: center;
  z-index: 10000;
  position: absolute;
  top:0;
  left:0;
  right:0;
  bottom:0;
`;

const ModalCard = styled(Card)`
  background-color: #222;
  border: 1px solid #333;
  border-radius: 10px;
  padding: 8px;
  min-width: 240px;
  max-width: 90%;
  max-height: 80%;
`;

const ModalTitle = styled(ThemedText)`
  color: #fff;
  font-size: 16px;
  font-weight: 600;
  padding: 8px 10px;
`;

const ModalList = styled.ScrollView`
  padding-vertical: 4px;
`;

const ModalItem = styled(ThemedText)`
  color: #fff;
  padding-vertical: 10px;
  padding-horizontal: 12px;
  border-radius: 6px;
`;

const ModalBtn = styled(TouchableOpacity)`
  padding-vertical: 0;
`;

const Divider = styled.View`
  height: 1px;
  background-color: #333;
  margin: 6px 0;
`;

const CancelBtn = styled(SecondaryButton)`
  align-self: flex-end;
`;

const CancelText = styled(ThemedText)`
  color: #fff;
`;
