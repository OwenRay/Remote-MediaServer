import React from 'react';
import { renderWithProviders } from '@/test-utils';
import LibraryScreen from '@/app/(tabs)/library';
import { server } from '@/jest.setup';
import { http, HttpResponse } from 'msw';
import { waitFor, screen } from '@testing-library/react-native';

describe('LibraryScreen', () => {
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
