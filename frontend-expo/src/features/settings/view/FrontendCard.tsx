import React from 'react';
import { default as styled } from 'styled-components/native';
import { ThemedText } from '@/src/features/shared/view/themed-text';
import { TextRow} from '@/src/features/shared/view/TextRow';
import {Card, CardTitle} from "@/src/features/shared/view/Card";

export type FrontendCardProps = {
  serverEndpoint: string;
  setServerEndpoint: (v: string) => void;
};

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

