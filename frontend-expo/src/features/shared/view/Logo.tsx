import React from 'react';
import { Image, ImageSourcePropType } from 'react-native';
import { default as styled } from 'styled-components/native';

export type LogoProps = {
  size?: number; // square size in dp
  accessibilityLabel?: string;
};

// Use a 192px web/app friendly logo by default; Metro will pick correct scale
const logoSource: ImageSourcePropType = require('@/assets/images/logo.png');

export function Logo({ size = 48, accessibilityLabel = 'Remote MediaServer logo' }: LogoProps) {
  return (
    <LogoImage
      source={logoSource}
      accessibilityLabel={accessibilityLabel}
      resizeMode="contain"
      size={size}
    />
  );
}

const LogoImage = styled(Image)<{ size: number }>`
  width: ${({ size }: {size:number}) => `${size}px`};
  height: ${({ size }:{size:number}) => `${size}px`};
`;
