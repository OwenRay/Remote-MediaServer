import React from 'react';
import { Switch } from 'react-native';
import {default as styled} from 'styled-components/native';
import { ThemedText } from '@/src/features/shared/view/themed-text';

export type CheckboxRowProps = {
  label: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
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
`;

export function CheckboxRow({ label, value, onValueChange }: CheckboxRowProps) {
  return (
    <Row>
      <LabelText>{label}</LabelText>
      <Switch value={value} onValueChange={onValueChange} />
    </Row>
  );
}
