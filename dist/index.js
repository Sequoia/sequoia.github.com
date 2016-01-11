'use strict';

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _rootPath = require('root-path');

var _rootPath2 = _interopRequireDefault(_rootPath);

var _util = require('./util');

var _getFiles = require('./getFiles');

var _getFiles2 = _interopRequireDefault(_getFiles);

var _bluebird = require('bluebird');

var _bluebird2 = _interopRequireDefault(_bluebird);

var _frontMatter = require('front-matter');

var _frontMatter2 = _interopRequireDefault(_frontMatter);

var _marker = require('./marker');

var _marker2 = _interopRequireDefault(_marker);

var _string = require('string');

var _string2 = _interopRequireDefault(_string);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var fs = _bluebird2.default.promisifyAll(require('fs'));

//get posts
var posts = (0, _getFiles2.default)((0, _rootPath2.default)('_content/posts'));

var makeTitleSlug = function makeTitleSlug(attrs) {
  return (0, _string2.default)(attrs.title).slugify().s;
};
var addSlug = (0, _util.addPropFn)('slug')(makeTitleSlug);
//creates an index.html file in dirname based on slug
//TODO: need to create out dirs to use this
var makeIndexHTMLOutPath = function makeIndexHTMLOutPath(slug) {
  return (0, _path2.default)((0, _rootPath2.default)('out'), slug, 'index.html');
};
var writeToOutDir = function writeToOutDir(f) {
  return fs.writeFile(makeIndexHTMLOutPath(f.attributes.slug), f.body);
};

////process posts
posts.map(_frontMatter2.default) // => { body, attributes }
.map((0, _util.onProp)('body')(_marker2.default)).map((0, _util.onProp)('attributes')(addSlug)).map(function (x) {
  return x.attributes;
}).map(_util.l);
//.map(writeToOutDir)
//.catch(e)
//.finally((res) => l('all done!', res));