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
var assert = require('assert');

var fs = _bluebird2.default.promisifyAll(require('fs'));

var mkdirp = _bluebird2.default.promisify(require('mkdirp'));
var months = require('months');
var tmpl = require('./renderers');

var outDir = (0, _rootPath2.default)('out');

var makeTitleSlug = function makeTitleSlug(attrs) {
  return (0, _string2.default)(attrs.title).slugify().s;
};
var addSlug = (0, _util.addPropFn)('slug')(makeTitleSlug);
var addTimestamp = (0, _util.addPropFn)('timestamp')(function (p) {
  return new Date(p.date).getTime();
});

//creates an index.html file in dirname based on slug
var makeIndexHTMLOutPath = function makeIndexHTMLOutPath(slug) {
  return join(outDir, slug, 'index.html');
};
var writeToOutDir = function writeToOutDir(p) {
  return fs.writeFileAsync(makeIndexHTMLOutPath(p.slug), p.body);
};
//takes dirname, makes it in "out" dir
var mkoutdir = (0, _ramda.compose)(mkdirp, (0, _ramda.curryN)(2, join)(outDir));

var writePage = function writePage(page) {
  return _bluebird2.default.resolve(page).tap(function (post) {
    return mkoutdir(page.slug);
  }).then(writeToOutDir);
};

function formatDate(d) {
  d = new Date(d);
  return months[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
}

_bluebird2.default.all([getPosts().tap(writeIndexPage).then(writePosts), writeProjectsPage(), writeContactsPage(), writeThanksPage()]).then(function () {
  return (0, _util.l)('EVERYTHING done :)');
});

////homepage
/**
 * @param Promise<Array[post object]>
 * @return Promise
 */
function writeIndexPage(posts) {
  fs.readFileAsync((0, _rootPath2.default)('_content/index.md'), 'utf-8').then(_frontMatter2.default) // => { body, attributes }
  //merge attributes to top level
  .then(function (p) {
    p.attributes.body = p.body;return p.attributes;
  })
  //add posts to template data
  .then(function (page) {
    page.posts = posts;return page;
  }).then((0, _util.onProp)('body')(_marker2.default)) //markdown
  .then(tmpl.index) //template
  .then(function (rendered) {
    return fs.writeFile(join(outDir, 'index.html'), rendered);
  });
}

/**
 * gets posts & adds metadata as needed
 * @return Promise<Array[post object]>
 */
function getPosts() {
  return (0, _getFiles2.default)((0, _rootPath2.default)('_content/posts')).map(_frontMatter2.default) // => { body, attributes }
  //merge attributes to top level
  .map(function (p) {
    p.attributes.body = p.body;return p.attributes;
  }).map(addSlug)
  //sort them
  .map(addTimestamp).then((0, _ramda.sortBy)((0, _ramda.prop)('timestamp'))).then(_ramda.reverse).map((0, _util.onProp)('date')(formatDate));
}

/**
 * @param Promise<Array[post object]>
 * @return Promise
 */
function writePosts(posts) {
  return _bluebird2.default.resolve(posts).map((0, _util.onProp)('body')(_marker2.default)) //markdown
  .map(function (page) {
    page.body = tmpl.post(page);return page;
  }) //template
  .each(function (post) {
    return (0, _util.l)('building... ' + post.title);
  }).each(writePage) //write
  .catch(function (err) {
    throw err;
  }).finally(function () {
    return (0, _util.l)('all done!');
  });
}

function writeProjectsPage() {
  return createPage({ title: 'Projects', slug: 'projects' }, tmpl.projects, [['projects', getProjectJson()]]);

  function getProjectJson() {
    var jsonRoute = (0, _rootPath2.default)('_content/projects.json');
    return require(jsonRoute).map((0, _util.onProp)('description')(_marker2.default)); //markdown
  }
}

function writeContactsPage() {
  return createPage({ title: 'Contact Me', slug: 'contact' }, tmpl.contact);
}

function writeThanksPage() {
  return createPage({ title: 'Thanks!', slug: 'thanks' }, tmpl.thanks);
}

/**
 * @param {object}    meta
 * @param {string}    meta.title
 * @param {string}    meta.slug  Used to build output path
 * @param {function}  renderer   Jade compiled template
 * @param {array}     extraData  [ [ name, value ] ] tuples, tmpl data
 *                               name: string name of property
 *                               value: data
 * @return {Promise}
 */
function createPage(meta, renderer, extraData) {
  assert(meta.title, 'title required');
  assert(meta.slug, 'slug required');

  return _bluebird2.default.resolve(meta).then(function (page) {
    if (extraData) {
      extraData.forEach(function (prop) {
        (0, _util.addProp)(prop[0])(prop[1])(page);
      });
    }
    return page;
  }).then((0, _util.addPropFn)('body')(renderer)).then(writePage);
}