'use strict';

var _path = require('path');

var _rootPath = require('root-path');

var _rootPath2 = _interopRequireDefault(_rootPath);

var _ramda = require('ramda');

var _ramda2 = _interopRequireDefault(_ramda);

var _util = require('./util');

var _getFiles = require('./getFiles');

var _getFiles2 = _interopRequireDefault(_getFiles);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _frontMatter = require('front-matter');

var _frontMatter2 = _interopRequireDefault(_frontMatter);

var _marker = require('./marker');

var _marker2 = _interopRequireDefault(_marker);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = _bluebird2.default.promisifyAll(require('fs'));

//utils for transforming a part of a [name, contents, {attributes}] array
var onFilename = (0, _util.justIndex)(0);
var onContents = (0, _util.justIndex)(1);

//get posts
var posts = (0, _getFiles2.default)((0, _rootPath2.default)('_content/posts'));

////process posts
posts.map(onFilename(_path.basename)).map(onContents(_frontMatter2.default)).map(function (f) {
  return [f[0], f[1].body, f[1].attributes];
}) //move attribs into array
.map(onContents(_marker2.default)).map(_ramda2.default.prop(1)).map(_ramda2.default.unary(_util.l));