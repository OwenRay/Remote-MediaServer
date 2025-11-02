import React, { useCallback, useState } from 'react';
import { Modal, Alert } from 'react-native';
import {default as styled, DefaultTheme} from 'styled-components/native';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { ThemedTextInput } from '@/src/features/shared/view/ThemedTextInput';
import { ThemedPicker } from '@/src/features/shared/view/ThemedPicker';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import { ServerFileBrowserModal } from '@/src/features/settings/view/ServerFileBrowserModal';

export type LibraryAttributes = {
  uuid?: string;
  name?: string;
  type?: string;
  folder?: string;
  shared?: boolean;
};

export type LibraryEditDialogProps = {
  visible: boolean;
  initial?: LibraryAttributes;
  title?: string;
  onCancel: () => void;
  onSave: (lib: LibraryAttributes) => void;
};

export function LibraryEditDialog({ visible, initial, title = 'Library', onCancel, onSave }: LibraryEditDialogProps) {
  const [local, setLocal] = useState<LibraryAttributes>(initial ?? { name: '', type: 'folder', folder: '' });
  const [browseVisible, setBrowseVisible] = useState(false);

  React.useEffect(() => {
    if (visible) {
      setLocal(initial ?? { name: '', type: 'folder', folder: '' });
    }
  }, [visible, initial]);

  const isShared = local.type === 'shared';

  const onPressSave = useCallback(() => {
    // Basic validation
    if (!local.name || local.name.trim().length === 0) {
      Alert.alert('Validation', 'Please enter a name for the library.');
      return;
    }
    if (!isShared && (!local.folder || local.folder.trim().length === 0)) {
      Alert.alert('Validation', 'Please select a folder.');
      return;
    }
    if (isShared && (!local.uuid || local.uuid.trim().length === 0)) {
      Alert.alert('Validation', 'Please enter the external code.');
      return;
    }
    onSave(local);
  }, [local, onSave, isShared]);

  return (
    <Modal statusBarTranslucent transparent visible={visible} onRequestClose={onCancel} animationType="fade">
      <Backdrop>
        <Card>
          <HeaderRow>
            <ThemedText style={{ fontSize: 18, fontWeight: '600' }}>{title}</ThemedText>
            <SecondaryButton onPress={onCancel}><ThemedText>Close</ThemedText></SecondaryButton>
          </HeaderRow>

          <Field>
            <Label>Name</Label>
            <ThemedTextInput
              placeholder="Name"
              value={local.name ?? ''}
              onChangeText={(t: string) => setLocal({ ...local, name: t })}
            />
          </Field>

          <Field style={{zIndex: 99}}>
            <Label>Type</Label>
            <ThemedPicker
              selectedValue={local.type ?? 'folder'}
              onValueChange={(val: string | number) => setLocal({ ...local, type: String(val) })}
              options={[{ label: 'Unspecified', value: 'folder' }, { label: 'TV Shows', value: 'tv' }, { label: 'Movies', value: 'movie' }, { label: 'Music', value: 'library_music' }, { label: 'External Library', value: 'shared'}]}
            />
          </Field>

          {isShared ? (
            <Field>
              <Label>Code</Label>
              <ThemedTextInput
                placeholder="Code"
                value={local.uuid ?? ''}
                onChangeText={(t: string) => setLocal({ ...local, uuid: t })}
              />
            </Field>
          ) : (
            <Field>
              <Label>Directory</Label>
              <Row>
                <DirInput
                  placeholder="Directory"
                  value={local.folder ?? ''}
                  onChangeText={(t: string) => setLocal({ ...local, folder: t })}
                />
                <SecondaryButton onPress={() => setBrowseVisible(true)}>
                  <ThemedText>Browse</ThemedText>
                </SecondaryButton>
              </Row>
              <ServerFileBrowserModal
                visible={browseVisible}
                initialDirectory={local.folder || '/'}
                label="Directory"
                onSelect={(dir) => {
                  setLocal({ ...local, folder: dir });
                  setBrowseVisible(false);
                }}
                onClose={() => setBrowseVisible(false)}
              />
            </Field>
          )}

          <Actions>
            <SecondaryButton onPress={onPressSave}>
              <ThemedText>Save</ThemedText>
            </SecondaryButton>
          </Actions>
        </Card>
      </Backdrop>
    </Modal>
  );
}

const Backdrop = styled.View`
  flex: 1;
  background-color: rgba(0,0,0,0.5);
  align-items: center;
  justify-content: center;
`;

const Card = styled.View`
  width: 90%;
  max-height: 80%;
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.card};
  border-radius: 12px;
  padding: 16px;
  gap: 12px;
`;

const HeaderRow = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
`;

const Field = styled.View`
  gap: 6px;
`;

const Label = styled(ThemedText)`
  opacity: 0.8;
`;

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const DirInput: typeof ThemedTextInput = styled(ThemedTextInput)`
  flex: 1;
`;

const Actions = styled.View`
  flex-direction: row;
  justify-content: flex-end;
`;
