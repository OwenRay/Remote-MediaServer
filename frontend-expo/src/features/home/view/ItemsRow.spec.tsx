import React from 'react';
import { screen, waitFor } from '@testing-library/react-native';
import { ItemsRow } from './ItemsRow';
import * as homeApi from '@/src/features/home/model/home';
import { renderWithProviders } from '@/test-utils';

// Helper to mock the RTK Query hook directly for home endpoint
function mockHomeHook(state: Partial<ReturnType<typeof homeApi.useGetHomeQuery>>) {
  jest.spyOn(homeApi, 'useGetHomeQuery').mockReturnValue({
    data: undefined,
    isFetching: false,
    isUninitialized: false,
    isError: false,
    refetch: jest.fn(),
    // Allow overrides
    ...(state as any),
  } as any);
}

describe('ItemsRow', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  const row = 'continueWatching' as const;

  it('shows loading state', async () => {
    mockHomeHook({ isFetching: true });

    renderWithProviders(<ItemsRow title="Loading Title" row={row} />);

    await waitFor(() => expect(screen.getByText('Loading...')).toBeTruthy());
  });

  it('shows empty state when no items', async () => {
    mockHomeHook({ data: { continueWatching: [], recommended: [], newMovies: [], newTV: [] } });

    renderWithProviders(<ItemsRow title="Empty Title" row={row} />);

    await waitFor(() => expect(screen.getByText('Nothing to see here yet')).toBeTruthy());
  });

  it('renders items when present', async () => {
    mockHomeHook({ data: { continueWatching: [{ id: '1', title: 'Movie', fileduration: 0, thumbnailUrl: '', year: '2020' } as any], recommended: [], newMovies: [], newTV: [] } });

    renderWithProviders(<ItemsRow title="Has Items" row={row} />);

    await waitFor(() => {
      expect(screen.getByText('Has Items')).toBeTruthy();
    });
  });

  it('shows empty placeholder on error', async () => {
    mockHomeHook({ isError: true });

    renderWithProviders(<ItemsRow title="Error Title" row={row} />);

    await waitFor(() => expect(screen.getByText('Nothing to see here yet')).toBeTruthy());
  });
});
