import React from 'react';
import { Image, Platform } from 'react-native';
import {default as styled} from 'styled-components/native';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { SeekBar } from '@/src/features/player/view/SeekBar';
import { formatTime } from '@/src/features/shared/utils/time';
import type { PlayerController } from '@/src/features/player/domain/usePlayerController';

export type TimelineBarProps = {
  controller: PlayerController;
  children?: React.ReactNode;
};

export function TimelineBar({ controller, children }: TimelineBarProps) {
  const itemPosterUrl = controller.item?.posterUrl;
  const currentPosition = controller.position;
  const duration = controller.item?.fileduration || 0;
  const onSeek = controller.onSeek;
  return (
    <Row>
      {itemPosterUrl ? (
        <Poster source={{ uri: itemPosterUrl }} resizeMode="cover" />
      ) : (
        <PosterPlaceholder />
      )}
      <Time>{formatTime(currentPosition)}</Time>
      <SeekBar min={0} max={duration} value={currentPosition || 0.01} onComplete={onSeek} />
      <Time>{formatTime(duration)}</Time>
      {children}
    </Row>
  );
}

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  margin-top: 10px;
  padding-left: 10%;
  ${Platform.OS === 'android' ? 'margin-top:20px;' : ''}
`;

const Poster = styled(Image)`
  background-color: #333;
  position: absolute;
  left: 0px;
  bottom: 0px;
  aspect-ratio: 9/14;
  width: 10%;
  border-radius: 6px;
`;

const PosterPlaceholder = styled.View`
  width: 36px;
  height: 54px;
  background-color: #333;
  position: absolute;
  left: 0px;
  bottom: 0px;
  aspect-ratio: 9/15;
  width: 10%;
`;

const Time = styled(ThemedText)`
  color: white;
  width: 48px;
  text-align: center;
  margin-horizontal: 4px;
`;
