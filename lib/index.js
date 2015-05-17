var SourceMap = require('./source-map');
var srcURL = require('source-map-url');

var inlineRe = /^data:.+?;base64,/;

function hasInline(src) {
  var url = srcURL.getFrom(src);
  return !!(url && inlineRe.test(url));
}

function getInline(src) {
  var url = srcURL.getFrom(src);
  var match = url && inlineRe.exec(url);
  if (match) return url.slice(match[0].length);
}

function create(opts) {
  return new SourceMap(opts || {});
}

module.exports = {
  create: create,
  SourceMap: SourceMap,

  hasInline: hasInline,
  getInline: getInline,

  srcURL: srcURL,
  getFrom: srcURL.getFrom,
  existsIn: srcURL.existsIn,
  removeFrom: srcURL.removeFrom
};
