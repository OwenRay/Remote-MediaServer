import React from 'react';
import { renderWithProviders } from '@/test-utils';
import LibraryScreen from '@/app/(tabs)/library';
import { server } from '@/jest.setup';
import { http, HttpResponse } from 'msw';
import { waitFor, screen } from '@testing-library/react-native';

describe('LibraryScreen', () => {
  it('renders items from API', async () => {
    renderWithProviders(<LibraryScreen />);
    expect(screen.getByText('Library')).toBeTruthy();
    await waitFor(() => {
      expect(screen.getByText('Example Video 1')).toBeTruthy();
      expect(screen.getByText('Example Video 2')).toBeTruthy();
    });
  });

  it('shows empty state when no items', async () => {
    server.use(
      http.get('*/api/media-items', () => HttpResponse.json({ data: [] }))
    );
    renderWithProviders(<LibraryScreen />);
    await waitFor(() => {
      expect(screen.getByText('No items found.')).toBeTruthy();
    });
  });
});
