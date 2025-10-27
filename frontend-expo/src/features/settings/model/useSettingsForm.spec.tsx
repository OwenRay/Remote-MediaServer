import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { Text, Button } from 'react-native';
import { act, fireEvent, waitFor } from '@testing-library/react-native';
import {useSettingsForm} from './useSettingsForm';

// Mocks
jest.mock('@/src/features/settings/model/settings', () => {
  const settings = {
    name: 'My Server',
    port: 8234,
    filewatcher: 'native',
    startscan: false,
    modules: ['ssl'],
    libraries: [],
    ssldomain: 'sub.example.com',
    sslport: 443,
    sslemail: 'admin@example.com',
    sslredirect: true,
    sharehost: 'share.example.com',
    shareport: 5555,
    sharespace: 10,
    advanced: true,
  };
  const available = ['ssl', 'sharing'];
  const mockUpdate = jest.fn((patch: any) => ({ unwrap: () => Promise.resolve({ patch }) }));
  return {
    useGetSettingsQuery: jest.fn(() => ({ data: settings, isFetching: false })),
    useGetModulesQuery: jest.fn(() => ({ data: available })),
    useUpdateSettingsMutation: jest.fn(() => [mockUpdate, { isLoading: false }]),
  };
});

const mockSetBaseUrl = jest.fn();
const mockGetBaseUrl = jest.fn(() => 'http://example:1234');

global.alert = jest.fn();

jest.mock('@/src/features/shared/model/serverConfig', () => ({
  setBaseUrl: (v: string) => mockSetBaseUrl(v),
  getBaseUrl: () => mockGetBaseUrl(),
}));

function HookHarness() {
  const hook = useSettingsForm();
  return (
    <>
      <Text testID="serverEndpoint">{hook.serverEndpoint}</Text>
      <Text testID="modules">{(hook.draft?.modules ?? []).join(',')}</Text>
      <Button title="toggleSharing" onPress={() => hook.toggleModule('sharing')} />
      <Button title="save" onPress={() => hook.onSave()} />
    </>
  );
}

describe('useSettingsForm', () => {
  it('initializes draft and server endpoint', async () => {
    const { getByTestId } = renderWithProviders(<HookHarness />);

    await waitFor(() => {
      expect(getByTestId('serverEndpoint').props.children).toBe('http://example:1234');
    });
  });

  it('toggles modules correctly', async () => {
    const { getByText, getByTestId } = renderWithProviders(<HookHarness />);

    // Initially only ssl
    await waitFor(() => {
      expect(getByTestId('modules').props.children).toBe('ssl');
    });

    await act(async () => fireEvent.press(getByText('toggleSharing')));

    await waitFor(() => {
      expect(getByTestId('modules').props.children).toBe('ssl,sharing');
    });
  });

  it('saves with correct numeric parsing', async () => {
    const { getByText } = renderWithProviders(<HookHarness />);

    await act(async () => fireEvent.press(getByText('save')));

    // getBaseUrl should be called during hydration at least once
    expect(mockGetBaseUrl).toHaveBeenCalled();
    // updateSettings called via hook mock (see module mock above)
    const { useUpdateSettingsMutation } = jest.requireMock('@/src/features/settings/model/settings');
    const [mockUpdate] = useUpdateSettingsMutation();
    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      port: expect.any(Number),
      sslport: expect.any(Number),
      shareport: expect.any(Number),
      sharespace: expect.any(Number),
    }));
  });
});
