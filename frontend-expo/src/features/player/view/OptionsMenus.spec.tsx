import React from 'react';
import { fireEvent, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '@/test-utils';
import { OptionsMenus } from './OptionsMenus';
import type { PlayerController } from '@/src/features/player/domain/usePlayerController';
import * as mediaContent from '@/src/features/player/model/mediaContent';

function makeController(overrides: Partial<PlayerController> = {}): PlayerController {
  // @ts-expect-error partial for tests
  return {
    paused: false,
    position: 0,
    onSeek: jest.fn(),
    currentTime: 0,
    volume: 1,
    setVolume: jest.fn(),
    togglePlay: jest.fn(),
    retry: jest.fn(),
    toggleFullscreen: jest.fn(),
    isCasting: false,
    player: { currentTime: 0 },
    item: { id: '123' } as any,
    setAudioChannel: jest.fn(),
    setVideoChannel: jest.fn(),
    setSubtitle: jest.fn(),
    ...overrides,
  } as unknown as PlayerController;
}

jest.spyOn(mediaContent, 'useGetMediaContentQuery').mockReturnValue({
  data: {
    audio: [],
    video: [],
    subtitles: [
      { label: 'None', value: '' },
      { label: 'eng.srt', value: 'eng.srt' },
      { label: 'built-in', value: ':3.ass' },
    ],
  },
  isLoading: false,
  isError: false,
} as any);

describe('OptionsMenus subtitles', () => {
  it('opens subtitle menu and selects a subtitle', async () => {
    const setSubtitle = jest.fn();
    const controller = makeController({ setSubtitle });
    const { getByLabelText, getByText } = renderWithProviders(
      // @ts-ignore casting
      <OptionsMenus controller={controller} castingController={{ ...controller, available: false }} />
    );

    fireEvent.press(getByLabelText('subtitles'));

    await waitFor(() => getByText('eng.srt'));
    fireEvent.press(getByText('eng.srt'));
    expect(setSubtitle).toHaveBeenCalledWith('eng.srt');
  });
});
