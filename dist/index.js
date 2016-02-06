'use strict';

var _ramda = require('ramda');

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

var join = require('path').join;

var fs = _bluebird2.default.promisifyAll(require('fs'));

var mkdirp = _bluebird2.default.promisify(require('mkdirp'));
var months = require('months');

//config
var outDir = (0, _rootPath2.default)('out');

//get posts
var posts = (0, _getFiles2.default)((0, _rootPath2.default)('_content/posts'));

var makeTitleSlug = function makeTitleSlug(attrs) {
  return (0, _string2.default)(attrs.title).slugify().s;
};
var addSlug = (0, _util.addPropFn)('slug')(makeTitleSlug);

//takes dirname, makes it in "out" dir
var mkoutdir = (0, _ramda.compose)(mkdirp, (0, _ramda.curryN)(2, join)(outDir));

//creates an index.html file in dirname based on slug
var makeIndexHTMLOutPath = function makeIndexHTMLOutPath(slug) {
  return join(outDir, slug, 'index.html');
};
var writeToOutDir = function writeToOutDir(p) {
  return fs.writeFile(makeIndexHTMLOutPath(p.slug), p.body);
};

function formatDate(d) {
  d = new Date(d);
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

////process posts
posts.map(_frontMatter2.default) // => { body, attributes }
//merge attributes to top level
.map(function (p) {
  p.attributes.body = p.body;return p.attributes;
}).map((0, _util.onProp)('body')(_marker2.default)).map(addSlug).each(function (post) {
  return mkoutdir(post.slug);
}).map((0, _util.onProp)('date')(formatDate)).tap(_util.l)
//.each(writeToOutDir)
.catch(function (err) {
  throw err;
}).finally(function () {
  return (0, _util.l)('all done!');
});