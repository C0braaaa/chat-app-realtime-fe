// Minimal no-op shim for `react-native-sound`.
// This prevents runtime crashes when a dependency (e.g. Zego callkit) imports it,
// while the app doesn't actually need to play local ringtone audio.

class Sound {
  constructor(_filename, _basePath, onLoad) {
    if (typeof _basePath === "function") {
      // (filename, callback)
      onLoad = _basePath;
    }
    if (typeof onLoad === "function") {
      // match typical signature: callback(error)
      onLoad(null);
    }
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

