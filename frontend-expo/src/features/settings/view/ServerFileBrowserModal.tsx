import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Modal, ActivityIndicator, FlatList, Pressable } from 'react-native';
import {default as styled, DefaultTheme} from 'styled-components/native';
import { ThemedText } from '@/src/features/shared/view/ThemedText';
import { ThemedTextInput } from '@/src/features/shared/view/ThemedTextInput';
import { SecondaryButton } from '@/src/features/shared/view/SecondaryButton';
import { getApiBaseUrl } from '@/src/features/shared/model/serverConfig';

export type ServerFileBrowserModalProps = {
  visible: boolean;
  initialDirectory?: string;
  label?: string;
  onSelect: (directory: string) => void;
  onClose: () => void;
};


async function fetchDirectories(path: string): Promise<{ error?: string; result: string[] }> {
  const url = `${getApiBaseUrl()}/browse?directory=${encodeURIComponent(path)}`;
  const res = await fetch(url);
  if (!res.ok) {
    return { error: 'Could not list directory', result: [] };
  }
  try {
    return (await res.json()) as { error?: string; result: string[] };
  } catch {
    return { error: 'Invalid server response', result: [] };
  }
}

export function ServerFileBrowserModal({ visible, initialDirectory = '/', label = 'Directory', onSelect, onClose }: ServerFileBrowserModalProps) {
  const [path, setPath] = useState<string>(initialDirectory || '/');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [directories, setDirectories] = useState<string[]>([]);

  const normalizedPath = useMemo(() => (path || '/').replace(/\\/g, '/'), [path]);

  const load = useCallback(async (target: string) => {
    setLoading(true);
    setError('');
    const resp = await fetchDirectories(target);
    if (resp.error) setError('Could not list directory');
    setDirectories(resp.result || []);
    setLoading(false);
  }, []);

  // reset and load on open
  useEffect(() => {
    if (visible) {
      const initial = (initialDirectory || '/').replace(/\\/g, '/');
      setPath(initial);
      load(initial).catch(() => {
        setError('Could not list directory');
        setLoading(false);
      });
    }
  }, [visible, initialDirectory, load]);

  const goUp = useCallback(() => {
    let val = normalizedPath;
    if (!val.endsWith('/')) val += '/';
    const parts = val.split('/');
    parts.pop();
    parts.pop();
    let next = parts.join('/');
    if (!next) next = '/';
    setPath(next);
    load(next);
  }, [normalizedPath, load]);

  const enterDir = useCallback((dir: string) => {
    let val = normalizedPath;
    if (!val.endsWith('/')) val += '/';
    const next = `${val}${dir}`;
    setPath(next);
    load(next);
  }, [normalizedPath, load]);

  const onChangePath = useCallback((t: string) => {
    const clean = t.replace('\\\\', '/').replace('\\\n', '/').replace('\\', '/');
    setPath(clean);
    // Debounce could be added; for simplicity, load immediately
    load(clean);
  }, [load]);

  return (
    <Modal transparent visible={visible} onRequestClose={onClose} animationType="fade">
      <Backdrop>
        <Card>
          <HeaderRow>
            <ThemedText style={{ fontSize: 18, fontWeight: '600' }}>{label}</ThemedText>
            <SecondaryButton onPress={onClose}><ThemedText>Close</ThemedText></SecondaryButton>
          </HeaderRow>
          <Row>
            <InputFlex placeholder="/" value={normalizedPath} onChangeText={onChangePath} />
            <SecondaryButton onPress={() => onSelect(normalizedPath)}>
              <ThemedText>Select Folder</ThemedText>
            </SecondaryButton>
          </Row>
          <Divider />
          {loading ? (
            <Row style={{ justifyContent: 'center' }}>
              <ActivityIndicator />
            </Row>
          ) : error ? (
            <ErrorText>{error}</ErrorText>
          ) : (
            <FlatList
              data={['..', ...directories]}
              keyExtractor={(item) => item}
              ItemSeparatorComponent={() => <Divider />}
              renderItem={({ item }) => (
                <ListItem onPress={() => (item === '..' ? goUp() : enterDir(item))} accessibilityRole="button">
                  <ThemedText>{item === '..' ? 'Go up' : item}</ThemedText>
                </ListItem>
              )}
              style={{ maxHeight: 300 }}
            />
          )}
          {!loading && !directories.length && !error ? (
            <ThemedText>Empty directory</ThemedText>
          ) : null}
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

const Row = styled.View`
  flex-direction: row;
  align-items: center;
  gap: 8px;
`;

const InputFlex: typeof ThemedTextInput = styled(ThemedTextInput)`
  flex: 1;
`;

const Divider = styled.View`
  height: 1px;
  background-color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.border};
`;

const ListItem = styled(Pressable)`
  padding-vertical: 12px;
`;

const ErrorText = styled(ThemedText)`
  color: ${({ theme }: { theme: DefaultTheme }) => theme.colors.error};
`;
