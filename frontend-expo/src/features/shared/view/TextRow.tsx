import React from 'react';
import {default as styled} from 'styled-components/native';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { ThemedTextInput } from '@/src/features/shared/view/ThemedTextInput';

export type TextRowProps = {
  label: string;
  value: string;
  placeholder?: string;
  keyboardType?: 'default' | 'numeric' | 'email-address';
  onChangeText: (t: string) => void;
};

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const LabelText: typeof ThemedText = styled(ThemedText)`
  font-size: 16px;
  min-width: 150px;
  text-align: right;
`;

const InputFlex: typeof ThemedTextInput = styled(ThemedTextInput)`
  flex: 1;
`;

export function TextRow({ label, value, onChangeText, keyboardType = 'default', placeholder }: TextRowProps) {
  return (
    <Row>
      <LabelText>{label}</LabelText>
      <InputFlex
        value={value ?? ''}
        placeholder={placeholder}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </Row>
  );
}

