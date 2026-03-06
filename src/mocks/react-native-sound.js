const Sound = function (filename, basePath, callback) {
  if (callback) callback(null);
};
Sound.prototype.play = function (callback) {
  if (callback) callback(true);
};
Sound.prototype.stop = function () {
  return this;
};
Sound.prototype.release = function () {
  return this;
};
Sound.prototype.setVolume = function () {
  return this;
};
Sound.prototype.setNumberOfLoops = function () {
  return this;
};
Sound.MAIN_BUNDLE = "";
Sound.DOCUMENT = "";
Sound.LIBRARY = "";
Sound.CACHES = "";

module.exports = Sound;
module.exports.default = Sound;
