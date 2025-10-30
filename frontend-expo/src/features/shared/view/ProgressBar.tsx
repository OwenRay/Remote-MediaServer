import React from 'react';
import { ViewStyle } from 'react-native';
import {default as styled, DefaultTheme} from 'styled-components/native';

export type ProgressBarProps = {
  progress: number; // 0..1
  height?: number; // default 6
  borderRadius?: number; // default height/2
  backgroundColor?: string; // default theme-based dark bg
  fillColor?: string; // default theme primary
  style?: ViewStyle;
  testID?: string;
};

export function ProgressBar(props: ProgressBarProps) {
  const {
    progress,
    height = 6,
    borderRadius,
    backgroundColor,
    fillColor,
    style,
    testID,
  } = props;

  const clamped = Math.max(0, Math.min(1, progress || 0));

  return (
    <Bar
      testID={testID}
      style={style}
      height={height}
      radius={typeof borderRadius === 'number' ? borderRadius : height / 2}
      backgroundColor={backgroundColor}
    >
      <Fill
        style={{ width: `${clamped * 100}%` }}
        fillColor={fillColor}
      />
    </Bar>
  );
}

const Bar = styled.View<{
  height: number;
  radius: number;
  backgroundColor?: string;
}>`
  width: 100%;
  height: ${({ height }: { height: number }) => `${height}px`};
  border-radius: ${({ radius }: { radius: number }) => `${radius}px`};
  overflow: hidden;
  background-color: ${({ backgroundColor, theme }: { backgroundColor?: string; theme: DefaultTheme }) => backgroundColor ?? 'rgba(0,0,0,0.6)'};
`;

const Fill = styled.View<{
  fillColor?: string;
}>`
  height: 100%;
  background-color: ${({ fillColor, theme }: { fillColor?: string; theme: DefaultTheme }) => fillColor ?? theme.colors.primary};
`;

export default ProgressBar;
