/*
 Web Chromecast service using CAF Sender SDK. No-ops on native platforms.
*/
import {Platform} from 'react-native';

const CAST_SDK_URL = 'https://www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';
const DEFAULT_APP_ID = 'CC1AD845'; // Default Media Receiver

export type CastStateListener = (s: {available: boolean; casting: boolean}) => void;

class CastService {
  private initialized = false;
  private available = false;
  private casting = false;
  private listeners: Set<CastStateListener> = new Set();

  init() {
    if (Platform.OS !== 'web' || this.initialized) return;
    this.initialized = true;

    // Load CAF script if not present
    if (!(window as any).cast || !(window as any).cast.framework) {
      const script = document.createElement('script');
      script.src = CAST_SDK_URL;
      script.async = true;
      script.onload = () => this.setupCast();
      document.head.appendChild(script);
    } else {
      this.setupCast();
    }
  }

  private setupCast() {
    try {
      const castAny = (window as any).cast;
      if (!castAny || !castAny.framework) return;
      const context = castAny.framework.CastContext.getInstance();
      context.setOptions({
        receiverApplicationId: DEFAULT_APP_ID,
        autoJoinPolicy: castAny.framework.AutoJoinPolicy.ORIGIN_SCOPED,
      });

      this.available = true;
      this.notify();

      context.addEventListener(castAny.framework.CastContextEventType.SESSION_STATE_CHANGED, (evt: any) => {
        const state = evt.sessionState;
        const S = castAny.framework.SessionState;
        const casting = state === S.SESSION_STARTED || state === S.SESSION_RESUMED;
        this.casting = casting;
        this.notify();
      });
    } catch {
      // ignore
    }
  }

  addListener(fn: CastStateListener) {
    this.listeners.add(fn);
    fn({available: this.available, casting: this.casting});
  }
  removeListener(fn: CastStateListener) {
    this.listeners.delete(fn);
  }
  private notify() {
    const s = {available: this.available, casting: this.casting};
    this.listeners.forEach(l => l(s));
  }

  isAvailable() { return Platform.OS === 'web' && this.available; }
  isCasting() { return Platform.OS === 'web' && this.casting; }

  async startCasting() {
    if (!this.isAvailable()) return;
    const castAny = (window as any).cast;
    await castAny.framework.CastContext.getInstance().requestSession();
  }
  stopCasting() {
    if (!this.isAvailable()) return;
    const castAny = (window as any).cast;
    castAny.framework.CastContext.getInstance().endCurrentSession(true);
  }

  loadMedia(url: string, contentType: string, title?: string, imageUrl?: string, startTimeSec?: number) {
    if (!this.isAvailable()) return;
    const castAny = (window as any).cast;
    const ctx = castAny.framework.CastContext.getInstance();
    const session = ctx.getCurrentSession?.();
    if (!session) return;

    const mediaInfo = new (window as any).chrome.cast.media.MediaInfo(url, contentType || 'video/mp4');
    if (title || imageUrl) {
      const md = new (window as any).chrome.cast.media.GenericMediaMetadata();
      if (title) md.title = title;
      if (imageUrl) md.images = [{url: imageUrl}];
      mediaInfo.metadata = md;
    }

    const request = new (window as any).chrome.cast.media.LoadRequest(mediaInfo);
    if (typeof startTimeSec === 'number') request.currentTime = Math.max(0, Math.floor(startTimeSec));
    request.autoplay = true;

    session.loadMedia(request).catch(() => {/* ignore */});
  }

  play() {
    try {
      const p = new (window as any).cast.framework.RemotePlayer();
      const c = new (window as any).cast.framework.RemotePlayerController(p);
      if (!p.isPaused) return;
      c.playOrPause();
    } catch {}
  }
  pause() {
    try {
      const p = new (window as any).cast.framework.RemotePlayer();
      const c = new (window as any).cast.framework.RemotePlayerController(p);
      if (p.isPaused) return;
      c.playOrPause();
    } catch {}
  }
  setVolume(v: number) {
    try {
      const p = new (window as any).cast.framework.RemotePlayer();
      const c = new (window as any).cast.framework.RemotePlayerController(p);
      p.volumeLevel = Math.max(0, Math.min(1, v));
      c.setVolumeLevel();
    } catch {}
  }
}

export const castService = new CastService();
