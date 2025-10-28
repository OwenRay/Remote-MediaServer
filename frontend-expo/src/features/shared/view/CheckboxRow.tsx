import React from 'react';
import {Switch, SwitchProps} from 'react-native';
import {default as styled} from 'styled-components/native';
import { ThemedText } from '@/src/features/shared/view/themed-text';
import {useTheme} from "@react-navigation/native";

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

const ModifiedForFrontendSwitch = Switch as unknown as React.FunctionComponent<SwitchProps & {activeThumbColor:string}>;

export function CheckboxRow({ label, value, onValueChange }: CheckboxRowProps) {
  const {colors} = useTheme();
  // @ts-ignore
  return (
    <Row>
      <LabelText>{label}</LabelText>
      <ModifiedForFrontendSwitch thumbColor={colors.primary} activeThumbColor={colors.primary} trackColor={{true:colors.primary, false: 'gray'}} value={value} onValueChange={onValueChange} />
    </Row>
  );
}
