/* eslint-disable no-underscore-dangle */

/* global chrome,window */

class ChromeCast {
  constructor() {
    this.EVENT_CASTING_INIT = 'CASTING_INIT';
    this.EVENT_CASTING_CHANGE = 'CASTING_CHANGE';
    this.EVENT_ONPLAY = 'EVENT_ONPLAY';
    this.events = {};
    window.__onGCastApiAvailable = this.onApiAvailable.bind(this);
  }

  onApiAvailable(available) {
    if (!available) {
      return;
    }
    const apiConfig = new chrome.cast.ApiConfig(
      new chrome.cast.SessionRequest('07EA9E92'),
      this.onSession.bind(this),
      this.onReceiver.bind(this),
      chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED,
    );

    chrome.cast.initialize(apiConfig, this.onInit.bind(this));
  }

  onInit() {
    this.trigger(this.EVENT_CASTING_INIT, []);
  }

  onSession(session) {
    this.session = session;
    this.trigger(this.EVENT_CASTING_CHANGE, [true]);
  }

  onReceiver(e) {
    if (e === 'available') {
      this._available = true;
    }
  }

  isAvailable() {
    return this._available;
  }

  startCasting() {
    chrome.cast.requestSession(this.onRequestSession.bind(this));
  }

  stopCasting() {
    if (this.session) {
      this.session.leave();
      this.trigger(this.EVENT_CASTING_CHANGE, [false]);
    }
  }

  onRequestSession(session) {
    this.session = session;
    this.trigger(this.EVENT_CASTING_CHANGE, [true]);
  }

  trigger(event, args = []) {
    if (this.events[event]) {
      console.log(this.events[event], args);
      this.events[event].forEach((e) => { e(...args); });
    }
  }

  addListener(event, callback) {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  removeListener(event, callback) {
    this.events[event] = this.events[event].filter(e => e !== callback);
  }

  updateSubtitle(subtitle) {
    const activeTracks = [subtitle];
    console.log(activeTracks);
    const tracksInfoRequest = new chrome.cast.media.EditTracksInfoRequest(activeTracks);
    this.media.editTracksInfo(tracksInfoRequest, () => console.log('Requested subtitles'), err => console.log(err));
  }

  setMedia(media, contentType, subtitles, activeSubtitle) {
    if (!this.session) {
      return;
    }
    const mediaInfo = new chrome.cast.media.MediaInfo(media, contentType);
    mediaInfo.textTrackStyle = new chrome.cast.media.TextTrackStyle();
    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    if (activeSubtitle >= 0) request.activeTrackIds = [activeSubtitle];

    mediaInfo.tracks = subtitles.map((sub, i) => {
      const track = new chrome.cast.media.Track(i, chrome.cast.media.TrackType.TEXT);
      track.trackContentId = sub;
      track.trackContentType = 'text/vtt';
      track.subtype = chrome.cast.media.TextTrackType.SUBTITLES;
      track.name = `sub_${i}`;
      track.customData = null;
      return track;
    });

    this.session.loadMedia(
      request,
      (m) => {
        console.log('media!', m);
        this.media = m;
        this.trigger(this.EVENT_ONPLAY);
      },
      (e) => {
        console.log('error loading media', e);
      },
    );
  }

  setVolume(volume) {
    if (this.media) {
      const request = new chrome.cast.media.VolumeRequest(new chrome.cast.Volume(volume));
      this.media.setVolume(request);
    }
  }

  getVolume() {
    return this.media.volume.level;
  }

  play() {
    if (this.media) {
      this.media.play();
    }
  }

  pause() {
    if (this.media) {
      this.media.pause();
    }
  }

  isActive() {
    return !!this.session;
  }

  getOffset() {
    if (!this.media) {
      return 0;
    }
    // fix unknown duration
    this.media.media.duration = Number.MAX_SAFE_INTEGER;
    return this.media.getEstimatedTime();
  }
}

export default new ChromeCast();
