import React from 'react';
import PlayerScreen from './[id]';
import { renderWithProviders } from '@/test-utils';
import * as mediaApi from '@/src/features/library/model/media';
import {waitFor} from "@testing-library/react-native";

jest.mock('react-native-google-cast', () => ({
  ...jest.requireActual('react-native-google-cast'),
  useDevices: jest.fn().mockReturnValue({ devices: [] }),
  useCastState: jest.fn().mockReturnValue({ isConnected: false }),
  useRemoteMediaClient: jest.fn().mockReturnValue(undefined),
}));

const mockNavigation = { setOptions: jest.fn() };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'itm1' }),
  useNavigation: () => mockNavigation,
  useRouter: () => ({ replace: jest.fn(), push: jest.fn() }),
}));

// Do not render the full PlayerScreenView tree in this test; focus on title logic only
jest.mock('@/src/features/player/view/PlayerScreenView', () => ({
  PlayerScreenView: () => null,
}));

describe('PlayerScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
    mockNavigation.setOptions.mockReset();
  });

  it('sets header title with the media title', async () => {
    jest.spyOn(mediaApi, 'useGetItemQuery').mockReturnValue({
      data: { id: 'itm1', title: 'My Movie', fileduration: 120, seasonEpisodeTag: 'S01E02' } as any,
    } as any);

    renderWithProviders(<PlayerScreen />);

    await waitFor(() => expect(mockNavigation.setOptions).toHaveBeenCalledWith(expect.objectContaining({ title: 'S01E02 • My Movie', headerTransparent: true })));
  });
});
