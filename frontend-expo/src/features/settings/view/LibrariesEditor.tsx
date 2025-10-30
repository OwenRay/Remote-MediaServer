import React, { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import {default as styled, DefaultTheme } from 'styled-components/native';
import { MaterialIcons } from '@expo/vector-icons';
import {Card, CardTitle } from '@/src/features/shared/view/Card';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { SettingsAttributes } from '@/src/features/settings/model/settings';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import { LibraryEditDialog } from '@/src/features/settings/view/LibraryEditDialog';

export type LibrariesEditorProps = {
  draft: SettingsAttributes;
  setDraft: (next: SettingsAttributes) => void;
};

const ListRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding-vertical: 10px;
  gap: 8px;
  border-bottom-width: 1px;
  border-bottom-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;

const InfoCol = styled.View`
  flex: 1;
  gap: 2px;
`;

const NameText = styled(ThemedText)`
  font-size: 16px;
  font-weight: 600;
`;

const SubText = styled(ThemedText)`
  opacity: 0.8;
`;

const Actions = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 4px;
`;

const IconBtn = styled(Pressable)`
  padding: 8px;
  border-radius: 8px;
`;

const AddBar = styled.View`
  margin-top: 12px;
  align-items: flex-start;
`;

export function LibrariesEditor({ draft, setDraft }: LibrariesEditorProps) {
  const libraries = draft.libraries ?? [];

  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [adding, setAdding] = useState<boolean>(false);

  const onDelete = (idx: number) => {
    Alert.alert('Delete library', 'Are you sure you want to delete this library?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        const libs = [...libraries];
        libs.splice(idx, 1);
        setDraft({ ...draft, libraries: libs });
      } },
    ]);
  };

  const editInitial = editingIndex != null ? libraries[editingIndex] : undefined;
  const addInitial = { name: '', type: 'folder', folder: '' } as any;

  const typeLabel = (t?: string) => {
    switch (t) {
      case 'tv': return 'TV Shows';
      case 'movie': return 'Movies';
      case 'library_music': return 'Music';
      case 'shared': return 'External Library';
      default: return 'Unspecified';
    }
  };

  return (
    <Card>
      <CardTitle>Media libraries</CardTitle>
      {libraries.map((lib, idx) => {
        const subtitle = lib.type === 'shared' ? `Code: ${lib.uuid ?? ''}` : `Folder: ${lib.folder ?? ''}`;
        return (
          <ListRow key={lib.uuid ?? `${idx}`}>
            <InfoCol>
              <NameText>{lib.name || 'Untitled library'}</NameText>
              <SubText>{typeLabel(lib.type)} • {subtitle}</SubText>
            </InfoCol>
            <Actions>
              <IconBtn accessibilityLabel="Edit library" onPress={() => setEditingIndex(idx)}>
                <MaterialIcons name="edit" size={22} color="#fff" />
              </IconBtn>
              <IconBtn accessibilityLabel="Delete library" onPress={() => onDelete(idx)}>
                <MaterialIcons name="delete" size={22} color="#fff" />
              </IconBtn>
            </Actions>
          </ListRow>
        );
      })}
      <AddBar>
        <SecondaryButton onPress={() => setAdding(true)}>
          <ThemedText>Add new</ThemedText>
        </SecondaryButton>
      </AddBar>

      <LibraryEditDialog
        visible={editingIndex != null}
        title="Edit library"
        initial={editInitial}
        onCancel={() => setEditingIndex(null)}
        onSave={(next) => {
          if (editingIndex == null) return;
          const libs = [...libraries];
          libs[editingIndex] = { ...libs[editingIndex], ...next } as any;
          setDraft({ ...draft, libraries: libs });
          setEditingIndex(null);
        }}
      />

      <LibraryEditDialog
        visible={adding}
        title="Add library"
        initial={addInitial}
        onCancel={() => setAdding(false)}
        onSave={(next) => {
          const libs = [...libraries, next as any];
          setDraft({ ...draft, libraries: libs });
          setAdding(false);
        }}
      />
    </Card>
  );
}

