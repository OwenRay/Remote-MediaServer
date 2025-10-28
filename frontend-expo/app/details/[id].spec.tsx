import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import DetailsScreen from './[id]';
import { renderWithProviders } from '@/test-utils';
import * as mediaApi from '@/src/features/library/model/media';
import * as playbackApi from '@/src/features/player/model/playback';

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: 'itm1' }),
  useRouter: () => ({ push: jest.fn() }),
}));

describe('DetailsScreen', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  function mockItem(overrides: Partial<mediaApi.MediaItem> = {}) {
    const base: mediaApi.MediaItem = {
      id: 'itm1',
      title: 'My Movie',
      fileduration: 3600,
      year: '2024',
      overview: 'Overview text',
      type: 'movie',
      thumbnailUrl: '',
      posterUrl: '',
      posterLargeUrl: '',
      backdropUrl: 'https://example.com/back.jpg',
      imdbUrl: 'https://example.com/imdb',
    } as any;
    return { ...base, ...overrides } as mediaApi.MediaItem;
  }

  it('renders BlurView overlay and IMDb button', async () => {
    jest.spyOn(mediaApi, 'useGetItemQuery').mockReturnValue({
      data: mockItem(),
      isLoading: false,
      isError: false,
    } as any);

    const mockWrite = jest.fn().mockReturnValue({ unwrap: async () => ({}) });
    jest.spyOn(playbackApi, 'useWritePlayPositionMutation').mockReturnValue([mockWrite] as any);

    renderWithProviders(<DetailsScreen />);

    await waitFor(() => expect(screen.getByTestId('details-blur-overlay')).toBeTruthy());
    expect(screen.getByText('IMDb')).toBeTruthy();
  });

  it('toggles watched via checkbox button', async () => {
    jest.spyOn(mediaApi, 'useGetItemQuery').mockReturnValue({
      data: mockItem({ playPosition: { position: 0, watched: false } }),
      isLoading: false,
      isError: false,
    } as any);

    const mockWrite = jest.fn().mockReturnValue({ unwrap: async () => ({}) });
    jest.spyOn(playbackApi, 'useWritePlayPositionMutation').mockReturnValue([mockWrite] as any);

    renderWithProviders(<DetailsScreen />);

    const btn = await screen.findByLabelText('Mark watched');
    fireEvent.press(btn);

    await waitFor(() => expect(mockWrite).toHaveBeenCalled());
  });
});
