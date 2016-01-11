'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = getFiles;

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _nodeDir = require('node-dir');

var _util = require('./util');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * @param root path
 * @param options see: https://www.npmjs.com/package/node-dir
 * @return Promise : array [contents]
 */
function getFiles(root, options) {
  var contents = [];
  return new _bluebird2.default(function (resolve, reject) {
    (0, _nodeDir.readFiles)(root, options, function (err, content, next) {
      if (err) throw err;
      contents.push(content);
      next();
    }, function (err, filenames) {
      if (err) return reject(err);
      (0, _util.l)('finished reading files');
      resolve(contents);
    });
  });
}