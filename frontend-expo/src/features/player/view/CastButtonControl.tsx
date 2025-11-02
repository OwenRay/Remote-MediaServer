import React from 'react';
import {default as styled, DefaultTheme} from 'styled-components/native';
import {CastingController} from '@/src/features/player/domain/useGoogleCast';
import {CastButton} from "react-native-google-cast";

export type CastButtonControlProps = {
  controller: CastingController;
};

export function CastButtonControl({ controller }: CastButtonControlProps) {
  const {available} = controller;


  if (!available) return null;

  // Simple button that opens the Cast dialog and starts casting the current item
  return (
    <CastBtnWrapper>
      <CastBtn accessibilityRole="button"/>
    </CastBtnWrapper>
  );
}

const CastBtn = styled(CastButton)`
  height: 36px;
  width: 36px;
`;

const CastBtnWrapper = styled.View`
  border-radius: 50%;
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.primary};
`;
