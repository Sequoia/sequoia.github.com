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

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = _bluebird2.default.promisifyAll(require('fs'));

//get posts
var posts = (0, _getFiles2.default)((0, _rootPath2.default)('_content/posts'));
//process posts
posts.then(_util.l);