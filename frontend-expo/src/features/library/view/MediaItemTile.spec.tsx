import { fireEvent } from '@testing-library/react-native';
import {MediaItemTile} from "./MediaItemTile";
import {renderWithProviders} from "../../../../test-utils";
import {MediaItem} from "../model/media";


function makeItem(overrides: Partial<MediaItem & { playPos?: number }> = {}): MediaItem & { playPos?: number } {
  return {
    id: 'abc123',
    title: 'My Show',
    fileduration: 200,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    playPos: 0,
    season: 1,
    episode: 2,
    ...overrides,
  } as any;
}

describe('MediaItemTile (expo)', () => {
  it('renders title and season/episode badge', () => {
    const item = makeItem();
    const {getByText} = renderWithProviders(
      <MediaItemTile item={item} />
    );
    // Title (note: API may already append SxxExx, but we render badge separately too)
    expect(getByText(/My Show/)).toBeTruthy();
    // Season/episode badge
    expect(getByText('s01e02')).toBeTruthy();
  });

  it('shows progress bar when playPos present', () => {
    const item = makeItem({ playPos: 50 });
    const {getByTestId} = renderWithProviders(<MediaItemTile item={item as any} />);
    expect(getByTestId('progress-bar')).toBeTruthy();
  });

  // @todo navigate on press
  it('invokes onPress when tapped twice', () => {
    const item = makeItem();
    const onPress = jest.fn();

    const {getByText} = renderWithProviders(<MediaItemTile item={item} />);
    fireEvent.press(getByText('My Show'));
    fireEvent.press(getByText('My Show'));

    expect(onPress).toHaveBeenCalled();
  });
});


describe('MediaItemTile play overlay', () => {
  it('renders play button and calls onPlay', () => {
    const item = makeItem();
    const onPlay = jest.fn();
    const {getByLabelText} = renderWithProviders(<MediaItemTile item={item} />);
    const play = getByLabelText('Play');
    fireEvent.press(play);
    expect(onPlay).toHaveBeenCalled();
  });
});
