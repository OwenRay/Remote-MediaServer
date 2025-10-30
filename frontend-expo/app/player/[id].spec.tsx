import React from 'react';
import PlayerScreen from './[id]';
import { renderWithProviders } from '@/test-utils';
import * as mediaApi from '@/src/features/library/model/media';

const mockNavigation = { setOptions: jest.fn() };
jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'itm1' }),
  useNavigation: () => mockNavigation,
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
      data: { id: 'itm1', title: 'My Movie', fileduration: 120 } as any,
    } as any);

    renderWithProviders(<PlayerScreen />);

    expect(mockNavigation.setOptions).toHaveBeenCalledWith(expect.objectContaining({ title: 'My Movie', headerTransparent: true }));
  });
});
