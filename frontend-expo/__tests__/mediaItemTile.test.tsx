import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react-native';
import { renderWithProviders } from '@/test-utils';
import MediaItemTile from '@/src/components/media/MediaItemTile';
import type { MediaItem } from '@/src/services/api/media';

function makeItem(overrides: Partial<MediaItem & { playPos?: number }> = {}): MediaItem & { playPos?: number } {
  return {
    id: 'abc123',
    title: 'My Show',
    season: 1,
    episode: 2,
    fileduration: 100,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    ...overrides,
  } as any;
}

describe('MediaItemTile (expo)', () => {
  it('renders title and season/episode badge', () => {
    const item = makeItem();
    renderWithProviders(
      <MediaItemTile item={item} />
    );
    // Title (note: API may already append SxxExx, but we render badge separately too)
    expect(screen.getByText(/My Show/)).toBeTruthy();
    // Season/episode badge
    expect(screen.getByText('s01e02')).toBeTruthy();
  });

  it('shows progress bar when playPos present', () => {
    const item = makeItem({ playPos: 50 });
    renderWithProviders(<MediaItemTile item={item as any} />);
    expect(screen.getByTestId('progress-bar')).toBeTruthy();
  });

  it('invokes onPress when tapped twice', () => {
    const item = makeItem();
    const onPress = jest.fn();

    renderWithProviders(<MediaItemTile item={item} onPress={onPress} />);
    fireEvent.press(screen.getByTestId('media-item-tile'));
    fireEvent.press(screen.getByTestId('media-item-tile'));

    expect(onPress).toHaveBeenCalled();
  });
});
