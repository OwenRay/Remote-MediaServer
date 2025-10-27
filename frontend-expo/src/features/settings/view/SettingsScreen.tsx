import React, {useCallback, useEffect, useState} from 'react';
import { Alert, StyleSheet, Switch, ScrollView, Platform } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import {default as styled, DefaultTheme} from 'styled-components/native';

import { useGetModulesQuery, useGetSettingsQuery, useUpdateSettingsMutation, SettingsAttributes } from '@/src/features/settings/model/settings';
import {ThemedPicker} from '@/src/features/shared/view/ThemedPicker';
import { getBaseUrl } from '@/src/features/shared/model/api/base';
import { setBaseUrl } from '@/src/features/shared/model/serverConfig';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import {ThemedTextInput} from '@/src/features/shared/view/ThemedTextInput';

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 12px;
`;

const RowRight = styled(Row)`
  justify-content: flex-end;
`;

const Column = styled.View`
  gap: 8px;
  margin-bottom: 12px;
`;

const Card = styled.View`
  border-radius: 8px;
  padding: 12px;
  margin-bottom: 16px;
  border-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;

const LabelText:typeof ThemedText = styled(ThemedText)`
  font-size: 16px;
`;

const InputFlex: typeof ThemedTextInput = styled(ThemedTextInput)`
  flex: 1;
`;

const Pill = styled.Pressable<{ active?: boolean }>`
  padding-horizontal: 12px;
  padding-vertical: 6px;
  border-radius: 999px;
  border-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
  background-color: ${({ active, theme }: { active?: boolean; theme: DefaultTheme }) => (active ? theme.colors.primary : 'transparent')};
`;

const PillText = styled(ThemedText)`
  color: white;
  font-weight: 600;
`;

const MonoText = styled(ThemedText)`
  font-family: ${Platform.select({ ios: 'Menlo', android: 'monospace', default: 'monospace' })};
  font-size: 12px;
`;

function CheckboxRow({ label, value, onValueChange }: { label: string; value: boolean; onValueChange: (next: boolean) => void }) {
  return (
    <Row>
      <LabelText>{label}</LabelText>
      <Switch value={value} onValueChange={onValueChange} />
    </Row>
  );
}

function TextRow({ label, value, onChangeText, keyboardType = 'default' as const, placeholder }: { label: string; value: string; placeholder?: string; keyboardType?: 'default' | 'numeric' | 'email-address'; onChangeText: (t: string) => void }) {
  return (
    <Row>
      <LabelText>{label}</LabelText>
      <ThemedTextInput
        value={value ?? ''}
        placeholder={placeholder}
        onChangeText={onChangeText}
        keyboardType={keyboardType}
      />
    </Row>
  );
}

export default function SettingsScreen() {
  const { data: settings } = useGetSettingsQuery();
  const { data: availableModules } = useGetModulesQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [draft, setDraft] = useState<SettingsAttributes | undefined>(undefined);
  const [serverEndpoint, setServerEndpointState] = useState<string>('');

  useEffect(() => {
    if (settings && !draft) setDraft(settings);
  }, [settings, draft]);

  const setServerEndpoint = useCallback((value:string) => {
    setBaseUrl(value);
    setServerEndpointState(value);
  }, [setServerEndpointState]);

  useEffect(() => {
    setServerEndpointState(getBaseUrl());
  }, []);

  const save = useCallback(async () => {
    if (!draft) return;
    await updateSettings(draft).unwrap();
    Alert.alert('Saved');
  }, [draft, updateSettings]);

  const toggleModule = useCallback((name: string) => {
    setDraft(prev => {
      if(!prev) return prev;
      const has = prev.modules?.includes(name);
      const modules = has ? prev.modules.filter(m => m !== name) : [...(prev.modules || []), name];
      return { ...prev, modules } as SettingsAttributes;
    });
  }, []);

  if (!draft) return <ScrollView />;

  return (
    <ScrollView contentContainerStyle={{ padding: 12 }}>
      <Card>
        <Column>
          <LabelText>Server</LabelText>
          <TextRow label="Endpoint" value={serverEndpoint} onChangeText={setServerEndpoint} placeholder="http://host:port" />
          <RowRight>
            <MonoText>Used by all API requests</MonoText>
          </RowRight>
        </Column>
      </Card>

      <Card>
        <Column>
          <LabelText>General</LabelText>
          <TextRow label="Name" value={draft.name} onChangeText={(t) => setDraft({ ...draft, name: t })} />
          <Row>
            <LabelText>Port</LabelText>
            <InputFlex
              value={String(draft.port ?? '')}
              keyboardType="numeric"
              onChangeText={(t) => setDraft({ ...draft, port: Number(t || 0) })}
            />
          </Row>
        </Column>
      </Card>

      <Card>
        <Column>
          <LabelText>Modules</LabelText>
          <Row style={{ flexWrap: 'wrap' }}>
            {(availableModules || []).map(m => (
              <Pill key={m} onPress={() => toggleModule(m)} active={!!draft.modules?.includes(m)}>
                <PillText>{m}</PillText>
              </Pill>
            ))}
          </Row>
        </Column>
      </Card>

      <Card>
        <Column>
          <LabelText>File Watcher</LabelText>
          <ThemedPicker
            selectedValue={draft.filewatcher}
            onValueChange={(v: 'native' | 'polling') => setDraft({ ...draft, filewatcher: v })}
          >
            <Picker.Item label="Native" value="native" />
            <Picker.Item label="Polling" value="polling" />
          </ThemedPicker>
        </Column>
      </Card>

      <Card>
        <Column>
          <LabelText>Advanced</LabelText>
          <CheckboxRow label="Start library scan on launch" value={!!draft.startscan} onValueChange={(v) => setDraft({ ...draft, startscan: v })} />
        </Column>
      </Card>

      <RowRight>
        <Pill onPress={save} active>
          <PillText>{isSaving ? 'Saving...' : 'Save'}</PillText>
        </Pill>
      </RowRight>
    </ScrollView>
  );
}
