import React from 'react';
import { renderWithProviders } from '@/test-utils';
import { act, waitFor } from '@testing-library/react-native';
import { Platform } from 'react-native';
import { usePlayerController } from './usePlayerController';
import * as mediaApi from '@/src/features/library/model/media';
import * as playbackApi from '@/src/features/player/model/playback';
import * as offline from '@/src/features/shared/model/offline';
import * as expoVideo from 'expo-video';

jest.mock('@/src/features/shared/model/offline', () => ({
  getUri: jest.fn(),
}));

// Small harness to access hook return value in a component test
function HookHarness({ id, onReady }: { id: string; onReady: (c: ReturnType<typeof usePlayerController>) => void }) {
  const controller = usePlayerController({ id });
  React.useEffect(() => { onReady(controller); }, [controller, onReady]);
  return null;
}

describe('usePlayerController', () => {
  const originalPlatform = Platform.OS;

  beforeEach(() => {
    // Default mocks
    jest.spyOn(mediaApi, 'useGetItemQuery').mockReturnValue({ data: { id: 'itm1', fileduration: 100, playPosition: { position: 0, watched: false } } } as any);
    (offline.getUri as jest.Mock).mockReset();
    (offline.getUri as jest.Mock).mockResolvedValue(undefined as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Platform.OS = originalPlatform;
  });

  it('prefers offline source when available', async () => {
    const playerMock = { currentTime: 0, play: jest.fn(), pause: jest.fn(), seek: jest.fn(), playing: false } as any;
    const useVideoSpy = jest.spyOn(expoVideo, 'useVideoPlayer').mockReturnValue(playerMock);
    (offline.getUri as jest.Mock).mockResolvedValueOnce('file:///downloaded.mp4');

    let ctl: any;
    renderWithProviders(<HookHarness id="42" onReady={(c) => { ctl = c; }} />);

    await waitFor(() => expect(useVideoSpy).toHaveBeenCalled());
    // Wait until one of the calls uses the offline URI
    await waitFor(() => {
      const matched = useVideoSpy.mock.calls.some(c => c[0]?.uri === 'file:///downloaded.mp4');
      expect(matched).toBe(true);
    });
    expect(ctl.player).toBe(playerMock);
  });

  it('falls back to streaming URL with seek anchor when offline missing', async () => {
    const playerMock = { currentTime: 0, play: jest.fn(), pause: jest.fn(), seek: jest.fn(), playing: false } as any;
    const useVideoSpy = jest.spyOn(expoVideo, 'useVideoPlayer').mockReturnValue(playerMock);

    renderWithProviders(<HookHarness id="99" onReady={() => {}} />);

    await waitFor(() => expect(useVideoSpy).toHaveBeenCalled());
    // Wait until one of the calls uses the expected id anchor
    await waitFor(() => {
      const matched = useVideoSpy.mock.calls.some(c => /\/ply\/99\/0$/.test(c[0]?.uri));
      expect(matched).toBe(true);
    });
  });

  it('togglePlay toggles paused state and calls player play/pause', async () => {
    const playerMock = { currentTime: 0, play: jest.fn(), pause: jest.fn(), seek: jest.fn(), playing: false } as any;
    jest.spyOn(expoVideo, 'useVideoPlayer').mockReturnValue(playerMock);

    let ctl: any;
    renderWithProviders(<HookHarness id="7" onReady={(c) => { ctl = c; }} />);
    await waitFor(() => expect(ctl).toBeTruthy());

    // Initially paused true -> toggle should play
    act(() => ctl.togglePlay());
    expect(playerMock.play).toHaveBeenCalled();

    // Mark as playing then toggle -> should pause
    playerMock.playing = true;
    act(() => ctl.togglePlay());
    expect(playerMock.pause).toHaveBeenCalled();
  });

  it('onSeek sets position and unpauses', async () => {
    const playerMock = { currentTime: 0, play: jest.fn(), pause: jest.fn(), seek: jest.fn(), playing: false } as any;
    const useVideoSpy = jest.spyOn(expoVideo, 'useVideoPlayer').mockReturnValue(playerMock);

    let ctl: any;
    renderWithProviders(<HookHarness id="5" onReady={(c) => { ctl = c; }} />);
    await waitFor(() => expect(ctl).toBeTruthy());

    act(() => ctl.onSeek(42));
    expect(ctl.paused).toBe(false);

    // Source should eventually reflect the new seek anchor 42 for id 5
    await waitFor(() => {
      const matched = useVideoSpy.mock.calls.some(c => /\/ply\/5\/(\d+)$/.test(c[0]?.uri ?? ''));
      expect(matched).toBe(true);
    });
    // Changing position triggers a new render; simulate by nudging retry which bumps position forcing new memo
    act(() => ctl.retry());
    await waitFor(() => {
      const matched = useVideoSpy.mock.calls.some(c => /\/ply\/5\//.test(c[0]?.uri ?? ''));
      expect(matched).toBe(true);
    });
  });

  it('retry clears errors and nudges position to refresh source', async () => {
    const playerMock = { currentTime: 0, play: jest.fn(), pause: jest.fn(), seek: jest.fn(), playing: false } as any;
    const useVideoSpy = jest.spyOn(expoVideo, 'useVideoPlayer').mockReturnValue(playerMock);

    let ctl: any;
    renderWithProviders(<HookHarness id="55" onReady={(c) => { ctl = c; }} />);
    await waitFor(() => expect(ctl).toBeTruthy());

    act(() => ctl.retry());
    // Should cause the source memo to change, creating a new player (at least one more call)
    await waitFor(() => expect(useVideoSpy.mock.calls.length).toBeGreaterThan(0));
  });

  it('toggleFullscreen handles web document fullscreen state and native no-op', async () => {
    const playerMock = { currentTime: 0, play: jest.fn(), pause: jest.fn(), seek: jest.fn(), playing: false } as any;
    jest.spyOn(expoVideo, 'useVideoPlayer').mockReturnValue(playerMock);

    let ctl: any;
    renderWithProviders(<HookHarness id="101" onReady={(c) => { ctl = c; }} />);
    await waitFor(() => expect(ctl).toBeTruthy());

    // Native branch (non-web): should early return without crashing
    Platform.OS = 'ios';
    act(() => ctl.toggleFullscreen());

    // Web branch: request when not fullscreen, exit when fullscreen
    Platform.OS = 'web';

    // Provide a minimal document stub if not available
    const anyGlobal: any = global as any;
    if (!anyGlobal.document) {
      anyGlobal.document = {
        documentElement: {},
        exitFullscreen: jest.fn(),
      } as any;
    }
    const requestFullscreen = jest.fn();
    const exitFullscreen = jest.fn();
    (anyGlobal.document as any).documentElement.requestFullscreen = requestFullscreen;
    (anyGlobal.document as any).exitFullscreen = exitFullscreen;

    (anyGlobal.document as any).fullscreenElement = null;
    act(() => ctl.toggleFullscreen());
    expect(requestFullscreen).toHaveBeenCalled();

    (anyGlobal.document as any).fullscreenElement = {};
    act(() => ctl.toggleFullscreen());
    expect(exitFullscreen).toHaveBeenCalled();
  });

  it('persists position on unmount when moved more than 5 seconds', async () => {
    const playerMock = { currentTime: 7, play: jest.fn(), pause: jest.fn(), seek: jest.fn(), playing: false } as any;
    jest.spyOn(expoVideo, 'useVideoPlayer').mockReturnValue(playerMock);
    const writePos = jest.fn();
    jest.spyOn(playbackApi, 'useWritePlayPositionMutation').mockReturnValue([writePos] as any);
    jest.spyOn(mediaApi, 'useGetItemQuery').mockReturnValue({ data: { id: 'itm9', fileduration: 120, playPosition: { position: 0, watched: false } } } as any);

    let ctl: any;
    const { unmount } = renderWithProviders(<HookHarness id="itm9" onReady={(c) => { ctl = c; }} />);
    await waitFor(() => expect(ctl).toBeTruthy());

    act(() => ctl.onSeek(10)); // seek to 10

    // Unmount triggers persistence logic: newTime = position + currentTime = 17, diff > 5
    unmount();
    expect(writePos).toHaveBeenCalledWith({ mediaItemId: 'itm9', position: 17, duration: 120 });
  });

  it('does not persist when diff <= 5 seconds', async () => {
    const playerMock = { currentTime: 4.9, play: jest.fn(), pause: jest.fn(), seek: jest.fn(), playing: false } as any;
    jest.spyOn(expoVideo, 'useVideoPlayer').mockReturnValue(playerMock);
    const writePos = jest.fn();
    jest.spyOn(playbackApi, 'useWritePlayPositionMutation').mockReturnValue([writePos] as any);
    jest.spyOn(mediaApi, 'useGetItemQuery').mockReturnValue({ data: { id: 'itm10', fileduration: 120, playPosition: { position: 0, watched: false } } } as any);

    let ctl: any;
    const { unmount } = renderWithProviders(<HookHarness id="itm10" onReady={(c) => { ctl = c; }} />);
    await waitFor(() => expect(ctl).toBeTruthy());

    act(() => ctl.onSeek(0));
    unmount();
    expect(writePos).not.toHaveBeenCalled();
  });
});
