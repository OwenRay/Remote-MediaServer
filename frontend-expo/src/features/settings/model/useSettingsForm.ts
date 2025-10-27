import {useCallback, useEffect, useState} from 'react';
import {Platform, Alert} from 'react-native';
import { getBaseUrl, setBaseUrl } from '@/src/features/shared/model/serverConfig';
import {
  SettingsAttributes,
  useGetModulesQuery,
  useGetSettingsQuery,
  useUpdateSettingsMutation
} from '@/src/features/settings/model/settings';

export type UseSettingsForm = {
  draft?: SettingsAttributes;
  setDraft: (next: SettingsAttributes) => void;
  serverEndpoint: string;
  setServerEndpoint: (value: string) => void;
  availableModules: string[];
  isFetching: boolean;
  isSaving: boolean;
  hasModule: (name: string) => boolean;
  toggleModule: (name: string) => void;
  onSave: () => Promise<void>;
};

export function useSettingsForm(): UseSettingsForm {
  const { data: settings, isFetching } = useGetSettingsQuery();
  const { data: availableModules = [] } = useGetModulesQuery();
  const [updateSettings, { isLoading: isSaving }] = useUpdateSettingsMutation();

  const [draft, setDraftState] = useState<SettingsAttributes | undefined>(undefined);
  const [serverEndpoint, setServerEndpointState] = useState<string>('');

  // Initialize draft from settings when first loaded
  useEffect(() => {
    if (settings && !draft) setDraftState(settings);
  }, [settings, draft]);

  const setServerEndpointCb = useCallback((value: string) => {
    setBaseUrl(value);
    setServerEndpointState(value);
  }, []);

  useEffect(() => {
    // hydrate server endpoint once
    setServerEndpointCb(getBaseUrl());
  }, [setServerEndpointCb]);

  const hasModule = useCallback((name: string) => (draft?.modules ?? []).includes(name), [draft]);

  const toggleModule = useCallback((name: string) => {
    if (!draft) return;
    const set = new Set(draft.modules ?? []);
    if (set.has(name)) set.delete(name); else set.add(name);
    setDraftState({ ...draft, modules: Array.from(set) });
  }, [draft]);

  const onSave = useCallback(async () => {
    if (!draft) return;
    try {
      const patch: Partial<SettingsAttributes> = {
        name: draft.name,
        port: Number(draft.port) as any,
        filewatcher: draft.filewatcher,
        startscan: !!draft.startscan,
        modules: draft.modules ?? [],
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
  }, [draft, updateSettings]);

  return {
    draft,
    setDraft: (next) => setDraftState(next),
    serverEndpoint,
    setServerEndpoint: setServerEndpointCb,
    availableModules,
    isFetching,
    isSaving,
    hasModule,
    toggleModule,
    onSave,
  };
}

