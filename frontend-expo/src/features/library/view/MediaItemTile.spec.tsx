import { fireEvent } from '@testing-library/react-native';
import {MediaItemTile} from "./MediaItemTile";
import {renderWithProviders} from "../../../../test-utils";
import {MediaItem} from "../model/media";


import * as expoRouter from "expo-router";
jest.mock('expo-router', () => ({
  useRouter: jest.fn()
}))

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
  it('goes to details page when media item is tapped twice', () => {
    const mockRouter:any = {push: jest.fn()};
    jest.spyOn(expoRouter, 'useRouter').mockReturnValue(mockRouter);

    const item = makeItem();

    const {getByText} = renderWithProviders(<MediaItemTile item={item}/>);
    fireEvent.press(getByText('My Show'));
    fireEvent.press(getByText('My Show'));

    expect(mockRouter.push).toHaveBeenCalledWith(`/details/${item.id}`);
  });
});


describe('MediaItemTile play overlay', () => {
  it('goes to play page when play button is pressed', () => {
    const mockRouter:any = {push: jest.fn()};
    jest.spyOn(expoRouter, 'useRouter').mockReturnValue(mockRouter);;

    const item = makeItem();
    const {getByLabelText} = renderWithProviders(<MediaItemTile item={item}/>);
    const play = getByLabelText('Play');
    fireEvent.press(play);

    expect(mockRouter.push).toHaveBeenCalledWith(`/player/${item.id}`);
  });
});
