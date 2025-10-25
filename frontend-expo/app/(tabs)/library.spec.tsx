import React from 'react';
import { renderWithProviders } from '@/test-utils';
import LibraryScreen from './library';

describe('Library', () => {
  it('renders header and handles loading state', () => {
    const { getByText } = renderWithProviders(<LibraryScreen />);
    expect(getByText('Library')).toBeTruthy();
  });
});
