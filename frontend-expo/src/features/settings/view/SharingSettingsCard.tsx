import React from 'react';
import Slider from '@react-native-community/slider';
import {default as styled} from 'styled-components/native';
import { Card, CardTitle } from '@/src/features/shared/view/Card';
import { TextRow } from '@/src/features/shared/view/TextRow';
import { ThemedText } from '@/src/features/shared/view/themed-text';
import { SettingsAttributes } from '@/src/features/settings/model/settings';
import { Platform } from 'react-native';

export type SharingSettingsCardProps = {
  draft: SettingsAttributes;
  setDraft: (next: SettingsAttributes) => void;
};

const Column = styled.View`
  gap: 8px;
  margin-bottom: 12px;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const MonoText = styled(ThemedText)`
  font-family: ${Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })};
  font-size: 12px;
`;

export function SharingSettingsCard({ draft, setDraft }: SharingSettingsCardProps) {
  return (
    <Card>
      <CardTitle>Share settings</CardTitle>
      <TextRow label="Sharing host" value={draft.sharehost ?? ''} onChangeText={(t) => setDraft({ ...draft, sharehost: t })} />
      <TextRow label="Sharing port" value={draft.shareport ? String(draft.shareport) : ''} keyboardType="numeric" onChangeText={(t) => setDraft({ ...draft, shareport: Number(t) as any })} />
      <Column>
        <ThemedText>Space reserved for shared files ({draft.sharespace ?? 0})</ThemedText>
        <Slider
          minimumValue={1}
          maximumValue={1000}
          step={1}
          value={draft.sharespace ?? 1}
          onValueChange={(v) => setDraft({ ...draft, sharespace: Math.round(v) })}
        />
      </Column>
      <Row>
        <ThemedText>Share key</ThemedText>
        <MonoText selectable>{`${draft.sharekey ?? ''}-${draft.dbKey ?? ''}-${draft.dbNonce ?? ''}`}</MonoText>
      </Row>
    </Card>
  );
}

