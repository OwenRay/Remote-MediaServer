import React from 'react';
import Slider from "@react-native-community/slider";
import {default as styled} from 'styled-components/native';
import {useTheme} from "@react-navigation/native";
import {Platform} from "react-native";

export type SeekBarProps = {
  min: number;
  max: number;
  value: number;
  onComplete: (val: number) => void;
};

export function SeekBarAllPlatform({min, max, value, onComplete}: SeekBarProps) {
  // Basic styling to better match legacy look: thinner volume bar
  const {colors} = useTheme();
  const minimumTrackTintColor = colors.primary;
  const maximumTrackTintColor = Platform.OS==='web' ? colors.background : '#FFFFFF';
  const thumbTintColor = colors.primary;
  return (
    <StyledSlider
      minimumValue={min}
      maximumValue={max}
      value={value}
      onSlidingComplete={onComplete}
      minimumTrackTintColor={minimumTrackTintColor}
      maximumTrackTintColor={maximumTrackTintColor}
      thumbTintColor={thumbTintColor}
    />
  );
}

type StyledProps = { $height: number };
const StyledSlider = styled(Slider)<StyledProps>`
  height: ${({height}: {height:number}) => `${height}px`};
  flex: 1;
  justify-content: center;
`;
