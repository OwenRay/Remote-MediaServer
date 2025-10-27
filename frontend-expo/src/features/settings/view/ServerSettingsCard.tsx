import React from 'react';
import { DefaultTheme, default as styled } from 'styled-components/native';
import { CardTitle, Card } from '@/src/features/shared/view/Card';
import { TextRow } from '@/src/features/shared/view/TextRow';
import { CheckboxRow } from '@/src/features/shared/view/CheckboxRow';
import { ThemedText } from '@/src/features/shared/view/themed-text';
import { SettingsAttributes } from '@/src/features/settings/model/settings';

export type ServerSettingsCardProps = {
  draft: SettingsAttributes;
  setDraft: (next: SettingsAttributes) => void;
};

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const RowGap = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const Pill = styled.Pressable<{ active?: boolean }>`
  padding-horizontal: 12px;
  padding-vertical: 6px;
  border-radius: 999px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
  background-color: ${({ active, theme }: { active?: boolean; theme: DefaultTheme }) => (active ? theme.colors.primary : 'transparent')};
`;

const PillText = styled(ThemedText)`
  color: white;
  font-weight: 600;
`;

export function ServerSettingsCard({ draft, setDraft }: ServerSettingsCardProps) {
  return (
    <Card>
      <CardTitle>Server settings</CardTitle>
      <TextRow label="Server name" value={draft.name ?? ''} onChangeText={(t) => setDraft({ ...draft, name: t })} />
      <TextRow label="Port" value={String(draft.port ?? '')} keyboardType="numeric" onChangeText={(t) => setDraft({ ...draft, port: Number(t) as any })} />
      <Row>
        <ThemedText>File watcher</ThemedText>
        <RowGap>
          <Pill onPress={() => setDraft({ ...draft, filewatcher: 'native' })} active={draft.filewatcher === 'native'}><PillText>Native</PillText></Pill>
          <Pill onPress={() => setDraft({ ...draft, filewatcher: 'polling' })} active={draft.filewatcher === 'polling'}><PillText>Polling</PillText></Pill>
        </RowGap>
      </Row>
      <CheckboxRow label="Full rescan on start" value={!!draft.startscan} onValueChange={(v) => setDraft({ ...draft, startscan: v })} />
    </Card>
  );
}

