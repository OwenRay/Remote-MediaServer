import React from 'react';
import Slider from "@react-native-community/slider";
import {default as styled} from 'styled-components/native';

export type SeekBarProps = {
  min: number;
  max: number;
  value: number;
  onComplete: (val: number) => void;
};

export function SeekBarAllPlatform({max, value, onComplete}: SeekBarProps) {
  return (
    <StyledSlider
      minimumValue={0}
      maximumValue={max}
      value={value}
      onSlidingComplete={onComplete}
    />
  );
}

const StyledSlider = styled(Slider)`
  height: 24px;
  flex: 1;
  justify-content: center;
`;
