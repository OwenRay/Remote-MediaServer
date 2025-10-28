import React from 'react';
import Slider from "@react-native-community/slider";
import {default as styled} from 'styled-components/native';

export type SeekBarProps = {
  min: number;
  max: number;
  value: number;
  onComplete: (val: number) => void;
  variant?: 'progress' | 'volume';
};

export function SeekBarAllPlatform({min, max, value, onComplete, variant = 'progress'}: SeekBarProps) {
  // Basic styling to better match legacy look: thinner volume bar
  const height = variant === 'volume' ? 12 : 18;
  const minimumTrackTintColor = variant === 'volume' ? '#b8a300' : '#b8a300';
  const maximumTrackTintColor = '#534c67';
  const thumbTintColor = '#ffffff';
  return (
    <StyledSlider
      minimumValue={min}
      maximumValue={max}
      value={value}
      onSlidingComplete={onComplete}
      minimumTrackTintColor={minimumTrackTintColor}
      maximumTrackTintColor={maximumTrackTintColor}
      thumbTintColor={thumbTintColor}
      height={height}
    />
  );
}

type StyledProps = { $height: number };
const StyledSlider = styled(Slider)<StyledProps>`
  height: ${({height}: {height:number}) => `${height}px`};
  flex: 1;
  justify-content: center;
`;
