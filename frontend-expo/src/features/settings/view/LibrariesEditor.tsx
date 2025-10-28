import React from 'react';
import {default as styled, DefaultTheme } from 'styled-components/native';
import { Picker } from '@react-native-picker/picker';
import {Card, CardTitle } from '@/src/features/shared/view/Card';
import { ThemedText } from '@/src/features/shared/view/themed-text';
import { ThemedTextInput } from '@/src/features/shared/view/ThemedTextInput';
import { SettingsAttributes } from '@/src/features/settings/model/settings';
import {ThemedPicker} from "@/src/features/shared/view/ThemedPicker";
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';

export type LibrariesEditorProps = {
  draft: SettingsAttributes;
  setDraft: (next: SettingsAttributes) => void;
};

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 12px;
`;

const InputFlex: typeof ThemedTextInput = styled(ThemedTextInput)`
  flex: 1;
`;

const AlignStart = styled.View`
  align-items: flex-start;
`;

const ActionBtn = styled(SecondaryButton)`
  padding-horizontal: 12px;
  padding-vertical: 8px;
  border-radius: 8px;
  border-width: 1px;
  border-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;

const ActionText = styled(ThemedText)`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.text};
`;

export function LibrariesEditor({ draft, setDraft }: LibrariesEditorProps) {
  const libraries = draft.libraries ?? [];
  return (
    <Card>
      <CardTitle>Media libraries</CardTitle>
      {libraries.map((lib, idx) => (
        <Row key={lib.uuid ?? `idx-${idx}`}>
          <InputFlex
            placeholder="Name"
            value={lib.name ?? ''}
            onChangeText={(t) => {
              const libs = [...libraries];
              libs[idx] = { ...libs[idx], name: t };
              setDraft({ ...draft, libraries: libs });
            }}
          />
          <ThemedPicker
            selectedValue={lib.type ?? 'folder'}
            onValueChange={(val) => {
              const libs = [...libraries];
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
          {lib.type === 'shared' ? (
            <InputFlex
              placeholder="Code"
              value={(lib as any).uuid ?? ''}
              onChangeText={(t) => {
                const libs = [...libraries];
                libs[idx] = { ...libs[idx], uuid: t };
                setDraft({ ...draft, libraries: libs });
              }}
            />
          ) : (
            <InputFlex
              placeholder="Directory"
              value={lib.folder ?? ''}
              onChangeText={(t) => {
                const libs = [...libraries];
                libs[idx] = { ...libs[idx], folder: t };
                setDraft({ ...draft, libraries: libs });
              }}
            />
          )}
          <ActionBtn onPress={() => {
            const libs = [...libraries];
            libs.splice(idx, 1);
            setDraft({ ...draft, libraries: libs });
          }}>
            <ActionText>Delete</ActionText>
          </ActionBtn>
        </Row>
      ))}
      <AlignStart>
        <ActionBtn onPress={() => setDraft({ ...draft, libraries: [...libraries, { name: '', type: 'folder', folder: '' }] })}>
          <ActionText>Add new</ActionText>
        </ActionBtn>
      </AlignStart>
    </Card>
  );
}

