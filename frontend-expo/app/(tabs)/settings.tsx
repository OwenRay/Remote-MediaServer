import React, {useCallback, useEffect, useState} from 'react';
import { Alert, Platform, StyleSheet, Switch, ScrollView } from 'react-native';
import Slider from '@react-native-community/slider';
import { Picker } from '@react-native-picker/picker';
import styled, {DefaultTheme} from 'styled-components/native';

import { useGetModulesQuery, useGetSettingsQuery, useUpdateSettingsMutation, SettingsAttributes } from '@/src/services/api/settings';
import {ThemedPicker} from "@/src/components/form/ThemedPicker";
import { getBaseUrl } from '@/src/services/api/base';
import { setBaseUrl } from '@/src/services/serverConfig';
import { ThemedText } from '@/src/components/themed-text';
import {ThemedTextInput} from '@/src/components/form/ThemedTextInput';

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

const LibRow = styled(Row)`
  gap: 8px;
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
  const { data: settings, isFetching } = useGetSettingsQuery();
  const { data: availableModules } = useGetModulesQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [draft, setDraft] = useState<SettingsAttributes | undefined>(undefined);
  const [serverEndpoint, setServerEndpointState] = useState<string>('');

  useEffect(() => {
    if (settings && !draft) setDraft(settings);
  }, [settings, draft]);

  useEffect(() => {
    setServerEndpoint(getBaseUrl());
  }, []);

  const setServerEndpoint = useCallback((value:string) => {
    setBaseUrl(value);
    setServerEndpointState(value);
  }, [setServerEndpointState]);



  const hasModule = (name: string) => (draft?.modules ?? []).includes(name);

  const toggleModule = (name: string) => {
    if (!draft) return;
    const set = new Set(draft.modules ?? []);
    if (set.has(name)) set.delete(name); else set.add(name);
    setDraft({ ...draft, modules: Array.from(set) });
  };

  const onSave = async () => {
    if (!draft) return;
    try {
      // Save frontend-only server endpoint first
      const patch: Partial<SettingsAttributes> = {
        name: draft.name,
        port: Number(draft.port) as any,
        filewatcher: draft.filewatcher,
        startscan: !!draft.startscan,
        modules: draft.modules ?? [],
        // Conditional blocks
        ssldomain: draft.ssldomain,
        sslport: draft.sslport ? Number(draft.sslport) : undefined,
        sslemail: draft.sslemail,
        sslredirect: draft.sslredirect,
        sharehost: draft.sharehost,
        shareport: draft.shareport ? Number(draft.shareport) : undefined,
        sharespace: draft.sharespace ? Number(draft.sharespace) : undefined,
        libraries: draft.libraries ?? [],
        advanced: !!draft.advanced,
      };
      await updateSettings(patch).unwrap();
      if (Platform.OS === 'web') alert('Settings saved'); else Alert.alert('Settings', 'Settings saved');
    } catch (e) {
      console.error(e);
      if (Platform.OS === 'web') alert('Failed to save settings'); else Alert.alert('Settings', 'Failed to save settings');
    }
  };

  // @todo move into seperate element and refresh state properly
  const serverElement = (
    <Card>
      <CardTitle>Frontend</CardTitle>
      <TextRow label="Server endpoint" value={serverEndpoint} placeholder="http://host:port" onChangeText={setServerEndpoint} />
      <HelpText>This only affects the app. Use it to connect to a different server address.</HelpText>
    </Card>
  )

  if (!draft) {
    return <>
      {serverElement}
      <Center><ThemedText>{isFetching ? 'Loading...' : 'No settings'}</ThemedText></Center>
    </>
  }

  return (
    <ScreenContainer>
      <ScrollView>
        <ContentPad>
        <AlignEnd>
          <SaveBtn onPress={onSave} accessibilityLabel="save">
            <SaveBtnText>{isSaving ? 'Saving…' : 'Save'}</SaveBtnText>
          </SaveBtn>
        </AlignEnd>

        {serverElement}

        <Card>
          <CardTitle>Server settings</CardTitle>
          <TextRow label="Server name" value={draft.name ?? ''} onChangeText={(t) => setDraft({ ...draft, name: t })} />
          <TextRow label="Port" value={String(draft.port ?? '')} keyboardType="numeric" onChangeText={(t) => setDraft({ ...draft, port: Number(t) as any })} />
          <Row>
            <LabelText>File watcher</LabelText>
            <RowGap>
              <Pill onPress={() => setDraft({ ...draft, filewatcher: 'native' })} active={draft.filewatcher === 'native'}><PillText>Native</PillText></Pill>
              <Pill onPress={() => setDraft({ ...draft, filewatcher: 'polling' })} active={draft.filewatcher === 'polling'}><PillText>Polling</PillText></Pill>
            </RowGap>
          </Row>
          <CheckboxRow label="Full rescan on start" value={!!draft.startscan} onValueChange={(v) => setDraft({ ...draft, startscan: v })} />
        </Card>

        <RowRight>
          <CheckboxRow label="Show advanced" value={!!draft.advanced} onValueChange={(v) => setDraft({ ...draft, advanced: v })} />
        </RowRight>

        {hasModule('ssl') && (
          <Card>
            <CardTitle>SSL</CardTitle>
            <TextRow label="SSL Subdomain" value={draft.ssldomain ?? ''} onChangeText={(t) => setDraft({ ...draft, ssldomain: t })} />
            <TextRow label="SSL port" value={draft.sslport ? String(draft.sslport) : ''} keyboardType="numeric" onChangeText={(t) => setDraft({ ...draft, sslport: Number(t) as any })} />
            <TextRow label="Email" value={draft.sslemail ?? ''} keyboardType="email-address" onChangeText={(t) => setDraft({ ...draft, sslemail: t })} />
            <CheckboxRow label="Automatically redirect to https" value={!!draft.sslredirect} onValueChange={(v) => setDraft({ ...draft, sslredirect: v })} />
          </Card>
        )}

        {hasModule('sharing') && (
          <Card>
            <CardTitle>Share settings</CardTitle>
            <TextRow label="Sharing host" value={draft.sharehost ?? ''} onChangeText={(t) => setDraft({ ...draft, sharehost: t })} />
            <TextRow label="Sharing port" value={draft.shareport ? String(draft.shareport) : ''} keyboardType="numeric" onChangeText={(t) => setDraft({ ...draft, shareport: Number(t) as any })} />
            <Column>
              <LabelText>Space reserved for shared files ({draft.sharespace ?? 0})</LabelText>
              <Slider
                minimumValue={1}
                maximumValue={1000}
                step={1}
                value={draft.sharespace ?? 1}
                onValueChange={(v) => setDraft({ ...draft, sharespace: Math.round(v) })}
              />
            </Column>
            <Row>
              <LabelText>Share key</LabelText>
              <MonoText selectable>{`${draft.sharekey ?? ''}-${draft.dbKey ?? ''}-${draft.dbNonce ?? ''}`}</MonoText>
            </Row>
          </Card>
        )}

        <Card>
          <CardTitle>Media libraries</CardTitle>
          {(draft.libraries ?? []).map((lib, idx) => (
            <LibRow key={lib.uuid ?? `idx-${idx}`}>
              <InputFlex
                placeholder="Name"
                value={lib.name ?? ''}
                onChangeText={(t) => {
                  const libs = [...(draft.libraries ?? [])];
                  libs[idx] = { ...libs[idx], name: t };
                  setDraft({ ...draft, libraries: libs });
                }}
              />
                <ThemedPicker
                  selectedValue={lib.type ?? 'folder'}
                  onValueChange={(val) => {
                    const libs = [...(draft.libraries ?? [])];
                    libs[idx] = { ...libs[idx], type: String(val) };
                    setDraft({ ...draft, libraries: libs });
                  }}
                >
                  <Picker.Item label="Unspecified" value="folder" />
                  <Picker.Item label="TV Shows" value="tv" />
                  <Picker.Item label="Movies" value="movie" />
                  <Picker.Item label="Music" value="library_music" />
                  <Picker.Item label="External Library" value="shared" />
                </ThemedPicker>
              {(lib.type === 'shared') ? (
                <InputFlex
                  placeholder="Code"
                  value={(lib as any).uuid ?? ''}
                  onChangeText={(t) => {
                    const libs = [...(draft.libraries ?? [])];
                    libs[idx] = { ...libs[idx], uuid: t };
                    setDraft({ ...draft, libraries: libs });
                  }}
                />
              ) : (
                <InputFlex
                  placeholder="Directory"
                  value={lib.folder ?? ''}
                  onChangeText={(t) => {
                    const libs = [...(draft.libraries ?? [])];
                    libs[idx] = { ...libs[idx], folder: t };
                    setDraft({ ...draft, libraries: libs });
                  }}
                />
              )}
              <RemoveBtn onPress={() => {
                const libs = [...(draft.libraries ?? [])];
                libs.splice(idx, 1);
                setDraft({ ...draft, libraries: libs });
              }}>
                <SaveBtnText>Delete</SaveBtnText>
              </RemoveBtn>
            </LibRow>
          ))}
          <AlignStart>
            <AddBtn onPress={() => setDraft({ ...draft, libraries: [...(draft.libraries ?? []), { name: '', type: 'folder', folder: '' }] })}>
              <SaveBtnText>Add new</SaveBtnText>
            </AddBtn>
          </AlignStart>
        </Card>

        <Card>
          <CardTitle>Modules</CardTitle>
          {(availableModules ?? []).map((m) => (
            <CheckboxRow key={m} label={`${m.replace('_', ' ')}`} value={hasModule(m)} onValueChange={() => toggleModule(m)} />
          ))}
          <HelpText>Changing these requires a restart of the mediaserver</HelpText>
        </Card>
        </ContentPad>
      </ScrollView>
    </ScreenContainer>
  );
}


const ScreenContainer = styled.View`
  flex: 1;
`;

const ContentPad = styled.View`
  padding: 16px;
`;

const Center = styled.View`
  flex: 1;
  align-items: center;
  justify-content: center;
`;

const AlignEnd = styled.View`
  align-items: flex-end;
`;

const AlignStart = styled.View`
  align-items: flex-start;
`;

const SaveBtn = styled.Pressable`
  padding-horizontal: 16px;
  padding-vertical: 10px;
  border-radius: 8px;
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.background};
`;

const SaveBtnText = styled(ThemedText)`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
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

const RowGap = styled.View`
  flex-direction: row;
  gap: 12px;
`;

const AddBtn = styled.Pressable`
  padding-horizontal: 12px;
  padding-vertical: 8px;
  border-radius: 8px;
  border-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;

const RemoveBtn = styled.Pressable`
  padding-horizontal: 12px;
  padding-vertical: 8px;
  border-radius: 8px;
  border-width: ${StyleSheet.hairlineWidth}px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;
