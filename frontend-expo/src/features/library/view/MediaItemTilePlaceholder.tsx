import React from 'react';
import {default as styled} from 'styled-components/native';

export type MediaItemTilePlaceholderProps = {
  width?: number;
  height?: number;
};

export function MediaItemTilePlaceholder({ width = 236, height = 150 }: MediaItemTilePlaceholderProps) {
  return (
    <Tile
      testID="media-item-placeholder"
      width={width}
      height={height}
      accessibilityLabel="Loading media item"
      accessibilityRole="image"
    >
      <Poster />
      <Footer />
    </Tile>
  );
}

const Tile = styled.View<{ width: number; height: number }>`
  border-radius: 6px;
  overflow: hidden;
  background-color: #1f1f1f;
  position: relative;
  width: ${({ width }: { width: number }) => `${width}px`};
  height: ${({ height }: { height: number }) => `${height}px`};
`;

const Poster = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  background-color: #2a2a2a;
`;

const Footer = styled.View`
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 6px;
  background-color: #333;
`;
