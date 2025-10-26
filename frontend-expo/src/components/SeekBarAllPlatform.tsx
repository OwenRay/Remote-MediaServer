import React from 'react';
import {StyleSheet} from 'react-native';
import Slider from "@react-native-community/slider";

export type SeekBarProps = {
  min: number;
  max: number;
  value: number;
  onComplete: (val: number) => void;
};

export function SeekBarAllPlatform({max, value, onComplete}: SeekBarProps) {

  return (
    <Slider
      style={styles.container}
      minimumValue={0}
      maximumValue={max}
      value={value}
      onSlidingComplete={onComplete}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    height: 24,
    flex: 1,
    justifyContent: 'center',
  },
  track: {
    height: 4,
    backgroundColor: '#444',
    borderRadius: 2,
  },
  thumb: {
    position: 'absolute',
    left: 0,
    height: 4,
    backgroundColor: '#0af',
    borderRadius: 2,
  },
});
