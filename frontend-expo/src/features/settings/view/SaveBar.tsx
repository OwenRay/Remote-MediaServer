import React from 'react';
import { default as styled, DefaultTheme } from 'styled-components/native';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';

export type SaveBarProps = {
  isSaving: boolean;
  onSave: () => void | Promise<void>;
};

const AlignEnd = styled.View`
  align-items: flex-end;
`;

const SaveBtn = styled(SecondaryButton)`
  padding-horizontal: 16px;
  padding-vertical: 10px;
  border-radius: 8px;
`;

const SaveBtnText = styled(ThemedText)`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
`;

export function SaveBar({ isSaving, onSave }: SaveBarProps) {
  return (
    <AlignEnd>
      <SaveBtn onPress={onSave} accessibilityLabel="save">
        <SaveBtnText>{isSaving ? 'Saving…' : 'Save'}</SaveBtnText>
      </SaveBtn>
    </AlignEnd>
  );
}

