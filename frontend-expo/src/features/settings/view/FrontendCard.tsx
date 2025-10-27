import React from 'react';
import { StyleSheet } from 'react-native';
import { default as styled, DefaultTheme } from 'styled-components/native';
import { ThemedText } from '@/src/features/shared/view/themed-text';
import { TextRow} from '@/src/features/shared/view/TextRow';

export type FrontendCardProps = {
  serverEndpoint: string;
  setServerEndpoint: (v: string) => void;
};

const Card = styled.View`
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  border-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;

const CardTitle = styled(ThemedText)`
  font-size: 18px;
  font-weight: 600;
  margin-bottom: 8px;
`;

const HelpText = styled(ThemedText)`
  font-size: 12px;
  opacity: 0.8;
`;

export function FrontendCard({ serverEndpoint, setServerEndpoint }: FrontendCardProps) {
  return (
    <Card>
      <CardTitle>Frontend</CardTitle>
      <TextRow label="Server endpoint" value={serverEndpoint} placeholder="http://host:port" onChangeText={setServerEndpoint} />
      <HelpText>This only affects the app. Use it to connect to a different server address.</HelpText>
    </Card>
  );
}

