// Minimal no-op shim for `react-native-sound`.
// Zego Call Kit may import this for ringtone/callkit features.
// We don't need local ringtone playback, so this prevents runtime crashes.

class Sound {
  constructor(_filename, _basePath, onLoad) {
    if (typeof _basePath === "function") onLoad = _basePath;
    if (typeof onLoad === "function") onLoad(null);
  }

  play(onEnd) {
    if (typeof onEnd === "function") onEnd(true);
  }
  pause() {}
  stop(cb) {
    if (typeof cb === "function") cb();
  }
  release() {}
  setNumberOfLoops() {}
  setVolume() {}
  setPan() {}
  setCurrentTime() {}
  getCurrentTime(cb) {
    if (typeof cb === "function") cb(0);
  }
  getDuration() {
    return 0;
  }
}

Sound.MAIN_BUNDLE = "";
Sound.DOCUMENT = "";
Sound.LIBRARY = "";
Sound.CACHES = "";

module.exports = Sound;
module.exports.default = Sound;

