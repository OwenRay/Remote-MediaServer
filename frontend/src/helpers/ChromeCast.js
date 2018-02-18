/* global chrome */

class ChromeCast{
  EVENT_CASTING_CHANGE = "CASTING_CHANGE";
  EVENT_ONPLAY = "EVENT_ONPLAY";

  constructor() {
    this.events = {};
    window['__onGCastApiAvailable'] = this.onApiAvailable.bind(this);
  }

  onApiAvailable(available) {
    if (!available) {
      return;
    }
    const apiConfig = new chrome.cast.ApiConfig(
      new chrome.cast.SessionRequest("07EA9E92"),
      this.onSession.bind(this),
      this.onReceiver.bind(this),
      chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
    );

    chrome.cast.initialize(apiConfig, this.onInit.bind(this));
  }

  onInit() {
    console.log("init", arguments);
  }

  onSession(session) {
    this.session = session;
    this.trigger(this.EVENT_CASTING_CHANGE, [true]);
    console.log("sess", arguments);
  }

  onReceiver(e) {
    if(e==="available") {
      this._available = true;
    }
    console.log(arguments);
  }

  isAvailable() {
    return this._available;
  }

  startCasting() {
    chrome.cast.requestSession(this.onRequestSession.bind(this));
  }

  stopCasting() {
    if(this.session) {
      this.session.leave();
      this.trigger(this.EVENT_CASTING_CHANGE, [false]);
    }
  }

  onRequestSession(session) {
    console.log("newsession", session);
    this.session = session;
    this.trigger(this.EVENT_CASTING_CHANGE, [true]);
  }

  trigger(event, args) {
    if(this.events[event]) {
      for(let key in this.events[event]) {
        this.events[event][key].apply(null, args);
      }
    }
  }

  addListener(event, callback) {
    if(!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);
  }

  removeListener(event, callback) {
    console.log("will r", this.events[event]);
    for(let key in this.events[event]) {
      if(this.events[event][key]===callback) {
        this.events[event].splice(key, 1);
      }
    }
    console.log("rd", this.events[event]);
  }

  setMedia(media, contentType) {
    if(!this.session) {
      return;
    }
    console.log(media, contentType);
    const mediaInfo = new chrome.cast.media.MediaInfo(media, contentType);
    const request = new chrome.cast.media.LoadRequest(mediaInfo);
    this.session.loadMedia(
      request,
      media=>{
        console.log("gotMedia");
        this.media=media;
        this.trigger(this.EVENT_ONPLAY);
      }
    );

  }

  setVolume(volume) {
    console.log("startsetvol");
    if(this.media) {
      const request = new chrome.cast.media.VolumeRequest(volume);
      this.media.setVolume(request);
    }
  }

  getVolume() {
    return this.media.volume.level;
  }

  play() {
    this.media.play();
  }

  pause() {
    this.media.pause();
  }

  isActive() {
    return !!this.session;
  }

  getOffset() {
    if(!this.media) {
      return 0;
    }
    return this.media.getEstimatedTime();
  }
}

export default new ChromeCast();
