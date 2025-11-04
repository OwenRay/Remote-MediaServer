import React, { useMemo } from 'react';
import { default as styled } from 'styled-components/native';
import type { PlayerController } from '@/src/features/player/domain/usePlayerController';
import { useSubtitles } from '@/src/features/player/domain/useSubtitles';

export type SubtitleOverlayProps = {
  controller: PlayerController;
};

export function SubtitleOverlay({ controller }: SubtitleOverlayProps) {
  const id = controller.item?.id ? String(controller.item.id) : undefined;
  const selected = controller.subtitle;
  const { getTextAt } = useSubtitles(id, selected);

  const text = useMemo(() => {
    const t = controller.position || 0;
    return getTextAt(t);
  }, [controller.position, getTextAt]);

  if (!selected || !text) return null;
  return (
    <Container pointerEvents="none">
      <Caption>{text}</Caption>
    </Container>
  );
}

const Container = styled.View`
  position: absolute;
  left: 5%;
  right: 5%;
  bottom: 8%;
  align-items: center;
`;

const Caption = styled.Text`
  color: #fff;
  font-size: 20px;
  text-align: center;
  text-shadow-color: rgba(0, 0, 0, 0.85);
  text-shadow-offset: 1px 1px;
  text-shadow-radius: 2px;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 6px 10px;
  border-radius: 6px;
`;
